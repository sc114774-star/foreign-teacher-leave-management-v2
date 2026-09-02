import type { MakeupDay } from "./leaveRules";

export type AdminRole = "cingshan" | "dongyuan";

export function canEditPrimarySettings(role: AdminRole) {
  return role === "cingshan" || role === "dongyuan";
}

export function schoolForAdminRole(role: AdminRole): MakeupDay["school"] {
  return role === "cingshan" ? "青山國小" : "東原國中";
}

export function upsertMakeupDay(role: AdminRole, existing: MakeupDay[], item: MakeupDay) {
  if (!canEditPrimarySettings(role)) throw new Error("Only school administrators can edit make-up days");
  if (!item.date) throw new Error("A make-up date is required");
  if (item.school !== schoolForAdminRole(role)) throw new Error("Administrators can only manage their own school's make-up days");
  const school = schoolForAdminRole(role);
  return [...existing.filter((day) => day.school === school && day.date !== item.date), item].sort((a, b) => a.date.localeCompare(b.date));
}

export function removeMakeupDay(role: AdminRole, existing: MakeupDay[], date: string) {
  if (!canEditPrimarySettings(role)) throw new Error("Only school administrators can edit make-up days");
  const school = schoolForAdminRole(role);
  return existing.filter((day) => day.school === school && day.date !== date);
}
