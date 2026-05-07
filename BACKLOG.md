# CarBNB Backend Build-Out — Prioritized Backlog

## Context (stable — why this plan exists)

CarBNB is a P2P car rental marketplace for the Philippines (Next.js 16 + Prisma 7 + Supabase + Vercel). The UI was built design-first as a high-fidelity prototype; the backend was deferred. The user inherited the project mid-internship and needs a prioritized path to move from "prototype with mock data" to "working product with real persistence."

This plan is the single source of truth for remaining work. The *Current state* section below tracks progress and will be updated as tiers complete — the *Context* section above does not change.

**Scope decisions locked in during planning:**
- **Auth**: Full tri-role (Admin + Host + Customer) — all three roles log in.
- **Booking model**: Customer self-serve — customers book directly from listing pages, admin approves.
- **Seed strategy**: Wipe existing partial data and reseed full mock dataset into the **local Docker DB** for development.
- **Dev/prod DB separation**: Local Docker Postgres for dev data + shared Supabase project for Auth & Storage. Production uses full Supabase (Postgres + Auth + Storage).
- **Accounting**: Parked. Cash-only details TBD; no payment gateways for now.

**Target audience:**
- **Now (through Tier 7)**: internship portfolio piece — demo to supervisor, show the complete marketplace loop works end-to-end. Not public-facing.
- **Long term**: public launch in the Philippine market. Tiers 7.5 (logout + password reset + basic email), 8 (accounting), 9 (email/rate limiting), 10 (testing/observability) and legal pages (ToS/Privacy) are all on the eventual roadmap.
- **Implication for Tier 2-7 decisions**: pick patterns that don't close doors on future scale — e.g. URL-based pagination (shareable), Zod schemas (reusable for APIs), server actions (easy to promote to API routes later), activity log writes from day one.

## Current state (dynamic — update as work progresses)

*Updated: 2026-04-24 (Tier 7 complete locally — admin dashboard on real Prisma aggregates; PlatformSettings singleton + wired /settings with Zod + activity log; commission rate lock-in per booking; admin /customers list + detail; admin /calendar wired to real bookings + exceptions; sidebar gets Calendar + Customers nav; login email preserved on error; login tab mismatch rejected with clear copy; admin Topnav UserMenu has Dashboard/Settings/Browse links; multiple cosmetic fixes (owner dropdown width + label pattern, numeric placeholders, exception-status label, /owners responsive breakpoint). Prod runs through Tier 6 (deployed at start of Tier 7). Tier 7 commit pending on `tier-7-complete`, deploys at the start of Tier 8.)*

*Updated: 2026-05-06 (Tier 16 complete locally — fleet routing + parallel availability. New `lib/host-booking-authority.ts` + `lib/host-listing-authority.ts` resolvers centralize "who can act on this booking/listing" for both action layer + page guards. Booking authority routes Confirm/Reject/Start/Complete to the fleet on cars with an ACTIVE FleetCarLink; the individual owner sees an informational "Managed by [Fleet]" panel and a read-only chat (`viewerRole="host-readonly"` added). New activity codes `FLEET_BOOKING_*` mirror the Tier 13 `HOST_*` pattern; system messages now read "by [Fleet name]" when fleet acts. Availability rules + exceptions are editable by both individual + fleet; new `CarAvailabilityException.addedByOwnerId` audit column drives a "blocked by [name]" row hint. `/host/cars` and `/host/bookings` now include linked-car rows for fleet operators; `/host/cars/[id]/edit` page guard accepts fleet on active link and hides owner-only sections (details edit, photos, OR/CR, fleet-link request). MANUAL-TESTING.md gets Tier 16 sections A–F. Deferred to Tier 8: money-split deduction logic on `Booking.ownerPayout`. Tier 16 commit pending on `tier-16-complete`, deploys at the start of Tier 17.)*

### Tier 1 — 100% complete locally, 0% deployed to prod

**Local setup — done:**
- ✅ Local Docker Postgres on host port 5433 (native Windows Postgres held 5432); [docker-compose.yml](docker-compose.yml) updated
- ✅ `.env.local` points `DATABASE_URL` + `DIRECT_URL` at Docker; real Supabase anon key in place (original value from Vercel was a placeholder); anon key and URL retained for Auth/Storage
- ✅ Initial migration generated + applied: [prisma/migrations/20260421110809_init/](prisma/migrations/20260421110809_init/)
- ✅ Full mock dataset seeded locally (7+ owners including signups, customers, listings, bookings, availability rules, exceptions, accounting entries, payouts, activity log, 1 admin User)
- ✅ Supabase SSR SDK installed (`@supabase/supabase-js`, `@supabase/ssr`)
- ✅ Supabase helpers: `utils/supabase/{server,client,middleware}.ts`
- ✅ Root `proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`) — refreshes sessions, guards admin paths with DB-based ADMIN role check
- ✅ Auth server actions: [app/(auth)/actions.ts](app/(auth)/actions.ts) (`loginAction`, `signupAction`)
- ✅ Login + signup forms wired as client components calling server actions
- ✅ [app/(admin)/owners/page.tsx](app/(admin)/owners/page.tsx) — converted to `db.owner.findMany()` with `export const dynamic = "force-dynamic"` so new signups appear immediately
- ✅ Prisma adapter-pg installed; lib/db.ts + seed updated for Prisma 7 engine-client pattern

**Verified manually:**
- Admin login redirects to `/dashboard`
- Unauthed `/dashboard`, `/owners`, `/bookings` redirect to `/login`
- Host signup creates Owner with status `Pending Verification`, appears in admin verification queue
- Customer signup creates Customer row
- Host/Customer logins route to `/`
- New signups appear in `/owners` without a rebuild (force-dynamic works in dev AND prod build)
- Production build compiles with 0 errors; all 23 routes compile cleanly; TypeScript + Prisma validate pass

**Known minor gaps (low priority, address in Tier 2):**
- Login form tabs (Host/Customer) are purely visual — users can log in via the "wrong" tab; role resolution happens via DB so they still land correctly. Fix later: compare requested role vs DB role and error if mismatch.
- `OwnerStatus` enum values (e.g. `"Pending Verification"`) don't match Prisma schema defaults (`"PENDING"`). Worked around by using `OwnerStatus.PENDING` in signup action; proper unification in Tier 2.
- Mock data IDs are `OWN-XXX` format; new rows get `cuid`. Cosmetic only — cuids are industry standard.
- No logout button yet — workaround is closing incognito / clearing cookies.
- Dashboard + every admin page except `/owners` still read from mock data. Conversion is Tier 2+.

**Deferred (until we merge `tier-1-complete` → `main` and deploy to prod):**
- ❌ Update Vercel's `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the real JWT (current Vercel value is the placeholder)
- ❌ Update Vercel's `DATABASE_URL` to the pooled Supabase format (current: old direct-host)
- ❌ Add `DIRECT_URL` to Vercel env vars
- ❌ Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel env vars (required for owner doc uploads + admin-create-owner auth provisioning)
- ❌ Update `package.json` postinstall to run `prisma migrate deploy && prisma generate`
- ❌ Create Supabase Auth admin user (`admin@carbnb.com`) for production login — actually already done since Auth is shared across envs; just needs verification
- ❌ **Re-enable "Confirm email" in Supabase Auth settings before production.** Turned OFF during Tier 1 A3 setup for dev convenience. Leaving off in prod would allow signup-without-real-email abuse.
- ❌ Verify `owner-documents` bucket is created in the Supabase project (should already exist since Auth/Storage are shared) — no RLS policies needed if we keep service-role-only writes

**Session ended at:** Tier 1 committed + pushed to `tier-1-complete` branch on GitHub. Production branch `main` untouched.

**Key Next.js 16 breaking changes surfaced:**
- `middleware.ts` → `proxy.ts`, exported function is `proxy`
- Prisma 7 has no Rust engine — requires driver adapter (`@prisma/adapter-pg`)
- Prisma 7 removed `url` and `directUrl` from schema `datasource` — now in `prisma.config.ts`

After each tier completes, update this section with the new state.

---

## Collaboration conventions

### Mode: Consulted *(chosen by user, 2026-04-21)*

When I'm about to execute a tier, cross-cutting decisions get handled this way:

- **On first encounter** of a cross-cutting topic (validation library, pagination, error UX, etc.) within a tier → I ask via `AskUserQuestion`, batching multiple questions into one prompt when possible.
- **Once decided** → I apply the decision in subsequent code without re-asking.
- **Decisions get logged** in the table below so future sessions (and future-me) know what was chosen.

**I ask about:** validation libraries, pagination defaults, error UX patterns, new schema additions, scope judgment calls, irreversible data operations, UX placement (modal vs route), visible naming choices.

**I don't ask about:** variable names, Tailwind classes, minor placeholder text, formatting — I match existing conventions.

### Cross-cutting decisions (filled in as tiers execute)

