export type NotificationStatus = "Queued" | "Sent" | "Failed";
export type NotificationOutcome = "delivered" | "failed";

export function nextNotificationStatus(status: NotificationStatus, outcome: NotificationOutcome): NotificationStatus {
  if (status !== "Queued") return status;
  return outcome === "delivered" ? "Sent" : "Failed";
}
