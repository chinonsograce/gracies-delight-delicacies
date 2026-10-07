# AGENTS.md — Gracie's Delight Delicacies

Build instructions for coding agents. Product behaviour, business rules (BR-xx), the catalogue, and acceptance criteria (AC-xx) live in [PRD.md](PRD.md). Read it before any task that touches ordering, pricing, catalogue data, or policy copy. This file says **how to build**; it does not restate the product.

## 1. Authority and conflicts

- The owner's explicit instructions override both files. When one changes a requirement, update PRD.md and AGENTS.md in the same change.
- If the files disagree, PRD.md wins on product behaviour and AGENTS.md wins on engineering conventions. Report the conflict; do not silently pick a side.
- Unresolved decisions (PRD §14) become labelled placeholders in configuration, never invented facts. If a task depends on one: ask, or use the placeholder and flag it.

## 2. Non-negotiables

1. **Brand.** Business name **Gracie's Delight Delicacies**, tagline **Freshly Baked Deliciousness**. Define each once as a constant/setting and reuse it everywhere (nav, titles, metadata, checkout, emails). Never shorten the name.
2. **No invented facts:** owner biography, reviews, certifications, ingredient/allergen claims, address, phone, hours, social links, prices presented as final.
3. **Pickup only; made to order** with a server-enforced minimum notice (BR-01, BR-02, BR-06). No automatic same-day orders.
4. **Confirmed means paid and verified** (BR-07). A redirect or form submit is never proof of payment.
5. **The client is untrusted.** It cannot set prices, fees, payment state, approvals, or fulfilment status.
6. **Money** is integer minor units plus currency, recalculated on the server.
7. **Demo mode cannot charge real money.** Demo pricing and temporary imagery are visibly disclosed.
8. **Secrets stay server-side.** Row-level security on every table.
9. **Idempotency** for checkout, payment events, and emails.
10. **Honest reporting.** A simulated integration is never presented as working; untested checks are reported as untested.
11. **V1 exclusions:** delivery/shipping, loyalty, subscriptions, AI recommendations, complex promotions, custom assortment builders, custom cake design, advanced inventory, large admin dashboards, unapproved products.

## 3. Stack and conventions

Use the existing project's framework if one exists. Otherwise default to: **TypeScript, Next.js (App Router), Supabase (Postgres + Auth + RLS), schema validation with zod, Vitest for unit/integration tests, Playwright for end-to-end checks.** Do not implement both Supabase and Neon. Add no infrastructure or libraries beyond need.

- Keep these commands working and documented in the README as they are created: install, dev, build, lint, typecheck, test, e2e, db migrate, db seed, **preflight** (see §6). Update this list when names are final.
- All business rules live in one server-side domain module (pricing, lead time, pack rules, approvals), unit tested, and imported by route handlers and server actions. Do not re-implement rules in components.
- Store timestamps as `timestamptz` (UTC). Compute "notice" in the configured business timezone with a tested date library. Test just-before/just-after cutoff cases.
- Migrations are versioned and reproducible. Seed data is editable files (JSON or TS) loaded by an idempotent script that upserts by stable `slug`/`sku`. By default the seed inserts only missing rows and does not overwrite owner-edited prices or availability.

## 4. Domain model

Minimum tables (foreign keys, timestamps, constraints, indexes throughout):

