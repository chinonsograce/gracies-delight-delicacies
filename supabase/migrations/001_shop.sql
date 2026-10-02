create extension if not exists pgcrypto;
create table public.products(id text primary key,slug text unique not null,name text not null,collection text not null,is_active boolean not null default true,is_seasonal boolean not null default false,allergen_text text,image_path text not null default '/bakery.png',image_alt text not null default 'Illustrative bakery selection',image_provenance text not null default 'OpenAI ImageGen, generated 1 October 2026',is_temporary_image boolean not null default true,created_at timestamptz not null default now());
create table public.product_variants(id text primary key,sku text unique not null,product_id text not null references public.products(id),name text not null,collection text not null,option text not null,price_minor bigint not null check(price_minor>=0),currency text not null default 'NGN',sell_unit text not null check(sell_unit in ('cake','loaf','piece','pack')),pieces_per_unit integer,preset_contents jsonb not null default '[]',launch_blockers text[] not null default '{}',is_available boolean not null default true,is_dev_price boolean not null default true,min_qty integer not null default 1,qty_step integer not null default 1,created_at timestamptz not null default now(),check(collection<>'Foil Cake Packs' or (sell_unit='pack' and pieces_per_unit=6)));
create table public.site_settings(id integer primary key check(id=1),settings jsonb not null);
insert into public.site_settings values(1,'{"brand_name":"Gracie''s Delight Delicacies","tagline":"Freshly Baked Deliciousness","currency":"NGN","business_timezone":"PENDING","lead_time_hours":24,"order_cutoff_time":"PENDING","rush_fee_method":"PENDING","rush_fee_value":"PENDING","bulk_threshold":"PENDING","bulk_lead_time_hours":"PENDING","approval_validity_hours":24,"pending_payment_expiry_minutes":60,"pickup_location":"PENDING","pickup_hours":"PENDING","pickup_instructions":"PENDING","contact_email":"PENDING","contact_phone":"PENDING","social_links":"PENDING","owner_notification_email":"PENDING","payment_provider":"demo","live_commerce_enabled":false,"privacy_policy":"PENDING","terms":"PENDING","refund_policy":"PENDING","packaging":"PENDING"}');
create table public.blackout_dates(day date primary key,reason text);
create table public.profiles(id uuid primary key references auth.users(id),name text,email text,phone text,updated_at timestamptz not null default now());
create table public.staff_roles(user_id uuid primary key references auth.users(id),role text not null check(role in ('owner','staff')));
create table public.orders(id uuid primary key default gen_random_uuid(),reference text unique not null default 'GD-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),user_id uuid not null references auth.users(id),idempotency_key uuid not null,name text not null,email text not null,phone text not null,notes text not null,pickup_at timestamptz not null,pickup_instructions text not null,contact_email text not null,payment_status text not null default 'pending' check(payment_status in ('pending','paid','failed','expired')),approval_status text not null check(approval_status in ('not_required','requested','approved','declined','expired')),fulfilment_status text check(fulfilment_status in ('confirmed','baking','ready_for_pickup','completed')),currency text not null,subtotal_minor bigint not null,rush_fee_minor bigint not null default 0,total_minor bigint not null,is_demo boolean not null default true,approval_expires_at timestamptz,approved_by uuid references auth.users(id),expires_at timestamptz not null,created_at timestamptz not null default now(),unique(user_id,idempotency_key),check(total_minor=subtotal_minor+rush_fee_minor),check(fulfilment_status is null or payment_status='paid'));
create index on public.orders(user_id,created_at desc);
create table public.order_items(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),variant_id text not null references public.product_variants(id),name text not null,option text not null,sell_unit text not null,pieces_per_unit integer,preset_contents jsonb not null,quantity integer not null check(quantity between 1 and 100),unit_price_minor bigint not null,line_total_minor bigint not null,unique(order_id,variant_id));
create table public.payment_events(event_id text primary key,order_id uuid not null references public.orders(id),provider text not null,amount_minor bigint not null,currency text not null,processed_at timestamptz not null default now());
create table public.order_status_events(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),from_status text,to_status text not null,staff_user_id uuid references auth.users(id),created_at timestamptz not null default now());
create table public.email_deliveries(order_id uuid references public.orders(id),kind text not null,status text not null check(status in ('sending','sent','failed','unknown')),attempts integer not null default 1,provider_message_id text,last_error text,created_at timestamptz not null default now(),primary key(order_id,kind));
create table public.request_limits(user_id uuid references auth.users(id),bucket timestamptz,hits integer not null,primary key(user_id,bucket));
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.site_settings enable row level security;
alter table public.blackout_dates enable row level security;
alter table public.profiles enable row level security;
alter table public.staff_roles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_events enable row level security;
alter table public.order_status_events enable row level security;
alter table public.email_deliveries enable row level security;
alter table public.request_limits enable row level security;
create policy catalogue on public.products for select to anon,authenticated using(is_active and not is_seasonal);
create policy variants on public.product_variants for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.is_active and not p.is_seasonal));
create policy own_profile on public.profiles for select to authenticated using(id=auth.uid());
create policy own_order on public.orders for select to authenticated using(user_id=auth.uid());
create policy own_items on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
create policy own_progress on public.order_status_events for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
revoke all on all tables in schema public from anon,authenticated;
grant select on public.products,public.product_variants to anon,authenticated;
grant select on public.profiles,public.orders,public.order_items,public.order_status_events to authenticated;

