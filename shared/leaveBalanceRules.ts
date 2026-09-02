export type BalanceLeaveType = "PTO" | "Sick Leave" | "Personal Leave" | "Official Leave";

export type BalanceRecord = {
  startDate: string;
  endDate: string;
  type: string;
  hours: number;
  status: "Pending" | "Approved" | "Rejected";
};

export type LeaveBalanceSummary = {
  ptoUsed: number;
  ptoRemaining: number;
  ptoTotal: number;
  sickUsed: number;
  personalUsed: number;
  officialUsed: number;
  sickPersonalUsed: number;
  salaryWarnings: string[];
};

export const UNLIMITED_LEAVE_TYPES: readonly BalanceLeaveType[] = ["Sick Leave", "Personal Leave", "Official Leave"];
export const PERSONAL_SALARY_WARNING_DAYS = 7;
export const SICK_PERSONAL_SALARY_WARNING_DAYS = 14;

export function leaveDaysFromHoursForBalance(hours: number): number {
  return Math.round((hours / 8) * 100) / 100;
}

export function academicYearForDate(date: string): string {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function isCountedApplication(record: BalanceRecord, academicYear: string): boolean {
  return record.status !== "Rejected" && academicYearForDate(record.startDate) === academicYear;
}

export function calculateLeaveBalance(records: BalanceRecord[], academicYear: string, ptoTotal: number): LeaveBalanceSummary {
  const counted = records.filter((record) => isCountedApplication(record, academicYear));
  const sum = (type: BalanceLeaveType) => leaveDaysFromHoursForBalance(counted.filter((record) => record.type === type).reduce((total, record) => total + record.hours, 0));
  const ptoUsed = sum("PTO");
  const sickUsed = sum("Sick Leave");
  const personalUsed = sum("Personal Leave");
  const officialUsed = sum("Official Leave");
  const sickPersonalUsed = Math.round((sickUsed + personalUsed) * 100) / 100;
  const warnings: string[] = [];
  if (personalUsed > PERSONAL_SALARY_WARNING_DAYS) warnings.push("事假累計超過 7 日 · Will deduct salary");
  if (sickPersonalUsed > SICK_PERSONAL_SALARY_WARNING_DAYS) warnings.push("事假＋病假累計超過 14 日 · Will deduct salary");
  return { ptoUsed, ptoTotal, ptoRemaining: Math.max(0, Math.round((ptoTotal - ptoUsed) * 100) / 100), sickUsed, personalUsed, officialUsed, sickPersonalUsed, salaryWarnings: warnings };
}

export function formatLeaveDays(days: number): string {
  return Number.isInteger(days) ? String(days) : days.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