| Table | Key contents |
| --- | --- |
| `products` | id, slug, name, collection, description, is_active, is_seasonal, verified ingredient/allergen text (nullable), image path, alt text, provenance/licence, `is_temporary_image`. |
| `product_variants` | id, **`sku` (stable, unique)**, product_id, flavour_key, size label and value/unit (e.g. 8 inches), pack_size, **`sell_unit`** (`cake`/`loaf`/`piece`/`pack`), **`pieces_per_unit`** (nullable), `preset_contents` (jsonb: list of flavour + count), `price_minor`, `currency`, `is_dev_price`, `is_available`, `min_qty`, `qty_step`, `launch_blockers` (text[]; non-empty means not purchasable). |
| `site_settings` | Single source for every configurable rule and owner fact in §6. |
| `blackout_dates` (and optional `pickup_slots`) | Dates/slots the bakery will not accept, with optional capacity. Create only what the owner's pickup decision requires. |
| `profiles` | Auth user id, name, email, phone, timestamps. Never store Google passwords. |
| `staff_roles` | user id, role. The only source of staff authorization. |
| `orders` | id, non-sequential customer reference, user id, contact snapshot, `payment_status`, payment reference, `fulfilment_status` (nullable), `approval_status`, approved pickup time / rush fee / total / approver / expiry, currency, subtotal, rush fee, total, requested pickup time, pickup instructions snapshot, notes, `is_demo`, timestamps. |
| `order_items` | order_id, variant_id, immutable snapshots (product name, options, preset contents, sell unit, pieces), quantity, unit-price snapshot, line total. |
| `payment_events` | provider, **provider event id (unique)**, order_id, verified payload summary, processed_at. |
| `order_status_events` | order_id, from, to, staff user id, timestamp. |
| `email_deliveries` | order_id, kind, **unique (order_id, kind)**, status, attempts, provider message id, last error (no PII). |

### Variant rules

- A variant is **purchasable** only if: product active, variant available, price set, `launch_blockers` empty, and every field its collection requires is present. In live mode it must also have `is_dev_price = false` and verified allergen text (PRD BR-12).
- Seed Banana Bliss packs (contents pending), Small Banana Bread (selling unit pending), and Seasonal Bakes (sizes/prices pending) with explicit `launch_blockers`. Show them as unavailable; never invent the missing data.
- **Foil Cake Packs:** the sellable unit is a **pack of six** (`sell_unit = pack`, `pieces_per_unit = 6`, `min_qty = 1`, `qty_step = 1`). Quantity means packs; display pieces as `quantity × 6` in cart, checkout, order, and email. Adding the same flavour again merges into one cart line. Each flavour is its own line. The server rejects non-integer, zero, negative, or over-limit quantities and any variant that is not a six-pack.
- Cart line identity is `variant_id`. Guest carts store only `variant_id` and quantity in client storage (never prices), survive the Google redirect, and are fully revalidated on checkout.

### Approved catalogue changes (October 2026)

- Shop categories, in order: **All bakes, Classic Cakes, Banana Bread, Bliss Mini Mix, Foil Cake Packs** (plus Seasonal Bakes when owner-activated).
- **Bliss Mini Mix** is one display category containing two product cards: Banana Bliss Mini Mix and Classic Cake Mini Mix. Stored `collection` values, product IDs and variant IDs are unchanged; the merge happens in the application layer (`normalizeCatalog` in `lib/catalog.ts` for web/API and `mobile/src/types.ts` for the app). Never rename stored collection values: seed and variant IDs derive from them.
- **Retired:** Blueberry Banana and every Muffins product (all sizes/packs). They are filtered from `/api/catalog`, rejected by cart PUT and order POST via `isRetired`, hidden from both bags even when previously saved, and deactivated in `supabase/migrations/005_catalog_update.sql`. Historical orders and their `order_items` snapshots are never modified.
- Each product appears exactly once in the shop grid; the card shows image, category, name, starting price ("From …" only when variant prices differ) and a **Choose options** action that opens the product page with the size/pack selector.

## 5. Order lifecycle and payment handling

Three separate fields. Do not collapse them into one status.

| Field | Values | Set by |
| --- | --- | --- |
| `approval_status` | `not_required`, `requested`, `approved`, `declined`, `expired` | Server at checkout (`requested`); owner/staff for `approved`/`declined`; server for `expired`. |
| `payment_status` | `pending`, `paid`, `failed`, `expired` | Server only, from verified provider events (or authorized staff for a manual method). `expired` applies to unpaid orders only. |
| `fulfilment_status` | `null`, `confirmed`, `baking`, `ready_for_pickup`, `completed` | Server sets `confirmed` when payment becomes `paid`; staff advance one step at a time. |

Rules:

