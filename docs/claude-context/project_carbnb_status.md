---
name: CarBNB project status
description: Tiers 1-7 + 7.1 admin-polish live in prod (main at d826875); ready to branch tier-8-complete for accounting/reports
type: project
originSessionId: 45d3bee8-9adb-4917-a307-4510d175a6bd
---
CarBNB is a peer-to-peer car rental marketplace for the Philippines (PHP currency, local brands). Next.js 16 + React 19 + Tailwind 4 + Prisma 7 + PostgreSQL (Docker locally / Supabase in prod). Hosted on Vercel at car-bnb-eta.vercel.app, repo at github.com/internz2026-sys/CarBNB.

**State as of 2026-04-24 (end of Tier 7 build-out):**

**Tiers 1–7 COMPLETE locally ✅**
- `tier-1-complete` → `ac0fdba` — foundation
- `tier-2-complete` → `cf79c9b` + `e6676e8` — owner admin CRUD + docs
- `tier-3-complete` → `3771653` — car-listings admin CRUD + photos + OR/CR + availability
- `tier-4-complete` → `7aac746` — customer browse + booking flow + account dashboard
- `tier-5-complete` → `3fd9314` — admin booking management + lifecycle + cash payments + inclusive-day billing
- `tier-6-complete` → `8bdcfa8` — host dashboard + host-scoped car CRUD + host confirm/reject
- `tier-7-complete` → `076045b` — admin dashboard real data + PlatformSettings + /customers + /calendar + polish (head includes the `fix: explicit return types` commit added after the local `npm run build` pre-deploy sanity check)
- `tier-7.1-admin-polish` → `d826875` — responsive fixes for 14" 16:10 laptops (dashboard hero sections, tile grids, calendar widget overflow, layout padding). Commits `c3d38da` + `d826875`.
- `main` is at `d826875` (Tiers 1-7 + 7.1 live in prod).

**Prod state (car-bnb-eta.vercel.app):**
- Runs Tier 1-7 code (merged early at user request; Vercel build triggered 2026-04-24).
- Prod Supabase schema: 5 migrations applied. `20260423174042_add_platform_settings` applies via postinstall on this deploy. `getPlatformSettings()` self-creates the singleton row on first call, so no manual seeding needed.
- Prod DB seeded with full mock dataset + `admin@carbnb.com` in both User table and Supabase Auth.
- All 5 env vars set in Vercel; `package.json` postinstall runs `prisma migrate deploy && prisma generate`.
- Supabase Storage: `owner-documents` (private), `car-photos` (public), `car-documents` (private).

**Tier 7 additions (new in this session):**

- **Schema**: single-row `PlatformSettings` table keyed by literal `id = "singleton"`. Fields: `commissionRate` (Float 0-1), `securityDeposit` (Float PHP), `autoApproveVerifiedCustomers` (Boolean), `requireOwnerConfirmation` (Boolean), `minimumBookingNoticeHours` (Int), `updatedAt`, `updatedBy`.
- **Migration** `20260423174042_add_platform_settings`.
- **Library split**:
  - `lib/platform-settings.ts` — client-safe math + default constants. `calculateBookingAmount(dailyPrice, pickupDate, returnDate, commissionRate)` now takes commission as an explicit arg.
  - `lib/platform-settings-server.ts` — `import "server-only"`; exports `getPlatformSettings()` (self-healing upsert on miss) and `upsertPlatformSettings(data)`.
- **Server action** `app/actions/settings.ts`:
  - `updatePlatformSettingsAction` — admin-guarded, Zod-validated, writes activity log entry. Accepts commission as a percent (0-100) and stores as a fraction (0-1).
- **Pages**:
  - `/settings` — server page fetches settings + renders `SettingsForm` client component. All 5 fields persist. Green "Settings saved." banner + "Last saved by admin@... · timestamp" footer.
  - `/dashboard` — fully rewritten with Prisma aggregates. 4 top tiles (Total Owners, Active Listings, Total Revenue gradient, Pending Approvals). Revenue card: sum of `totalAmount` / `platformFee` / `ownerPayout` across COMPLETED bookings. "Platform Fee (X%)" label reads the LIVE commission from settings. Verification Queue lists 3 latest pending owners + 3 latest pending listings as clickable cards. Active & Upcoming Bookings table shows ONGOING + CONFIRMED with car photo, status, dates, amount.
  - `/customers` — list with search + two summary tiles (Total customers, Total bookings) + directory table. Clicking View opens `/customers/[id]`.
  - `/customers/[id]` — detail with Contact card, Booking activity breakdown, Lifetime spend (sum of COMPLETED totalAmount), full booking history table.
  - `/calendar` — split into server page + `calendar-view` client component. Real bookings + exceptions from DB. Vehicle select filters events per listing.
