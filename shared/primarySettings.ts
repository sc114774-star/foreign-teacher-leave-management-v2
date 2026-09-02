import type { MakeupDay } from "./leaveRules";

export type AdminRole = "cingshan" | "dongyuan";

export function canEditPrimarySettings(role: AdminRole) {
  return role === "cingshan";
}

export function upsertMakeupDay(role: AdminRole, existing: MakeupDay[], item: MakeupDay) {
  if (!canEditPrimarySettings(role)) {
    throw new Error("Only the primary school can edit make-up days");
  }
  if (!item.date) {
    throw new Error("A make-up date is required");
  }
  return [...existing.filter((day) => day.date !== item.date), item].sort((a, b) => a.date.localeCompare(b.date));
}

export function removeMakeupDay(role: AdminRole, existing: MakeupDay[], date: string) {
  if (!canEditPrimarySettings(role)) {
    throw new Error("Only the primary school can edit make-up days");
  }
  return existing.filter((day) => day.date !== date);
}
