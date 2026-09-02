import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../functions/line-webhook/index.ts", import.meta.url), "utf8");

describe("LINE webhook Edge Function contract", () => {
  it("verifies the LINE signature before parsing events", () => {
    expect(source).toContain("x-line-signature");
    expect(source).toContain("LINE_CHANNEL_SECRET");
    expect(source).toContain("HMAC");
    expect(source).toContain("SHA-256");
    expect(source).toContain("Invalid signature");
  });

  it("deduplicates webhook events and stores an audit payload server-side", () => {
    expect(source).toContain("foreign_teacher_line_webhook_events");
    expect(source).toContain("webhook_event_id");
    expect(source).toContain("onConflict: \"webhook_event_id\"");
    expect(source).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("supports one-time binding codes for teacher and school recipients", () => {
    expect(source).toContain("match(/^\\\\/bind\\\\s+(\\\\S+)$/)");
    expect(source).toContain("foreign_teacher_line_recipient_bindings");
    expect(source).toContain("foreign_teacher_profiles").toBeTruthy();
    expect(source).toContain("used_at");
    expect(source).toContain("line_group_id");
  });
});
