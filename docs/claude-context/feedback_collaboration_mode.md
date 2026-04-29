---
name: CarBNB collaboration mode — Consulted
description: User chose "Consulted" mode for tier execution — ask on first encounter of cross-cutting decisions, batch questions, don't re-ask
type: feedback
originSessionId: 45d3bee8-9adb-4917-a307-4510d175a6bd
---
**Rule:** On CarBNB tier work, operate in **Consulted mode**:

1. When starting a tier, scan for cross-cutting decisions that will come up. If 2+ are uncertain, batch them into a single `AskUserQuestion` call at the tier start.
2. For decisions that only surface mid-tier, ask at first encounter (not before), again batching if multiple hit at once.
3. Once a cross-cutting decision is made, **apply it in all subsequent code without re-asking**. Log it in the "Cross-cutting decisions" table in `BACKLOG.md`.
4. Do NOT ask about: variable names, Tailwind classes, placeholder text, minor formatting. Match existing conventions.
5. DO ask about: validation libraries, pagination defaults, error UX patterns, schema additions, scope judgment calls, irreversible data operations, UX placement (modal vs dedicated route).

**Why:** User is a solo intern who wants to learn + make informed decisions, but also wants progress to keep moving. Consulted mode is the middle ground between fully-autonomous (fast but loses visibility) and high-touch (everything asked, slow). User explicitly chose this on 2026-04-21.

**Additional rule (added 2026-04-22):** At the END of each tier, always do an automated self-test BEFORE handing off a manual test script to the user. The self-test pattern that worked for Tiers 1 and 2:
- Production `next build` (catches compile/runtime errors)
- HTTP probes on new routes (`curl` with `-w "%{http_code} %{redirect_url}"`) to confirm route guards + 200s
- DB state queries (write a small `_selftest.mjs` using Prisma + adapter, group-by on activity log, counts per table, recent rows)
- Supabase Auth admin listUsers + Storage bucket list (verifies service role key + buckets)
- Clean up the temp script after use
This catches bugs before the user spends manual testing time, and gives the user the confidence-level they want. Mark findings clearly — what passed, what I couldn't test, what needs human verification.

**Additional rule (added 2026-04-22): Pre-compact sweep.** Before the user runs `/compact`, always do a thorough pass through memory files + `BACKLOG.md` to find any gaps. Anything decided, learned, or changed during the current conversation that isn't already in durable files will be lost to the compact summary. The pass should check:

1. **`MEMORY.md` index descriptions** — are they still accurate? Stale descriptions ("high-fidelity prototype; zero auth" after we've built auth) must be updated, since this is what loads first in a new session.
2. **`project_carbnb_status.md`** — does it reflect the CURRENT tier status (which tiers done, which branch, what's wired vs mock, what's deferred for prod)?
3. **Feedback memory files** — any new preferences or workflow rules from this conversation captured? (e.g., self-test-first, Consulted mode, branch-per-tier.)
4. **`BACKLOG.md` Cross-cutting decisions table** — every decision made in this conversation logged? Including WHY each was picked, not just the choice.
5. **`BACKLOG.md` Current state section** — updated to reflect any new blockers, deferrals, or known gaps surfaced mid-tier.
6. **`BACKLOG.md` Deploy checklist / deferred items** — any new env vars, Supabase dashboard actions, or prod-only fix-ups added (e.g. "re-enable Confirm email before production").
7. **Conventions established mid-conversation** — file-path patterns, action naming, validation approach, UX patterns — must appear in either BACKLOG decisions table or project status file so they're reapplied consistently in future tiers.

Report findings to the user: "X gaps found and fixed" / "everything covered, safe to compact." Never let the user compact when gaps are known but unfixed.

**How to apply:**
- At tier kickoff, before writing code: scan BACKLOG.md's Cross-cutting decisions table. Anything marked "TBD" that applies to the current tier → ask now, batched.
- Update the table in BACKLOG.md with each decision as it's made.
- Decisions already locked in from Tier 1 (see BACKLOG.md): error UX = inline banner, form pattern = useActionState + server actions, role resolution = DB lookup, admin guard = proxy.ts with DB check, Prisma client = PrismaPg adapter.
- Tiers 9 and 10 have been proposed for deferred cross-cutting work (email/rate-limiting/testing/observability). Don't block Tiers 2-7 on these.
