# Product Requirements Document
# Gracie's Delight Delicacies

**Tagline:** Freshly Baked Deliciousness
**Status:** Draft v1.1 (revised 1 October 2026)
**Scope:** V1 bakery website and technical assignment
**Companion:** [AGENTS.md](AGENTS.md) (build instructions)

Items marked **(proposed)** are recommendations added in this revision. They are not owner-approved policy until confirmed in §14.

## 1. Purpose and document roles

Create a credible, easy-to-use storefront for freshly baked cakes and treats made to order for everyday enjoyment, sharing, gifting, and small gatherings. Support the bakery's real ordering process while demonstrating database persistence, Google authentication, checkout, and transactional email for the assignment.

Use **Gracie's Delight Delicacies** wherever the business is named and **Freshly Baked Deliciousness** as the exact tagline, each defined once and reused. Do not shorten the name. Do not position the business as only a naked-cake or bespoke celebration-cake service.

**Roles.** This PRD is the single source of truth for product behaviour, the catalogue, business rules (BR), and acceptance criteria (AC). AGENTS.md covers engineering conventions and links back here by ID. The owner's explicit decisions override both; update both files together. If they conflict, this PRD wins on product behaviour. Development defaults are provisional, not approved launch policy.

## 2. Goals, users, success

**Goals**
- Help customers discover products and understand sizes, flavours, and pack contents.
- Make advance notice, pickup-only fulfilment, and payment confirmation clear before purchase.
- Support a dependable path from browsing to confirmed order and pickup progress.
- Let the owner manage a controlled menu, prices, availability, photos, approvals, and statuses through a minimal secure workflow.
- Demonstrate integrations honestly, distinguishing demo from live operation.

| User | Primary need |
| --- | --- |
| Visitor | Browse, understand policies, build a cart without signing in. |
| Signed-in customer | Check out, receive confirmation, view own orders and pickup progress. |
| Owner / authorized staff | Maintain catalogue data, review urgent/bulk requests, verify payment where manual, update fulfilment progress. |

No commercial targets have been established, so none are invented. V1 success is passing §12 plus the performance targets in §9. Business metrics can be added once the owner defines them.

## 3. Scope

**Included:** Home; Shop/collections; Product Details; Cart; Google Sign-in; Checkout; Order Confirmation; My Orders; About, Contact, and policy areas; persistent catalogue and order data; Mailgun confirmation emails; configurable pricing, availability, and rules; minimal secure owner operations.

**Excluded:** delivery, shipping, delivery tracking, loyalty, subscriptions, AI recommendations, complex promotions, unrestricted custom assortment builders, advanced inventory, custom cake design tools, unapproved products, large admin dashboards. Elaborate search/filtering is optional.

## 4. Catalogue

Support the full catalogue below while letting the owner activate only a manageable launch selection. Flavour, size, pack size, preset contents, price, and availability are structured, editable data. Quantities must distinguish cakes, loaves, pieces, and packs.

| Collection | Flavours / products | Variants and constraints |
| --- | --- | --- |
| Classic Cakes | Classic Vanilla; Rich Chocolate; Red Velvet; Coconut; Marble; Cookies & Cream | 6, 8, 10, 12 inches for each flavour. |
| Banana Bread | Classic Banana; Peanut Butter Banana; Nutty Banana; Chocolate Chip Banana; Nutella Banana; Double Chocolate Banana; Coconut Banana; Coconut & Raisin Banana | Small, Medium, Large. Dimensions/weights and the Small selling unit await owner confirmation. Keep distinct from Bliss Mini Mix packs. |
| Bliss Mini Mix | Banana Bliss Mini Mix (mini banana bread variety packs); Classic Cake Mini Mix (regular mini cakes) | Two product cards in one category. 4-piece and 6-piece packs. Classic Cake Mini Mix: 4-pack one each Chocolate, Red Velvet, Vanilla, Cookies & Cream; 6-pack adds one Marble and one Coconut. Banana Bliss preset combinations await owner confirmation. Fixed assortments only; no customer-built mixes. |
| Foil Cake Packs | Chocolate; Red Velvet; Vanilla; Marble; Cookies & Cream | Small foil cakes. Minimum 6 pieces, then multiples of 6 (12, 18, 24 and above). One flavour per group of 6. No single pieces. |
| Seasonal Bakes | Fruit Cake; Strawberry Cake; Blueberry Cake | Visible only when owner-activated. Sizes, availability, and prices must be configured first; Classic Cakes sizes do not carry over. |

