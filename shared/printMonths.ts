export function currentYearMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function rollingPrintMonths(date = new Date(), pastMonths = 12, futureMonths = 6): string[] {
  const result: string[] = [];
  const start = new Date(date.getFullYear(), date.getMonth() - pastMonths, 1);
  const end = new Date(date.getFullYear(), date.getMonth() + futureMonths, 1);
  for (const cursor = new Date(start); cursor <= end; cursor.setMonth(cursor.getMonth() + 1)) {
    result.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
  }
  return result.sort((a, b) => b.localeCompare(a));
}

export function mergePrintMonths(recordMonths: string[], date = new Date()): string[] {
  return Array.from(new Set([...recordMonths, ...rollingPrintMonths(date)])).sort((a, b) => b.localeCompare(a));
}
