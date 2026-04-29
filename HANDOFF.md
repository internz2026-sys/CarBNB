# carBNB — Project Handoff

This is the orientation point for the new project owner. The MVP has been presented and shipped through Tier 7.1; you're picking up at the beginning of Tier 8 (accounting + reports). Read this doc end to end before anything else, then dive into the specific docs it points at.

---

## 1. Pre-handoff checklist (for the previous owner)

Complete these before the new owner pulls the repo:

- [ ] **GitHub** — add the new owner as a collaborator on `internz2026-sys/CarBNB` with push access. They'll need it to push branches and merge to `main`.
- [ ] **Vercel** — invite them to the project at vercel.com (Project → Settings → Members). Required so they can see deploy status, redeploy if needed, and view production logs.
- [ ] **Supabase** — invite them to the Supabase project as a team member. Needed to access the prod database (Table Editor / SQL Editor), Auth users console, Storage buckets, and project API settings.
- [ ] **Secrets bundle** — through the internship's secure secrets channel, deliver:
  - All five values from your local `.env.local` (the file lives at the repo root and is gitignored — never share via email/chat plain text)
  - The `admin@carbnb.com` password
  - Optionally: a 1-line note saying the `.env.example` in the repo is a fill-in template
- [ ] **Confirm prerequisites** with the new owner: Docker Desktop installed and running, Node.js 20+ available, Git installed.

---

## 2. Local environment setup (for the new owner)

```bash
# 1. Clone
git clone https://github.com/internz2026-sys/CarBNB.git
cd CarBNB

# 2. Install dependencies
npm install

# 3. Create your local env file
cp .env.example .env.local
# Then open .env.local and fill in the 5 values from the secrets bundle.
# For local dev, the DATABASE_URL and DIRECT_URL can stay as the placeholders
# (they target Docker Postgres on localhost:5433). The Supabase keys and
# SUPABASE_SERVICE_ROLE_KEY come from the bundle.

# 4. Start the local Postgres in Docker
docker compose up -d
# This uses docker-compose.yml at the repo root and exposes Postgres on host
# port 5433 (not 5432 — Windows often holds 5432 with a native pg install).

# 5. Apply migrations to the local DB
npx prisma migrate dev
# Five migrations should apply cleanly. If Prisma complains about a stale
# client, run `npx prisma generate` and retry.

# 6. Seed the mock dataset
npx prisma db seed

# 7. Start the dev server
npm run dev
# App lives at http://localhost:3000.
```

If you ever modify the schema and run `prisma migrate dev`, also kill the dev server and delete `.next/` before restarting. The Next.js Turbopack cache holds the old Prisma client in memory and the new fields will read as `undefined` until the cache clears.

---

## 3. Environment variable reference

| Variable | Source | Purpose | Local vs Prod |
|---|---|---|---|
| `DATABASE_URL` | Docker compose (local) / Supabase Project Settings → API → Database → Connection string → "Transaction" mode (prod) | Pooled Postgres connection used by app server actions and Prisma queries at runtime. | Local: Docker `postgresql://postgres:password123@localhost:5433/carbnb_admin`. Prod: Supabase pgbouncer pooled URL on port 5432. |
| `DIRECT_URL` | Same source as DATABASE_URL but "Session" mode (prod) | Direct (non-pooled) Postgres connection used by `prisma migrate` commands. | Local: same as DATABASE_URL. Prod: Supabase direct connection. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings → API | Project URL for the Supabase SSR auth client and public storage URLs. Public — exposed to the browser. | Same value local and prod (we share the Supabase project for Auth and Storage between environments). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings → API | Anonymous JWT used by `utils/supabase/{server,client,middleware}.ts`. Public, RLS-gated. | Same value local and prod. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings → API | Service-role JWT used only in server actions for admin operations (creating Auth users from "Add Owner", signing private bucket URLs for ID/license/OR-CR documents). Loaded only inside `utils/supabase/admin.ts` (`import "server-only"`). **Never expose to the browser.** | Same value local and prod. |

The five variables together are the entire secret payload for this project. There are no per-developer secrets, no API tokens for third-party services. Cash payments are recorded manually — there's no payment-gateway key.

---

## 4. Common gotchas

- **Next.js 16 renamed `middleware.ts` → `proxy.ts`** at the repo root. The exported function is `proxy`, not `middleware`. If you're cargo-culting middleware patterns from the web, double-check they map to the new convention. See `node_modules/next/dist/docs/` for in-repo guides if needed.
- **Prisma 7 has no Rust engine.** It uses driver adapters. The connection is wired in `lib/db.ts` via `@prisma/adapter-pg`. Don't try to revert to the old engine.
- **Stale Prisma client after a migration.** After `prisma migrate dev`, the dev server holds the old generated client in memory. Kill the dev server, `rm -rf .next`, run `npx prisma generate` if needed, then restart. This bit us in Tiers 5 and 7.
- **Supabase "Confirm email" toggle is OFF** in this environment. Fake signups (e.g. `tester-host@example.com`) work without an inbox round-trip — convenient for testing, **must be re-enabled before public launch**.
- **`BACKLOG.md` is now tracked in git** (changed during Tier 7.1, commit `50e4af5`). Update it alongside related code changes; don't treat it as a local working doc anymore.
- **DB enum values are stored title-cased** (`"Pending"`, `"Confirmed"`, `"Verified"`). Always reference them through the enums in `types/index.ts` (`BookingStatus.PENDING`, `OwnerStatus.VERIFIED`, etc.). Hardcoded uppercase strings will silently fail to match.
- **`<SelectValue />` from Base UI renders the raw value, not the item label.** Pattern that works: render manual text in `SelectTrigger` using a state lookup. Example in `app/(admin)/bookings/[id]/booking-actions.tsx` (the cancellation-reason dialog). This pattern has been needed 6+ times across tiers.
- **Inclusive-day billing.** A booking from May 4 → May 6 is **3 days**, not 2. Pickup and return both count. `calculateBookingAmount(dailyPrice, pickupDate, returnDate, commissionRate)` in `lib/platform-settings.ts` is the single source of truth.
- **Commission rate is locked in per booking** at creation time. Changing the platform commission in `/settings` only affects new bookings going forward. Historical `Booking.platformFee` and `Booking.ownerPayout` columns are immutable.
- **Sibling admin route groups will collide.** We hit this in Tier 6 with `app/(host)/*` resolving the same URLs as `app/(admin)/*`. The fix was to use a real URL segment (`app/host/*`). When adding a new sibling area, prefer real segments.

