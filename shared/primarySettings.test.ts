import { describe, expect, it } from "vitest";
import { canEditPrimarySettings, removeMakeupDay, upsertMakeupDay } from "./primarySettings";

describe("primary school settings", () => {
  it("only allows Cingshan to edit settings", () => {
    expect(canEditPrimarySettings("cingshan")).toBe(true);
    expect(canEditPrimarySettings("dongyuan")).toBe(false);
  });

  it("upserts multiple make-up days without losing other dates", () => {
    const existing = [{ date: "2025-06-12", school: "東原國中" as const, note: "運動會補休" }];
    const result = upsertMakeupDay("cingshan", existing, { date: "2025-06-16", school: "青山國小", note: "校慶補休" });
    expect(result.map((day) => day.date)).toEqual(["2025-06-12", "2025-06-16"]);
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

  it("rejects partner-school edits and empty dates", () => {
    expect(() => upsertMakeupDay("dongyuan", [], { date: "2025-06-12", school: "東原國中" })).toThrow();
    expect(() => upsertMakeupDay("cingshan", [], { date: "", school: "青山國小" })).toThrow();
  });
});
