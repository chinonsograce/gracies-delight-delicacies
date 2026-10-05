# Build verification

## Verified

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` passes.
- Production Worker build: `node scripts/run-framework.mjs build` passes.
- ESLint: no errors; three raw-image optimization warnings.
- Four domain tests pass: invalid quantities, foil packs/pieces and totals, blocked/duplicate lines, demo lead-time boundary.
- Local HTTP renders with status 200 and returns the fallback demo catalogue.
- Browser: storefront/product/catalogue/cart/checkout render; adding the same foil pack twice merges into one line and displays 12 pieces and NGN 12,000 demo total; unconfigured Google sign-in gives a usable message and preserves the bag.
- Preflight exits with failure and lists missing service configuration instead of reporting integrations as working.
- Checkout checked at phone width: single-column layout, no horizontal overflow (content width equals viewport width).
- Lesson 3 phase 1 (shared server-side bag): TypeScript and the four domain tests pass after the cart refactor. Dev server smoke: `OPTIONS /api/cart` returns 204 with CORS headers; `GET /api/cart` without a bearer token returns 401 JSON with CORS headers; `PUT /api/cart` without a token returns 401; `GET /api/catalog` still returns 200 and unchanged payload shape. Cross-origin requests in dev are blocked by the framework's dev-only origin guard, so cross-origin CORS was re-checked against the published site: preflight from a foreign origin returns 204 echoing the origin, unauthenticated `GET /api/cart` returns 401 JSON with CORS headers, and `GET /api/catalog` returns 200 with `Access-Control-Allow-Origin`.
- Live deployment (checked 2026-10-05): `/api/config` returns the owner's Supabase URL and publishable key; `/api/catalog` returns database rows (`connected: true` shape, includes `sku`/`product_id`), not the demo fallback. Querying Supabase REST with the anon key returns `42501 permission denied` for `cart_items` and `orders` (not `404`), which confirms migration `003_cart.sql` has been applied and that anon cannot read those tables directly.
- Mobile shop grouping: the shop list now shows one card per product (`groupProducts` in `mobile/src/types.ts`), with an option selector on the product screen that updates price, pieces, contents, allergens and availability per chosen size/pack. `tsc --noEmit` and `expo export --platform android` pass after the change. The web grid already rendered one card per product with a size selector on the detail page, so no web change or republish was required.
- Lesson 3 phase 2 (mobile client): `node node_modules/typescript/bin/tsc --noEmit` passes in `mobile/` under `strict`. `npx expo export --platform android` bundles 640 modules into a 1.6 MB Hermes bundle, so every import and asset resolves. `npx expo start` boots Metro and serves a valid Expo Go manifest (HTTP 200, `runtimeVersion: exposdk:57.0.0`). Mobile request shapes were matched field-by-field against the deployed routes (`/api/cart` GET/PUT/DELETE, `/api/orders` GET/POST with UUID `idempotency_key`, `/api/demo-payment` `{id}`, `/api/catalog`, `/api/profile`, `/api/config`).

## Not verified / outstanding

- Realtime cart sync between two signed-in sessions (web + phone) is not yet observed end-to-end. The `postgres_changes` subscription on `public.cart_items` is implemented on both clients but needs a phone run with the mobile deep link allowlisted.
- The mobile app has never been executed: no device/emulator run, no Google sign-in round trip, no on-phone checkout. Expo Go plus the owner's redirect allowlist are required (see `mobile/README.md`).
- The mobile redirect URI must be allowlisted under Supabase → Authentication → URL Configuration → Redirect URLs before mobile Google sign-in can return to the app: `graciedelight://oauth2redirect` for a development/production build, or the exact `exp://<lan-ip>:8081/--/oauth2redirect` printed at startup when running in Expo Go. Google Cloud Console needs no change. The app logs the URI at launch and repeats it in the sign-in error banner so the value can be copied from the phone.

- Supabase migrations and atomic checkout/payment functions require a project. Two-user RLS, payment replay, expiry and staff-transition database tests remain unrun.
- Real Google OAuth needs Google/Supabase configuration; cancellation and return with an authenticated session need real test accounts.
- Mailgun delivery and retry need a sandbox or verified domain, API key and recipients. Ambiguous network delivery outcomes require provider reconciliation.
- Live payments are deliberately unsupported. Owner pickup, pricing, bulk, cutoff, policy and allergen decisions must be supplied before implementing a live provider.
- Final calendar-day/cutoff logic, pickup capacity/slots and automatic auth-token refresh are not implemented.
- Full keyboard/accessibility audit, mobile Lighthouse performance measurements and an automated browser suite remain pending.
- The site is live at `https://gracies-delight-delicacies.chinonsoo765.chatgpt.site`; that host is the delivery target. An earlier Qoder Sites attempt left a registered private project (`appgprj_6abe563410fc819189638a80790ac55e`) and `.openai/hosting.json`. Leave both alone and do not create a duplicate Site — publishing there was never completed and is not needed for the current deployment.

Local source and built output are retained. Follow SETUP.md to create service accounts and connect them. The demo catalogue fallback is in source; it is not database persistence.
