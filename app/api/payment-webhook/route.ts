import {processEvent} from '@/lib/process-event';
export async function POST(r:Request){try{const raw=await r.text();if(raw.length>10000)throw new Error('Invalid event.');return Response.json(await processEvent(raw,r.headers.get('x-demo-signature')||''));}catch{return Response.json({error:'Payment event was rejected.'},{status:400});}}