| Topic | Decision | Tier decided | Notes |
|---|---|---|---|
| Error UX pattern | Inline banner from server action returning `{ error: string }` | Tier 1 | Established by `loginAction` / `signupAction` |
| Form submit pattern | Client form + `useActionState` + server action | Tier 1 | Established in `login-form.tsx`, `signup-form.tsx` |
| Role resolution | DB lookup (User/Owner/Customer tables), NOT auth metadata | Tier 1 | Prevents spoofing via anon-key `signUp` |
| Admin route guard | `proxy.ts` at root, DB role check per admin path | Tier 1 | Next.js 16 renamed `middleware.ts` → `proxy.ts` |
| Prisma client pattern | `PrismaPg` adapter from `@prisma/adapter-pg` | Tier 1 | Prisma 7 removed Rust engine |
| Validation library | **Zod** | Tier 2 | Schema-first, reusable across server actions |
| Pagination + filter state | **URL query params** | Tier 2 | `?page=N&search=X&status=Y` — shareable, bookmarkable |
| Activity logging triggers | **Every admin action** (create/approve/suspend/edit/delete on owners, listings, bookings) | Tier 2 | Write to `ActivityLogEntry` from each server action |
| Edit UX | **Separate `/owners/[id]/edit` route** (and analogous for listings/customers) | Tier 2 | Matches existing new-owner form pattern |
| Admin-creates-user auth provisioning | **Option B — admin sets temp password; server provisions Supabase Auth user + Owner row atomically with rollback** | Tier 2 | Chosen over staff-only stub + invitation-email paths. When email infra lands later, revisit to add invite flow. |
| Storage bucket access | **Private bucket + service-role writes only from server actions** | Tier 2 | `owner-documents` bucket has NO RLS policies — safe because only service role (server-side) writes. If we later want client-direct uploads, we'd need RLS. |
| File-path convention in Storage | **`{entityId}/{docKind}.{ext}`** | Tier 2 | E.g. `cmoa21tf4.../id.jpg`. Upsert=true so replaces overwrite rather than accumulate. |
| File upload UX | *TBD — ask at Tier 2* | - | When we first upload an ID doc |
| Image optimization | *TBD — Tier 3 when photos land* | - | Candidate: `next/image` + Supabase transforms |
| Listing creation scope (Tier 3) | **Admin-only in Tier 3**; host-scoped creation deferred to Tier 6 | Tier 3 | Keeps tier boundary clean; admin form proven before host flow reuses it |
| Photo upload UX | **Multi-file gallery** with drag-to-reorder, primary photo selector, per-photo remove; cap at ~8 photos | Tier 3 | Matches marketplace norms; avoids rewrite when customer-facing listing detail needs it in Tier 4 |
| Availability UI placement | **Edit per-listing on `/car-listings/[id]/edit`** (rules + exceptions co-located); `/availability` repurposed as read-only fleet summary | Tier 3 | Airbnb-style; one car = one page for editing; top-level page keeps the cross-listing overview |
| Vercel deploy cadence | **Deploy at start of each tier** once merged; Tier 3 is the first such deploy (brings Tier 1+2 live together in one merge of `tier-2-complete` → `main`) | Tier 3 | Catches env/migration drift early on a small bundle before Tier 3 features layer on |
| Commission rate | **TBD — hardcoded constant with TODO marker** for Tier 4; revisit in Tier 7 when PlatformSettings table lands | Tier 4 | Existing UI says 15%, mock data inconsistent (15% + 20%). Pick one later, keep constant centralized now so only one place to update. |
| Booking reference format | **`BK-{6 uppercase alphanumeric}`** (e.g. `BK-A3X9K2`). Generated server-side, uniqueness enforced by existing `referenceNumber` unique DB constraint with retry on collision | Tier 4 | Short, readable, non-sequential (no leaking total bookings). Matches prototype's `BK-` aesthetic. |
| Customer cancellation policy | **Customer can self-cancel PENDING bookings only.** Once admin confirms (CONFIRMED+), cancel requires admin action (Tier 5) | Tier 4 | Tight scope for demo. Avoids refund/deposit/time-cutoff logic (accounting parked). Expand in Tier 5/8. |
| Payment + accounting scope (Tier 5) | **Mark-paid writes Booking fields only** (paymentStatus + method/receivedAt/receivedBy/notes). No AccountingEntry row until Tier 8 | Tier 5 | Data already exists on Booking; AccountingEntry would be duplication. Tier 8 can backfill from paid Bookings in one migration. |
| Mark-paid UX | Only **notes** field is manually filled; paymentMethod defaults to `"CASH"`, receivedAt=`now()`, receivedBy=admin.email. paymentProofUrl column exists but no UI for it yet | Tier 5 | Cash-only model, minimal admin friction. Audit trail still captured. |
| Admin cancel/reject reason UX | **Preset dropdown + optional note** (preset list: Customer no-show, Documents not verified, Vehicle unavailable, Duplicate booking, Other). If Other, note becomes required | Tier 5 | Structured data for future reports + fast UX. |
| Admin-created booking status | Start at **CONFIRMED immediately** (skip PENDING). Availability check still runs | Tier 5 | Admin IS the decision-maker; no one to self-approve to. |
| Rental-day counting | **Inclusive calendar days** — both pickup and return dates count. May 4 → May 6 = 3 days | Tier 5 | Matches what the range calendar visually highlights; matches local PH P2P rental norms; owner payout reflects actual car unavailability. Same-day rentals still bill 1 day minimum. |
| Availability model when range crosses blocked days | **Model 1 strict** — bookings cannot span any blocked day (weekly rule, exception, or existing booking). Customer must split into two separate bookings if they want segments on either side of an unavailable window | Tier 5 | Matches Airbnb/Turo. Owners genuinely use blocked-weekend to mean "my own car days." Server already enforced this; client now shows a red warning + disabled submit via `findRangeConflicts` instead of letting user submit into a rejection. |
| Host booking controls | **Confirm / Reject only** on their own cars' PENDING bookings. Admin keeps Start / Complete / Cancel / MarkPaid | Tier 6 | Turo-style. Hosts own request-acceptance; platform owns the rest of the lifecycle. Avoids two-cook conflicts on mid-lifecycle actions. *Superseded in Tier 13 — see "Host trip-lifecycle actions" row below.* |
| Host trip-lifecycle actions | **Host gains Start + Complete; admin keeps both as well.** Both can transition CONFIRMED → ONGOING and ONGOING → COMPLETED on bookings against the host's cars; first-mover wins via the existing status guard. Admin retains exclusive control of MarkPaid + Cancel | Tier 13 | Tier 6's "platform owns the lifecycle" left the host waiting on an admin who has strictly less information — the host has direct ground truth (handed over the keys, got the car back). The two-cook concern from Tier 6 is mitigated by per-status status guards, not exclusivity: whichever role acts first transitions the status; the second role's action returns "Cannot start a booking whose current status is ONGOING" cleanly. MarkPaid stays admin-only until accounting (Tier 8) ships a customer-side payment confirmation. |
| Booking chat scope | **Per-booking, lifecycle-bounded.** Chat opens at CONFIRMED, stays active through ONGOING, remains active for 48h after `rentalCompletedAt`, then goes read-only. Each booking gets its own thread; no shared thread across past bookings between the same (host, customer) pair | Tier 14 | Matches the Grab/Uber model the user explicitly cited — strictly for trip coordination, not general messaging. Lifecycle scoping makes grace-period boundaries unambiguous. Per-booking threading keeps audit trail clean for disputes ("which trip was this damage about?"). |
| Booking chat — admin access | **Read-only access to all booking chats** from `/bookings/[id]`. Privacy banner on the chat panel notes admin can view for support / dispute purposes | Tier 14 | Small platform pre-launch — losing the only audit trail to an "all-private" stance is risky. Admin observes but cannot reply or send. Customer + host both see the privacy banner so there's no surveillance surprise. |
| Booking chat — system events | **Inline lifecycle events as muted system rows.** Status transitions write paired Message rows with `kind = "system"`: "Booking confirmed by host", "Trip started · 9:42 AM", "Trip completed · Chat closes in 48h", "Booking cancelled · reason: …" | Tier 14 | Provides context without either party having to type it. Distinguishes "why is the host saying 'I'm here'" → "oh, the trip just started". Adds a `kind` column to Message but the cost is small and the UX win is large. |
| Booking chat — past trips link | **Show inline link if the customer has 1+ prior COMPLETED booking with the same host.** Link opens a small popover listing past bookings with quick links to each (chats are still per-booking, not merged) | Tier 14 | Discoverability of context without merging threads. Same on the host side ("You've rented to this customer before"). |
| Booking chat — realtime mechanism | **V1 = client-side polling every 5s with Page Visibility API pause on blur.** V2 = swap the polling hook for Supabase Realtime channel subscription | Tier 14 | Polling is cheap and avoids RLS work in V1. The `useChatMessages(bookingId)` hook is the abstraction boundary — V2 migration changes only the hook, not the chat-panel components. For coordination messages ("running late", "I'm here"), 0-5s latency is invisible in the real world. |
| Booking chat — message length cap | **1000 characters** | Tier 14 | Matches review comment + bio caps. Plenty for "the address is …" / "key is under the mat" / "running 10 min late". Short enough to keep the chat scannable. Validated server-side in Zod and client-side via `<textarea maxLength>`. |
| Host kind taxonomy | **Two kinds: `INDIVIDUAL` and `FLEET`**, stored as `Owner.kind: String @default("INDIVIDUAL")`. Fleets get optional `companyName` and `businessRegNumber` fields. Existing seeded + migrated Owner rows default to INDIVIDUAL | Tier 15 | Reuses one Owner table with a discriminator field rather than introducing a separate `FleetOperator` entity. Fleets share most behavior with individuals (login, dashboard, booking management) so the discriminator avoids duplicating ~60% of the existing host code. |
| Host kind — locked at signup | **Locked at signup; not user-switchable.** Onboarding screen has two big buttons (Independent Car Owner / Registered Car Rental Operator) with helper captions. Admin can flip `Owner.kind` manually if a host requests a change | Tier 15 | Switching kind raises edge cases (does an individual switching to fleet auto-self-list? do existing FleetCarLinks survive an INDIVIDUAL who flips to FLEET?). Locking removes a class of bugs at the cost of a rare admin-mediated flow. |
| Fleet verification gate | **Same `OwnerStatus.PENDING → admin approves → VERIFIED` flow** as individuals (Tier 2). Admin sees `kind=FLEET` in the verification queue and can request business-registration documents out-of-band before approving | Tier 15 | Reuses existing Tier 2 admin approval queue. No new doc upload paths in V1. The kind label in the queue gives admin context to apply heavier scrutiny if needed. |
| Fleet-link direction | **Owner-initiates only.** Independent owner browses `/fleets` (a public-ish directory of VERIFIED fleets), picks one, sends a link request for a specific car. Fleet approves or rejects from their host dashboard | Tier 15 | Matches the natural mental model ("I'd like Acme Rentals to manage my car"). Single UI flow. Fleet-initiates (invitations) and bidirectional linking are nice-to-haves that can be added later without migrating the existing data. |
| Public host name display | **Both names, dual-host format: "Hosted by Joe · managed by Acme Rentals"** on listing cards, listing detail Owner card, and chat panel headers when the car has an ACTIVE FleetCarLink | Tier 15 | Most transparent. Customer sees the legal owner AND the operational manager. Both names link to their respective `/hosts/[id]`. Trust signal: the fleet operator is visible as a registered company; the individual isn't hidden. |
| Public profile for fleets | **Same `/hosts/[id]` template** as individuals, with `companyName` swapped in for `fullName` in the header when `kind=FLEET`. Bio field renders as "About this company" instead of "About". Listings grid shows owned cars + cars linked to this fleet | Tier 15 | Reuses Tier 11 work. One template, conditional on kind. Fleet operators get a public-facing profile from day one without building a separate page. |
| Fleet management fee | **Captured at link approval time as `FleetCarLink.managementFeePercent: Float?` (nullable).** No deduction logic ships in Tier 15 or 16 — `Booking.ownerPayout` continues to go 100% to the individual. Real fee deduction defers to Tier 8 (accounting) | Tier 15 | Lets fleets and owners record their fee agreement now without needing accounting infrastructure. When Tier 8 ships, the field is already populated for active links. |
| Booking authority on fleet-managed cars | **Fleet exclusive once a `FleetCarLink` is `ACTIVE`.** Confirm / Reject / Start / Complete actions only render on the fleet's host dashboard. Individual owner sees the booking on their own `/host/bookings` list as informational (no action buttons). Admin retains exclusive MarkPaid + Cancel | Tier 16 | Cleanest division. The whole point of linking is "I delegated the operational side to the fleet" — letting the individual still act would defeat the purpose. Two-cook conflicts already prevented by the Tier 13 status guard pattern. |
| Booking chat counterparty on fleet-managed cars | **Customer ↔ fleet operator** is the active chat. The booking's `senderRole` for host-side messages becomes the fleet's role. Individual owner sees the chat history read-only on their `/host/bookings/[id]` (admin-style read-only). One thread per booking — Tier 14 invariant preserved | Tier 16 | Matches "fleet exclusive" booking authority. Avoids 3-way chat (overkill in V1). The individual stays visible to the customer via the dual-host name display, but the operational counterparty is whoever's actually managing. |
| Availability authority on fleet-managed cars | **Both individual and fleet can edit weekly rules and exceptions.** New `CarAvailabilityException.addedByOwnerId` field tracks who created each exception (audit trail). `requireHost()` server-action gate extends to accept "fleet operator on a car with active link to that fleet" | Tier 16 | Both have legitimate scheduling concerns: individual blocks for personal use, fleet blocks for maintenance / detailing. The union of all blocks applies — no real conflict. Activity log + the new column preserve audit trail. |
| Proximity model for fleet picker | **Decision deferred to tier start.** Two paths logged: (A) lat/lng + geocoding for true distance, (B) district / neighborhood text fields with substring match at sub-city. Recommended staging: B first, A as a polish tier afterward | Tier 18+ candidate | Full lat/lng is a bigger commitment than the demo currently warrants. B captures the UX win without API integration; A becomes a clean follow-up if and when needed. |
| Proximity as suggestion vs filter | **Suggestion only.** Picker sorts by proximity and badges matches with "Near you"; never filters non-matching fleets out | Tier 18+ candidate | Owners may have legitimate reasons to pick a non-local fleet (existing relationship, better fee, better reputation). Don't paternalize the choice. |
| Where proximity applies | **Picker on `/host/cars/[id]/edit` only** — not the public `/fleets` directory | Tier 18+ candidate | `/fleets` is a marketing surface for all roles; "near you" assumes the viewer has a car to link. The picker is the actionable surface where sort order matters. |
| Listing submission flow | **Multi-step wizard: basics → photos → OR/CR.** New `DRAFT` status (string union, no Postgres enum); listing rows start as DRAFT and only flip to PENDING_APPROVAL via explicit "Submit for Approval" CTA gated on photos.length ≥ 1 AND orCrDocumentUrl present. Action-layer re-checks the prerequisites server-side | Tier 17 | Today's flow lets admins approve listings sight-unseen. Bundling docs with submission matches Turo / Airbnb expectations and eliminates the "approved without docs → never uploaded" failure mode. DRAFT keeps mid-wizard rows out of admin's queue. |
| Photo requirement at submission | **Require ≥1 photo before DRAFT can flip to PENDING_APPROVAL.** No upper bound at submission; existing 8-photo cap stays. No minimum count beyond 1 | Tier 17 | Admin needs visual context to approve. ≥1 is the lowest bar that still gives admin something to look at; phones make this cheap. Higher minimums add submission friction without proportional review value. |
| Availability in submission flow | **Stays post-approval — NOT pulled into the wizard.** Hosts set weekly rules + exceptions on `/host/cars/[id]/edit` after admin approves the listing | Tier 17 | Availability is scheduling, not a trust signal. Including it lengthens the wizard with no admin-decision value. Same as today's behavior — only the wizard ordering of basics/photos/OR/CR is new. |
| DRAFT visibility on /host/cars | **Show DRAFT cards with an amber "Continue setup" badge.** Click → `/host/cars/[id]/edit` (same page as ACTIVE/PENDING/etc.) with a sticky footer "Submit for Approval" CTA gated on prerequisites | Tier 17 | One edit page, two button states based on status. Cleaner than a parallel wizard route. Host always knows where their incomplete drafts are. |
| Legacy PENDING_APPROVAL listings without OR/CR | **Grandfathered under old rules.** Admin can still approve them as-is. Only the new wizard path requires docs to leave DRAFT | Tier 17 | Small known set; rewriting in-flight submissions creates worse experience than letting admin handle them under prior conventions. The new policy applies cleanly to all wizard-created listings going forward. |
| Host listing create + edit flow | **Approval on first submit, free edit after.** Host submits → `PENDING_APPROVAL` → admin approves → `ACTIVE`. Post-approval edits to price / description / photos / availability do NOT bounce the listing back to PENDING_APPROVAL | Tier 6 | Matches Turo / Airbnb. Vetting lives at onboarding; hosts need frictionless price tuning. Plate stays locked after create to prevent drift. |
| Pending-host UX | **Dedicated "awaiting approval" locked screen** at `/host/dashboard` — pending hosts can log in but no actions render. SUSPENDED hosts get the same treatment with red-shield copy. Full progress-dashboard onboarding deferred to Tier 7+ | Tier 6 | Simplest that's still professional for the demo. `requireHost()` in server actions is the real trust gate; pages are the visible one. |
| Host dashboard tiles | **Active listings count → /host/cars · Upcoming bookings count → /host/bookings · Total earnings = sum(ownerPayout) of COMPLETED bookings**. No activity feed | Tier 6 | Matches Turo host home's top-of-fold. Earnings sums straight from `Booking.ownerPayout` — no AccountingEntry needed (still parked for Tier 8). |
| Host route structure | **`app/host/*` (no route group).** Pages live at literal `/host/dashboard`, `/host/cars`, `/host/bookings` | Tier 6 | Initial attempt at `app/(host)/*` collided with `app/(admin)/*` — both groups are URL no-ops so `(host)/bookings` and `(admin)/bookings` both resolved to `/bookings`. Nesting under a real `host` segment fixed it cleanly. |
| PlatformSettings storage | **Single-row `PlatformSettings` table** keyed by literal `id = "singleton"`, accessed via self-healing helper `getPlatformSettings()` that upsert-creates on miss | Tier 7 | Simplest possible "config table" pattern. Row is guaranteed to exist at runtime even if DB is wiped. Keeps `prisma migrate` and `db seed` simple. |
| Commission rate lock-in | **New rate applies to new bookings only.** `Booking.platformFee` / `ownerPayout` are calculated at creation time using the live commission; existing rows keep their stored values. Dashboard "Platform Fee (X%)" label uses the live setting; per-booking detail computes the rate from the stored amounts | Tier 7 | Matches standard accounting practice: retroactive rate changes would corrupt historical records. |
| `calculateBookingAmount` API | Takes explicit `commissionRate: number` parameter (no default). Client forms accept it as a prop from the parent server page; server actions fetch via `getPlatformSettings()` before calling | Tier 7 | Keeps the math library client-safe (no server-only imports bleed into client bundles). `lib/platform-settings-server.ts` holds the DB helpers behind `import "server-only"`. |
| Availability summary drift | **Deferred** — `CarListing.availabilitySummary` stays a stored string, updated inside `saveAvailabilityRulesAction` (and host equivalent) on every rule save | Tier 7 | Works today; `saveAvailabilityRulesAction` is the only place rules change, and it already writes the summary alongside the rules. Revisit if a second code path starts mutating rules. |
| Booking time precision | **Daily-only** — UI exposes pickup/return as dates, no time-of-day picker | Tier 9 | Matches PH P2P norms + current inclusive-calendar-day billing. `Booking.pickupDate` / `returnDate` columns stay `DateTime` so we can add hours later without a migration. |
| Vehicle type taxonomy | **Fixed enum** — Sedan, SUV, Hatchback, MPV, Van, Pickup, Coupe | Tier 9 | New `CarListing.vehicleType: String` column. Validation enforced in app (Zod). Adding a new type later = one-line code change + (optional) backfill. |
| Vehicle features taxonomy | **Fixed checkbox list** — stored as `CarListing.features: String[]`. Initial list: Air conditioning, Bluetooth, USB ports, Backup camera, GPS, Dashcam, Child seat, Sunroof, Cruise control, Apple CarPlay, Android Auto, Keyless entry, Auto wipers | Tier 9 | Hosts pick from the list when creating/editing a listing. List lives in a single constant in the app. |
| Review model | **Single 1-5 stars + optional comment**, customer-only, after `status=COMPLETED`, one per booking, no edit, no host reply | Tier 10 | User picked simplest over the originally-described 5-category breakdown (cleanliness/maintenance/communication/convenience/accuracy). Multi-category split can be added later without breaking existing rows (new columns nullable, single rating stays primary). |
| Review form placement | **Inline form on `/account/bookings/[id]`** for COMPLETED bookings without an existing review. After submit, the same section flips to read-only display of the saved review | Tier 10 | No new route, no dialog primitive needed. Customer sees their booking + review in one place. |
| Reviews list pagination | **5 most recent + "View more" button** (client-side load-more, no URL state). Listing detail shows aggregate at top + first 5 below | Tier 10 | Simple, no extra round-trip on initial render. Most users want chronological top-down. URL-based pagination would add complexity for little payoff. |
| No-reviews state | **Empty-state copy** — Reviews section heading + "No reviews yet — be the first to review after your trip" message. Aggregate line shows "No ratings yet" instead of "0.0 ★" | Tier 10 | Keeps page structure consistent. Cards with `reviewCount = 0` hide the stars chip entirely. |
| Review comment cap | **1000 characters** | Tier 10 | Roughly 150-200 words; matches Turo. Enough for thorough review without becoming a wall of text. Validated in Zod (server) and `<textarea maxLength>` (client). |
| Aggregate rating sync | **Recompute on every review insert** inside the same transaction (`avg(rating)` + `count(*)` from Review where listingId = ...) | Tier 10 | Reviews are write-rare and read-frequent. Recompute is exact and avoids drift; incremental update would risk floating-point error on long-lived listings. |
| Bio character cap | **500 characters** | Tier 11 | About 80 words. Forces a tight scannable bio; matches the brevity of seeded host data. Validated in Zod (server) + `<textarea maxLength>` (client). |
| Favorited heart style | **Solid red/pink filled** when favorited; outline gray otherwise | Tier 11 | Universally recognized "saved" pattern (Airbnb, Turo). Visually distinct from brand primary so the action stands out. |
| Host profile with 0 active listings | **Show profile + empty state** ("No active listings right now") | Tier 11 | Avoids orphan-link 404s when a host's listings are temporarily suspended or between cars. Also keeps the host bio + member-since useful even with no inventory. |
| Favorites scope | **Login required** — heart icon only works for logged-in customers; logged-out click bounces to `/login?redirectTo=...` | Tier 11 | No localStorage/anonymous merge logic. Single source of truth = `Favorite` table. |
| Host public profile scope | **Listings + bio + member-since only** at `/hosts/[id]`. No response-rate / response-time / verified-badge stats | Tier 11 | Adds nullable `Owner.bio`. Member-since uses existing `Owner.createdAt`. Stats deferred to a future polish tier. |
| Location search input | **Free-text + city chips coexist** — text input does case-insensitive partial match on `CarListing.location`; existing city chips remain below as quick-filter shortcuts | Tier 9 | Best of both: power users type, browsers tap chips. No schema change. |

