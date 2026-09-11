#!/usr/bin/env node
/**
 * MCP server for sending Pushover notifications.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const PUSHOVER_API_URL = "https://api.pushover.net/1/messages.json";

const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN;
const PUSHOVER_USER = process.env.PUSHOVER_USER;

if (!PUSHOVER_TOKEN) {
  console.error("ERROR: PUSHOVER_TOKEN environment variable is required");
  process.exit(1);
}
if (!PUSHOVER_USER) {
  console.error("ERROR: PUSHOVER_USER environment variable is required");
  process.exit(1);
}

const PriorityEnum = z.union([
  z.literal(-2),
  z.literal(-1),
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);

const SendNotificationInputSchema = z
  .object({
    message: z
      .string()
      .min(1, "Message is required")
      .max(1024, "Message must not exceed 1024 characters")
      .describe("The notification body text."),
    title: z
      .string()
      .max(250, "Title must not exceed 250 characters")
      .optional()
      .describe("Optional notification title. Defaults to the Pushover app name if omitted."),
    priority: PriorityEnum.default(0).describe(
      "Message priority: -2 (lowest, no notification), -1 (low, no sound/vibration), " +
        "0 (normal, default), 1 (high, bypasses quiet hours), " +
        "2 (emergency, repeats until acknowledged)."
    ),
    device: z
      .string()
      .max(250)
      .optional()
      .describe(
        "Comma-separated device name(s) to target, or omit to send to all of the " +
          "user's/group's devices (e.g. 'iphone' or 'iphone,laptop')."
      ),
  })
  .strict();

type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;

interface PushoverResponse {
  status: number;
  request: string;
  errors?: string[];
  receipt?: string;
}

function handlePushoverError(error: unknown): string {
  if (error instanceof PushoverApiError) {
    if (error.errors?.length) {
      return `Error: Pushover rejected the request: ${error.errors.join("; ")}`;
    }
    return `Error: Pushover API request failed with status ${error.status}`;
  }
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  return `Error: Unexpected error occurred: ${String(error)}`;
}

class PushoverApiError extends Error {
  status: number;
  errors?: string[];

  constructor(status: number, errors?: string[]) {
    super(`Pushover API error (status ${status})`);
    this.status = status;
    this.errors = errors;
  }
}

async function sendPushoverNotification(
  params: SendNotificationInput
): Promise<PushoverResponse> {
  const body = new URLSearchParams({
    token: PUSHOVER_TOKEN!,
    user: PUSHOVER_USER!,
    message: params.message,
    priority: String(params.priority),
  });

  if (params.title) body.set("title", params.title);
  if (params.device) body.set("device", params.device);

  // Emergency priority requires retry/expire parameters.
  if (params.priority === 2) {
    body.set("retry", "60");
    body.set("expire", "3600");
  }

  let response: Response;
  try {
    response = await fetch(PUSHOVER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch (error) {
    throw new Error(
      `Network error contacting Pushover: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const data = (await response.json()) as PushoverResponse;

  if (!response.ok || data.status !== 1) {
    throw new PushoverApiError(response.status, data.errors);
  }

  return data;
}

const server = new McpServer({
  name: "pushover-mcp-server",
  version: "1.0.0",
});

server.registerTool(
  "pushover_send_notification",
  {
    title: "Send Pushover Notification",
    description: `Send a push notification via Pushover to a user or group.

Args:
  - message (string, required): Notification body text, up to 1024 characters.
  - title (string, optional): Notification title, up to 250 characters. Defaults to the Pushover app's name if omitted.
  - priority (-2 | -1 | 0 | 1 | 2, optional): Message priority. Default 0 (normal).
      -2 = lowest (no notification), -1 = low (no sound/vibration), 0 = normal,
      1 = high (bypasses quiet hours), 2 = emergency (repeats until acknowledged).
  - device (string, optional): Comma-separated device name(s) to target (e.g. "iphone" or "iphone,laptop").
      Omit to send to all devices for the configured user or group key.

Returns: Confirmation text including the Pushover request ID, or an error message describing what went wrong.

Error Handling:
  - Returns "Error: Pushover rejected the request: ..." if Pushover reports invalid parameters (e.g. bad token/user key, unknown device).
  - Returns a network error message if the Pushover API could not be reached.`,
    inputSchema: SendNotificationInputSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: SendNotificationInput) => {
    try {
      const result = await sendPushoverNotification(params);
      return {
        content: [
          {
            type: "text" as const,
            text: `Notification sent (request id: ${result.request}).`,
          },
        ],
        structuredContent: { request: result.request, status: result.status },
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: handlePushoverError(error) }],
        isError: true,
      };
    }
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Pushover MCP server running via stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