- Approval is required when the requested pickup is earlier than the configured notice, or when a configured bulk rule applies. Checkout then creates the order with `approval_status = requested`, **offers no payment**, and notifies the owner (see §9). This in-app request is the urgent/bulk route, so it does not depend on contact details that are still pending.
- Payment is offered only when approval is `not_required`, or `approved` and unexpired. Approved pickup time, rush fee, and total are snapshotted. Any cart change invalidates the approval.
- Customers see "Confirmed" only when `payment_status = paid`. Unpaid, pending, or failed orders show accurate states.
- Unpaid orders expire after `pending_payment_expiry_minutes`. Expiry reserves nothing and is not a cancellation/refund policy; do not add cancel or refund transitions until the owner defines them.
- Staff transitions are validated on the server (forward, one step), restricted to `staff_roles`, and logged in `order_status_events`.
- Payment events: put a `PaymentProvider` interface (create payment, verify event) behind the checkout. The **demo adapter** emits signed events with a shared secret into the same webhook path as a live provider, so verification and idempotency are exercised for real. The handler verifies the signature on the raw body, inserts into `payment_events` (unique event id), checks amount and currency against the order total, then in **one transaction** sets `paid` and `confirmed`. A mismatch never confirms; flag it for staff. Return pages read order state and never trust the redirect.
- Changes to price or availability after an order exists never alter that order. If an item becomes unavailable after payment, the paid order stands and the owner resolves it manually.

## 6. Configuration and launch gate

Keep every item below in `site_settings` (or env for secrets). Unresolved values hold an explicit `PENDING` sentinel, not a guess.

`brand_name`, `tagline`, `currency`, `lead_time_hours` (dev default 24), `business_timezone`, `order_cutoff_time`, `rush_fee_method` and `rush_fee_value`, `bulk_threshold` and `bulk_lead_time_hours`, `approval_validity_hours`, `pending_payment_expiry_minutes`, `pickup_location`, `pickup_hours`, `pickup_instructions`, `contact_email`/`contact_phone`/`social_links`, `owner_notification_email`, `payment_provider`, `live_commerce_enabled` (default false).

- Provide a **preflight** command that lists every unresolved setting and every purchasable variant with `is_dev_price`, temporary image, or missing allergen text. With `live_commerce_enabled = true`, preflight must fail while any required item is unresolved, and the server must refuse real charging.
- Live charging requires **both** `live_commerce_enabled = true` and no `is_dev_price` variant in the order. The demo flag on an order is derived from this, not from the client.
- Show "Demo pricing — not final" wherever dev prices appear, including checkout.
- While no bulk threshold is set, do not auto-detect bulk orders. Show the bulk guidance and the in-app request route, and do not imply one-day notice guarantees bulk availability.

## 7. Security checklist

- Privileged DB credentials, OAuth secrets, Mailgun keys, and payment secrets are server-side env vars. Never commit, bundle, or log them. Provide `.env.example` with no values.
- RLS on every table. Public read only for active catalogue data. Customers read only their own profile, orders, and items. Orders, payment, approval, and status writes go through server code with explicit authorization; the public client key grants none of that.
- Validate all input with schemas. Recompute totals from trusted variant rows.
- Rate-limit checkout, approval-request, and email-retry endpoints.
- Verify the signature on payment callbacks against the raw body. Treat events as replayable.
- Validate the post-login return URL as same-origin (no open redirect).
- Escape customer-supplied text (notes, names) in emails and any staff views.
- No customer data in logs or error responses. Order references are non-sequential.

## 8. UI, imagery, accessibility

- **Palette (owner-chosen; overrides the earlier "cream and brown only" direction).** Define these as design tokens once (CSS variables or theme file) and use no other brand colours. Welcoming, appetizing, uncluttered; keep Vanilla Glow dominant so the pinks stay accents rather than a wall of pink.

  | Token | Hex | Use |
  | --- | --- | --- |
  | `--vanilla-glow` | `#F4E6D2` | Page background, large surfaces. |
  | `--berry-velvet` | `#B23A5D` | Primary buttons, key links, active states. White text is allowed on it (5.74:1). |
  | `--peach-whip` | `#F8C6A0` | Highlight bands, badges, hover tints. |
  | `--rose-cloud` | `#E8A7B5` | Secondary surfaces, collection-card accents, soft dividers. |
  | `--olive-mist` | `#9DAA77` | Availability/positive accents, decorative touches. |
  | `--ink` *(proposed)* | `#3B2418` | All body and heading text (rich brown). |
  | `--berry-dark` *(proposed)* | `#8F2C49` | Hover/pressed, and link text on Vanilla Glow (6.51:1). |
  | `--olive-dark` *(proposed)* | `#566336` | Olive text, icons, and borders (5.29:1 on Vanilla Glow). |
  | `--surface` *(proposed)* | `#FFFFFF` | Cards, inputs, and checkout panels for legibility. |

  Contrast rules (WCAG 2.2 AA; ratios computed): `--ink` on every palette colour passes (Vanilla 11.78, Peach 9.35, Rose 7.32, Olive 5.82, white higher). **White text fails on Peach, Rose, Olive, and Vanilla** (1.2–2.5:1), so never use it there. Peach, Rose, and Olive on Vanilla are below 3:1, so they cannot be the only boundary of an input, button, or card that must be perceivable; use `--ink` or `--berry-dark` for borders and focus rings. Berry Velvet text on Vanilla is 4.68:1 (passes, narrowly); use `--berry-dark` for small text. Statuses always use text or an icon in addition to colour. Re-check any new colour pairing before use.
