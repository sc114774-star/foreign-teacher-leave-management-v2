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

  it("requires authorization and persists Sent/Failed outcomes", () => {
    expect(source).toContain('authHeader?.startsWith("Bearer ")');
    expect(source).toContain("sentNotificationUpdate");
    expect(source).toContain("failedNotificationUpdate");
    expect(source).toContain("notificationId");
  });

  it("resolves school groups from the database before environment fallbacks", () => {
    expect(source).toContain("foreign_teacher_line_group_settings");
    expect(source).toContain("CINGSHAN_LINE_GROUP_ID");
    expect(source).toContain("DONGYUAN_LINE_GROUP_ID");
    expect(source).toContain('row.event_type !== "Submitted"');
  });
});