**Approved launch categories.** The shop presents, in order: All bakes, Classic Cakes, Banana Bread, Bliss Mini Mix, Foil Cake Packs. Blueberry Banana and the Muffins collection were removed from sale; they stay unpurchasable through old links and saved bags, while historical order records are preserved.

**Foil packs.** The sellable unit is a **pack of six**. Quantity means packs, so two packs display as 12 pieces. Each flavour is its own cart line, and re-adding a flavour increases that line. Show total pieces in the cart, order, and email. Enforce on the server as well as in the interface.

**Not-yet-purchasable items.** Banana Bliss Mini Mix packs, Small Banana Bread, and Seasonal Bakes appear as unavailable until their pending data is supplied. Development placeholders are allowed only if clearly labelled and blocked from live checkout.

**Naming.** Bliss Mini Mix and Foil use "Chocolate" and "Vanilla" while Classic Cakes use "Rich Chocolate" and "Classic Vanilla". Keep collection-specific display names as written, but link them to a shared flavour key for consistency. The owner may confirm or rename.

## 5. Business rules

| ID | Requirement |
| --- | --- |
| BR-01 | All products are baked to order with a minimum of one day's advance notice. Do not imply ready-made stock or automatic same-day availability. |
| BR-02 | Use a configurable 24-hour minimum for development. The final meaning of "one day", business timezone, cutoff, hours, blackout dates, and capacity need owner confirmation. Enforce timing server-side. |
| BR-03 | Urgent orders require availability confirmation and an additional rush fee. Show "Urgent order? Contact us to confirm availability." Willingness to pay never overrides capacity or timing rules. |
| BR-04 | The owner approves urgent pickup timing and the fee before the customer accepts the total and pays. Record and validate approval server-side. A contact request alone reserves nothing. |
| BR-05 | Large and bulk orders need additional notice as appropriate. Thresholds and lead times are pending; direct bulk enquiries to the owner while unresolved. One-day notice does not guarantee bulk availability. Approved large orders still obey pack rules. |
| BR-06 | V1 is pickup only. Collect requested pickup timing, show approved instructions, and never collect a delivery address or offer delivery charges. |
| BR-07 | Confirm an order only after payment is received and verified. A submission or redirect is not proof of payment. |
| BR-08 | Payment state, approval state, and fulfilment status are separate. Pending/failed/expired payments never display as Confirmed. |
| BR-09 | After verified payment, fulfilment runs Confirmed → Baking → Ready for Pickup → Completed. Only authorized staff advance it. |
| BR-10 | Packaging is affordable, clean, practical, and food-suitable. No luxury packaging or upgrades without approval. |
| BR-11 **(proposed)** | An item lacking required data (price, preset contents, selling unit, seasonal sizes) is not purchasable. |
| BR-12 **(proposed)** | In live mode, each purchasable product has owner-verified ingredient/allergen information shown before purchase. Never infer "allergen-free" or "contains" claims from names. |
| BR-13 **(proposed)** | Later price or availability changes never alter an existing order. A paid order stands, and any resulting problem is resolved by the owner manually. |

Rush-fee amount and method (fixed or percentage) are unresolved and configurable. Cancellation/refund terms and their status transitions are unresolved; do not invent them.

## 6. Order lifecycle

Orders carry three separate fields:

| Field | Values | Set by |
| --- | --- | --- |
| Approval | not required, requested, approved, declined, expired | System at checkout; owner approves or declines. |
| Payment | pending, paid, failed, expired | System only, from verified events (or authorized staff for a manual method). |
| Fulfilment | none, Confirmed, Baking, Ready for Pickup, Completed | System sets Confirmed on payment; staff advance one step at a time. |

- Checkout creates the order. If the requested pickup is earlier than the configured notice, or a bulk rule applies, approval is **requested** and no payment is offered. The owner is notified. This in-app request works even while owner contact details are pending **(proposed)**.
- Payment is offered only when approval is not required, or approved and unexpired. Approved pickup time, rush fee, and total are fixed; any cart change voids the approval.
- Unpaid orders expire after a configurable period **(proposed)**. Expiry is not a cancellation or refund policy.
- Staff status changes are validated and logged with who and when **(proposed)**.

