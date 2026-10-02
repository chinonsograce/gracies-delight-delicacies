import {demoCatalog} from '../lib/catalog.ts';
import {writeFileSync} from 'node:fs';
const q=(s:string)=>"'"+s.replaceAll("'","''")+"'";
let sql='-- Idempotent: existing owner edits are preserved.\n';
for(const v of demoCatalog){const pid=(v.collection+'-'+v.name).toLowerCase().replace(/[^a-z0-9]+/g,'-');sql+=`insert into products(id,slug,name,collection) values(${q(pid)},${q(pid)},${q(v.name)},${q(v.collection)}) on conflict do nothing;\n`;sql+=`insert into product_variants(id,sku,product_id,name,collection,option,price_minor,sell_unit,pieces_per_unit,preset_contents,launch_blockers) values(${q(v.id)},${q(v.id)},${q(pid)},${q(v.name)},${q(v.collection)},${q(v.option)},${v.price_minor},${q(v.sell_unit)},${v.pieces_per_unit??'null'},${q(JSON.stringify(v.preset_contents))}::jsonb,ARRAY[${v.launch_blockers.map(q).join(',')}]::text[]) on conflict do nothing;\n`;}
for(const name of ['Fruit Cake','Strawberry Cake','Blueberry Cake']){const pid=name.toLowerCase().replaceAll(' ','-');sql+=`insert into products(id,slug,name,collection,is_active,is_seasonal) values(${q(pid)},${q(pid)},${q(name)},'Seasonal Bakes',false,true) on conflict do nothing;\n`;}
writeFileSync('supabase/seed.sql',sql);console.log('Wrote supabase/seed.sql');
