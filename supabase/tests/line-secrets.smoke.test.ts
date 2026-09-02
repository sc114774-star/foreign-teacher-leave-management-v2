import { describe, expect, it } from "vitest";

describe("LINE Messaging API deployment secrets", () => {
  it.skipIf(!process.env.LINE_CHANNEL_ACCESS_TOKEN)("authenticates the configured channel access token with Get bot info", async () => {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is required for this smoke test");

    const response = await fetch("https://api.line.me/v2/bot/info", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { userId?: string; basicId?: string };
    expect(body.userId || body.basicId).toBeTruthy();
  }, 15_000);
});
