export type Variant = {
  id: string;
  name: string;
  collection: string;
  option: string;
  price_minor: number;
  currency: string;
  sell_unit: string;
  pieces_per_unit: number | null;
  preset_contents: string[];
  launch_blockers: string[];
  is_available: boolean;
  is_dev_price: boolean;
  image_path?: string;
  image_alt?: string;
  is_temporary_image?: boolean;
  allergen_text?: string;
};

export type Line = { variant_id: string; quantity: number };

/** One shop card: every size/pack option of a single bake. */
export type Product = { key: string; name: string; collection: string; variants: Variant[] };

export function groupProducts(variants: Variant[]): Product[] {
  const groups: Product[] = [];
  const index = new Map<string, Product>();
  for (const variant of variants) {
    const key = variant.collection + "::" + variant.name;
    let group = index.get(key);
    if (!group) {
      group = { key, name: variant.name, collection: variant.collection, variants: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.variants.push(variant);
  }
  return groups;
}

export type OrderItem = {
  name: string;
  option: string;
  quantity: number;
  sell_unit: string;
  pieces_per_unit: number | null;
  preset_contents: string[];
};

export type Order = {
  error?: string;
  id: string;
  reference: string;
  payment_status: string;
  approval_status: string;
  fulfilment_status: string | null;
  total_minor: number;
  currency: string;
  pickup_at: string;
  email_status?: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
};

export type Profile = { name: string; email: string; phone: string };

export function money(n: number, currency = "NGN"): string {
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(n / 100);
  } catch {
    return (n / 100).toLocaleString() + " " + currency;
  }
}
