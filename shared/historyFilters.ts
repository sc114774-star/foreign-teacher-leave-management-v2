export type HistoryFilterStatus = "all" | "Pending" | "Approved" | "Rejected";

export type HistoryFilterRecord = {
  type: string;
  status: Exclude<HistoryFilterStatus, "all">;
};

export function filterHistoryRecords<T extends HistoryFilterRecord>(records: T[], leaveType: string, status: HistoryFilterStatus): T[] {
  return records.filter((record) => (leaveType === "all" || record.type === leaveType) && (status === "all" || record.status === status));
}
