export async function GET(){return Response.json({url:process.env.SUPABASE_URL||null,key:process.env.SUPABASE_ANON_KEY||null});}
