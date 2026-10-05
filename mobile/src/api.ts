import { BASE } from "./config";
import type { Line, Order, Profile, Variant } from "./types";

export class ApiError extends Error {}

async function call<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
  if (token) headers.Authorization = "Bearer " + token;
  const response = await fetch(BASE + path, { ...init, headers });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new ApiError(data.error || "Request failed (" + response.status + ").");
  return data;
}

export const api = {
  config: () => call<{ url: string | null; key: string | null }>("/api/config", null),
  catalog: () => call<{ variants: Variant[]; connected: boolean }>("/api/catalog", null),
  profile: (token: string) => call<Profile>("/api/profile", token),
  cart: (token: string) => call<Line[]>("/api/cart", token),
  setLine: (token: string, variant_id: string, quantity: number) =>
    call<Line[]>("/api/cart", token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variant_id, quantity }),
    }),
  removeLine: (token: string, variant_id: string) =>
    call<Line[]>("/api/cart?variant_id=" + encodeURIComponent(variant_id), token, { method: "DELETE" }),
  clearCart: (token: string) => call<Line[]>("/api/cart", token, { method: "DELETE" }),
  orders: (token: string) => call<Order[]>("/api/orders", token),
  createOrder: (
    token: string,
    payload: {
      name: string;
      email: string;
      phone: string;
      pickup_at: string;
      notes: string;
      bulk: boolean;
      lines: Line[];
      idempotency_key: string;
    },
  ) =>
    call<Order>("/api/orders", token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  pay: (token: string, id: string) =>
    call<Order>("/api/demo-payment", token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }),
};
