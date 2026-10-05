import {db,user,email} from '@/lib/server';
import {priceCart,needsApproval} from '@/lib/domain';
import {cors,preflight} from '@/lib/cors';
import {z} from 'zod';
const schema=z.object({name:z.string().trim().min(2).max(100),email:z.string().email().max(254),phone:z.string().min(7).max(30),pickup_at:z.string().datetime({offset:true}),notes:z.string().max(1000),bulk:z.boolean(),idempotency_key:z.string().uuid(),lines:z.array(z.object({variant_id:z.string().max(200),quantity:z.number().int().min(1).max(100)})).max(60)});
export async function OPTIONS(r:Request){return preflight(r);}
export async function GET(r:Request){try{const u=await user(r);await db('rpc/expire_customer_orders',{method:'POST',body:JSON.stringify({customer_id:u.id})});return cors(r,Response.json(await db('orders?user_id=eq.'+u.id+'&select=*,order_items(*)&order=created_at.desc')));}catch(e){return cors(r,Response.json({error:(e as Error).message},{status:503}));}}
export async function POST(r:Request){try{const u=await user(r);const data=schema.parse(await r.json());const variants=await db<import('@/lib/catalog').Variant[]>('product_variants?select=*');priceCart(data.lines,variants);needsApproval(data.pickup_at,Date.now(),24,data.bulk);const result=await db('rpc/create_checkout',{method:'POST',body:JSON.stringify({customer_id:u.id,payload:data})});if(result.approval_status==='requested')await email(result,'approval');return cors(r,Response.json(result));}catch(e){return cors(r,Response.json({error:e instanceof z.ZodError?'Please check your checkout details.':(e as Error).message},{status:400}));}}
