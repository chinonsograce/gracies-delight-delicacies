export const BRAND = "Gracie's Delight Delicacies";
export const TAGLINE = 'Freshly Baked Deliciousness';
export type Variant = {id:string; name:string; collection:string; option:string; price_minor:number; currency:string; sell_unit:string; pieces_per_unit:number|null; preset_contents:string[]; launch_blockers:string[]; is_available:boolean; is_dev_price:boolean;image_path?:string;image_alt?:string;is_temporary_image?:boolean;allergen_text?:string};
export const collections = ['Classic Cakes','Banana Bread','Banana Bliss Mini Mix','Classic Cake Mini Mix','Foil Cake Packs','Muffins'];
const variants: Variant[]=[];
function add(collection:string,names:string[],options:string[],unit:string,pieces:(o:string)=>number|null,base:number,blocked:(o:string)=>string[]=()=>[]) { for(const name of names) for(const [i,option] of options.entries()) variants.push({id:[collection,name,option].join('-').toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,collection,option,price_minor:(base+i*2000)*100,currency:'NGN',sell_unit:unit,pieces_per_unit:pieces(option),preset_contents:[],launch_blockers:blocked(option),is_available:true,is_dev_price:true}); }
add('Classic Cakes',['Classic Vanilla','Rich Chocolate','Red Velvet','Coconut','Marble','Cookies & Cream'],['6 inches','8 inches','10 inches','12 inches'],'cake',()=>null,12000);
add('Banana Bread',['Classic Banana','Peanut Butter Banana','Nutty Banana','Chocolate Chip Banana','Nutella Banana','Double Chocolate Banana','Blueberry Banana','Coconut Banana','Coconut & Raisin Banana'],['Small','Medium','Large'],'loaf',()=>null,3500,o=>o==='Small'?['Selling unit pending']:[]);
add('Banana Bliss Mini Mix',['Banana Bliss Mini Mix'],['4-piece pack','6-piece pack'],'pack',o=>parseInt(o),5000,()=>['Preset contents pending']);
add('Classic Cake Mini Mix',['Classic Cake Mini Mix'],['4-piece pack','6-piece pack'],'pack',o=>parseInt(o),6000);
variants.filter(v=>v.collection==='Classic Cake Mini Mix').forEach(v=>v.preset_contents=['Chocolate × 1','Red Velvet × 1','Vanilla × 1','Cookies & Cream × 1',...(v.pieces_per_unit===6?['Marble × 1','Coconut × 1']:[])]);
add('Foil Cake Packs',['Chocolate','Red Velvet','Vanilla','Marble','Cookies & Cream'],['6-piece pack'],'pack',()=>6,6000);
add('Muffins',['Double Chocolate','Chocolate Chip','Blueberry'],['4-piece pack','6-piece pack'],'pack',o=>parseInt(o),4000);
export const demoCatalog=variants;
export const money=(n:number,currency='NGN')=>new Intl.NumberFormat('en-NG',{style:'currency',currency,maximumFractionDigits:0}).format(n/100);
