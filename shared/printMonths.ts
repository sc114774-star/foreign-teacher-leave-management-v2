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

// Aug(startYear) .. Jul(startYear+1) inclusive — the school's academic year,
// used to bound the print-month dropdown instead of an arbitrary rolling
// window centered on today's date.
export function academicYearMonths(startYear: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < 12; i++) {
    const monthIndex = 7 + i; // August (0-indexed 7) .. next July
    const d = new Date(startYear, monthIndex, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return result;
}
