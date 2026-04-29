# Claude Code operational memory snapshot

This folder is a **point-in-time snapshot** of the operational memory the previous owner accumulated across Tiers 1 → 7.1 of CarBNB. Each `*.md` file (other than this README) is a verbatim copy of a memory file from `~/.claude/projects/<workspace-id>/memory/` on the original laptop.

These are committed to the repo so a new owner doesn't start their Claude Code sessions cold. The repo's [AGENTS.md](../../AGENTS.md) auto-loads on every Claude Code session, but it's intentionally minimal; the per-session memory below carries the *why* behind decisions, the conventions in force, and the known gotchas.

## What's in here

| File | Type | Purpose |
|---|---|---|
| `MEMORY.md` | index | Top-level pointer to the other memory files. Loaded first by Claude Code. |
| `project_carbnb_status.md` | project | Current tier status, schema migrations, what reads from Prisma vs mock, deferred items, pattern reminders. |
| `feedback_git_workflow.md` | feedback | One-branch-per-tier policy, deploy-at-start-of-next-tier cadence, BACKLOG.md tracked-from-Tier-7.1 note, prod env-var checklist. |
| `feedback_collaboration_mode.md` | feedback | "Consulted" mode rules — when to ask vs when to apply, the pre-compact sweep checklist, the self-test-first rule. |
| `feedback_manual_test_format.md` | feedback | When the user confirms a test section passed, print the next section's full numbered steps verbatim. |

## How to import these into your own Claude Code config

Claude Code stores memory at:

- **macOS / Linux**: `~/.claude/projects/<workspace-id>/memory/`
- **Windows**: `C:\Users\<you>\.claude\projects\<workspace-id>\memory\`

`<workspace-id>` is an encoded version of the absolute path Claude Code knows this repo by. To find yours:

1. Open Claude Code in this repo at least once. Run any small command (e.g. ask "list the files here").
2. Look under `~/.claude/projects/`. The folder modified most recently with a name starting with the encoded form of your repo path is yours. Typical pattern looks like `c--Users-yourname-...-CarBNB`.
3. Inside that folder, create a `memory/` subfolder if it doesn't already exist.

Then copy these files into that `memory/` directory:

```
docs/claude-context/MEMORY.md                    →  memory/MEMORY.md
docs/claude-context/project_carbnb_status.md     →  memory/project_carbnb_status.md
docs/claude-context/feedback_git_workflow.md     →  memory/feedback_git_workflow.md
docs/claude-context/feedback_collaboration_mode.md → memory/feedback_collaboration_mode.md
docs/claude-context/feedback_manual_test_format.md → memory/feedback_manual_test_format.md
```

That's it. Your next Claude Code session in this repo will pick up the same operational context the previous owner had.

## Caveats

- **This is a snapshot, not the live source of truth.** Once you import these files, *your* memory dir becomes the live copy. Edit there, not here.
- **The snapshot will drift** as you do new tier work and your local memory updates. The convention going forward (locked in this handoff): when something materially changes — project status moves forward, a new convention lands, a workflow rule changes — update *both* your local memory file *and* the in-repo copy under `docs/claude-context/`, then commit. This keeps a future re-handoff easy.
- **Do not commit secrets.** Memory files describe behavior and decisions, never store API keys or passwords. The current set is safe to share. If you ever add a new memory that mentions a secret value, put a placeholder there and route the actual secret through the secrets channel.
- **Memory dates.** Each file has timestamps inline (e.g. "as of 2026-04-24"). Treat older claims as point-in-time observations and verify against the current code if anything looks off.

## Why we bother committing this

The five files together carry roughly two weeks of decisions: what the tiered build-out looks like, why the commission rate locks in per booking, why hosts are gated to VERIFIED before mutations, why we use `app/host/*` instead of `app/(host)/*`, what the prod deploy cadence is, what the "Consulted" collaboration mode means, etc. None of that lives in the source files themselves — losing it would mean re-deriving half of it the hard way.

A 4-file copy + commit is cheap insurance against that loss.
