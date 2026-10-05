# Your bakery website: setup guide

The storefront is implemented. External services are not connected until you configure your own accounts. Start with a private demo; no real money can be charged by this build.

## 1. Supabase: database and customer accounts

1. Create a project at https://supabase.com/dashboard. Save your database password securely.
2. Open SQL Editor. Run `supabase/migrations/001_shop.sql` once, then `supabase/migrations/002_expiry.sql`, then `supabase/migrations/003_cart.sql`, then `supabase/seed.sql`. The seed preserves existing prices and availability. `003_cart.sql` adds the shared server-side bag (`cart_items`) with its RLS policies and adds the table to the `supabase_realtime` publication, which is what lets web and mobile carts sync instantly.
3. Project settings → API: find your project URL and the public anon key. Find the service role key under API keys. The service role key is secret and must only be placed in server environment settings.
4. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and secret `SUPABASE_SERVICE_ROLE_KEY` on the hosting service. For local development, copy `.env.example` to `.env` and fill it in. Never commit `.env` or paste secret keys into chat.
5. Check catalogue rows in Table Editor. Orders and item snapshots are stored in a single database transaction. Every table has row-level security. Customers have no direct order-write permission.

## 2. Google sign-in

1. Open https://console.cloud.google.com/ and create/select a project.
2. Open Google Auth Platform. Configure the consent screen with your app name, support email and developer contact. Add yourself as a test user while testing.
3. Create an OAuth client of type **Web application**. Set authorized redirect URI to `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`. Copy the exact callback URL shown by Supabase's Google provider page.
4. Supabase → Authentication → Sign In / Providers → Google: enable it, add the Google client ID and secret, and save. These Google credentials belong in Supabase, never frontend code.
5. Supabase → Authentication → URL Configuration: set the site URL to your deployed website. Add its exact root URL with trailing `/` to Redirect URLs. For local development add the actual localhost root URL too.
6. Test adding items, signing in, and returning to checkout with the bag intact. Also test cancellation. Publish the consent screen before inviting ordinary customers; Testing only allows listed test users.

The app requests `openid email profile`, uses PKCE, and sends the Supabase access token to the server. Sessions currently require signing in again after token expiry; automatic session refresh is a follow-up improvement.

Official guide: https://supabase.com/docs/guides/auth/social-login/auth-google

## 3. Mailgun confirmation emails

1. Create an account at https://www.mailgun.com/. Choose US or EU region.
2. For a first test, use the sandbox domain and add your own email as an authorized recipient. Sandbox emails cannot reach arbitrary customers.
3. For real customers, add a domain you own and verify the DNS records Mailgun supplies through your domain registrar.
4. Set secret `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM` (for example your approved bakery sender), and `MAILGUN_API_BASE` (`https://api.mailgun.net` or `https://api.eu.mailgun.net`). Set `OWNER_NOTIFICATION_EMAIL` to your owner email.
5. Complete a demo order and demo payment. Check Mailgun logs and your inbox. Approval requests notify the owner instead.

Email claims are unique per order and kind. A definite rejection is retryable; an interrupted send can have an unknown outcome and must be checked in Mailgun before retrying. The app does not promise exactly-once delivery across an ambiguous provider timeout.

Official API: https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/send-http

## 4. Demo payments and launch decisions

Set a secret random `DEMO_PAYMENT_SECRET` of at least 32 characters. The demo adapter signs an event with HMAC-SHA256 and passes it through the shared payment-event verifier. `/api/payment-webhook` accepts the same signed raw event with `x-demo-signature`. Amount and currency are checked against the persisted order, and payment/confirmation updates are atomic and idempotent. No gateway is installed and no real funds move.

Before real trading, confirm prices/currency, pickup address/hours/instructions, contact details, one-day notice and cutoff, timezone, blackout dates/capacity, rush fees, bulk thresholds, ingredient/allergen details, packaging, policies and payment provider. Keep `live_commerce_enabled=false`: enabling it deliberately blocks checkout because live payments are not implemented.

Demo timing is a rolling 24-hour interval. Final local-day cutoff behavior is not implemented until that rule is supplied. Timezone-dependent blackout dates use the configured timezone; a pending timezone uses UTC for demo only. Do not use this default as a bakery promise.

## 5. Owner maintenance

Use Supabase Table Editor with your project owner account. Never give customers project access or service credentials.

- Prices/availability: `product_variants`. Money is in minor units (NGN 5,000 = 500000). Keep demo prices flagged. Stable IDs/SKUs must not change.
- Products/photos: `products` stores image provenance and allergen text. Change image_path/image_alt and is_temporary_image here to replace product images. Use a licensed HTTPS image URL or a hosted asset path.
- Settings: `site_settings`, row 1. Pending decisions use `PENDING`.
- Blackout dates: `blackout_dates`.
- Staff: after a trusted owner signs in, copy their user UUID from Authentication → Users. Add it to `staff_roles`. Only the project owner should grant roles.
- Approval/status operations: authenticated staff can POST `/api/staff` with their own Supabase bearer token. Approval body: `{"action":"approve","id":"ORDER_UUID","pickup":"UTC_ISO_TIMESTAMP","fee":0,"accept":true}`. Status body: `{"action":"advance","id":"ORDER_UUID","status":"baking"}`. The server checks staff membership, validates transitions and logs changes. A visual staff screen is not included.
- Retry definite failed email: `{"action":"retry_email","id":"ORDER_UUID","kind":"confirmation"}`. Reconcile unknown/sending states with Mailgun first.
- Never directly edit payment or fulfilment statuses to bypass validation.

## 6. Commands

From this folder with Node 24 and pnpm installed:

```powershell
pnpm --ignore-workspace install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm db:seed
pnpm db:migrate
pnpm preflight
```

`db:seed` generates SQL; run it in Supabase SQL Editor. `db:migrate` prints the migration path for the same manual workflow. `preflight` inspects runtime environment and the database, listing pending settings and demo prices/images/allergen gaps. It fails if credentials are missing or live commerce is enabled. E2E and two-user RLS checks require a connected project and test accounts and are not yet automated.
