-- The authenticated /api/cart server uses service_role after verifying the customer.
-- RLS policies and authenticated customer grants are unchanged.
begin;
grant select, insert, update, delete on public.cart_items to service_role;
commit;
select privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='cart_items' and grantee='service_role'
order by privilege_type;