- Temporary images carry a visible nearby label ("Illustrative image — actual product may vary"); alt text alone is not disclosure. Store path, alt text, provenance/licence, and `is_temporary_image` as data so photos can be swapped without redesign. Use licensed or clearly generated imagery only; never copy competitors' photos. Do not imply unverified decorations, portions, packaging, or ingredients. Use consistent crops, responsive sizes, and fixed aspect ratios to prevent layout shift.
- Mobile-first, WCAG 2.2 AA: semantic HTML, labelled forms, visible focus, keyboard operation, accessible announcements for validation and cart changes, status not conveyed by colour alone. Provide loading, empty, error, unavailable-product, and payment-pending states.
- Show lead-time, pickup-only, and payment policy near purchasing actions as well as in the footer. Never infer allergen-free claims from names or images.

## 9. Integrations

- **Supabase Auth + Google:** configure the Google provider with credentials from Google Cloud Console. Register redirect URLs for local, preview, and production in both Google and Supabase. Request only `openid email profile`. Set the OAuth consent screen to *In production* before real users; in *Testing* it admits only listed test users.
- **Mailgun:** send from server code after the order is committed, using the approved sender/domain and the correct regional API base URL. Create the `email_deliveries` row first and send idempotently by `(order_id, kind)`. Failure leaves the order intact and is retryable by staff action or job. A Mailgun sandbox domain only delivers to authorized recipients, so note this in setup docs and do not call a sandbox-only test "working in production". Emails include the full business name, reference, items/pack contents/pieces, total, pickup details, and contact information (from settings). Use the same mechanism for the owner notification on approval requests.
- **Payment:** demo adapter until the owner selects a provider. For a gateway, verify server-side events. For a manual method, only authorized staff mark paid.
- **Setup docs:** concise steps for database, Google OAuth, Mailgun, demo payment, owner operations (prices, availability, image replacement, approvals, status updates, staff roles via a documented restricted workflow), and launch settings.

## 10. Definition of done and reporting

Automate these where feasible (unit/integration/e2e) and map each to PRD AC IDs:

- Pack rules: invalid foil quantities and non-six-pack variants rejected; two groups display as 12 pieces.
- Lead time: boundary cases around cutoff in the business timezone; blackout dates; no same-day acceptance without approval.
- Tampered client totals, unavailable or blocked variants rejected; historical orders unchanged after price edits.
- Two-user RLS test: user A cannot read or modify user B's orders; customers cannot write payment, approval, or status fields.
- Repeated payment callbacks produce one paid order, one `confirmed` transition, and one email. Pending/failed/expired orders never show Confirmed.
- Email failure leaves the order intact and a retry sends exactly once.
- Cart survives Google sign-in; sign-in cancellation and errors are usable.
- Keyboard, labels, focus, contrast, and responsive checks on Home, Product, Cart, Checkout, My Orders.
- No secrets in the client bundle or repository; demo mode cannot charge.

Finish every task with a short report in two lists: **Verified** (with how) and **Not verified** (with what credential or owner decision is needed). Do not claim an untested integration is complete.

## 11. When blocked

Order of preference: ask the owner → labelled placeholder in `site_settings` surfaced by preflight → never publish an assumption as a business promise. Development proceeds with placeholders; real checkout waits for approved launch decisions (PRD §14).
