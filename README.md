# pushover-mcp-server

A minimal [MCP](https://modelcontextprotocol.io) stdio server for sending [Pushover](https://pushover.net) notifications.

## Implemented tool

### `pushover_send_notification`

Sends a push notification via the Pushover API.

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `message` | string (≤1024 chars) | yes | Notification body. |
| `title` | string (≤250 chars) | no | Defaults to the Pushover app name. |
| `priority` | `-2` \| `-1` \| `0` \| `1` | no | Defaults to `0`. Emergency priority (`2`) is deliberately unsupported. |
| `device` | string (≤250 chars) | no | Comma-separated device name(s); omit to notify all devices. |
| `ttl` | integer, 1–2,419,200 | no | Delivery time-to-live in seconds (up to four weeks). Pushover discards an undelivered notification after this interval. |

Emergency notifications are not implemented or accepted. This server does not expose Pushover's emergency priority, retry interval, expiry, or receipt workflow.

## Pushover API coverage

The server intentionally focuses on sending ordinary, low, and high-priority messages. It is not intended to be a complete Pushover API wrapper.

| Pushover API area | MCP status | Scope |
|---|---|---|
| [Message API](https://pushover.net/api) | Implemented | `pushover_send_notification` supports message, title, priority through high, device targeting, and TTL. |
| [Open Client API](https://pushover.net/api/openclient) | Potential future work | Could enable a user-authorized MCP flow instead of requiring a preconfigured `PUSHOVER_USER`. It would require a safe authorization and token-storage design before implementation. |
| User validation | Out of scope | The configured destination is validated by Pushover when a message is sent. |
| Device management | Out of scope | No MCP tools for listing, creating, renaming, or deleting devices. |
| Group management | Out of scope | No MCP tools for managing groups or group members. |
| Application management | Out of scope | Application tokens are configured externally, not managed by this server. |
| Sounds API | Out of scope | Custom sound discovery and selection are not exposed. |
| Emergency receipts | Out of scope | Emergency delivery, retries, expiry, and receipt polling are intentionally unavailable. |

The Open Client API is the only API area currently under consideration beyond message delivery. It may make the server more suitable for clients that need per-user authorization, but it is not needed for the environment-variable configuration used today. All other Pushover API surfaces are currently out of scope.

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

```json
{
  "mcpServers": {
    "pushover": {
      "command": "npx",
      "args": ["-y", "pushover-mcp-server"],
      "env": {
        "PUSHOVER_TOKEN": "xxxx",
        "PUSHOVER_USER": "yyyy"
      }
    }
  }
}
```

(Until published to npm, point `command`/`args` at `node` and the local `dist/index.js` path instead.)

## Development

```bash
npm run dev    # run with tsx, auto-reload
npm run build  # compile TypeScript to dist/
```
