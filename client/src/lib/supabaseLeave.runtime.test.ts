import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockClient, makeChain } = vi.hoisted(() => {
  const makeChain = (value: unknown, error: unknown = null) => {
    const chain: Record<string, unknown> = {};
    for (const method of ["select", "eq", "order", "single", "update", "insert"]) chain[method] = vi.fn(() => chain);
    chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: value, error }).then(resolve);
    Object.defineProperty(chain, "data", { get: () => value });
    Object.defineProperty(chain, "error", { get: () => error });
    return chain;
  };
  const mockClient = {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "approver-1" } } })) },
    from: vi.fn(),
    storage: { from: vi.fn(() => ({ createSignedUrl: vi.fn(async () => ({ data: { signedUrl: "https://signed.example/file" }, error: null })) })) },
  };
  return { mockClient, makeChain };
});

vi.mock("./supabase", () => ({ supabase: mockClient }));

import { createSupabaseLeaveApplication, decideSupabaseLeaveApplication, fetchSupabaseLeaveApplications, getSupabaseAttachmentUrl } from "./supabaseLeave";

describe("Supabase leave adapter runtime contracts", () => {
  beforeEach(() => { mockClient.from.mockReset(); mockClient.storage.from.mockClear(); });

  it("reads routed leave_days with school, hours, date, and route reason", async () => {
    const routed = [{ id: 1, application_id: 42, leave_date: "2025-06-17", hours: 8, assigned_school: "青山國小", route_reason: "Tuesday → Cingshan" }];
    mockClient.from.mockReturnValueOnce(makeChain([{ id: 42, application_no: "LV-RUNTIME-READ", leave_days: routed, leave_attachments: [] }]));
    const result = await fetchSupabaseLeaveApplications();
    expect(result[0].leave_days?.[0]).toMatchObject({ assigned_school: "青山國小", route_reason: "Tuesday → Cingshan", hours: 8, leave_date: "2025-06-17" });
  });

  it("writes leave_days routing and queues the school notification on submission", async () => {
    mockClient.from
      .mockReturnValueOnce(makeChain({ id: 42 }))
      .mockReturnValueOnce(makeChain(null))
      .mockReturnValueOnce(makeChain(null));
    const applicationId = await createSupabaseLeaveApplication({
      application_no: "LV-RUNTIME-001", teacher_id: "teacher-1", leave_type: "PTO", reason: "test", official_document_no: null, official_location: null,
      start_at: "2025-06-17T00:00:00Z", end_at: "2025-06-17T08:00:00Z", total_hours: 8,
      leave_days: [{ leave_date: "2025-06-17", hours: 8, assigned_school: "青山國小", route_reason: "Tuesday → Cingshan" }],
    });
    expect(applicationId).toBe(42);
    expect(mockClient.from.mock.calls[1][0]).toBe("leave_days");
    expect(mockClient.from.mock.calls[2][0]).toBe("leave_notifications");
  });

  it("creates a signed attachment URL only after application attachment matching", async () => {
    mockClient.from.mockReturnValueOnce(makeChain({ id: 7, file_name: "proof.pdf", mime_type: "application/pdf", storage_key: "7/proof.pdf" }));
    const result = await getSupabaseAttachmentUrl(7, 11);
    expect(result).toMatchObject({ id: 7, file_name: "proof.pdf", url: "https://signed.example/file" });
    expect(mockClient.storage.from).toHaveBeenCalledWith("leave-attachments");
  });

  it("updates Pending and writes approval plus teacher notification for the assigned school", async () => {
    const updateChain = makeChain(null);
    const approvalChain = makeChain(null);
    const notificationChain = makeChain(null);
    const applicationChain = makeChain({ teacher_id: "teacher-1" });
    const profileChain = makeChain({ line_user_id: "Uteacher123" });
    mockClient.from
      .mockReturnValueOnce(makeChain([{ assigned_school: "青山國小" }]))
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(approvalChain)
      .mockReturnValueOnce(applicationChain)
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(notificationChain);
    const result = await decideSupabaseLeaveApplication({ application_id: 7, school: "青山國小", decision: "Approved" });
    expect(result).toEqual({ applicationId: 7, decision: "Approved" });
    expect(updateChain.update).toHaveBeenCalledWith({ status: "Approved" });
    expect((approvalChain.insert as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ application_id: 7, school: "青山國小", approver_id: "approver-1", decision: "Approved", note: null });
    expect((notificationChain.insert as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ application_id: 7, recipient_type: "Teacher", recipient_ref: "Uteacher123", event_type: "Approved", channel: "LINE", status: "Queued" });
    expect(mockClient.from).toHaveBeenCalledTimes(6);
    expect(mockClient.from.mock.calls[5][0]).toBe("leave_notifications");
  });

  it("writes a Rejected approval and teacher notification for the assigned school", async () => {
    const approvalChain = makeChain(null);
    const notificationChain = makeChain(null);
    mockClient.from
      .mockReturnValueOnce(makeChain([{ assigned_school: "東原國中" }]))
      .mockReturnValueOnce(makeChain(null))
      .mockReturnValueOnce(approvalChain)
      .mockReturnValueOnce(makeChain({ teacher_id: "teacher-1" }))
      .mockReturnValueOnce(makeChain({ line_user_id: "Uteacher123" }))
      .mockReturnValueOnce(notificationChain);
    await decideSupabaseLeaveApplication({ application_id: 8, school: "東原國中", decision: "Rejected", note: "Please revise" });
    expect((approvalChain.insert as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ application_id: 8, school: "東原國中", approver_id: "approver-1", decision: "Rejected", note: "Please revise" });
    expect((notificationChain.insert as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ application_id: 8, recipient_type: "Teacher", recipient_ref: "Uteacher123", event_type: "Rejected", channel: "LINE", status: "Queued" });
  });

  it("rejects a decision when every leave day is not assigned to the current school", async () => {
    mockClient.from.mockReturnValueOnce(makeChain([{ assigned_school: "東原國中" }]));
    await expect(decideSupabaseLeaveApplication({ application_id: 7, school: "青山國小", decision: "Rejected" })).rejects.toThrow("not assigned to this school");
  });

  it("rejects an attachment/application mismatch before requesting Storage", async () => {
    mockClient.from.mockReturnValueOnce(makeChain(null, new Error("Attachment not linked to application")));
    await expect(getSupabaseAttachmentUrl(7, 99)).rejects.toThrow("Attachment not linked to application");
    expect(mockClient.storage.from).not.toHaveBeenCalled();
  });

  it("propagates Storage/RLS signed URL rejection", async () => {
    mockClient.from.mockReturnValueOnce(makeChain({ id: 7, file_name: "proof.pdf", mime_type: "application/pdf", storage_key: "7/proof.pdf" }));
    mockClient.storage.from.mockReturnValueOnce({ createSignedUrl: vi.fn(async () => ({ data: null, error: new Error("Storage access denied") })) });
    await expect(getSupabaseAttachmentUrl(7, 11)).rejects.toThrow("Storage access denied");
  });
});
