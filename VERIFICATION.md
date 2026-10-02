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

## Not verified / outstanding

- Supabase migrations and atomic checkout/payment functions require a project. Two-user RLS, payment replay, expiry and staff-transition database tests remain unrun.
- Real Google OAuth needs Google/Supabase configuration; cancellation and return with an authenticated session need real test accounts.
- Mailgun delivery and retry need a sandbox or verified domain, API key and recipients. Ambiguous network delivery outcomes require provider reconciliation.
- Live payments are deliberately unsupported. Owner pickup, pricing, bulk, cutoff, policy and allergen decisions must be supplied before implementing a live provider.
- Final calendar-day/cutoff logic, pickup capacity/slots and automatic auth-token refresh are not implemented.
- Full keyboard/accessibility audit, mobile Lighthouse performance measurements and an automated browser suite remain pending.
- Publishing did not complete. The registered private Site project is `appgprj_6abe563410fc819189638a80790ac55e`; preserve and reuse `.openai/hosting.json`. The Sites plugin's local files disappeared while publishing, and no successful deployment URL was returned. Do not create a duplicate Site when restoring publishing.

Local source and built output are retained. Follow SETUP.md to create service accounts and connect them. The demo catalogue fallback is in source; it is not database persistence.
