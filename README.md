# pushover-mcp-server

A minimal [MCP](https://modelcontextprotocol.io) stdio server for sending [Pushover](https://pushover.net) notifications.

## Implemented tool

### `pushover_send_notification`

Sends a push notification via the Pushover Message API.

This MCP tool is intentionally minimal: it exposes the subset of Message API fields that are useful for ordinary push notifications and deliberately omits the emergency/receipt workflow. The request is validated with a strict schema, and unsupported API fields are not accepted by the tool.

#### Current Message API parameters supported by the MCP tool

| Pushover Message API field | MCP parameter | Type | Required | Status | Notes |
|---|---|---|---|---|---|
| `message` | `message` | string | yes | Implemented | Required body text; max 1024 chars. |
| `title` | `title` | string | no | Implemented | Optional title; max 250 chars. Defaults to the Pushover app name when omitted. |
| `priority` | `priority` | `-2` \| `-1` \| `0` \| `1` | no | Implemented | Defaults to `0` (normal). Values `-2`, `-1`, `0`, and `1` are accepted. Emergency priority `2` is intentionally unsupported. |
| `device` | `device` | string | no | Implemented | Comma-separated device names such as `iphone` or `iphone,laptop`; omit to send to all devices. |
| `ttl` | `ttl` | integer | no | Implemented | Valid range is `1` to `2,419,200` seconds (up to four weeks). |

#### Unsupported or intentionally excluded Message API fields

| Pushover Message API field | MCP status | Reason |
|---|---|---|
| `url` | Not exposed | Deliberately omitted; not needed for the minimal notification server. |
| `url_title` | Not exposed | Requires a URL field to be meaningful and is outside the current scope. |
| `sound` | Not exposed | Custom sounds are not managed by this server. |
| `timestamp` | Not exposed | The server does not accept or generate custom timestamps. |
| `callback` | Not exposed | Callback URL integration is out of scope. |
| `html` / `monospace` | Not exposed | The server does not expose formatting options. |
| `retry`, `expire`, `receipt`, `emergency` | Not exposed | Emergency priority and receipt workflow are intentionally not implemented. |
| `attachment` | Not exposed | File attachments are not supported by this server. |

The schema is strict and rejects unsupported fields before a request reaches Pushover. This keeps the tool safe and predictable while matching the current minimal implementation.

## Pushover API coverage

The server intentionally focuses on sending ordinary, low, and high-priority messages. It is not intended to be a complete Pushover API wrapper.

| Pushover API area | MCP status | Scope |
|---|---|---|
| [Message API](https://pushover.net/api) | Implemented, partial | `pushover_send_notification` supports the core message payload: `message`, `title`, `priority`, `device`, and `ttl`. Emergency priority and receipt-based features are deliberately excluded. |
| [Open Client API](https://pushover.net/api/openclient) | Potential future work | Could enable a user-authorized MCP flow instead of requiring a preconfigured `PUSHOVER_USER`. It would require a safe authorization and token-storage design before implementation. |
| User validation | Out of scope | The configured destination is validated by Pushover when a message is sent. |
| Device management | Out of scope | No MCP tools for listing, creating, renaming, or deleting devices. |
| Group management | Out of scope | No MCP tools for managing groups or group members. |
| Application management | Out of scope | Application tokens are configured externally, not managed by this server. |
| Sounds API | Out of scope | Custom sound discovery and selection are not exposed. |
| Emergency receipts | Out of scope | Emergency delivery, retries, expiry, and receipt polling are intentionally unavailable. |

The Open Client API is the only API area currently under consideration beyond message delivery. It may make the server more suitable for clients that need per-user authorization, but it is not needed for the environment-variable configuration used today. All other Pushover API surfaces remain out of scope.

## Setup

```bash
npm install
npm run build
```

## Configuration

Requires a [Pushover application token](https://pushover.net/apps/build) and a user or group key, passed via environment variables:

- `PUSHOVER_TOKEN` — your Pushover application API token
- `PUSHOVER_USER` — the destination user key or group key

### Run directly

```bash
PUSHOVER_TOKEN=xxxx PUSHOVER_USER=yyyy node dist/index.js
```

### Claude Code / Claude Desktop config

Because the release is distributed via GitHub rather than npm, install and run the package directly from the GitHub repository:

```json
{
  "mcpServers": {
    "pushover": {
      "command": "npx",
      "args": ["-y", "github:warthurton/pushover-mcp-server"],
      "env": {
        "PUSHOVER_TOKEN": "xxxx",
        "PUSHOVER_USER": "yyyy"
      }
    }
  }
}
```

The package's `prepare` script builds the executable automatically when npm installs
it from GitHub, so this command does not require a prebuilt `dist/` directory in the
repository.

If you want to pin to a specific tag or release, use a ref such as:

```json
"args": ["-y", "github:warthurton/pushover-mcp-server#v1.0.0"]
```

If you are running from a local checkout instead of a GitHub release, use:

```json
"command": "node",
"args": ["/absolute/path/to/pushover-mcp-server/dist/index.js"]
```

Run `npm install` (or `npm run build`) in that checkout first so `dist/index.js`
exists. The direct `node` invocation is for local development/checkouts; configured
clients should normally use the GitHub `npx` form above.

## Health checks

This server does not expose a custom health endpoint or health tool. Health is reported entirely through the standard MCP protocol methods that `@modelcontextprotocol/sdk`'s `McpServer` already implements over the stdio transport:

- `initialize` — confirms the process is up and speaking MCP.
- `tools/list` — confirms `pushover_send_notification` is registered and its schema is valid.
- `ping` — a lightweight liveness check with no side effects.

Orchestrators that health-check MCP servers this way — including litellm's MCP gateway, which polls `tools/list`/`ping` over the configured transport — can use this server directly with no extra configuration.

If `PUSHOVER_TOKEN` or `PUSHOVER_USER` is missing, the process prints an error to stderr and exits with status `1` before the MCP transport connects. This is intentional: a misconfigured server fails immediately and visibly (connection refused/closed) rather than starting and reporting healthy while unable to deliver notifications. Note that a successful `tools/list`/`ping` only confirms the process and MCP handshake are healthy — it does not validate the Pushover token/user against the Pushover API, since that only happens when `pushover_send_notification` is actually called.

## Development

```bash
npm run dev    # run with tsx, auto-reload
npm run build  # compile TypeScript to dist/
```
