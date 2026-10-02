import type {Variant} from './catalog';
export function priceCart(lines:{variant_id:string;quantity:number}[], variants:Variant[]) {
 if(!lines.length||lines.length>60) throw new Error('Choose at least one item (maximum 60 lines).');
 const seen=new Set<string>();
 return lines.map(line=>{const v=variants.find(v=>v.id===line.variant_id); if(!v||!v.is_available||v.launch_blockers.length) throw new Error('An item is unavailable. Please review your bag.');
 if(seen.has(v.id)) throw new Error('Duplicate cart line.'); seen.add(v.id);
 if(!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>100) throw new Error('Quantity must be a whole number from 1 to 100.');
 if(v.collection==='Foil Cake Packs'&&(v.sell_unit!=='pack'||v.pieces_per_unit!==6)) throw new Error('Foil cakes must be packs of six.');
 return {...line,variant:v,line_total:v.price_minor*line.quantity};});
}
export function needsApproval(pickup:string,now=Date.now(),hours=24,bulk=false){const time=Date.parse(pickup); if(!Number.isFinite(time)||time<=now) throw new Error('Choose a future pickup time.'); return bulk||time-now<hours*3600000;}
