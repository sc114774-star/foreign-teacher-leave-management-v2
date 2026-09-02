import { describe, expect, it } from "vitest";
import { canReviewLeave, canViewLeaveRegister } from "./schoolAccess";

describe("school admin access", () => {
  it("allows both schools to view the complete register", () => {
    expect(canViewLeaveRegister("青山國小")).toBe(true);
    expect(canViewLeaveRegister("東原國中")).toBe(true);
  });

  it("only allows a school to review its own pending application", () => {
    expect(canReviewLeave("青山國小", "青山國小", "Pending")).toBe(true);
    expect(canReviewLeave("青山國小", "東原國中", "Pending")).toBe(false);
    expect(canReviewLeave("東原國中", "青山國小", "Pending")).toBe(false);
  });

  it("does not expose approve or reject actions after a decision", () => {
    expect(canReviewLeave("青山國小", "青山國小", "Approved")).toBe(false);
    expect(canReviewLeave("東原國中", "東原國中", "Rejected")).toBe(false);
  });
});
