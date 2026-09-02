export function sentNotificationUpdate(sentAt: string) {
  return { status: "Sent" as const, sent_at: sentAt, error_message: null };
}

export function failedNotificationUpdate(errorMessage: string) {
  return { status: "Failed" as const, error_message: errorMessage };
}
