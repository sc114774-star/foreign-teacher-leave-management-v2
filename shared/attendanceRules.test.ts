import { describe, expect, it } from "vitest";
import { effectiveLeaveHours, leaveDaysFromHours } from "./attendanceRules";

const at = (value: string) => new Date(`2025-06-17T${value}:00`);

describe("attendance leave calculation", () => {
  it("counts a primary school half-day as four hours", () => {
    expect(effectiveLeaveHours("青山國小", at("08:00"), at("12:00"))).toBe(4);
    expect(leaveDaysFromHours(4)).toBe(0.5);
  });
  it("subtracts the junior high lunch break", () => {
    expect(effectiveLeaveHours("東原國中", at("10:00"), at("15:00"))).toBe(4);
    expect(leaveDaysFromHours(4)).toBe(0.5);
  });
  it("converts eight hours to one day", () => {
    expect(leaveDaysFromHours(8)).toBe(1);
  });
});
