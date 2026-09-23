import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../functions/send-line-notification/index.ts", import.meta.url), "utf8");

describe("send-line-notification Edge Function contract", () => {
  it("uses LINE push API and server-side credentials", () => {
    expect(source).toContain("https://api.line.me/v2/bot/message/push");
    expect(source).toContain("LINE_CHANNEL_ACCESS_TOKEN");
    expect(source).toContain("CINGSHAN_LINE_GROUP_ID");
    expect(source).toContain("DONGYUAN_LINE_GROUP_ID");
    expect(source).not.toContain("nodemailer");
    expect(source).not.toContain("SMTP_APP_PASSWORD");
  });

  it("requires authorization and never surfaces a 500 to the caller", () => {
    expect(source).toContain('authHeader?.startsWith("Bearer ")');
    expect(source).toContain("supabaseAdmin.auth.getUser");
    // Direct-push architecture: LINE/network failures degrade gracefully
    // instead of persisting a Sent/Failed row or throwing a 500.
    expect(source).toContain("success: false");
    expect(source).not.toContain("sentNotificationUpdate");
    expect(source).not.toContain("failedNotificationUpdate");
  });

  it("resolves school groups from the database before environment fallbacks", () => {
    expect(source).toContain("foreign_teacher_line_group_settings");
    expect(source).toContain("CINGSHAN_LINE_GROUP_ID");
    expect(source).toContain("DONGYUAN_LINE_GROUP_ID");
  });

  it("branches the message on the cancel action rather than a queued event_type", () => {
    expect(source).toContain('action === "cancel"');
    expect(source).not.toContain('row.event_type !== "Submitted"');
  });
});
