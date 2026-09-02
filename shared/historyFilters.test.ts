import { describe, expect, it } from "vitest";
import { filterHistoryRecords } from "./historyFilters";

const records = [
  { id: "1", type: "PTO", status: "Approved" as const },
  { id: "2", type: "Sick Leave", status: "Pending" as const },
  { id: "3", type: "PTO", status: "Rejected" as const },
];

describe("history filters", () => {
  it("filters by leave type", () => {
    expect(filterHistoryRecords(records, "PTO", "all").map((record) => record.id)).toEqual(["1", "3"]);
  });

  it("filters by approval status and combined conditions", () => {
    expect(filterHistoryRecords(records, "all", "Pending").map((record) => record.id)).toEqual(["2"]);
    expect(filterHistoryRecords(records, "PTO", "Approved").map((record) => record.id)).toEqual(["1"]);
  });

  it("returns an empty result when no record matches", () => {
    expect(filterHistoryRecords(records, "Official Leave", "all")).toEqual([]);
  });
});
