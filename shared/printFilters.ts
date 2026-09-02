export type PrintRangeRecord = {
  startDate: string;
  endDate: string;
};

export type PrintScope = "month" | "term" | "all";

export function overlapsDateRange(record: PrintRangeRecord, rangeStart: string, rangeEnd: string): boolean {
  return record.startDate <= rangeEnd && record.endDate >= rangeStart;
}

export function filterRecordsByMonth<T extends PrintRangeRecord>(records: T[], month: string): T[] {
  if (!/^\d{4}-\d{2}$/.test(month)) return [];
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  return records.filter((record) => overlapsDateRange(record, `${month}-01`, lastDay));
}

export function getAcademicTermRange(term: "first" | "second", academicYearStart: number): { start: string; end: string } {
  if (term === "first") return { start: `${academicYearStart}-08-01`, end: `${academicYearStart + 1}-01-31` };
  return { start: `${academicYearStart + 1}-02-01`, end: `${academicYearStart + 1}-07-31` };
}

export function filterRecordsByTerm<T extends PrintRangeRecord>(records: T[], term: "first" | "second", academicYearStart: number): T[] {
  const range = getAcademicTermRange(term, academicYearStart);
  return records.filter((record) => overlapsDateRange(record, range.start, range.end));
}

export function sortRecordsForPrint<T extends PrintRangeRecord>(records: T[]): T[] {
  return [...records].sort((a, b) => a.startDate.localeCompare(b.startDate));
}
