---
name: CarBNB git + deploy workflow
description: User's chosen branching and Vercel deploy strategy — one branch per tier; merge + deploy at the start of each NEW tier
type: feedback
originSessionId: 45d3bee8-9adb-4917-a307-4510d175a6bd
---
**Rule:** For CarBNB backend build-out, work on a dedicated `tier-N-complete` branch per tier (stacked branches). Each tier branches from the previous tier's branch. Push each completed tier branch to GitHub as a backup/checkpoint. **Deploy the completed tier to prod at the start of the NEXT tier** — not at the end of the current one, not at Tier 7 final.

**Why (rule):** The user is a solo intern shipping to an internship demo Vercel env, but they want each tier's features to reach prod in a visible way while keeping the deploy cadence predictable. Deploying at the start of N+1 batches the merge with the natural "regroup and smoke-test prod" moment before new code lands, and avoids the bigger Tier-7 bang-deploy.

**Why (deviation from original plan):** Memory was initially written for "merge only at Tier 7." That policy was superseded during the Tier 3 kickoff discussion. The new policy (logged in BACKLOG decisions table, row "Vercel deploy cadence") is the one in effect. Session record: Tiers 1+2 deployed at start of Tier 3; Tier 3 deployed at start of Tier 4; Tier 4 deployed at start of Tier 5; Tier 5 will deploy at start of Tier 6.

**How to apply:**

*Starting a new tier (Tier N ≥ 3):*
1. Merge `tier-(N-1)-complete` → `main` and `git push origin main` → Vercel auto-deploys the previous tier
2. Smoke-test the affected flows on `car-bnb-eta.vercel.app` (use the stable alias, not the deployment-specific URL)
3. Branch `tier-N-complete` from `tier-(N-1)-complete` and start building

*Ending a tier:*
- Commit with a clear `Tier N complete: <summary>` message
- `git push -u origin tier-N-complete`
- **Do NOT merge to main yet** — that happens at the start of Tier N+1

*Vercel deploy must-haves (already set, do not re-do):*
- DATABASE_URL (pooled), DIRECT_URL (direct), NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- `package.json` postinstall runs `prisma migrate deploy && prisma generate` — new migrations apply automatically on build

*Git safety:*
- **Never** set git user.name/user.email or other git config (strict safety rule per global instructions)
- Adding a git remote: have the user do it themselves; don't run `git remote add` for them
- Never force-push to `main` without explicit user direction

*BACKLOG.md is now tracked* (changed during Tier 7.1, commit 50e4af5):
- BACKLOG.md was previously gitignored as a local working doc. As of 2026-04-29 it is committed to the repo and shared with the team. Edits to it should be committed alongside related code changes (or in a `chore: update backlog` commit if standalone).
- The policy reversal happened so the colleague taking over MVP testing has visibility into tier scope, decisions, and the polish punchlist.

*URL convention:*
- For prod smoke-testing, always use `https://car-bnb-eta.vercel.app` (stable alias)
- Ignore the `car-<hash>-...-projects.vercel.app` URL — that's the immutable deployment permalink, not the public URL