- **Sidebar updates** `components/layout/sidebar.tsx` — added **Calendar** + **Customers** nav items. Tightened padding (`py-3.5 → py-2.5`), icon size (`size-10 → size-9`), text (`1.05rem → 0.95rem`), inter-item gap (`gap-2 → gap-1`) so 9 items fit without cramping. Footer profile card condensed. `overflow-y-auto` added as defense-in-depth.
- **Auth polish** `app/(auth)/actions.ts` + `login-form.tsx`:
  - `AuthState` type expanded to `{ error: string; email?: string }` so the failed email can be echoed back.
  - `LoginForm` binds `<Input defaultValue={state?.email ?? ""}>` — email stays filled on error.
  - Login form submits a hidden `selectedRole` field. `loginAction` checks DB role after successful auth and rejects mismatch (customer on Host tab, host on Customer tab) with clear copy + `supabase.auth.signOut()`. Admin accounts exempt.
- **Admin UserMenu** `components/layout/topnav.tsx` — when viewer is admin, popover links now include Admin dashboard / Platform settings / Browse cars (plus the built-in Log out).
- **Cosmetic fixes**:
  - Admin `/car-listings/new` "Verified Owner" dropdown widened to `w-full` + manual label pattern in trigger (`"{fullName} — {email}"`) + email on second line inside options.
  - Numeric placeholders prefixed with `"e.g. "` on year / seating / daily-rate inputs.
  - Admin exception status Select (`availability-exceptions-form.tsx`) fixed — trigger now renders the friendly label via manual-text pattern, not raw `"no"/"yes"`.
  - `/owners` two-column layout bumped from `xl:` (1280px) to `2xl:` (1536px). Stacks vertically at laptop widths.
  - Admin + host booking detail pages' "Platform fee (X%)" now compute the rate from stored values (`Math.round((platformFee / totalAmount) * 100)`), no longer hardcoded 15%.
- **Booking creation** updated — customer + admin booking creation actions fetch `getPlatformSettings()` and pass the live rate to `calculateBookingAmount`. Client preview components (`booking-cta.tsx`, `new-admin-booking-form.tsx`) accept `commissionRate` as a prop passed from their parent server page.

**Tier 7 cross-cutting decisions (all logged in BACKLOG.md table):**
- **PlatformSettings storage**: single-row singleton table with self-healing helper
- **Commission rate lock-in**: new rate applies to new bookings only; existing stored `platformFee` preserved
- **`calculateBookingAmount` API**: explicit `commissionRate` param, no default; server actions fetch, client forms receive as prop
- **Availability summary drift**: deferred — stays a stored string kept in sync inside `saveAvailabilityRulesAction` + host equivalent

**Bugs fixed during Tier 7 build-out:**
1. Stale Prisma client after `prisma migrate dev` added `PlatformSettings` — dev server held old client in memory. Fix: kill dev server + `rm -rf .next` + `npx prisma generate` + restart. Same class of bug as Tier 5.
2. `BookingCTA` had an inner `CustomerBookingDialog` component that referenced `commissionRate` out of scope after I added it to the outer props. Fix: thread the prop through to the inner component explicitly.
3. Admin sidebar got cramped at 9 nav items in 18rem column. Fix: tighten padding / icon / text / gap + collapse footer + add `overflow-y-auto`.

**Local dev state:**
- Docker Postgres on host port 5433. `.env.local` has Docker URLs.
- 5 migrations applied locally:
  - `20260421110809_init`
  - `20260422123533_add_owner_document_urls`
  - `20260422215753_add_car_or_cr_document_url`
  - `20260423113813_add_booking_payment_and_cancellation_fields`
  - `20260423174042_add_platform_settings`

