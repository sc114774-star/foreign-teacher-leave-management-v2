import { describe, expect, it } from "vitest";
import { academicYearForDate, calculateLeaveBalance, formatLeaveDays } from "./leaveBalanceRules";

describe("leave balance rules", () => {
  it("maps dates to the Taiwan academic year", () => {
    expect(academicYearForDate("2025-08-01")).toBe("2025-2026");
    expect(academicYearForDate("2026-07-31")).toBe("2025-2026");
  });

  it("calculates PTO remaining while keeping other leave unlimited", () => {
    const summary = calculateLeaveBalance([
      { startDate: "2025-09-01", endDate: "2025-09-01", type: "PTO", hours: 16, status: "Approved" },
      { startDate: "2025-09-02", endDate: "2025-09-02", type: "Sick Leave", hours: 80, status: "Approved" },
      { startDate: "2025-09-03", endDate: "2025-09-03", type: "Personal Leave", hours: 64, status: "Pending" },
      { startDate: "2025-09-04", endDate: "2025-09-04", type: "Official Leave", hours: 40, status: "Approved" },
    ], "2025-2026", 14);
    expect(summary.ptoUsed).toBe(2);
    expect(summary.ptoRemaining).toBe(12);
    expect(summary.sickUsed).toBe(10);
    expect(summary.personalUsed).toBe(8);
    expect(summary.officialUsed).toBe(5);
    expect(summary.salaryWarnings).toEqual(["事假累計超過 7 日 · Will deduct salary", "事假＋病假累計超過 14 日 · Will deduct salary"]);
  });

  it("excludes rejected records and respects strict warning thresholds", () => {
    const summary = calculateLeaveBalance([
      { startDate: "2025-08-01", endDate: "2025-08-01", type: "Personal Leave", hours: 56, status: "Approved" },
      { startDate: "2025-08-02", endDate: "2025-08-02", type: "Sick Leave", hours: 56, status: "Approved" },
      { startDate: "2025-08-03", endDate: "2025-08-03", type: "Personal Leave", hours: 80, status: "Rejected" },
    ], "2025-2026", 10);
    expect(summary.personalUsed).toBe(7);
    expect(summary.sickPersonalUsed).toBe(14);
    expect(summary.salaryWarnings).toEqual([]);
  });

  it("formats whole and fractional leave days without duplicated units", () => {
    expect(formatLeaveDays(3)).toBe("3");
    expect(formatLeaveDays(3.5)).toBe("3.5");
  });
});
