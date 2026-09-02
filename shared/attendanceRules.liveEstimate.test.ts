import { describe, expect, it } from "vitest";
import { estimateLeaveHoursForRange, leaveDaysFromHours } from "./attendanceRules";

describe("live leave estimate", () => {
  it("estimates a Cingshan half day as 0.5 day", () => {
    const hours = estimateLeaveHoursForRange("青山國小", "2025-06-17", "08:00", "2025-06-17", "12:00");
    expect(hours).toBe(4);
    expect(leaveDaysFromHours(hours)).toBe(0.5);
  });

  it("subtracts Dongyuan lunch for a same-day request", () => {
    const hours = estimateLeaveHoursForRange("東原國中", "2025-06-18", "10:00", "2025-06-18", "15:00");
    expect(hours).toBe(4);
    expect(leaveDaysFromHours(hours)).toBe(0.5);
  });

  it("combines partial first and last days with full middle days", () => {
    const hours = estimateLeaveHoursForRange("青山國小", "2025-06-17", "12:00", "2025-06-19", "12:00");
    expect(hours).toBe(16);
    expect(leaveDaysFromHours(hours)).toBe(2);
  });
});
