-- Approved catalogue update (October 2026): remove Muffins and Blueberry Banana.
-- Run once in the Supabase SQL Editor, after 001-004. Safe to run again.
-- Historical orders are untouched: order_items keep their own snapshots and
-- their variant_id references stay valid because variant rows are never deleted.
begin;

-- Retire every Muffins product (Double Chocolate, Chocolate Chip, Blueberry)
-- and the Blueberry Banana loaf, including all of their size/pack options.
-- is_active=false hides them through the catalogue RLS policies and makes the
-- cart and checkout validation reject them, so old links and saved bags cannot
-- purchase them.
update public.products set is_active=false where collection='Muffins' and is_active;
update public.products set is_active=false where collection='Banana Bread' and name='Blueberry Banana' and is_active;

-- Category presentation: the shop shows one "Bliss Mini Mix" category that
-- contains the Banana Bliss Mini Mix and Classic Cake Mini Mix products. This
-- mapping lives in the application layer so product/variant IDs and stored
-- collection values stay exactly as they are; no data rename is required.

commit;

-- Check: this should return no rows once the update has run.
select id,name,collection from public.products
where is_active and (collection='Muffins' or name='Blueberry Banana');
