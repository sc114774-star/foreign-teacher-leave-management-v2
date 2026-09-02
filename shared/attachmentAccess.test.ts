import { describe, expect, it } from "vitest";
import { canViewLeaveAttachment, isInlinePreviewable } from "./attachmentAccess";

describe("attachment access", () => {
  it("limits teachers to their own leave attachments", () => {
    expect(canViewLeaveAttachment("teacher", 11, 11)).toBe(true);
    expect(canViewLeaveAttachment("teacher", 12, 11)).toBe(false);
  });

  it("allows school roles to review attachments across both schools", () => {
    expect(canViewLeaveAttachment("cingshan", 21, 11)).toBe(true);
    expect(canViewLeaveAttachment("dongyuan", 22, 11)).toBe(true);
  });

  it("identifies browser-previewable files", () => {
    expect(isInlinePreviewable("application/pdf")).toBe(true);
    expect(isInlinePreviewable("image/jpeg")).toBe(true);
    expect(isInlinePreviewable("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(false);
  });
});
