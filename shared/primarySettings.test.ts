import { describe, expect, it } from "vitest";
import { canEditPrimarySettings, removeMakeupDay, upsertMakeupDay } from "./primarySettings";

describe("primary school settings", () => {
  it("allows both school offices to edit their own settings", () => {
    expect(canEditPrimarySettings("cingshan")).toBe(true);
    expect(canEditPrimarySettings("dongyuan")).toBe(true);
  });

  it("upserts only the current school's make-up days", () => {
    const existing = [{ date: "2025-06-12", school: "東原國中" as const, note: "運動會補休" }];
    const result = upsertMakeupDay("cingshan", existing, { date: "2025-06-16", school: "青山國小", note: "校慶補休" });
    expect(result).toEqual([{ date: "2025-06-16", school: "青山國小", note: "校慶補休" }]);
  });

  it("updates one date while preserving other make-up days", () => {
    const existing = [{ date: "2025-06-12", school: "東原國中" as const }, { date: "2025-06-16", school: "青山國小" as const }];
    const result = upsertMakeupDay("cingshan", existing, { date: "2025-06-12", school: "青山國小", note: "調整後補休" });
    expect(result).toEqual([{ date: "2025-06-12", school: "青山國小", note: "調整後補休" }, existing[1]]);
  });

  it("removes one date without removing other make-up days", () => {
    const existing = [{ date: "2025-06-12", school: "東原國中" as const }, { date: "2025-06-16", school: "青山國小" as const }];
    expect(removeMakeupDay("cingshan", existing, "2025-06-12")).toEqual([existing[1]]);
  });

  it("rejects cross-school edits and empty dates", () => {
    expect(() => upsertMakeupDay("dongyuan", [], { date: "2025-06-12", school: "青山國小" })).toThrow();
    expect(() => upsertMakeupDay("cingshan", [], { date: "", school: "青山國小" })).toThrow();
  });
});