**What still reads from `lib/data/mock-data.ts`:**
- Accounting (Tier 8 parked)
- Reports (Tier 8 parked)
- Everything else is now real-data — admin dashboard / owners / car-listings / availability / calendar / bookings / customers / settings are all Prisma-backed.

**Known gaps / deferred (refreshed):**
- Supabase "Confirm email" toggle still OFF — re-enable before public launch
- Login Host/Customer tabs are VALIDATED against DB role now (Tier 7) — the visual tab just drives the enforcement
- Status-string casing inconsistency — still worked around everywhere with enum values; unify across seed/DB in a future migration
- Customer cannot cancel CONFIRMED bookings — requires admin (by design, Tier 4 decision)
- Refund / deposit rules — Tier 8 with accounting
- Host messaging / reviews — future tier
- Host calendar view — future tier
- Admin /dashboard visual polish — user flagged during T7-B that layout feels dense/dated. Logged in BACKLOG "carried forward" polish section.
- Availability summary drift — accepted as tech debt (`saveAvailabilityRulesAction` is the only writer)

**Pattern reminders (unchanged + new from Tier 7):**
- DB status values stored as title case matching enum values (`"Pending"`, `"Confirmed"`). Never hardcode uppercase strings; always use `BookingStatus.X`, `ListingStatus.X`, `OwnerStatus.X`.
- Date comparisons should use `yyyy-MM-dd` string keys, not Date-object comparison, to avoid UTC-vs-local timezone skew.
- Photo URLs: use `resolveListingPhotoUrl()` — handles Supabase Storage, external http, and seeded `/public` paths.
- Server actions: `"use server"` file at `app/actions/*.ts` with `requireX()` gate + Zod validation + activity log entry. No non-function exports in these files (move constants to separate `lib/*.ts` files).
- Role scope: DB is source of truth; look up Owner/Customer/User by email, never trust auth metadata.
- `<SelectValue />` quirk: renders raw `value` (id/slug), not item label. Workaround: render manual text in `SelectTrigger` using state lookup. Pattern hit 6+ times across tiers.
- Inclusive-day billing: `calculateBookingAmount(dailyPrice, pickup, return, commissionRate)` treats pickup and return date as both counted.
- **NEW** Platform-settings-backed values: ANY place that consumes commission / deposit / min-notice / toggles should read from `getPlatformSettings()` at call time; no hardcoded constants. Client components receive as prop from parent server page.
- **NEW** Self-healing singletons: `getPlatformSettings()` upserts on miss so prod can't end up in a "no row exists" state even after schema or data resets.
- **NEW** Derived rates for display: where we show a percentage derived from stored booking values (admin + host booking detail pages), compute from `Math.round((platformFee / totalAmount) * 100)` instead of a hardcoded label. Guards against stale labels as commission changes over time.

**How to apply this memory:**
- Real-data pages as of Tier 7: ALL admin pages except `/accounting` and `/reports`. All customer + host pages + landing + listings detail.
- Mock-data pages (Tier 8 parked): `/accounting`, `/reports`.
- When starting Tier 8: `git checkout -b tier-8-complete tier-7-complete`. Before Tier-8 work, merge `tier-7-complete` → `main` and push. Vercel auto-deploys Tier 7 (new PlatformSettings migration applies via postinstall). Smoke-test `/settings` save + `/dashboard` numbers in prod before building.
- Tier 8 scope per BACKLOG: accounting flow wiring (AccountingEntry on mark-paid), OwnerPayout batch processing + commission invoicing, /accounting page real-data wire-up, /reports real-data. Also the "admin dashboard visual polish" item carried forward from Tier 7 testing.
- Heed `AGENTS.md`: Next.js 16 (proxy.ts, async searchParams), Prisma 7 (driver adapter, no Rust engine).
- BACKLOG.md is now tracked in git (as of commit 50e4af5, 2026-04-29) — edit + commit alongside related code changes.
- `feedback_manual_test_format.md`: when user confirms a section passed, print the NEXT section's full numbered steps verbatim.
- When adding a sibling admin section, prefer real URL segments over `(group)/*` patterns — the `app/(host)/*` collision in Tier 6 taught us that lesson.
