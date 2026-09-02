export function formatDayCountBilingual(days: number | string): string {
  const numeric = typeof days === "string" ? Number(days) : days;
  if (!Number.isFinite(numeric)) return "0 日 / 0 days";
  const normalized = Number.isInteger(numeric)
    ? String(numeric)
    : numeric.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${normalized} 日 / ${normalized} days`;
}

export function formatLeaveDaysBilingual(actualHours: number): string {
  return formatDayCountBilingual(actualHours / 8);
}
