# Gracie's Delight Delicacies — mobile client (Expo / React Native)

Lesson 3 phase 2–3: a React Native storefront for the **same Supabase backend** the web
app uses. Server-backed cart, Google sign-in, realtime cross-device cart sync and the
demo payment flow — no new backend code.

The shop lists **one card per bake**: every size/pack of a product is grouped under a
single entry ("Chocolate Chip Banana — 3 options", priced "From ₦…"). Opening it shows
an option selector; price, pieces, contents, allergens and availability all follow the
chosen option. The web storefront groups the same way.

## Stack

- Expo SDK 57, React Native 0.86, TypeScript
- `expo-auth-session` + `expo-web-browser` + `expo-crypto` for Google PKCE sign-in
- `expo-secure-store` for tokens
- Raw `WebSocket` Phoenix-channel subscriber for `public.cart_items` realtime
  (port of `lib/realtime.ts`)

## Android test build

Google OAuth must be tested in an installed app with its own scheme, not Expo Go.
See https://docs.expo.dev/guides/authentication/.

`eas.json` has two Android profiles, both installing as APKs with the native
`graciedelight://` scheme:

- **preview** — JavaScript bundle included. Standalone: connects only to the live
  API in `src/config.ts`; the phone needs no laptop or Metro server. Use this for
  the sign-in / realtime / checkout phone tests.
- **development** — `expo-dev-client` build. Needs the Metro server
  (`npx expo start --dev-client`) on the same network. Use this only when you want
  live reload or in-app logs while changing code.

From this directory:

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

An Expo account is required. Link this mobile app to that account when prompted.
After the build succeeds, open its installation link on your Android phone,
download the APK and install it. This is an internal test build, not a Play Store
submission. Keep any generated Android signing credentials private.

## Google sign-in configuration

Supabase Authentication → URL Configuration → Redirect URLs must include:

```text
graciedelight://oauth2redirect
```

This redirect was added and verified on 5 October 2026. Existing website redirects
were preserved. Google Cloud Console needs no change: Google redirects to the
existing Supabase callback; Supabase then redirects back to the app.

## Flows to test on the phone

1. **Browse** the catalog (guest): list, product detail, prices in naira.
2. **Sign in with Google** (same account as web). In-app browser opens, returns via
   the `graciedelight://` deep link, tokens land in SecureStore.
3. **Realtime cart**: add an item on the *web* app → the phone bag updates within a
   second without pulling to refresh (and vice versa). Backed by the
   `postgres_changes` subscription on `public.cart_items` filtered by `user_id`.
4. **Checkout**: contact + pickup time + notes + bulk switch → `POST /api/orders`
   with an idempotency key; bag clears; confirmation shows reference and statuses.
5. **Demo payment**: on a `pending` order that is `approved` or `not_required`, tap
   *Simulate payment* → `POST /api/demo-payment` flips it to `paid`.
6. **Orders**: history list, statuses as chips, reopen for detail.
7. **Sign out / relaunch**: token restored from SecureStore, refreshed if expired.

## Verified so far

- `npx tsc --noEmit` — no errors (strict).
- `npx expo export --platform android` — Metro bundles 640 modules into a 1.6 MB
  Hermes bundle, so every import resolves.
- API contracts match the deployed endpoints by inspection: `/api/cart` (GET/PUT/
  DELETE `?variant_id=`), `/api/orders` (GET/POST incl. `idempotency_key` UUID),
  `/api/demo-payment` (`{id}`), `/api/catalog` (`{variants, connected}`),
  `/api/profile`, `/api/config`.

Not yet verified: everything that needs a phone and the owner's Supabase redirect
allowlist — Google sign-in, the realtime socket, and checkout against the live API.

## Layout

```
mobile/
  App.tsx                  session bootstrap, header, navigation state
  src/
    config.ts              BASE url + deep-link scheme
    api.ts                 typed client for /api/* (same contracts as web)
    auth.ts                PKCE sign-in, SecureStore, refresh-on-launch
    realtime.ts            Phoenix websocket subscriber for cart_items
    types.ts               Variant / Line / Order / money()
    ui.tsx                 palette + Btn / Field / Chip / Notice
    screens/               Shop, Product, Cart, Checkout, Order, Orders
```
