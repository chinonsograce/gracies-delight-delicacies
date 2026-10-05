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
- Lesson 3 phase 1 (shared server-side bag): TypeScript and the four domain tests pass after the cart refactor. Dev server smoke: `OPTIONS /api/cart` returns 204 with CORS headers; `GET /api/cart` without a bearer token returns 401 JSON with CORS headers; `PUT /api/cart` without a token returns 401; `GET /api/catalog` still returns 200 and unchanged payload shape. Cross-origin requests in dev are blocked by the framework's dev-only origin guard, so cross-origin CORS must be re-checked against the published site.

## Not verified / outstanding

- `supabase/migrations/003_cart.sql` (cart_items table, RLS policies, realtime publication) must be run once in the Supabase SQL Editor before `/api/cart` works against the live database. Until then signed-in bag calls fail and the web app keeps the device copy with a notice.
- Realtime cart sync between two signed-in sessions (web + mobile) is not yet observed end-to-end; requires migration 003, a published build and the phase 2 mobile app.
- Mobile app (Lesson 3 phase 2) and on-phone testing (phase 3) are not started.

- Supabase migrations and atomic checkout/payment functions require a project. Two-user RLS, payment replay, expiry and staff-transition database tests remain unrun.
- Real Google OAuth needs Google/Supabase configuration; cancellation and return with an authenticated session need real test accounts.
- Mailgun delivery and retry need a sandbox or verified domain, API key and recipients. Ambiguous network delivery outcomes require provider reconciliation.
- Live payments are deliberately unsupported. Owner pickup, pricing, bulk, cutoff, policy and allergen decisions must be supplied before implementing a live provider.
- Final calendar-day/cutoff logic, pickup capacity/slots and automatic auth-token refresh are not implemented.
- Full keyboard/accessibility audit, mobile Lighthouse performance measurements and an automated browser suite remain pending.
- Publishing did not complete. The registered private Site project is `appgprj_6abe563410fc819189638a80790ac55e`; preserve and reuse `.openai/hosting.json`. The Sites plugin's local files disappeared while publishing, and no successful deployment URL was returned. Do not create a duplicate Site when restoring publishing.

Local source and built output are retained. Follow SETUP.md to create service accounts and connect them. The demo catalogue fallback is in source; it is not database persistence.
