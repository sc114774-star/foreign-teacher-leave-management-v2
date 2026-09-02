import { describe, expect, it } from "vitest";
import { calculateRemaining, requiresAttachment, routeSchool, splitLeaveDays, validateSingleSchoolApplication } from "./leaveRules";

describe("leave routing and validation", () => {
  const summer = [{ start: "2025-07-01", end: "2025-08-31", label: "Summer vacation" }];

  it("routes Monday and Wednesday to Dongyuan, other weekdays to Cingshan", () => {
    expect(routeSchool("2025-06-09")).toBe("東原國中");
    expect(routeSchool("2025-06-10")).toBe("青山國小");
  });

  it("routes all vacation dates to Cingshan regardless of weekday", () => {
    expect(routeSchool("2025-07-02", summer)).toBe("青山國小");
  });

  it("routes a designated make-up date to the configured school before weekday rules", () => {
    expect(routeSchool("2025-06-12", [], [{ date: "2025-06-12", school: "東原國中", sourceDate: "2025-06-07" }])).toBe("東原國中");
  });

  it("splits a cross-school request into independently routed day records", () => {
    const result = splitLeaveDays(["2025-06-09", "2025-06-10"], 8);
    expect(result.map((day) => day.school)).toEqual(["東原國中", "青山國小"]);
  });

  it("blocks mixed-school applications and allows single-school applications", () => {
    const mixed = splitLeaveDays(["2025-06-09", "2025-06-10"], 8);
    expect(validateSingleSchoolApplication(mixed).valid).toBe(false);
    expect(validateSingleSchoolApplication([mixed[0]!]).valid).toBe(true);
  });

  it("requires documents for regulated leave types", () => {
    expect(requiresAttachment("Sick Leave", 3, [], ["2025-06-09"]).required).toBe(true);
    expect(requiresAttachment("Official Leave", 1, [], ["2025-06-09"]).required).toBe(true);
    expect(requiresAttachment("PTO", 1, summer, ["2025-06-09"]).required).toBe(true);
    expect(requiresAttachment("PTO", 1, summer, ["2025-07-02"]).required).toBe(false);
  });

  it("does not deduct more than the available shared balance", () => {
    expect(calculateRemaining(80, 24)).toBe(56);
    expect(calculateRemaining(8, 12)).toBe(0);
  });
});
