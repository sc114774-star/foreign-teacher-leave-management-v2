import { describe, expect, it } from "vitest";
import { formatDayCountBilingual, formatLeaveDaysBilingual } from "./bilingualFormat";

describe("bilingual day formatting", () => {
  it("formats whole days in both languages", () => {
    expect(formatDayCountBilingual(14)).toBe("14 日 / 14 days");
    expect(formatLeaveDaysBilingual(8 * 284)).toBe("284 日 / 284 days");
  });

  it("formats a half day without exposing only one language", () => {
    expect(formatLeaveDaysBilingual(4)).toBe("0.5 日 / 0.5 days");
  });

  it("normalizes numeric strings and invalid values", () => {
    expect(formatDayCountBilingual("3.50")).toBe("3.5 日 / 3.5 days");
    expect(formatDayCountBilingual("invalid")).toBe("0 日 / 0 days");
  });
});
