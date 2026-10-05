-- Lesson 3: server-side shopping bag so web and mobile share one cart.
-- Run once in the Supabase SQL Editor, after 001_shop.sql and 002_expiry.sql.
begin;
create table public.cart_items(
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id text not null references public.product_variants(id) on delete cascade,
  quantity integer not null check(quantity between 1 and 100),
  updated_at timestamptz not null default now(),
  primary key(user_id,variant_id)
);

alter table public.cart_items enable row level security;

create policy own_cart_select on public.cart_items for select to authenticated using(user_id=auth.uid());
create policy own_cart_insert on public.cart_items for insert to authenticated with check(user_id=auth.uid());
create policy own_cart_update on public.cart_items for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy own_cart_delete on public.cart_items for delete to authenticated using(user_id=auth.uid());

-- Realtime respects the RLS policies above, so each signed-in client only
-- receives changes to its own bag. This is what makes web and mobile carts
-- update instantly.
alter publication supabase_realtime add table public.cart_items;
commit;
