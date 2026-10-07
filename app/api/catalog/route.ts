import {db} from '@/lib/server';
import {demoCatalog,normalizeCatalog} from '@/lib/catalog';
import {cors,preflight} from '@/lib/cors';
export async function OPTIONS(r:Request){return preflight(r);}
export async function GET(r:Request){try{const rows=await db<(import('@/lib/catalog').Variant & {products:{is_active:boolean;is_seasonal:boolean;image_path:string;image_alt:string;is_temporary_image:boolean;allergen_text:string}})[]>('product_variants?select=*,products!inner(*)&products.is_active=eq.true&products.is_seasonal=eq.false&order=collection');return cors(r,Response.json({variants:normalizeCatalog(rows.map(({products,...v})=>({...v,image_path:products.image_path,image_alt:products.image_alt,is_temporary_image:products.is_temporary_image,allergen_text:products.allergen_text}))),connected:true}));}catch{return cors(r,Response.json({variants:normalizeCatalog(demoCatalog),connected:false}));}}
