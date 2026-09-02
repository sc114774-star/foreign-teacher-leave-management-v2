export type School = "青山國小" | "東原國中";
export type LeaveType = "PTO" | "Sick Leave" | "Personal Leave" | "Official Leave" | "Make-up Leave";

export type VacationPeriod = { start: string; end: string; label: string };
export type LeaveDay = { date: string; hours: number; school: School };
export type MakeupDay = { id?: number; date: string; school: School; sourceDate?: string; note?: string };

function inPeriod(date: string, period: VacationPeriod) {
  return date >= period.start && date <= period.end;
}

export function routeSchool(date: string, vacationPeriods: VacationPeriod[] = [], makeupDays: MakeupDay[] = []): School {
  const makeup = makeupDays.find((item) => item.date === date);
  if (makeup) return makeup.school;
  if (vacationPeriods.some((period) => inPeriod(date, period))) return "青山國小";
  const weekday = new Date(`${date}T12:00:00`).getDay();
  return [1, 3].includes(weekday) ? "東原國中" : "青山國小";
}

export function splitLeaveDays(dates: string[], hoursPerDay: number, vacationPeriods: VacationPeriod[] = [], makeupDays: MakeupDay[] = []): LeaveDay[] {
  return dates.map((date) => ({ date, hours: hoursPerDay, school: routeSchool(date, vacationPeriods, makeupDays) }));
}

export function validateSingleSchoolApplication(days: LeaveDay[]) {
  const schools = Array.from(new Set(days.map((day) => day.school)));
  return {
    valid: schools.length <= 1,
    schools,
    message: schools.length <= 1 ? "" : "跨校日期必須拆單申請，分別送至各校審核。",
  };
}

export function requiresAttachment(type: LeaveType, totalDays: number, vacationPeriods: VacationPeriod[], dates: string[]) {
  if (type === "Sick Leave" && totalDays >= 3) return { required: true, reason: "病假連續 3 日（含）以上需檢附就醫證明" };
  if (type === "Official Leave") return { required: true, reason: "公假需檢附公文電子檔" };
  if (type === "PTO" && dates.some((date) => !vacationPeriods.some((period) => inPeriod(date, period)))) return { required: true, reason: "非寒暑假期間之特休需檢附公文證明" };
  return { required: false, reason: "" };
}

export function calculateRemaining(total: number, approvedHours: number) {
  return Math.max(0, total - approvedHours);
}
