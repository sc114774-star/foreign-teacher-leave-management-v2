export type AttachmentViewerRole = "teacher" | "user" | "admin" | "cingshan" | "dongyuan";

export function canViewLeaveAttachment(role: AttachmentViewerRole, viewerId: number, teacherId: number): boolean {
  if (role === "admin" || role === "cingshan" || role === "dongyuan") return true;
  return (role === "teacher" || role === "user") && viewerId === teacherId;
}

export type AttachmentSummary = {
  id: number | string;
  fileName: string;
  mimeType: string;
  storageKey?: string;
  storageUrl?: string;
  uploadedAt?: string | Date;
};

export function isInlinePreviewable(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType === "application/pdf" || mimeType.startsWith("text/");
}
