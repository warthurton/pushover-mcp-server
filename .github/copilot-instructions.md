# Copilot instructions

This repository contains a minimal MCP server for Pushover notifications. Keep the documentation in sync with the actual implementation in `src/index.ts`.

When changing the tool schema, supported Message API parameters, or the implementation status of the MCP server, update the README and any user-facing docs in the same change. The README should describe the current behavior accurately, including supported fields, intentionally unsupported fields, and any deliberate exclusions such as emergency priority and receipt workflows.

Also document how to run the server when releases are distributed via GitHub rather than npm. Include the GitHub install/run pattern (`npx github:owner/repo` or a pinned GitHub ref) and clarify when a local `node dist/index.js` invocation is appropriate instead.
