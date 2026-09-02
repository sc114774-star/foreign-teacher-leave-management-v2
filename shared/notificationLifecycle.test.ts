import { describe, expect, it } from "vitest";
import { nextNotificationStatus } from "./notificationLifecycle";

describe("notification lifecycle", () => {
  it("moves queued notifications to Sent after successful delivery", () => {
    expect(nextNotificationStatus("Queued", "delivered")).toBe("Sent");
  });

  it("moves queued notifications to Failed after delivery failure", () => {
    expect(nextNotificationStatus("Queued", "failed")).toBe("Failed");
  });

  it("does not reopen a terminal notification", () => {
    expect(nextNotificationStatus("Sent", "failed")).toBe("Sent");
    expect(nextNotificationStatus("Failed", "delivered")).toBe("Failed");
  });
});
