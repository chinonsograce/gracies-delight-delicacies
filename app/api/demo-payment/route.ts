import {db,user} from '@/lib/server';
import {sign} from '@/lib/payment';
import {processEvent} from '@/lib/process-event';
import {cors,preflight} from '@/lib/cors';
export async function OPTIONS(r:Request){return preflight(r);}
export async function POST(r:Request){try{const u=await user(r);const {id}=await r.json() as {id:string};if(typeof id!=='string'||! /^[0-9a-f-]{36}$/.test(id))throw new Error('Invalid order.');const [o]=await db<import('@/lib/server').ServiceOrder[]>('orders?id=eq.'+id+'&user_id=eq.'+u.id);if(!o||!o.is_demo)throw new Error('Demo order not found.');const raw=JSON.stringify({order_id:id,event_id:'demo-'+id,amount_minor:o.total_minor,currency:o.currency});return cors(r,Response.json(await processEvent(raw,await sign(raw))));}catch(e){return cors(r,Response.json({error:(e as Error).message},{status:400}));}}
