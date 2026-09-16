import { describe, expect, it } from "vitest";
import { currentYearMonth, mergePrintMonths, rollingPrintMonths } from "./printMonths";

describe("print month options", () => {
  const now = new Date(2026, 8, 16);

  it("uses the real current year-month", () => {
    expect(currentYearMonth(now)).toBe("2026-09");
  });

  it("provides a rolling fallback range sorted newest first", () => {
    const months = rollingPrintMonths(now);
    expect(months[0]).toBe("2027-03");
    expect(months.at(-1)).toBe("2025-09");
    expect(months).toContain("2026-09");
  });

  it("merges database months and retains a current-month option when records are empty", () => {
    const months = mergePrintMonths([], now);
    expect(months).toContain("2026-09");
    expect(months[0]).toBe("2027-03");
  });

  it("deduplicates and sorts record months", () => {
    const months = mergePrintMonths(["2025-06", "2026-09", "2025-06"], now);
    expect(months.filter((month) => month === "2025-06")).toHaveLength(1);
    expect(months.indexOf("2026-09")).toBeLessThan(months.indexOf("2025-06"));
  });
});