## 7. Pricing and operating modes

Accurate selling prices are not established. Prices are replaceable per sellable variant in centralized data.

**Demo/assignment mode:** clearly temporary prices with an obvious "Demo pricing — not final" notice wherever needed, including checkout. NGN is a configurable development default pending owner confirmation. Use a labelled sandbox payment flow, prevent real charging, and separate demo orders from live ones.

**Live mode:** requires approved prices, fees, available variants, workable pickup details, a chosen payment method, and the decisions in §14. Real checkout is blocked until they are resolved, and a preflight check reports what is still open **(proposed)**.

Totals are calculated server-side from trusted prices and approved fees, stored as integer minor units with currency. Show subtotal, any approved rush fee, and total before payment. Add no unapproved charges. The payment method is not selected; a manual method needs authorized verification and a gateway needs server-side verification. No specific gateway is mandated.

## 8. Customer experience

**Primary journey:** Home → Shop → Product Details → Cart → Google Sign-in → Checkout → payment verification → Order Confirmation → My Orders. Signed-in customers go directly from Cart to Checkout.

**Exception journeys**
- **Urgent / bulk:** request → owner confirms capacity, timing, and fee → customer accepts full total → verified payment → confirmation.
- **Pending/failed payment:** accurate feedback and a safe retry, with no false confirmation or duplicate paid order.
- **Email failure:** the paid order and its confirmation page are preserved; email can be retried without duplicates.

| Page | Required experience |
| --- | --- |
| Home | Exact name and tagline; made-to-order promise; Shop action; collection highlights; one-day notice; pickup-only guidance; urgent route. No fabricated testimonials or popularity claims. |
| Shop | Four launch collections (Classic Cakes, Banana Bread, Bliss Mini Mix, Foil Cake Packs) plus active Seasonal Bakes; one card per product with image, category, starting price, and a Choose options action; demo disclosure retained. |
| Product Details | Description; image disclosure; valid flavour/size/pack selectors; exact preset contents; price; quantity unit; order notice; foil rules; allergen information when supplied. Add to Cart requires a valid selection. |
| Cart | Edit/remove; preserve variants and contents; distinguish pieces from packs; subtotal; policy reminders; checkout action. Survives sign-in; revalidated at checkout. |
| Google Sign-in | Required before completing checkout and viewing order history. Clear cancellation/error handling, return to checkout with cart intact, sign-out. |
| Checkout | Name, email, phone, pickup date/time or slot, optional notes, itemized total, pickup policy, notice rules, payment state. Prefill from profile; allow corrections. Server validates timing, availability, variants, totals, approvals. |
| Order Confirmation | After verified payment: reference, items/options/pack contents, paid total, pickup details, status, contact route. |
| My Orders | Only the customer's orders: payment state, totals, pickup info, fulfilment progress, helpful empty state. |
| About / Contact / policies | Honest owner-supplied content and channels; ordering, urgency, bulk, pickup, payment, packaging, privacy, terms, cancellation/refund, allergen information. Mark pending decisions for owner review. |

Show key purchasing policies near purchasing actions as well as in the footer. Do not invent contacts, hours, certifications, biographies, reviews, or ingredient claims.

## 9. Design, imagery, accessibility, performance

**Palette (owner-chosen).** Vanilla Glow `#F4E6D2` (background), Berry Velvet `#B23A5D` (primary actions), Peach Whip `#F8C6A0`, Rose Cloud `#E8A7B5`, and Olive Mist `#9DAA77` (accents), with rich brown text. This replaces the earlier "cream and brown with restrained accents; avoid overly pink" direction. The site should stay welcoming, appetizing, and uncluttered, with Vanilla Glow dominant and pink used as accent so it does not become a wall of pink. Several supporting shades are **(proposed)** for accessibility (a dark brown for text, a darker berry and olive for small text and borders, white for cards). Palette tokens, contrast pairings, and restrictions are in AGENTS.md §8. The reference was a Pinterest palette; only the colours are used, not the pin's imagery.

