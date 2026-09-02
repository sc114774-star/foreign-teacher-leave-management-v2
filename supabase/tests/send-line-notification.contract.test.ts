import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../functions/send-line-notification/index.ts", import.meta.url), "utf8");

describe("send-line-notification Edge Function contract", () => {
  it("uses LINE push API and server-side credentials", () => {
    expect(source).toContain("https://api.line.me/v2/bot/message/push");
    expect(source).toContain("LINE_CHANNEL_ACCESS_TOKEN");
    expect(source).toContain("LINE_CINGSHAN_RECIPIENT_ID");
    expect(source).toContain("LINE_DONGYUAN_RECIPIENT_ID");
    expect(source).not.toContain("nodemailer");
    expect(source).not.toContain("SMTP_APP_PASSWORD");
  });

  it("requires authorization and persists Sent/Failed outcomes", () => {
    expect(source).toContain('authHeader?.startsWith("Bearer ")');
    expect(source).toContain("sentNotificationUpdate");
    expect(source).toContain("failedNotificationUpdate");
    expect(source).toContain("notificationId");
  });

  it("prefers webhook-bound school recipients before secret fallbacks", () => {
    expect(source).toContain("line_recipient_bindings");
    expect(source).toContain("line_group_id");
    expect(source).toContain("LINE_CINGSHAN_RECIPIENT_ID");
  });
});
