import {cors,preflight} from '@/lib/cors';
export async function OPTIONS(r:Request){return preflight(r);}
export async function GET(r:Request){return cors(r,Response.json({url:process.env.SUPABASE_URL||null,key:process.env.SUPABASE_ANON_KEY||null}));}
