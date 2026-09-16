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

If you want to pin to a specific tag or release, use a ref such as:

```json
"args": ["-y", "github:warthurton/pushover-mcp-server#v1.0.0"]
```

If you are running from a local checkout instead of a GitHub release, use:

```json
"command": "node",
"args": ["/absolute/path/to/pushover-mcp-server/dist/index.js"]
```

This avoids depending on npm publication and works with the current GitHub-only release flow.

## Development

```bash
npm run dev    # run with tsx, auto-reload
npm run build  # compile TypeScript to dist/
```