create function public.order_summary(oid uuid) returns jsonb language sql security definer set search_path=public as $$ select to_jsonb(o)||jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(i)) from order_items i where i.order_id=o.id),'[]'::jsonb)) from orders o where o.id=oid $$;
create function public.create_checkout(customer_id uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare o orders;v product_variants;l jsonb;s jsonb;subtotal bigint:=0;approval text;pickup timestamptz;hits integer;line_count integer;
begin
 select * into o from orders where user_id=customer_id and idempotency_key=(payload->>'idempotency_key')::uuid;
 if found then return order_summary(o.id);end if;
 insert into request_limits values(customer_id,date_trunc('minute',now()),1) on conflict(user_id,bucket) do update set hits=request_limits.hits+1 returning request_limits.hits into hits;
 if hits>10 then raise exception 'Too many requests. Please wait a minute.';end if;
 select settings into s from site_settings where id=1;
 if (s->>'live_commerce_enabled')::boolean then raise exception 'Live commerce is not implemented. Keep demo mode enabled.';end if;
 pickup:=(payload->>'pickup_at')::timestamptz;
 if pickup<=now() then raise exception 'Choose a future pickup time.';end if;
 if exists(select 1 from blackout_dates where day=(pickup at time zone (case when s->>'business_timezone'='PENDING' then 'UTC' else s->>'business_timezone' end))::date) then raise exception 'Pickup is unavailable on this date.';end if;
 line_count:=jsonb_array_length(payload->'lines');if line_count<1 or line_count>60 then raise exception 'Invalid bag.';end if;
 if (select count(distinct x->>'variant_id') from jsonb_array_elements(payload->'lines') x)<>line_count then raise exception 'Duplicate lines.';end if;
 for l in select * from jsonb_array_elements(payload->'lines') loop
  select * into v from product_variants where id=l->>'variant_id' for share;
  if not found or not v.is_available or cardinality(v.launch_blockers)>0 or not exists(select 1 from products where id=v.product_id and is_active and not is_seasonal) then raise exception 'Item unavailable.';end if;
  if (l->>'quantity')::numeric<>trunc((l->>'quantity')::numeric) or (l->>'quantity')::integer not between 1 and 100 then raise exception 'Invalid quantity.';end if;
  if v.collection='Foil Cake Packs' and (v.sell_unit<>'pack' or v.pieces_per_unit<>6) then raise exception 'Foil cakes require six-packs.';end if;
  subtotal:=subtotal+v.price_minor*(l->>'quantity')::integer;
 end loop;
 approval:=case when pickup<now()+make_interval(hours=>(s->>'lead_time_hours')::integer) or coalesce((payload->>'bulk')::boolean,false) then 'requested' else 'not_required' end;
 if s->>'bulk_threshold'<>'PENDING' and (select sum((x->>'quantity')::integer) from jsonb_array_elements(payload->'lines') x)>=(s->>'bulk_threshold')::integer then approval:='requested';end if;
 insert into orders(user_id,idempotency_key,name,email,phone,notes,pickup_at,pickup_instructions,contact_email,approval_status,currency,subtotal_minor,total_minor,expires_at) values(customer_id,(payload->>'idempotency_key')::uuid,payload->>'name',payload->>'email',payload->>'phone',payload->>'notes',pickup,s->>'pickup_instructions',s->>'contact_email',approval,s->>'currency',subtotal,subtotal,now()+make_interval(mins=>(s->>'pending_payment_expiry_minutes')::integer)) returning * into o;
 for l in select * from jsonb_array_elements(payload->'lines') loop
 select * into v from product_variants where id=l->>'variant_id';
 insert into order_items(order_id,variant_id,name,option,sell_unit,pieces_per_unit,preset_contents,quantity,unit_price_minor,line_total_minor) values(o.id,v.id,v.name,v.option,v.sell_unit,v.pieces_per_unit,v.preset_contents,(l->>'quantity')::integer,v.price_minor,v.price_minor*(l->>'quantity')::integer);
 end loop;
 insert into profiles(id,name,email,phone) values(customer_id,payload->>'name',payload->>'email',payload->>'phone') on conflict(id) do update set name=excluded.name,email=excluded.email,phone=excluded.phone,updated_at=now();
 return order_summary(o.id);
end $$;
create function public.verify_demo_event(oid uuid,eid text,amount bigint,event_currency text) returns jsonb language plpgsql security definer set search_path=public as $$
declare o orders;
begin
 select * into o from orders where id=oid for update;
 if not found or not o.is_demo then raise exception 'Demo order required.';end if;
 if o.total_minor<>amount or o.currency<>event_currency then raise exception 'Payment amount mismatch.';end if;
 if o.payment_status='paid' then return order_summary(oid);end if;
 if o.expires_at<now() or o.approval_status not in ('not_required','approved') or (o.approval_status='approved' and (o.approval_expires_at is null or o.approval_expires_at<now())) then raise exception 'Order expired or needs approval.';end if;
 insert into payment_events(event_id,order_id,provider,amount_minor,currency) values(eid,oid,'demo',amount,event_currency) on conflict do nothing;
 update orders set payment_status='paid',fulfilment_status='confirmed' where id=oid;
 insert into order_status_events(order_id,to_status) values(oid,'confirmed');
 return order_summary(oid);
end $$;
create function public.claim_email(oid uuid,email_kind text) returns boolean language plpgsql security definer set search_path=public as $$ begin insert into email_deliveries(order_id,kind,status) values(oid,email_kind,'sending') on conflict do nothing;return found;end $$;
create function public.staff_approve(oid uuid,actor uuid,pickup timestamptz,fee bigint,accept boolean) returns jsonb language plpgsql security definer set search_path=public as $$ begin
 if not exists(select 1 from staff_roles where user_id=actor) then raise exception 'Staff required.';end if;
 if fee<0 or pickup<=now() then raise exception 'Invalid approval.';end if;
 update orders set approval_status=case when accept then 'approved' else 'declined' end,pickup_at=pickup,rush_fee_minor=fee,total_minor=subtotal_minor+fee,approved_by=actor,approval_expires_at=now()+interval '24 hours',expires_at=now()+interval '24 hours' where id=oid and approval_status='requested' and payment_status='pending';
 if not found then raise exception 'Order is not awaiting approval.';end if;return order_summary(oid);end $$;
create function public.staff_advance(oid uuid,actor uuid,next_status text) returns jsonb language plpgsql security definer set search_path=public as $$ declare o orders;expected text;begin
 if not exists(select 1 from staff_roles where user_id=actor) then raise exception 'Staff required.';end if;
 select * into o from orders where id=oid for update;
 expected:=case o.fulfilment_status when 'confirmed' then 'baking' when 'baking' then 'ready_for_pickup' when 'ready_for_pickup' then 'completed' end;
 if o.payment_status<>'paid' or expected is null or next_status<>expected then raise exception 'Invalid status transition.';end if;
 update orders set fulfilment_status=next_status where id=oid;
 insert into order_status_events(order_id,from_status,to_status,staff_user_id) values(oid,o.fulfilment_status,next_status,actor);return order_summary(oid);end $$;
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on all functions in schema public to service_role;
