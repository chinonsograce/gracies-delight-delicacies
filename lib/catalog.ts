export const BRAND = "Gracie's Delight Delicacies";
export const TAGLINE = 'Freshly Baked Deliciousness';
export type Variant = {id:string; name:string; collection:string; option:string; price_minor:number; currency:string; sell_unit:string; pieces_per_unit:number|null; preset_contents:string[]; launch_blockers:string[]; is_available:boolean; is_dev_price:boolean;image_path?:string;image_alt?:string;is_temporary_image?:boolean;allergen_text?:string};
// Shop categories in the approved display order ("All bakes" is added by the UI).
export const collections = ['Classic Cakes','Banana Bread','Bliss Mini Mix','Foil Cake Packs'];
// Underlying catalogue rows keep their original collection values so product and
// variant IDs (derived from collection+name+option) never change. The two mini
// mix collections are presented as one "Bliss Mini Mix" category.
const MINI_MIX_LEGACY = ['Banana Bliss Mini Mix','Classic Cake Mini Mix'];
export const displayCollection=(collection:string)=>MINI_MIX_LEGACY.includes(collection)?'Bliss Mini Mix':collection;
export const isRetired=(v:{name:string;collection:string})=>v.collection==='Muffins'||v.name==='Blueberry Banana';
export function normalizeCatalog<T extends {name:string;collection:string}>(rows:T[]):T[]{return rows.filter(r=>!isRetired(r)).map(r=>r.collection===displayCollection(r.collection)?r:{...r,collection:displayCollection(r.collection)});}
const variants: Variant[]=[];
function add(collection:string,names:string[],options:string[],unit:string,pieces:(o:string)=>number|null,base:number,blocked:(o:string)=>string[]=()=>[]) { for(const name of names) for(const [i,option] of options.entries()) variants.push({id:[collection,name,option].join('-').toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,collection,option,price_minor:(base+i*2000)*100,currency:'NGN',sell_unit:unit,pieces_per_unit:pieces(option),preset_contents:[],launch_blockers:blocked(option),is_available:true,is_dev_price:true}); }
add('Classic Cakes',['Classic Vanilla','Rich Chocolate','Red Velvet','Coconut','Marble','Cookies & Cream'],['6 inches','8 inches','10 inches','12 inches'],'cake',()=>null,12000);
add('Banana Bread',['Classic Banana','Peanut Butter Banana','Nutty Banana','Chocolate Chip Banana','Nutella Banana','Double Chocolate Banana','Coconut Banana','Coconut & Raisin Banana'],['Small','Medium','Large'],'loaf',()=>null,3500,o=>o==='Small'?['Selling unit pending']:[]);
add('Banana Bliss Mini Mix',['Banana Bliss Mini Mix'],['4-piece pack','6-piece pack'],'pack',o=>parseInt(o),5000,()=>['Preset contents pending']);
add('Classic Cake Mini Mix',['Classic Cake Mini Mix'],['4-piece pack','6-piece pack'],'pack',o=>parseInt(o),6000);
variants.filter(v=>v.name==='Classic Cake Mini Mix').forEach(v=>v.preset_contents=['Chocolate × 1','Red Velvet × 1','Vanilla × 1','Cookies & Cream × 1',...(v.pieces_per_unit===6?['Marble × 1','Coconut × 1']:[])]);
add('Foil Cake Packs',['Chocolate','Red Velvet','Vanilla','Marble','Cookies & Cream'],['6-piece pack'],'pack',()=>6,6000);
export const demoCatalog=variants;
export const money=(n:number,currency='NGN')=>new Intl.NumberFormat('en-NG',{style:'currency',currency,maximumFractionDigits:0}).format(n/100);
