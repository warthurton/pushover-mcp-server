# Agent instructions

These are the shared instructions for AI coding agents working in this repository (GitHub Copilot and Claude Code both read this file — Claude Code via the `@` import in `CLAUDE.md`). Edit this file only; do not fork the content elsewhere.

This repository contains a minimal MCP server for Pushover notifications. Keep the documentation in sync with the actual implementation in `src/index.ts`.

## Commands

- `npm run build` — compile TypeScript to `dist/`
- `npm run dev` — run with `tsx watch` for local iteration
- `npm run clean` — remove `dist/`

There is no test suite yet. Always run `npm run build` after changes to `src/` to confirm the TypeScript compiles.

When changing the tool schema, supported Message API parameters, or the implementation status of the MCP server, update the README and any user-facing docs in the same change. The README should describe the current behavior accurately, including supported fields, intentionally unsupported fields, and any deliberate exclusions such as emergency priority and receipt workflows.

Also document how to run the server when releases are distributed via GitHub rather than npm. Include the GitHub install/run pattern (`npx github:owner/repo` or a pinned GitHub ref) and clarify when a local `node dist/index.js` invocation is appropriate instead.
