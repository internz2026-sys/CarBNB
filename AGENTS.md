<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Backlog

The outstanding backend build-out plan lives in [BACKLOG.md](BACKLOG.md) at project root. It tracks tiered work from auth foundation through customer booking flow. Check it before starting new work to confirm scope and priorities, and update its *Current state* section as tiers complete.

# Handoff documentation

If you are a new owner of this project, start at [HANDOFF.md](HANDOFF.md). It covers the local dev setup, environment variables, common gotchas (Next.js 16 + Prisma 7 + Supabase quirks), a pointer map to every doc in the repo, and how to use Claude Code productively here.

The previous owner's Claude Code operational memory — decisions, conventions, and gotchas accumulated across Tiers 1–7.1 — is snapshotted at [docs/claude-context/](docs/claude-context/). Follow that folder's `README.md` to import the memory files into your local `~/.claude/projects/<workspace-id>/memory/` directory so your sessions inherit the same context.
