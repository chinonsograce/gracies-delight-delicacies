import {db,user} from '@/lib/server';
export async function GET(r:Request){try{const u=await user(r);const [p]=await db<{name:string;email:string;phone:string}[]>('profiles?id=eq.'+u.id);return Response.json(p||{name:u.user_metadata?.full_name||'',email:u.email||'',phone:''});}catch{return Response.json({error:'Please sign in again.'},{status:401});}}