Temporary stock or generated images may be used but must not be presented as the owner's products. Show a visible nearby label such as "Illustrative image — actual product may vary"; alt text alone is not disclosure. Match imagery to the product without implying unverified decorations, portions, ingredients, or packaging. Record licence/source or generated provenance. Image path, alt text, provenance, and temporary flag are editable data so owner photos can replace them without redesign. Use consistent crops, responsive sizing, and stable layout. Real photos are not needed to begin.

Mobile-first, WCAG 2.2 AA: semantic content, strong contrast, readable type, comfortable touch targets, labelled inputs, visible focus, keyboard operation, accessible validation/cart announcements, status not by colour alone, loading/empty/error/unavailable/payment-pending states, useful alt text (empty for decoration).

**Performance targets (proposed)**, measured on mobile with Lighthouse or PageSpeed Insights for Home, Shop, and Product pages: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. These are targets to report against, not guarantees.

## 10. Data and integrations

- **Supabase or Neon** for catalogue and orders; prefer Supabase for integrated Postgres and auth; never both. Neon needs a separate secure auth solution.
- **Google OAuth** via Google Cloud Console with development and production redirects. The consent screen must be published for non-test users.
- **Mailgun** server-side confirmation from an approved sender/domain: full business name, reference, items, total, pickup details, contact information. A sandbox domain only reaches authorized recipients.
- **Payment:** labelled demo flow until a provider is selected.

Entities, fields, constraints, and idempotency design are specified in AGENTS.md §4–5. Product edits never rewrite historical orders. Repeated requests or callbacks must not create duplicate paid orders or emails.

## 11. Security and operations

Secrets stay server-side and out of the repository, bundles, and logs. Row-level security limits customers to their own data; the public client key never replaces access control. The client cannot set prices, payment state, approvals, fees, or fulfilment. Payment callbacks are verified with the provider's mechanism. Customer-entered text is escaped in emails. Checkout and request endpoints are rate-limited **(proposed)**. Protect customer data in logs and errors.

Provide a minimal secure owner workflow for prices, availability, image replacement, approvals, status updates, and staff access; a documented restricted backend workflow is acceptable. Deliver migrations, editable seeds, a secret-free environment example, and setup instructions. Identify unavailable or untested integrations; a simulation is not a working integration.

If customers are in Nigeria (suggested by the NGN default), the Nigeria Data Protection Act 2023 is likely relevant to the privacy policy. This is not legal advice; have the owner confirm with a qualified adviser.

## 12. Acceptance criteria

These are verification requirements for the build, not claims that anything is implemented. "Verify by": **Auto** = automated test, **Manual** = checked by hand, **Setup** = needs owner credentials or external configuration.

| ID | Passing condition | Verify by |
| --- | --- | --- |
| AC-01a | Name and tagline match exactly everywhere they appear, from one constant. | Auto |
| AC-01b | Every collection, flavour, size, pack, and preset in §4 is represented; pending items are unavailable, with nothing invented. | Auto + Manual |
| AC-02a | Foil quantities that are zero, negative, fractional, or not a six-pack variant are rejected server-side. | Auto |
| AC-02b | Cart, order, and email show two foil packs as 12 pieces and show units for packs vs cakes/loaves. | Auto |
| AC-03a | Temporary prices and images are visibly disclosed; both are replaceable through editable data. | Manual |
| AC-03b | Demo mode and any order with a dev-price variant cannot be charged for real. | Auto |
| AC-04a | A guest builds a cart, signs in with Google, and returns to checkout with the cart intact. | Manual (Setup) |
| AC-04b | Cancelling or failing sign-in shows a usable message and keeps the cart. | Manual |
| AC-05a | Valid checkout persists order and items atomically. | Auto |
| AC-05b | Unavailable or blocked variants, tampered totals, invalid pack choices, and unapproved exceptions are rejected. | Auto |
| AC-06a | Requests inside the configured notice, on blackout dates, or around the cutoff boundary behave per configuration in the business timezone. | Auto |
| AC-06b | No same-day or urgent order is accepted without recorded owner approval; approval voids when the cart changes or expires. | Auto |
| AC-06c | Bulk guidance and the request route are shown; with no threshold set, orders are not auto-blocked or implied to be guaranteed. | Manual |
| AC-07a | Pending, failed, and expired payments never show Confirmed. | Auto |
| AC-07b | Repeated callbacks or submissions produce exactly one paid order, one Confirmed transition, and one email. A callback with a mismatched amount does not confirm. | Auto |
| AC-08a | Mailgun sends the persisted summary in the configured environment. | Setup |
| AC-08b | An email failure leaves the order intact and a retry sends exactly once. | Auto |
| AC-09a | A second customer cannot read or modify another customer's orders, items, or profile. | Auto |
| AC-09b | Customers cannot write payment, approval, fee, or status fields. | Auto |
| AC-10a | Authorized staff advance Confirmed → Baking → Ready for Pickup → Completed one step at a time; skips and backward moves are rejected; each change is logged. | Auto |
| AC-10b | Customers see progress but cannot change it. | Auto |
| AC-11a | Keyboard operation, labels, focus visibility, contrast, and error announcements pass on Home, Product, Cart, Checkout, and My Orders, using only the approved palette pairings. | Manual |
| AC-11b | Layouts work on mobile and desktop; empty, loading, error, unavailable, and payment-pending states exist. | Manual |
| AC-11c | §9 performance targets are measured and reported. | Manual |
| AC-12a | No secrets in the repository or client bundle. | Auto |
| AC-12b | Setup docs and owner maintenance instructions are complete; the final report lists what passed and what is blocked on external setup. | Manual |

