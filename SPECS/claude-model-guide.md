# Claude Model Selection Guide — Results Tracking System

## Default: Sonnet 4.5

Use Sonnet for ~80% of day-to-day work. Toggle with `/fast` in Claude Code.

Sonnet handles well:

- Adding API endpoints following existing patterns
- Creating React components and hooks from specs
- SQL query tweaks and schema updates
- Seed scripts, type updates, CORS fixes
- Bug fixes with clear reproduction steps
- Single-file or 2-3 file changes
- Running tests, linting, commit/push workflows

## Switch to Opus for:

- **Planning new features from scratch** — architecture, multi-step design
- **Debugging complex cross-system issues** — e.g., deployment routing, auth flow problems
- **Large coordinated multi-file changes** — 5+ files with interdependencies
- **Architectural decisions** — choosing patterns, designing data models
- **When you're stuck** — deep investigation, unclear root cause

## Model Reference

| Model      | ID                           | Best For                                    |
| ---------- | ---------------------------- | ------------------------------------------- |
| Opus 4.6   | `claude-opus-4-6`            | Complex planning, debugging, architecture   |
| Sonnet 4.5 | `claude-sonnet-4-5-20250929` | Day-to-day coding, feature implementation   |
| Haiku 4.5  | `claude-haiku-4-5-20251001`  | Simple edits, quick searches, trivial tasks |

## Cost/Speed Tradeoff

Sonnet is significantly faster and cheaper than Opus with almost no quality difference for pattern-following tasks. Reserve Opus for when you genuinely need the extra reasoning depth.
