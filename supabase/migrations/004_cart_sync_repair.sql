-- Repair the shared server-side bag so /api/cart writes and realtime sync work.
-- Run once in the Supabase SQL Editor, after 003_cart.sql. Safe to re-run:
-- every step converges public.cart_items to the intended shape even if an
-- earlier draft of the table exists. Bag rows are deduplicated, not dropped
-- (the newest row per user + variant is kept).
begin;

-- 1. Table with the full intended shape (no-op if it already exists).
create table if not exists public.cart_items(
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id text not null references public.product_variants(id) on delete cascade,
  quantity integer not null check(quantity between 1 and 100),
  updated_at timestamptz not null default now(),
  primary key(user_id,variant_id)
);

-- 2. Add any missing columns the API depends on.
alter table public.cart_items add column if not exists user_id uuid;
alter table public.cart_items add column if not exists variant_id text;
alter table public.cart_items add column if not exists quantity integer not null default 1;
alter table public.cart_items add column if not exists updated_at timestamptz not null default now();

-- 3. Drop a stray surrogate-key column from earlier drafts; the API never
--    references it and a NOT NULL id without a default breaks every insert.
alter table public.cart_items drop column if exists id;

-- 4. Missing constraints.
do $$
begin
  if not exists (select 1 from pg_constraint where conname='cart_items_quantity_check' and conrelid='public.cart_items'::regclass) then
    alter table public.cart_items add constraint cart_items_quantity_check check(quantity between 1 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname='cart_items_user_id_fkey' and conrelid='public.cart_items'::regclass) then
    alter table public.cart_items add constraint cart_items_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='cart_items_variant_id_fkey' and conrelid='public.cart_items'::regclass) then
    alter table public.cart_items add constraint cart_items_variant_id_fkey foreign key (variant_id) references public.product_variants(id) on delete cascade;
  end if;
end $$;

-- 5. The upsert in /api/cart uses Prefer: resolution=merge-duplicates, which
--    requires a unique target on (user_id, variant_id). Rebuild the primary
--    key if it is absent or different.
do $$
declare c record;
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.cart_items'::regclass and contype='p'
      and pg_get_constraintdef(oid) ilike '%user_id%variant_id%'
  ) then
    for c in select conname from pg_constraint where conrelid='public.cart_items'::regclass and contype in ('p','u') loop
      execute format('alter table public.cart_items drop constraint %I', c.conname);
    end loop;
    delete from public.cart_items
     where ctid not in (select max(ctid) from public.cart_items group by user_id, variant_id);
    alter table public.cart_items add primary key (user_id, variant_id);
  end if;
end $$;

-- 6. Row-level security: each customer only reaches their own rows.
alter table public.cart_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cart_items' and policyname='own_cart_select') then
    create policy own_cart_select on public.cart_items for select to authenticated using(user_id=auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cart_items' and policyname='own_cart_insert') then
    create policy own_cart_insert on public.cart_items for insert to authenticated with check(user_id=auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cart_items' and policyname='own_cart_update') then
    create policy own_cart_update on public.cart_items for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cart_items' and policyname='own_cart_delete') then
    create policy own_cart_delete on public.cart_items for delete to authenticated using(user_id=auth.uid());
  end if;
end $$;

-- 7. Table grants: PostgREST and Realtime (which re-checks RLS per row) both
--    need privileges for the authenticated role.
grant select, insert, update, delete on public.cart_items to authenticated;

-- 8. Realtime publication membership, so postgres_changes events are emitted.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='cart_items') then
    alter publication supabase_realtime add table public.cart_items;
  end if;
end $$;

commit;

-- Result panel: confirm the composite primary key is listed.
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid='public.cart_items'::regclass
order by contype, conname;