### Deferred cross-cutting topics

Not addressed in Tiers 2–7; plan to add dedicated tiers later:

- **Email notifications** (booking confirmations, host alerts, verification approvals) → propose Tier 9
- **Testing** (unit + integration for server actions) → propose Tier 10
- **Rate limiting** (signup/login abuse protection) → propose Tier 9
- **Observability** (Sentry or similar for error tracking + structured logging) → propose Tier 10
- **SEO / OpenGraph tags** on listing detail → can be a follow-up after Tier 4

---

## Session 0 — Already complete

- ✅ Vercel CLI installed, logged in, project linked (`internz2026-9884s-projects/car-bnb`)
- ✅ `.env.local` pulled from Vercel, upgraded to pooled `DATABASE_URL` + session-mode `DIRECT_URL`
- ✅ Prisma 7 adapter (`@prisma/adapter-pg` + `pg`) installed and wired in [lib/db.ts](lib/db.ts)
- ✅ [prisma/schema.prisma](prisma/schema.prisma) updated for Prisma 7 (url/directUrl removed from schema)
- ✅ [prisma.config.ts](prisma.config.ts) loads `.env.local`, points CLI at `DIRECT_URL`
- ✅ Supabase connectivity verified — all 10 tables exist, 1 row per main entity

**Known carry-over fix**: Vercel's production `DATABASE_URL` still points at the old direct-host format. Needs updating in Vercel dashboard before the first real-data page deploys.

