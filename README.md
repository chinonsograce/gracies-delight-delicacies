# Gracie's Delight Delicacies

A bakery storefront with a pickup checkout, Supabase database migrations and Google OAuth PKCE integration, Mailgun server email adapter, signed demo-payment verification, customer order history and restricted staff API.

Start with [SETUP.md](SETUP.md). Product behavior is specified in [PRD.md](PRD.md); engineering instructions are in [AGENTS.md](AGENTS.md). These documents are user-supplied requirements; explicit user requests take precedence.

Demo mode is the only supported payment mode. External integrations require your accounts and server secrets; they are not connected merely by building the code. The guest bag persists locally; on sign-in it merges into a server-side bag (`cart_items`) exposed through `/api/cart`. Web and mobile clients read and write that same bag and subscribe to Supabase Realtime on `cart_items`, so a change on one device appears on the other instantly. Catalogue, profiles, orders, item snapshots, events and email claims use Supabase once configured.

Implemented automated checks: pack quantity constraints, two packs = 12 pieces, blocked variants, duplicate lines, and the rolling 24-hour demo boundary. Database transaction, RLS, OAuth and email acceptance checks require live test configuration. See SETUP.md for launch gaps and commands.
