import {db,user} from '@/lib/server';
import {cors,preflight} from '@/lib/cors';
export async function OPTIONS(r:Request){return preflight(r);}
export async function GET(r:Request){try{const u=await user(r);const [p]=await db<{name:string;email:string;phone:string}[]>('profiles?id=eq.'+u.id);return cors(r,Response.json(p||{name:u.user_metadata?.full_name||'',email:u.email||'',phone:''}));}catch{return cors(r,Response.json({error:'Please sign in again.'},{status:401}));}}