---

## Tier 1 — Foundation (must come first, unblocks everything) ✅ COMPLETE

*Committed + pushed on branch `tier-1-complete` (commit `ac0fdba`, 2026-04-21)*

### 1.0 Set up local Docker Postgres (required before seed) ✅
- Start local DB: `npm run db:up` (uses existing [docker-compose.yml](docker-compose.yml) — postgres:15 on port 5432)
- Update local `.env.local`:
  - `DATABASE_URL` → `postgresql://postgres:password123@localhost:5432/carbnb_admin`
  - `DIRECT_URL` → same as DATABASE_URL (Docker pg supports direct queries, no pooler)
  - Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` pointing at shared Supabase (Auth + Storage)
- Run `npx prisma migrate dev --name init` against the new local DB — creates migration files from current schema, applies to Docker
- Commit the generated `prisma/migrations/` folder to git (they're the source of truth for prod too)

### 1.1 Seed full mock data (into local Docker DB) ✅
- `npx prisma db seed` — seeds the **local Docker DB** with full mock dataset from [lib/data/mock-data.ts](lib/data/mock-data.ts)
- Verify via Prisma Studio (`npm run db:studio`)
- Production Supabase already has schema + 1 row of partial data; leave it untouched for now. We'll either reseed it carefully once locally-developed features are ready to demo, or let it populate through real usage.
- **Critical files**: [prisma/seed.ts](prisma/seed.ts), [lib/data/mock-data.ts](lib/data/mock-data.ts)

### 1.2 Install Supabase auth SDK + create helpers ✅
- `npm install @supabase/supabase-js @supabase/ssr`
- Create `utils/supabase/server.ts`, `utils/supabase/client.ts`, `utils/supabase/middleware.ts` per Supabase SSR pattern

### 1.3 Root proxy + session refresh + route guards ✅

> Next.js 16 renamed `middleware.ts` → `proxy.ts`; function export is `proxy`. Admin-path guard uses DB role lookup (not metadata) so it can't be spoofed.
- Create `middleware.ts` at project root
- Refresh Supabase session on every request
- Guard `/app/(admin)/*` → requires `role: ADMIN`
- Guard host-only pages (TBD — probably under `/(host)/*`) → requires `role: HOST`
- Guard customer account pages (TBD — probably under `/(customer)/*`) → requires authenticated user

### 1.4 Wire tri-role auth on existing login/signup pages ✅
- [app/(auth)/login/page.tsx](app/(auth)/login/page.tsx) — currently just `<Link>` to `/dashboard`. Convert to client form:
  - On Host tab: `signInWithPassword` → check role=HOST → redirect to host dashboard (new route, TBD)
  - On Customer tab: `signInWithPassword` → check role=CUSTOMER → redirect to customer home (likely `/` or `/account`)
  - Admin login: may need a separate `/admin/login` or query param flag
- [app/(auth)/signup/page.tsx](app/(auth)/signup/page.tsx) — wire both Host and Customer signups. On signup:
  - Create Supabase Auth user with role metadata
  - Create corresponding `Owner` or `Customer` row in DB (sync DB with auth)
  - Owner starts with `status: PENDING` (admin approves later)
- Seed at least one ADMIN user in Supabase Auth + `User` table so login works

### 1.5 Proof-of-concept data wire (one admin page) ✅ *(local only — Vercel deploy deferred to Tier 3 checkpoint)*
- Pick [app/(admin)/owners/page.tsx](app/(admin)/owners/page.tsx) (simplest list)
- Convert `import { owners } from "@/lib/data/mock-data"` → `await db.owner.findMany()`
- **Verify locally first**: runs against Docker DB with full seed → should see 5 owners
- **Update Vercel production DB URL**: dashboard → Settings → Environment Variables → update `DATABASE_URL` to the pooled Supabase format (and add `DIRECT_URL` if not present)
- **Add Prisma migrate to Vercel build**: update [package.json](package.json) `postinstall` to `prisma migrate deploy && prisma generate` so migrations apply on production deploys
- Push to main → Vercel builds → runs `prisma migrate deploy` against Supabase → deploys
- Visit car-bnb-eta.vercel.app/owners → should render 1 owner (Supabase has 1 seeded row from colleague)
- **This is the end-to-end validation**. Nothing else ships until this works.

### 1.6 Fix broken references discovered in audit (quick wins) ✅
- `Owner.eWalletDetails` referenced in [app/(admin)/owners/page.tsx](app/(admin)/owners/page.tsx) but not in schema — remove or add field
- `TransactionType.COMMISSION` referenced in [app/(admin)/accounting/page.tsx](app/(admin)/accounting/page.tsx) — verify export in [types/index.ts](types/index.ts), add if missing
- Commission rate: UI says 15% ([accounting/page.tsx:93](app/(admin)/accounting/page.tsx#L93)), mock data shows 20% — unify (deferred to Tier 5 settings, but note the mismatch now)

---

## Tier 2 — Owner management (admin CRUD) ✅ COMPLETE

*Committed + pushed on branch `tier-2-complete` (commit `cf79c9b`, 2026-04-22)*

- [x] List owners with working search/filter — [app/(admin)/owners/page.tsx](app/(admin)/owners/page.tsx)
- [x] Create owner (via admin, with temp password — provisions Supabase Auth user + Owner row) — [app/(admin)/owners/new/page.tsx](app/(admin)/owners/new/page.tsx)
- [x] Approve owner (status transitions via server action + DB check + activity log)
- [x] Suspend owner (including Reactivate from SUSPENDED)
- [x] Edit owner details — new route [app/(admin)/owners/[id]/edit/page.tsx](app/(admin)/owners/%5Bid%5D/edit/page.tsx); email read-only
- [x] Upload ID + license docs to Supabase Storage (private `owner-documents` bucket; signed URLs for display)

Parallel feed-in from Tier 1.4: self-signup of hosts creates Owner rows in `PENDING` status. Admin approval queue shows these.

**Not in scope (intentionally)**: hard-delete owner button — deferred to later, prefer soft-delete / suspend pattern.

---

## Tier 3 — Car listings (admin CRUD) ✅ COMPLETE

*Committed + pushed on branch `tier-3-complete` (commit `3771653`, 2026-04-23)*

- [x] List listings with filter — [app/(admin)/car-listings/page.tsx](app/(admin)/car-listings/page.tsx) (URL search + status filter)
- [x] Create listing (admin-only in Tier 3; host-created deferred to Tier 6) — [app/(admin)/car-listings/new/page.tsx](app/(admin)/car-listings/new/page.tsx)
- [x] Approve listing (`PENDING_APPROVAL → ACTIVE`) via status-actions island
- [x] Suspend listing (`ACTIVE → SUSPENDED`, with Reactivate)
- [x] Edit listing — new route [app/(admin)/car-listings/[id]/edit/page.tsx](app/(admin)/car-listings/%5Bid%5D/edit/page.tsx); plate + owner are read-only
- [x] Photos: multi-file gallery, primary selector, reorder, remove; public `car-photos` bucket
- [x] OR/CR doc: private `car-documents` bucket, signed URLs (1h)
- [x] Availability rules CRUD — 7-day grid on listing edit page
- [x] Availability exceptions CRUD — blackout/forced-available dates on listing edit page
- [x] Repurposed `/availability` as read-only fleet summary (listing schedules + next-14-day blocks)

**Not in scope (intentionally):** hard-delete listing button — deferred; prefer suspend/archive pattern.

---

## Tier 4 — Customer-facing flow (core MVP scope per decision) ✅ COMPLETE

*Committed + pushed on branch `tier-4-complete` (commit `7aac746`, 2026-04-23). Pulled in extras: logout + UserMenu UI (originally Tier 7.5). Prod deploy happens at start of Tier 5.*

**What landed:**
- `/listings` public browse with URL search + city filter chips
- `/listings/[id]` real data + auth-aware `<BookingCTA>` (guest / customer / admin-or-host branches)
- `/account` customer dashboard (upcoming + past) + `/account/bookings/[id]` detail + self-cancel form (PENDING only)
- Landing page + all public/customer headers converted to real data with unified `UserMenu`
- `app/actions/bookings.ts` — create + cancel actions with availability validation, Zod, activity log, reference generation
- `lib/availability.ts`, `lib/platform-settings.ts`, `lib/booking-ref.ts`, `lib/current-user.ts` — business helpers
- Proxy now guards `/account` (customer-auth required; non-customers bounce home)
- Login: `?redirectTo=` honored; customer default landing is `/account`; logout added

**Bugs fixed during manual test:**
- Availability check used wrong-case status strings (uppercase vs title case) → duplicate bookings were accepted
- Date picker had UTC-vs-local timezone skew → pickup-start date rendered as available
- Landing + /listings headers ignored login state → showed "Sign In" to logged-in users
- Customer login redirected to `/` instead of `/account`
- `redirectTo` query wasn't threaded through the login form

---

Depends on Tier 3. Listings must be queryable. This is where the bulk of the *new* UI work lives — the customer-side pages either don't exist or dead-end.

### 4.1 Public listings index (doesn't exist yet)
- Create `app/listings/page.tsx` — browse page with search, filter, pagination
- Fetch from Supabase: `db.carListing.findMany({ where: { status: "ACTIVE" } })`
- Join owner info for display

### 4.2 Landing page converts to real data
- [components/marketing/landing-page.tsx](components/marketing/landing-page.tsx) currently imports mock data
- Replace with Prisma query for featured listings (e.g. top 3 active listings)

### 4.3 Listing detail page converts to real data
- [app/listings/[id]/page.tsx](app/listings/%5Bid%5D/page.tsx) — replace mock imports with Prisma
- `generateStaticParams` stays but generated from DB
- Add real availability awareness (fetch booking conflicts)

### 4.4 Customer booking flow (new UI — doesn't exist)
- Add date-range picker to listing detail page
- "Reserve Now" button:
  - If not logged in → redirect to login with return URL
  - If logged in → open reservation form (dates, pickup time, notes)
  - On submit → creates `Booking` with `status: PENDING`, `paymentStatus: UNPAID`
  - Validates availability (no conflicts with existing bookings, rules, exceptions)
  - Calculates `totalAmount`, `platformFee`, `ownerPayout` from commission setting
  - Redirects to booking confirmation page

### 4.5 Customer account dashboard (new — doesn't exist)
- `app/(customer)/account/page.tsx` — "My Bookings" list
- `app/(customer)/account/bookings/[id]/page.tsx` — booking detail
- Show status, pickup/return times, car info, owner contact
- Cancel booking action (if status permits)

---

## Tier 5 — Admin booking management ✅ COMPLETE

*Committed + pushed on branch `tier-5-complete` (commit `3fd9314`, 2026-04-23). Prod deploy happens at start of Tier 6.*

**What landed:**
- `/bookings` list with search + status chips + "Unpaid" chip + summary cards
- `/bookings/new` admin-create (customer + vehicle dropdowns show friendly labels, Calendar range picker reacts to selected vehicle's unavailable dates, auto-CONFIRMED on submit)
- `/bookings/[id]` detail with status actions island (Confirm / Start / Complete) + Reject + Cancel dialogs (preset reason dropdown + note, required if Other) + Mark-as-Paid dialog (cash, notes only)
- `app/actions/admin-bookings.ts` — 7 server actions, all admin-guarded, Zod-validated, activity-logged
- Schema migration `20260423113813_add_booking_payment_and_cancellation_fields` adds 11 Booking columns (5 payment + 4 cancellation + 2 rental timestamps)
- `lib/cancellation-reasons.ts` — shared preset reason list
- `lib/availability.ts#findRangeConflicts` — client-side range validator (Model 1 strict: no booking across blocked days)
- `lib/platform-settings.ts` — switched to inclusive calendar-day billing (May 4→May 6 = 3 days)
- Customer BookingCTA also gets the range-conflict warning

**Key decisions (in decisions table above):**
- Payment+accounting: booking fields only, AccountingEntry deferred to Tier 8
- Cancel reason: preset dropdown + optional note (required on Other)
- Admin-created booking: CONFIRMED immediately (availability still enforced)
- Rental-day counting: inclusive calendar days
- Availability model: Model 1 strict (no booking across blocked days)

**Not in scope:** split cancellations with refund logic (accounting parked), host-initiated booking actions (Tier 6), email/SMS notifications (deferred).

---

Depends on Tier 4 (customer-created bookings need admin review). Also covers admin-created bookings via [bookings/new](app/(admin)/bookings/new/page.tsx) as a fallback path.

- [ ] List bookings with filters — [app/(admin)/bookings/page.tsx](app/(admin)/bookings/page.tsx)
- [ ] Admin creates booking on behalf of customer — [app/(admin)/bookings/new/page.tsx](app/(admin)/bookings/new/page.tsx) (existing form)
- [ ] Confirm booking (`PENDING → CONFIRMED`) — admin reviews customer-created bookings
- [ ] Start rental (`CONFIRMED → ONGOING`) — timestamp actual pickup
- [ ] Complete rental (`ONGOING → COMPLETED`) — timestamp actual return
- [ ] Cancel / reject booking — with reason
- [ ] Record cash payment — manual "Mark as Paid" button; updates `paymentStatus: UNPAID → PAID`, writes `AccountingEntry` row

**Schema additions (cash-only model)**: Add to `Booking`: `paymentMethod`, `paymentReceivedAt`, `paymentReceivedBy`, `paymentProofUrl`, `paymentNotes`.

---

## Tier 6 — Host dashboard ✅ COMPLETE (2026-04-24)

- [x] `app/host/dashboard/page.tsx` — pending/suspended locked views + 3 tiles for verified (active listings / upcoming bookings / total earnings)
- [x] `app/host/cars/page.tsx` — list of the host's own cars with status chips + photo thumbnails
- [x] `app/host/cars/new/page.tsx` — host create form (no owner picker; auto-submits as `PENDING_APPROVAL`)
- [x] `app/host/cars/[id]/edit/page.tsx` — forked sub-forms (details / photos / OR-CR / availability rules / exceptions); ownership-scoped
- [x] `app/host/bookings/page.tsx` — bookings scoped to `ownerId = host.id` with filter chips + summary cards
- [x] `app/host/bookings/[id]/page.tsx` — booking detail with **Accept / Reject only** action bar (PENDING-only)
- [x] `app/actions/host-listings.ts` — 10 server actions with `requireHost()` (VERIFIED-only) + per-listing ownership check
- [x] `app/actions/host-bookings.ts` — `hostConfirmBookingAction` + `hostRejectBookingAction` (reason + optional note)
- [x] `lib/current-host.ts` — tagged-union session helper (anonymous / not-host / pending / suspended / verified)
- [x] `proxy.ts` — `/host/*` guard: requires logged-in + Owner row (status-agnostic; pages render locked views for PENDING/SUSPENDED)
- [x] `app/(auth)/actions.ts` — `resolveRoleRedirect` sends owners to `/host/dashboard`
- [x] Landing + `/listings` headers — host UserMenu now exposes Host dashboard / My cars / My bookings links
- [x] Host earnings tile = `sum(Booking.ownerPayout)` on COMPLETED bookings (no AccountingEntry; deferred to Tier 8)

Host permissions enforced via `proxy.ts` (Owner lookup by email) + server actions (`requireHost()` + `ownerId === booking.ownerId / listing.ownerId`). DB is source of truth; auth metadata never trusted.

---

## Tier 7 — Dashboard, settings, cross-cutting polish ✅ COMPLETE (2026-04-24)

**Data & settings**
- [x] Admin `/dashboard` — now reads real Prisma aggregates: total owners, verified owners, active listings, completed-booking revenue split (platform fee + owner payouts using *live* commission rate), pending-approvals counter, verification queue (3 latest pending owners + 3 latest pending listings), active & upcoming bookings table
- [x] `/settings` save — new `PlatformSettings` singleton table; wires all 5 fields (commission %, security deposit, auto-approve verified customers, require owner confirmation, minimum booking notice hrs) through Zod + admin-guard + activity log
- [x] Commission rate unified — single source of truth is `PlatformSettings.commissionRate`. `lib/platform-settings-server.ts#getPlatformSettings()` is self-healing (creates the singleton row if missing). `calculateBookingAmount(..., commissionRate)` now takes commission as an explicit arg
- [x] New migration `20260423174042_add_platform_settings`
- [x] Admin `/customers` wired: list + search + `/customers/[id]` detail with booking history + lifetime spend (sum of completed-booking `totalAmount`)
- [x] Admin `/calendar` wired: split into server page + `calendar-view` client; real bookings + exceptions replace mock data
- [x] Sidebar: added **Calendar** + **Customers** nav items; tightened padding/size so 9 items fit comfortably in 18rem column without feeling cramped
- [ ] ~~Fix availability summary drift~~ — deferred (row "Availability summary drift" in decisions table). Still keeping the stored `CarListing.availabilitySummary` column with `saveAvailabilityRulesAction` keeping it in sync.

**UI/UX polish (discovered during Tier 3 testing)**
- [x] Verified Owner dropdown on [app/(admin)/car-listings/new/new-listing-form.tsx](app/(admin)/car-listings/new/new-listing-form.tsx) widened to full-width + label pattern (manual text in trigger, email on second line in option)
- [x] Numeric placeholders on the same form now prefix with "e.g. " (2024 → e.g. 2024; 5 → e.g. 5; 2500 → e.g. 2500)
- [x] Exception status Select in `availability-exceptions-form.tsx` now renders the friendly label ("Block this date" / "Force available (override)") via the manual-trigger pattern, not the raw `"no"/"yes"` value
- [x] Same Select widened to `w-full` so "Force available (override)" no longer truncates

**UI/UX polish (discovered during Tier 2 testing)**
- [x] Responsive layout audit — `/owners` two-column split bumped from `xl:` (1280px) to `2xl:` (1536px). Stacks vertically at laptop widths, splits at truly wide screens. *Done in Tier 7.*
- [ ] Preserve scroll position on search/filter submit — currently the GET form submit reloads the page and scrolls to top, forcing the user to scroll back down to the search results. Either use an anchor (`#owner-directory`) on the form action, or convert the search to a client-navigated version that preserves scroll.
- [ ] Add a "Clear search" button when `?search=` is active (URL cleanup — currently an empty search keeps a trailing `?search=`).
- [ ] Auth polish: login page should detect "already logged in" and redirect to the appropriate home.
- [x] Logout button in admin shell — lives inside the `UserMenu` popover (top-right avatar). Tier 7 enriched the menu with Admin dashboard / Platform settings / Browse cars links alongside Log out.
- [x] Login tab mismatch UX — `loginAction` now receives a `selectedRole` hidden input. Customer-on-Host-tab (or vice-versa) gets a clear error "This email is registered as a {other} account. Please use the {other} tab." + signs out so stray auth session doesn't persist. Admin accounts exempt. *Done in Tier 7.*

**UI/UX polish (discovered during Tier 6 testing)**
- [x] Login form clears the email field when credentials are wrong. Preserve it: on submit error, the email input should still show what the user typed. Fix in [app/(auth)/login/login-form.tsx](app/(auth)/login/login-form.tsx) by wiring the input to `defaultValue={state?.email}` and returning the submitted email from `loginAction` in its error state, or by switching the input to a controlled value via `useState`. *Done in Tier 7.*

**UI/UX polish (carried forward from Tier 7 testing — punchlist for a later polish pass)**
- [ ] Admin `/dashboard` visual polish — numbers are right but the overall layout feels dense/dated. Candidates: tighten the revenue card copy, rework the verification-queue + bookings split so both breathe better, maybe replace the mobile card variant with something more scannable. Flagged during T7-B testing.

---

## Tier 9 — Browse & filter overhaul (customer marketplace polish)

Customer-facing browse + listing detail upgrade. Schema additions but no new tables. Cards become the entry point to the booking funnel; listing detail picks up gallery + features.

### 9.1 Schema migration `add_listing_taxonomy`
- [ ] Add `CarListing.vehicleType: String` (validated in Zod against fixed enum)
- [ ] Add `CarListing.features: String[]` (default `[]`)
- [ ] Backfill existing rows: assign sensible `vehicleType` per car (mock data has brand+model — pick by hand or default to `Sedan`); `features` stays empty
- [ ] Update `prisma/seed.ts` so reseeded mock data has both fields populated

### 9.2 Hero search on `/listings`
- [ ] Replace current header with hero search bar: `Where` (free-text), `From` (date), `Until` (date), submit button
- [ ] City chips persist below as quick-filter shortcuts
- [ ] All inputs URL-state-driven (`?location=&from=&until=`)
- [ ] Free-text "Where" → Prisma `contains` + `mode: insensitive` against `CarListing.location`
- [ ] Date range pre-fills booking form on listing detail click-through (carry `?from=&until=` to `/listings/[id]`)
- [ ] Date range further constrains results: only show listings available across the entire range (reuses `findRangeConflicts` from Tier 5)

### 9.3 Filter rail
- [ ] Sidebar (desktop) / drawer (mobile) with: price range slider, vehicle type (multi-checkbox), transmission (Manual/Automatic), fuel type (multi-checkbox), seating capacity (≥2/4/5/7), make+model search-within-filter
- [ ] All filter state in URL params; preserves on share + reload
- [ ] "Clear filters" button visible when any filter active

### 9.4 Sort
- [ ] Dropdown: Price low-to-high (default), Price high-to-low, Newest first
- [ ] Sort state in URL (`?sort=price_asc`)
- [ ] "Top rated" sort option deferred until Tier 10 ships and `avgRating` exists

### 9.5 Card redesign
- [ ] New card component shows: thumbnail (primary photo), name (brand + model), `₱X / day`, year, transmission, fuel type, seats, **heart placeholder (disabled, wired in Tier 11)**
- [ ] Hover/focus state, click → listing detail with date params if set
- [ ] Loading skeletons + empty state copy ("No cars match these filters")

### 9.6 Listing detail upgrade
- [ ] Photo gallery viewer — lightbox or full-screen on click; keyboard nav (← → Esc); preserves existing photo array on `CarListing.photos`
- [ ] "Vehicle features" section renders `features` array as a checklist (with simple icons or check-bullets)
- [ ] Trip-date editor stays — already exists from Tier 4
- [ ] Host name on detail becomes a `<Link>` to `/hosts/[ownerId]` (Tier 11 wires the destination; Tier 9 leaves it as a dead-link or guards with `if hostProfileEnabled`)

### 9.7 Admin + host listing forms
- [ ] Admin create + edit forms ([app/(admin)/car-listings/new](app/(admin)/car-listings/new) + edit): add `vehicleType` dropdown, `features` checkbox group
- [ ] Host create + edit forms (mirror): same additions
- [ ] Server actions (admin + host) accept the new fields in Zod schemas

---

## Tier 10 — Reviews & ratings

Customer reviews tied to completed bookings. Aggregates feed cards + listing detail.

### 10.1 Schema migration `add_reviews`
- [ ] New `Review` table:
  - `id`, `bookingId` (unique — enforces one review per booking), `customerId`, `listingId`, `ownerId`
  - `rating: Int` (1-5, validated)
  - `comment: String?`
  - `createdAt`, `updatedAt`
- [ ] Add `CarListing.avgRating: Float @default(0)` and `CarListing.reviewCount: Int @default(0)` (denormalized for fast card rendering)

### 10.2 Customer review flow
- [ ] On `/account/bookings/[id]` for COMPLETED bookings without an existing review → show "Leave a review" CTA → opens form (route or modal — TBD at execution)
- [ ] Form: 5-star picker + optional comment textarea
- [ ] `app/actions/reviews.ts#createReviewAction`: customer-only (`requireCustomer()`), booking-ownership check, status=COMPLETED check, single-review-per-booking constraint (DB unique on `bookingId`)
- [ ] Action runs `avgRating` + `reviewCount` recalc atomically (transaction with the insert)
- [ ] Activity log entry on review create

### 10.3 Display
- [ ] Card stars + review count next to price
- [ ] Listing detail: aggregate stars at top + reviews list (most recent first; paginate at 10/page)
- [ ] Empty state: "No reviews yet — be the first after your trip"
- [ ] Stars on host profile (Tier 11) as a future hook — Tier 10 just exposes the data

### 10.4 Sort hook (small follow-on)
- [ ] Add "Top rated" option to the sort dropdown introduced in Tier 9.4

---

## Tier 11 — Favorites + public host profile

Smaller tier; closes out the customer iteration.

### 11.1 Schema migration `add_favorites_and_host_bio`
- [ ] New `Favorite` table: `id`, `customerId`, `listingId`, `createdAt`. Unique constraint on `(customerId, listingId)`.
- [ ] Add `Owner.bio: String?` (nullable; max length validated in Zod, e.g. 500 chars)

### 11.2 Favorites
- [ ] `app/actions/favorites.ts#toggleFavoriteAction` — customer-only, idempotent (insert if absent, delete if present)
- [ ] Heart icon on cards + listing detail wires to action; logged-out click → `/login?redirectTo=...` and returns
- [ ] New `/account/favorites` page — grid of customer's hearted listings (re-uses card component from Tier 9.5)
- [ ] UserMenu gets a "Favorites" link

### 11.3 Public host profile
- [ ] New route `app/hosts/[id]/page.tsx` (public, no auth required)
- [ ] Renders: host name, bio, "Member since YYYY" (from `Owner.createdAt`), grid of host's ACTIVE listings (re-use card)
- [ ] 404 if owner not VERIFIED (don't expose pending/suspended hosts publicly)
- [ ] Listing detail's host-name link from Tier 9.6 now resolves correctly

### 11.4 Host edits their own bio
- [ ] Add a host profile edit page (e.g. `/host/profile`) — currently no host-side profile editor exists. Single-field form for `bio`.
- [ ] Host UserMenu gets a "Profile" link
- [ ] `app/actions/host-profile.ts#updateBioAction` — `requireHost()`, Zod-validated, activity log

---

## Tier 15 — Fleet operators + linking (planned)

Splits the Owner role into two kinds: **independent owners** (what we have today — a person who owns a car and manages it themselves) and **fleet operators** (registered car rental companies that can manage bookings on behalf of one or many independent owners). Independent owners can request to link their car to a fleet; once approved, the link is "label-only" in this tier — the public-facing UI shows "managed by X", but bookings still route to whoever the listing's `ownerId` points at. The actual routing flip ships in Tier 16.

The split between Tier 15 and Tier 16 lets you ship a fully working "fleet operators are real entities, fleet directory + linking flow exist, labels render" feature first, validate it with users, then layer on the operational routing.

### 15.1 Schema migration `add_fleet_operators`
- [ ] `Owner.kind: String @default("INDIVIDUAL")` — `"INDIVIDUAL"` or `"FLEET"`
- [ ] `Owner.companyName: String?` — only meaningful when `kind=FLEET`
- [ ] `Owner.businessRegNumber: String?` — only meaningful when `kind=FLEET`
- [ ] New `FleetCarLink` table: `id`, `listingId`, `fleetId`, `status: String` (`"PENDING"|"ACTIVE"|"INACTIVE"`), `managementFeePercent: Float?`, `requestedAt`, `respondedAt: DateTime?`, `severedAt: DateTime?`. Unique constraint preventing two `ACTIVE` links on the same listing
- [ ] All existing seeded + migrated Owner rows default to `INDIVIDUAL` (Postgres `DEFAULT 'INDIVIDUAL'` on the column handles backfill)

### 15.2 Onboarding flow — two-button signup
- [ ] [app/(auth)/signup/page.tsx](app/(auth)/signup/page.tsx) gets a new initial step before the existing form: two large buttons side-by-side
  - **Independent Car Owner** — "I have my own car and want to rent it out myself"
  - **Registered Car Rental Operator** — "I run a rental company and want to manage cars on behalf of multiple owners"
- [ ] Picking either kind reveals the appropriate signup form below. Fleet form has extra required fields: `companyName`, `businessRegNumber`
- [ ] `signupAction` accepts the kind + fleet fields, writes them on Owner creation
- [ ] Choice is locked after signup — no kind-switch UI for users (admin can flip via Prisma Studio if a host requests a change)

### 15.3 Fleet directory + public profile
- [ ] New public route `app/fleets/page.tsx` — lists all `kind=FLEET, status=VERIFIED` operators
- [ ] Each fleet card shows: company name, bio, count of cars currently managed (owned + linked), member-since
- [ ] `/hosts/[id]` (Tier 11) extended: when `kind=FLEET`, header swaps `fullName` for `companyName`, bio header reads "About this company", and the listings grid shows owned + linked cars (any car with an ACTIVE FleetCarLink to this fleet, regardless of who actually owns it)
- [ ] Existing `/hosts/[id]` for `kind=INDIVIDUAL` is unchanged

### 15.4 Owner-initiated link request
- [ ] On `/host/cars/[id]/edit` for cars owned by an INDIVIDUAL: new "Manage with a fleet operator" section
- [ ] If the car has no active link: shows a "Pick a fleet" picker that lists VERIFIED fleets. Submitting writes a new `FleetCarLink` row with `status=PENDING`
- [ ] If the car has a PENDING link: shows the pending state with "Cancel request" action
- [ ] If the car has an ACTIVE link: shows "Currently managed by [Fleet]" with a "Sever link" action (writes `status=INACTIVE`, sets `severedAt`)
- [ ] Server actions: `app/actions/fleet-links.ts#requestLinkAction`, `cancelLinkRequestAction`, `severLinkAction`. All `requireHost()`-scoped + ownership-checked

### 15.5 Fleet host dashboard updates
- [ ] When `kind=FLEET`: dashboard tiles change to "Owned cars" + "Linked cars (managed)" + "Total earnings"
- [ ] New section on the fleet dashboard: "Pending link requests" — list of `FleetCarLink` rows with `status=PENDING` for this fleet. Each row shows the requesting owner's name + the car. **Approve** / **Reject** buttons
- [ ] Approve → `status=ACTIVE`, sets `respondedAt`, writes activity log entry
- [ ] Reject → `status=INACTIVE`, sets `respondedAt`, writes activity log entry
- [ ] `/host/cars` page extended for fleets: shows owned + actively-linked cars in one list, with a "managed by you" label on linked rows

### 15.6 Public-facing labels — "managed by X"
- [ ] Update `<ListingCard>`: when the car has an `ACTIVE FleetCarLink`, header reads *"Hosted by Joe · managed by Acme Rentals"*. Both names link to their respective `/hosts/[id]`.
- [ ] Update [app/listings/[id]/page.tsx](app/listings/%5Bid%5D/page.tsx) Owner card: dual display, both names linked
- [ ] Booking chat panel header (Tier 14): when applicable, header shows "managed by X" alongside the existing host link
- [ ] Server query helpers extended to `include` the active link relation when fetching listings + bookings

### 15.7 Landing page CTAs for fleet operators
- [ ] [components/marketing/landing-page.tsx](components/marketing/landing-page.tsx) hero gets a third smaller pill below the existing two big CTAs: *"Run a fleet? See operator program →"* linking to `#fleet-operator-journey`
- [ ] Header nav adds a "For Operators" text link (next to "Browse Cars" / "How It Works") pointing at `#fleet-operator-journey`
- [ ] New section in the landing page body, mirroring the structure of `#owner-journey` but for fleet operators: positioning + value props + step-by-step ("Sign up as a fleet → Get verified → Connect with owners → Manage their bookings on one dashboard")
- [ ] Footer adds a "For Operators" link in the existing column

### 15.8 Activity log + audit
- [ ] New action codes: `FLEET_LINK_REQUESTED` (owner sends request), `FLEET_LINK_APPROVED` (fleet approves), `FLEET_LINK_REJECTED`, `FLEET_LINK_SEVERED` (either side ends an active link)
- [ ] All entries include both the owner and fleet email/name in the description for traceability

### Out of scope for Tier 15 (deferred to Tier 16)
- Booking authority routing (fleet still doesn't act on bookings — individual owner does, even on linked cars)
- Chat counterparty switch (chat still goes to individual)
- Availability authority (only individual edits availability — fleet has no write access yet)
- Money-split deduction (the `managementFeePercent` field is captured but not yet applied)

---

## Tier 16 — Fleet routing + parallel availability (planned, depends on Tier 15)

Once Tier 15 ships and fleet operators are real entities with link relationships in place, Tier 16 makes the link operational: bookings on fleet-managed cars actually route to the fleet, the chat counterparty switches, and the availability surface grants the fleet write access alongside the individual.

### 16.1 Booking authority routing
- [x] Update `requireOwnBooking()` helpers in `app/actions/host-bookings.ts` to accept "fleet operator on a car with active link" alongside the existing "owner of the booking's car" check (now `requireBookingActor` via shared `lib/host-booking-authority.ts`)
- [ ] Mirror update in admin-bookings notification logic (when an admin needs context, the fleet is the relevant party for fleet-managed bookings) — *deferred: admin still uses email-of-ownerId for context; revisit when admin notifications ship*
- [x] Render Confirm/Reject/Start/Complete actions on `/host/bookings/[id]` for the fleet operator on linked-car bookings; suppress them for the individual owner (informational "Managed by [Fleet]" panel)
- [x] Booking lists at `/host/bookings`: fleets see linked-car bookings as actionable; individuals see their managed bookings as informational ("Managed by [Fleet]" amber pill)

### 16.2 Chat counterparty switch
- [x] `app/actions/messages.ts#sendMessageAction`: extend the auth resolver — when the booking has an active fleet link, the fleet operator becomes a valid sender (replacing the individual)
- [x] Individual owner can poll/read the chat history (admin-style read-only) on their `/host/bookings/[id]` — new `viewerRole="host-readonly"` in chat panel + conversation
- [x] System messages still write at lifecycle transitions; the "by host" wording becomes "by [Fleet]" when fleet acts

### 16.3 Availability authority
- [x] `CarAvailabilityException.addedByOwnerId: String?` — tracks who created each exception (audit trail). Migration `20260506124507_add_availability_exception_added_by`
- [x] Server actions for availability rules + exceptions extended: previously `requireHost()` checked `ownerId` match; now also accepts "fleet operator on a car with active link to that fleet" (new `requireAvailabilityActor` helper)
- [x] UI: both individual host and fleet host see the same availability editor on `/host/cars/[id]/edit`. Each exception row shows who created it ("blocked by Joe" or "blocked by Acme Rentals — maintenance"). Fleet viewers get the availability sections only — listing details / photos / OR/CR stay owner-only

### 16.4 Activity log
- [x] New action codes for fleet-triggered transitions: `FLEET_BOOKING_CONFIRMED`, `FLEET_BOOKING_STARTED`, `FLEET_BOOKING_COMPLETED`, `FLEET_BOOKING_REJECTED`. Mirror the `HOST_*` pattern from Tier 13.
- [x] System messages in chat use "by [Fleet]" for these transitions

### Out of scope for Tier 16 (deferred further)
- Money-split deduction logic (`Booking.ownerPayout` still goes 100% to individual; fleet's management fee is recorded but not deducted) — defers to Tier 8 (accounting)
- Fleet-initiated link invitations (only owner-initiates in V1) — possible future polish
- Bidirectional kind switching (admin still mediates rare cases manually) — possible future polish

---

## Tier 17 — Required-docs submission flow (planned)

Today the host create-listing flow ends at "submit for approval", which writes a `PENDING_APPROVAL` row with no photos and no OR/CR. Photos and OR/CR get added on `/host/cars/[id]/edit` after admin approval — leaving admins to approve listings sight-unseen and creating a "approved without docs → host forgets to upload" failure mode.

Tier 17 fixes this by making submission a multi-step wizard: hosts fill basics → upload photos → upload OR/CR → submit for approval. Until those prerequisites are met the listing sits as `DRAFT` and is invisible to admin. By the time admin sees a `PENDING_APPROVAL` listing, the package is complete and reviewable in one pass.

### 17.1 Schema migration `add_listing_draft_status`
- [ ] No new column needed. `CarListing.status` gains a new permitted value `"DRAFT"` (string union, not a Postgres enum). Default for new create-from-wizard rows is `DRAFT`; rows are flipped to `PENDING_APPROVAL` only by the explicit "Submit for Approval" action when prerequisites are met
- [ ] Existing `PENDING_APPROVAL` rows untouched (legacy grandfathered)
- [ ] Type union in `types/index.ts` `ListingStatus` adds `DRAFT = "DRAFT"`

### 17.2 Wizard UI on `/host/cars/new`
- [ ] Replace the single-form create page with a 3-step wizard: **Basics** → **Photos** → **OR/CR**. Step indicator at top with clickable navigation between completed steps
- [ ] Step 1 (Basics): the existing create form. On submit, creates the row as `status=DRAFT` and advances to step 2 with the new `listingId` in URL state
- [ ] Step 2 (Photos): existing `HostListingPhotoGallery` component, ≥1 photo required to advance
- [ ] Step 3 (OR/CR): existing `HostListingOrCrForm` component. Shows a final "Submit for Approval" CTA that flips status `DRAFT → PENDING_APPROVAL` and redirects to `/host/cars`
- [ ] Mid-wizard abandonment leaves the row in `DRAFT` status. `/host/cars/new` detects an existing DRAFT for the current host and offers "Resume your draft" instead of starting fresh — or "Discard and start over" to delete it

### 17.3 DRAFT visibility on `/host/cars`
- [ ] DRAFT cards render in the cars grid with an amber "Continue setup" badge instead of the status badge
- [ ] Clicking a DRAFT card lands on `/host/cars/[id]/edit` (same page as ACTIVE/PENDING/etc.) — but with a sticky footer CTA "Submit for Approval", enabled only when photos.length ≥ 1 AND `orCrDocumentUrl !== null`. Disabled state shows what's missing: "Add at least 1 photo and OR/CR document to submit"
- [ ] Submitting flips status `DRAFT → PENDING_APPROVAL` via a new server action `submitListingForApprovalAction` and writes activity log entry `LISTING_SUBMITTED_FOR_APPROVAL`

### 17.4 Public + admin filters exclude DRAFT
- [ ] `/listings` (public browse), `/availability`, `/calendar`, listing search, etc. — all queries that treat ACTIVE/INACTIVE/MAINTENANCE/etc. as a public-side audience continue to filter DRAFT out (same way they already filter PENDING_APPROVAL out from the public side)
- [ ] Admin verification queue (`/dashboard` Verification tile + `/owners/[id]` host detail listing rollups) excludes DRAFT — admin only sees `PENDING_APPROVAL` onward. DRAFT is host-private until submitted

### 17.5 Activity log
- [ ] New action code `LISTING_SUBMITTED_FOR_APPROVAL` — written when host flips DRAFT → PENDING_APPROVAL
- [ ] `LISTING_CREATED` activity entry now writes at DRAFT-creation (basics step). Description copy reads "Host X started a listing for [Car] — currently in DRAFT" so the audit trail captures both the start of the funnel and the final submission
- [ ] `LISTING_PHOTO_ADDED` and `LISTING_OR_CR_UPLOADED` continue to write as-is (already cover the wizard's photo + doc steps)

### 17.6 Action-layer enforcement
- [ ] `submitListingForApprovalAction` re-checks the prerequisites server-side (photos ≥ 1, orCrDocumentUrl present, status === DRAFT, ownership). UI gating is for UX only; this is the trust boundary
- [ ] Admin approval action (existing `approveListingAction` if present, or whatever fires `status=PENDING_APPROVAL → ACTIVE`) is unchanged — still works on PENDING_APPROVAL listings of either provenance (legacy or wizard-submitted)

### 17.7 Manual test plan in MANUAL-TESTING.md
- [ ] T17-A: wizard happy path (basics → photos → OR/CR → submit → admin sees full package)
- [ ] T17-B: abandonment + resume (close mid-wizard, return to /host/cars/new → resume option appears; also accessible via /host/cars DRAFT card)
- [ ] T17-C: prerequisite gating (Submit for Approval is disabled when photos.length=0 or OR/CR missing; submitting via forge against the action is rejected)
- [ ] T17-D: legacy PENDING_APPROVAL listings without OR/CR still approve cleanly under old rules
- [ ] T17-E: DRAFT invisibility (admin /dashboard, /owners/[id], /listings public browse, /availability, /calendar — no DRAFT rows leak)

### Out of scope for Tier 17 (deferred further)
- Photo minimum > 1 (UX feels excessive at submission; can revisit if admins consistently reject "1 photo" submissions)
- Pulling availability rules into the wizard (scheduling, not a trust signal — kept post-approval)
- OCR / document-content validation (current MIME + 5MB checks remain the bar)
- Backfilling legacy PENDING_APPROVAL rows to require docs (grandfathered — small set, real history)
- Admin-side "request docs" notification when a DRAFT lingers too long (no notification system yet)

---

## Tier 18+ candidate — Proximity-aware fleet matching (parked)

When an independent owner opens the fleet picker on `/host/cars/[id]/edit`, the dropdown today sorts by `createdAt` and shows the fleet's free-text `serviceArea` as a label. That doesn't help an owner in Jaro distinguish a Jaro fleet from a Mandurriao fleet inside the same Iloilo City row — both fleets read "Iloilo City" at the city granularity we capture.

**Intent**: when the owner opens the picker, sort fleets by proximity to the owner's car location and badge the closest as "Near you". The owner can still pick any verified fleet — proximity is a *suggestion*, not a filter.

### Two implementation paths to choose from at tier start

**A. True lat/lng geolocation.**
- Schema: `CarListing.latitude/longitude` (Float?), `Owner.latitude/longitude` (Float?, FLEET-only — fleet's primary shop location)
- Geocoding: text address → lat/lng via Nominatim (free, dev-friendly) or Mapbox / Google for prod
- Distance: Haversine formula (~10-line helper, no library)
- UI: address picker on car create + fleet signup (Leaflet for the optional map)
- Picker: distance-sorted with "X km away" labels
- Highest fidelity. Biggest scope — geocoding integration, address picker UI, env-var-managed API source, backfill story for legacy rows.

**B. Neighborhood / district text fields.**
- Schema: `CarListing.district String?`, `Owner.districts String[]`
- Owner types "Jaro"; fleet types "Jaro, Mandurriao"
- Substring match at district-first, city-fallback
- No API, no map, no schema lat/lng
- Doesn't compute actual distance — just *"this fleet operates in your district"* → *"this fleet operates in your city"* → *"somewhere else"*
- ~20% of the work for ~80% of the practical value. Future-compatible: if a later tier adds lat/lng, the district field stays useful as a label.

**Recommended staging**: ship **B first**, treat **A** as a polish tier afterward — unless user opts straight into A.

### Out of scope regardless of A or B
- Hard-filtering of non-matching fleets (proximity is a sort/badge only)
- Legacy listings + fleets without coords/districts: handled either by best-effort geocoding pass or by sorting "no proximity data" rows last
- Custom map-drawing tools for service-area polygons (a fleet's polygon would be more accurate than a single point, but adds heavy UI)

### Files that would be touched at tier start
- [prisma/schema.prisma](prisma/schema.prisma) — schema additions for the chosen path
- [app/host/cars/[id]/edit/fleet-link-section.tsx](app/host/cars/[id]/edit/fleet-link-section.tsx) — picker UI changes
- [app/host/cars/[id]/edit/page.tsx](app/host/cars/[id]/edit/page.tsx) — fleet-options query (sort + selected fields)
- [app/(auth)/signup/host-signup-flow.tsx](app/(auth)/signup/host-signup-flow.tsx) — fleet signup gains district picker (B) or address picker (A)
- New `lib/geo/` helpers for distance + match logic

---

## Tier 8 — Parked / deferred (don't build yet)

- Full accounting flow wiring (cash-only details TBD)
- `OwnerPayout` batch processing + commission invoicing
- [app/(admin)/reports/page.tsx](app/(admin)/reports/page.tsx) — placeholder
- Payment gateway integration (PayMongo / GCash / Maya)
- Dispute / refund workflow
- Tax fields (VAT/withholding)
- "Message owner" feature (placeholder button on listing detail)

---

## Deployment pipeline considerations

Currently the plumbing works but has gaps that will bite as we start shipping real features.

### Target pipeline (after Tier 1.0 complete)

```
                              ┌───────────────────────────────┐
  laptop                      │  Docker Postgres (local)       │ ◀── DATABASE_URL (local)
     │                        │  — dev data, seeded, isolated  │
     │                        └───────────────────────────────┘
     │
     │  shared auth + storage
     ▼
  Supabase project (pfslckqmlkipoogyadpf)
     ▲
     │  DATABASE_URL (prod pooler)
     │
  Vercel (production) ◀── git push to main
     ▲
     │
  GitHub
```

- **Local dev**: Docker Postgres for all data operations (reads, writes, seeds, migrations). Supabase used only for Auth sessions + Storage uploads.
- **Production**: Full Supabase — Postgres + Auth + Storage.
- **Schema changes** flow: `prisma migrate dev` against Docker (generates migration files) → commit to git → push → Vercel runs `prisma migrate deploy` against Supabase in build.

### Pipeline mechanics

- **Git**: User works on `master`, but Vercel's production branch is `main` (per Vercel default). **Pushing to `master` may not trigger production deploy.** Need to verify branch setting in Vercel dashboard; if `main` is production, rename or merge accordingly.
- **Vercel deploys**: Push to production branch → auto-deploy to car-bnb-eta.vercel.app. PRs / other branches → preview deploys at unique URLs.
- **Env vars**: Local `.env.local` ≠ Vercel env vars automatically. Local `DATABASE_URL` points at Docker; Vercel's `DATABASE_URL` points at Supabase pooler. Keep them semantically equivalent but literally different.
- **Auth works identically** in both envs because they share the same Supabase Auth. A user signed up locally IS a real Supabase user — they can log in to production too. Good for testing, but be mindful when creating test users.

### Env var management going forward

Whenever we add a new env var (e.g., `SUPABASE_SERVICE_ROLE_KEY` for server-side operations):
1. Add to local `.env.local` with real value
2. Add to Vercel dashboard: Project → Settings → Environment Variables (set for Development, Preview, Production environments independently)
3. Document in a checked-in `.env.example` so future devs know it's required
4. Redeploy Vercel if adding mid-deploy cycle (env vars only apply to new deploys)

### Prisma migration strategy for production

- **Dev**: `npx prisma migrate dev --name <description>` creates migration files + applies them locally
- **Commit migration files** to git (they live in `prisma/migrations/`)
- **Vercel build step**: add `prisma migrate deploy` before `next build` in the build command (or as a `postinstall` addition). This applies pending migrations to prod on every deploy
- **Never** run `prisma migrate dev` against production — it's for dev DBs only

Current [package.json](package.json) has `postinstall: "prisma generate"`. Need to extend to: `prisma migrate deploy && prisma generate` once we have dev/prod separation.

### Branch + PR workflow

Suggested flow once work starts:
- `main` stays as production branch
- Feature work on `feat/<name>` branches
- Push feature branch → Vercel preview deploy at a unique URL → test the feature there
- Merge PR → main → production deploy
- Current `master` branch should be renamed to `main` (or merged to `main` and deleted) to match Vercel's default

### Supabase Storage buckets

When Tier 2 / Tier 3 adds document/photo uploads, storage buckets must be created in Supabase dashboard:
- `owner-documents` (private bucket, RLS-protected)
- `car-photos` (public bucket for listing displays)
- `car-documents` (private bucket for OR/CR)

Buckets live per-Supabase-project.

### Smoke test after every deploy

Minimal post-deploy check:
1. Visit car-bnb-eta.vercel.app → loads without 500 error
2. Click into a listing detail page → data renders
3. Try to access `/dashboard` unauthenticated → redirects to `/login` (after Tier 1 done)
4. Login as admin → reaches dashboard
5. Vercel build logs show no Prisma or env var warnings

---

## Critical file inventory

**Wired now** (don't break):
- [lib/db.ts](lib/db.ts) — Prisma client with PrismaPg adapter
- [prisma/schema.prisma](prisma/schema.prisma) — Prisma 7 compliant
- [prisma.config.ts](prisma.config.ts) — loads `.env.local`, uses `DIRECT_URL`
- [.env.local](.env.local) — has pooled DATABASE_URL + direct DIRECT_URL + Supabase public keys

**To be created**:
- `utils/supabase/{server,client,middleware}.ts` — Supabase SSR helpers
- `middleware.ts` — root middleware (session refresh + route guards)
- `app/actions/{owners,listings,bookings,availability,settings}.ts` — server actions per entity
- `app/listings/page.tsx` — public browse page
- `app/(customer)/account/*` — customer account routes
- `app/(host)/*` — host dashboard routes
- `lib/settings.ts` — fetch platform settings

**To be modified**:
- All admin pages under [app/(admin)/](app/(admin)/) — swap mock imports for Prisma queries, wire forms to server actions
- [app/(auth)/login/page.tsx](app/(auth)/login/page.tsx), [app/(auth)/signup/page.tsx](app/(auth)/signup/page.tsx) — wire to Supabase Auth
- [app/listings/[id]/page.tsx](app/listings/%5Bid%5D/page.tsx) — add booking flow
- [components/marketing/landing-page.tsx](components/marketing/landing-page.tsx) — swap mock for Prisma
- [prisma/schema.prisma](prisma/schema.prisma) — add fields noted above (Owner docs, Booking payment fields, PlatformSettings model)

---

## Verification checkpoints

**After Tier 1**: Visit `/owners` locally and on car-bnb-eta.vercel.app — list renders from Supabase, not mock file. Login as a test user succeeds and redirects correctly per role. Unauthenticated visit to `/dashboard` redirects to `/login`.

**After Tier 2**: Create a new owner via `/owners/new` → appears in list → approve → status changes in Supabase dashboard. Host self-signup creates pending owner.

**After Tier 3**: Create a car listing linked to an owner → photos upload to Supabase Storage → approve → listing shows `ACTIVE` status. Availability rules save and reload correctly.

**After Tier 4**: Visit `/listings` as a logged-in customer, pick a car, choose dates, hit Reserve → booking appears in Supabase with `status: PENDING`. Customer sees it in their account. Availability blocks those dates for future browsers.

**After Tier 5**: Admin sees the PENDING booking, confirms it, starts rental, marks as paid (cash), completes rental. Status progresses correctly. `AccountingEntry` row created on payment.

**After Tier 6**: Host logs in → sees only their own cars/bookings → can create a listing, manage availability.

**After Tier 7**: Dashboard KPIs reflect real database state. Commission setting change only affects new bookings; existing bookings keep their locked-in rate.

**Vercel deployment check after every tier**: push to main → live site works identically to local. Watch build logs for Prisma adapter or env var issues.

---

## Estimated sequencing

Rough order of execution (each tier blocks the next unless noted):

1. Tier 1 (foundation) — **blocking** ✅
2. Tier 2 (owners) + Tier 7 (dashboard fixes) in parallel ✅
3. Tier 3 (listings) + schema additions for Tier 5 ✅
4. Tier 4 (customer flow) + Tier 6 (host dashboard) can run in parallel once Tier 3 is done ✅
5. Tier 5 (booking management) — wraps up the loop; depends on Tier 4 for real inbound bookings ✅
6. **Tier 9 (browse & filter overhaul)** — schema-light; touches `/listings`, listing detail, admin+host create forms. **Next up.**
7. **Tier 10 (reviews & ratings)** — depends on Tier 9 (cards + detail layout) and on COMPLETED bookings existing.
8. **Tier 11 (favorites + host public profile)** — depends on Tier 9 (card component reuse) and Tier 10 (host stars hook). Smallest of the three.
9. Tier 8 (accounting / payouts / payment gateway) stays parked until product direction is clearer.
