create function public.expire_customer_orders(customer_id uuid) returns void language plpgsql security definer set search_path=public as $$ begin
 update orders set payment_status='expired' where user_id=customer_id and payment_status='pending' and expires_at<now();
 update orders set approval_status='expired' where user_id=customer_id and approval_status='approved' and approval_expires_at<now() and payment_status<>'paid';
end $$;
revoke execute on function public.expire_customer_orders(uuid) from public,anon,authenticated;
grant execute on function public.expire_customer_orders(uuid) to service_role;
