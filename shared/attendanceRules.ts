export type School = "青山國小" | "東原國中";

export function effectiveLeaveHours(school: School, start: Date, end: Date): number {
  if (end <= start) return 0;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const clippedStart = Math.max(startMinutes, 8 * 60);
  const clippedEnd = Math.min(endMinutes, school === "東原國中" ? 17 * 60 : 16 * 60);
  if (clippedEnd <= clippedStart) return 0;
  const totalMinutes = clippedEnd - clippedStart;
  const breakMinutes = school === "東原國中" ? Math.max(0, Math.min(clippedEnd, 13 * 60) - Math.max(clippedStart, 12 * 60)) : 0;
  return (totalMinutes - breakMinutes) / 60;
}

export function leaveDaysFromHours(actualHours: number): number {
  return Math.round((actualHours / 8) * 100) / 100;
}

export function formatLeaveDays(actualHours: number): string {
  return `${leaveDaysFromHours(actualHours)} 日`;
}

function dateAt(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function estimateLeaveHoursForRange(school: School, startDate: string, startTime: string, endDate: string, endTime: string): number {
  if (!startDate || !endDate || !startTime || !endTime) return 0;
  const start = dateAt(startDate, startTime);
  const end = dateAt(endDate, endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0;

  const startDay = dateAt(startDate, "00:00");
  const endDay = dateAt(endDate, "00:00");
  const dayCount = Math.floor((endDay.getTime() - startDay.getTime()) / 86_400_000) + 1;
  if (dayCount === 1) return effectiveLeaveHours(school, start, end);

  const closeTime = school === "東原國中" ? "17:00" : "16:00";
  const firstDayHours = effectiveLeaveHours(school, start, dateAt(startDate, closeTime));
  const lastDayHours = effectiveLeaveHours(school, dateAt(endDate, "08:00"), end);
  return firstDayHours + Math.max(0, dayCount - 2) * 8 + lastDayHours;
}