---

## 5. Pointer map — every doc in the repo

| Doc | Purpose |
|---|---|
| [README.md](README.md) | Project overview + feature list. The "what this project is" doc. |
| **HANDOFF.md** (this file) | Orientation for new ownership. The "how to take it over" doc. |
| [BACKLOG.md](BACKLOG.md) | Single source of truth for tiered build-out scope, the cross-cutting decisions table (every architectural choice + why), the polish punchlist, and the deferred-items list. Read this before starting any new work. |
| [AGENTS.md](AGENTS.md) | Auto-loaded by Claude Code on every session in this repo. Holds the Next.js 16 breakage warning and pointers to BACKLOG + this handoff package. |
| [CLAUDE.md](CLAUDE.md) | Imports `AGENTS.md` so Claude Code's `CLAUDE.md` auto-load also picks up the agent rules. |
| [DESIGN.md](DESIGN.md) | Design system documentation — the visual language, color tokens, typography. Read before doing visual work. |
| [CarBNB-Product-Digest.docx](CarBNB-Product-Digest.docx) | Investor / partner-facing product summary. Hand to a non-technical stakeholder asking "what is this and why does it matter?" |
| [CarBNB-Tester-Handoff-Guide.docx](CarBNB-Tester-Handoff-Guide.docx) | Step-by-step QA walkthrough across all three roles (admin, host, customer) and an end-to-end happy path. The previous owner used this when handing demo duty to the testing intern. |
| [scripts/generate-digest.py](scripts/generate-digest.py) | `python-docx` regenerator for the Product Digest. Edit copy in the script, run `python scripts/generate-digest.py`, commit. |
| [scripts/generate-tester-guide.py](scripts/generate-tester-guide.py) | `python-docx` regenerator for the Tester Handoff Guide. Same pattern. |
| [docs/claude-context/](docs/claude-context/) | Snapshot of the previous owner's Claude Code operational memory (decisions, conventions, gotchas across Tiers 1–7.1). Not the live source — see that folder's `README.md` for how to import it into your local Claude config. |

---

## 6. How to use Claude Code on this project

1. Open Claude Code in the repo. It will auto-load `CLAUDE.md` → `AGENTS.md` for project-level context.
2. To inherit the operational memory from prior tiers (the "why behind decisions" that isn't in the source code), follow the import steps in [docs/claude-context/README.md](docs/claude-context/README.md). This copies five memory files into your local `~/.claude/projects/<workspace-id>/memory/` folder.
3. Once imported, your sessions will load with the same operational context the previous owner had: tier status, git workflow, "Consulted" collaboration mode, manual-test handoff format. You can edit the memories freely as the project evolves — just remember to update the in-repo snapshot under `docs/claude-context/` when something material changes, so the next handoff is easy.

---

## 7. Where the project is right now

- **Live in prod**: Tiers 1–7 + 7.1 (admin polish for 14" laptops). `main` is at commit `d826875` (Tier 7.1) plus the docs-and-handoff commits that came after. car-bnb-eta.vercel.app reflects this.
- **Next up**: Tier 8 — accounting flow wiring (`AccountingEntry` rows on mark-paid), `OwnerPayout` batch processing + commission invoicing, replace mock data on `/accounting` and `/reports` with real Prisma reads. Plus the carry-forward "admin dashboard visual polish" item from Tier 7 testing.
- **Recommended kickoff**:
  1. `git checkout main && git pull`
  2. `git checkout -b tier-8-complete`
  3. Read the Tier 8 row in `BACKLOG.md` and the cross-cutting decisions table.
  4. Open Claude Code; ask it to read `BACKLOG.md`. Confirm it has the operational memory imported (if not, follow `docs/claude-context/README.md`).
  5. Batch any cross-cutting decisions for Tier 8 (e.g., does each Booking write one `AccountingEntry` row, or one per side of the trip? Are owner payouts released individually or batched weekly?) — log decisions in `BACKLOG.md`.
  6. Build, self-test (production `next build` + a small Prisma probe script), then a manual test pass.

---

## 8. Communication / open questions

If you (the new owner) hit something this doc doesn't answer:

- **Architectural / "why was this built this way"**: check the cross-cutting decisions table in `BACKLOG.md` first; most non-obvious choices have a row there with the rationale.
- **"Where does X live in the code"**: `BACKLOG.md` has a "Critical files" inventory near the top.
- **"Why is this behaving weirdly"**: scan the Common Gotchas section above and the "Bugs fixed during Tier N" entries in `docs/claude-context/project_carbnb_status.md`.
- **Anything else**: contact the previous owner directly through the internship channel.

Good luck — the foundation is solid. The hard call-and-response architectural decisions for the marketplace loop are all locked in; Tier 8 is mostly about laying accounting plumbing on top of a working booking lifecycle.
