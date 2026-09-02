import { describe, expect, it } from "vitest";
import { filterRecordsByMonth, filterRecordsByTerm, getAcademicTermRange, sortRecordsForPrint } from "./printFilters";

const records = [
  { id: "late", startDate: "2026-07-31", endDate: "2026-07-31" },
  { id: "first", startDate: "2025-08-01", endDate: "2025-08-03" },
  { id: "second", startDate: "2026-02-01", endDate: "2026-02-02" },
  { id: "cross", startDate: "2025-07-31", endDate: "2025-08-01" },
];

describe("print collection filters", () => {
  it("includes records overlapping a calendar month", () => {
    expect(filterRecordsByMonth(records, "2025-08").map((record) => record.id)).toEqual(["first", "cross"]);
  });

  it("uses inclusive academic semester boundaries", () => {
    expect(getAcademicTermRange("first", 2025)).toEqual({ start: "2025-08-01", end: "2026-01-31" });
    expect(filterRecordsByTerm(records, "second", 2025).map((record) => record.id)).toEqual(["late", "second"]);
  });

  it("sorts a collection chronologically without mutating the input", () => {
    expect(sortRecordsForPrint(records).map((record) => record.id)).toEqual(["cross", "first", "second", "late"]);
    expect(records[0].id).toBe("late");
  });
});