## 13. Delivery stages

1. Catalogue/configuration and the branded responsive browsing and cart experience.
2. Database persistence and Google sign-in; validated demo checkout and order history.
3. Mailgun, owner operations, and end-to-end acceptance verification.
4. Owner decisions and production setup before enabling live commerce.

These describe implementation order, not a schedule or extra scope.

## 14. Open decisions and launch readiness

"Blocks" shows when the decision is needed: **Dev** (needed to build) or **Launch** (needed before real charging). Every Launch item is tracked by the preflight check.

| Decision | Development placeholder | Blocks |
| --- | --- | --- |
| Prices and currency | Configurable demo prices, NGN default | Launch |
| Rush-fee method and amount | Configurable, no final value | Launch |
| Bulk threshold and notice | Owner enquiry route only | Launch |
| One-day notice rule, cutoff, timezone | 24-hour minimum, configurable | Launch |
| Pickup location, hours, slots, blackout dates, capacity, instructions | None invented; checkout cannot go live without them | Launch |
| Payment method/provider | Labelled demo adapter | Launch |
| Banana Bliss Mini Mix 4-pack and 6-pack contents | Not purchasable | Launch |
| Banana Bread sizes (dimensions/weights, Small selling unit) | Labels only | Launch |
| Seasonal Bakes sizes, prices, availability | Hidden/not purchasable | Launch |
| Owner contact details, About content | Placeholders flagged | Launch |
| Verified ingredient/allergen information per product (BR-12, proposed) | "Allergen information pending" notice | Launch |
| Privacy, terms, refund and cancellation text | Marked for owner review | Launch |
| Packaging specifics | Generic BR-10 wording only | Launch |
| Imagery | Disclosed temporary images | Launch (or keep disclosure) |
| Palette accessibility shades: dark brown text, darker berry/olive, white cards (proposed) | Defined in AGENTS.md §8 | Dev |
| Approval validity and unpaid-order expiry periods (proposed) | Configurable defaults | Dev |
| Owner notification email and staff Google accounts (proposed) | Test accounts | Dev |
| Flavour naming consistency (§4) | Per-collection names as written | Dev |
| Production OAuth, database access, Mailgun sender and credentials, payment settings | Sandbox/test | Launch |

Development proceeds with labelled placeholders. Real checkout waits for the Launch items. Professional photos may follow if temporary imagery stays disclosed.

## 15. Risks and assumptions

- **Single sign-in method:** customers without a Google account cannot check out. This is accepted for V1 because the assignment requires Google OAuth.
- **Google consent screen** left in Testing mode blocks ordinary users and expires sessions; publish it before real use.
- **Mailgun sandbox** only reaches authorized recipients; a verified domain is needed for real customers.
- **Owner availability** for the §14 decisions is the main schedule risk; the placeholder approach keeps development unblocked.
- **Capacity** is not modelled beyond blackout dates and optional slots. Overbooking is handled by the owner through the approval flow.
