import { describe, expect, it } from "vitest";
import { failedNotificationUpdate, sentNotificationUpdate } from "../functions/_shared/notificationStatus";

describe("LINE notification status transitions", () => {
  it("builds the Queued to Sent update payload", () => {
    expect(sentNotificationUpdate("2026-09-01T00:00:00.000Z")).toEqual({ status: "Sent", sent_at: "2026-09-01T00:00:00.000Z", error_message: null });
  });

  it("builds the Queued to Failed update payload", () => {
    expect(failedNotificationUpdate("LINE push failed (500)")).toEqual({ status: "Failed", error_message: "LINE push failed (500)" });
  });
});
