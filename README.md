# pushover-mcp-server

A minimal [MCP](https://modelcontextprotocol.io) stdio server for sending [Pushover](https://pushover.net) notifications.

## Tool

### `pushover_send_notification`

Sends a push notification via the Pushover API.

| Param      | Type                        | Required | Notes                                                                 |
|------------|------------------------------|----------|------------------------------------------------------------------------|
| `message`  | string (≤1024 chars)         | yes      | Notification body.                                                    |
| `title`    | string (≤250 chars)          | no       | Defaults to the Pushover app name.                                     |
| `priority` | `-2` \| `-1` \| `0` \| `1` \| `2` | no   | Default `0`. `2` (emergency) auto-sets `retry=60`/`expire=3600`.       |
| `device`   | string                       | no       | Comma-separated device name(s); omit to notify all devices.           |

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
