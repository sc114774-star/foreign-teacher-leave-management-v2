import fs from "node:fs";

const path = "client/src/pages/Home.tsx";
let source = fs.readFileSync(path, "utf8");

source = source.replace(
  'import { isInlinePreviewable, type AttachmentSummary } from "@shared/attachmentAccess";\n',
  'import { isInlinePreviewable, type AttachmentSummary } from "@shared/attachmentAccess";\nimport { filterRecordsByMonth, filterRecordsByTerm, getAcademicTermRange, sortRecordsForPrint, type PrintScope } from "@shared/printFilters";\n',
);
source = source.replace(
  '  id: string;\n  applicationId?: number;',
  '  id: string;\n  startDate: string;\n  endDate: string;\n  applicationId?: number;',
);
source = source.replace(
  '{ id: "LV-114-006", type:',
  '{ id: "LV-114-006", startDate: "2025-06-17", endDate: "2025-06-17", type:',
);
source = source.replace(
  '{ id: "LV-114-005", type:',
  '{ id: "LV-114-005", startDate: "2025-06-09", endDate: "2025-06-10", type:',
);
source = source.replace(
  '{ id: "LV-114-004", type:',
  '{ id: "LV-114-004", startDate: "2025-05-22", endDate: "2025-05-22", type:',
);
source = source.replace(
  '{ id: "LV-114-003", type:',
  '{ id: "LV-114-003", startDate: "2025-04-28", endDate: "2025-04-28", type:',
);
source = source.replace(
  '  return { id: row.application.applicationNo, applicationId: row.application.id, type:',
  '  return { id: row.application.applicationNo, startDate: start.replace(/\\//g, "-"), endDate: end.replace(/\\//g, "-"), applicationId: row.application.id, type:',
);

const marker = 'function LeaveCardPrint({ record, onClose }: { record: LeaveRecord; onClose: () => void }) {';
const component = `function LeaveCollectionPrint({ records, title, onClose }: { records: LeaveRecord[]; title: string; onClose: () => void }) {
  const orderedRecords = sortRecordsForPrint(records);
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f4f0e8] p-4 sm:p-8 print:static print:overflow-visible print:bg-white print:p-0">
    <div className="mx-auto max-w-[900px] bg-white p-8 text-[#1f2a26] shadow-xl print:max-w-none print:p-0 print:shadow-none">
      <div className="mb-6 flex items-start justify-between print:hidden"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a948c]">Collection print preview</p><h2 className="mt-1 text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-[#92978f]">共 {orderedRecords.length} 筆請假紀錄 · {orderedRecords.length} leave records</p></div><div className="flex gap-2"><Button variant="outline" onClick={onClose}>Close · 關閉</Button><Button className="bg-[#304b3b] hover:bg-[#41644f]" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print all · 全部列印</Button></div></div>
      {orderedRecords.length === 0 ? <div className="rounded-2xl border border-dashed border-[#d4d2c8] p-12 text-center text-sm text-[#7e887f]">此範圍沒有請假紀錄 · No leave records in this range.</div> : <div className="space-y-8">{orderedRecords.map((record, index) => <div key={record.id} className="break-after-page border-2 border-[#33443a] last:break-after-auto"><div className="border-b-2 border-[#33443a] p-5 text-center"><p className="text-lg font-bold tracking-[0.22em]">臺南市青山國民小學　114 學年度　請假卡</p><p className="mt-1 text-sm font-medium tracking-[0.1em]">{record.school}　114 Academic Year　Leave Application Form</p><p className="mt-2 text-[10px] text-[#6e776f]">第 {index + 1} 筆 / Record {index + 1} · {record.id}</p></div><div className="grid grid-cols-2 border-b border-[#33443a] text-sm"><div className="border-r border-[#33443a] p-3"><span className="font-semibold">姓名 Name：</span> {record.applicant}</div><div className="p-3"><span className="font-semibold">單位 Department：</span> {record.department}</div><div className="border-r border-t border-[#33443a] p-3"><span className="font-semibold">職別 Job Title：</span> {record.jobTitle}</div><div className="border-t border-[#33443a] p-3"><span className="font-semibold">假單編號 Leave No.：</span> {record.id}</div></div><div className="grid grid-cols-[180px_1fr] text-sm"><div className="border-b border-r border-[#33443a] p-4 font-bold">假別<br /><span className="font-normal">Type of Leave</span></div><div className="border-b border-[#33443a] p-4">{record.typeZh} · {record.type}</div><div className="border-b border-r border-[#33443a] p-4 font-bold">請假事由說明<br /><span className="font-normal">Reason for Leave</span></div><div className="border-b border-[#33443a] p-4">{record.reason}</div><div className="border-b border-r border-[#33443a] p-4 font-bold">公文字號及地點<br /><span className="font-normal">Official Document No. and Location</span></div><div className="border-b border-[#33443a] p-4">{record.officialDocument} · {record.location}</div><div className="border-b border-r border-[#33443a] p-4 font-bold">起訖時間<br /><span className="font-normal">Dates and Interval</span></div><div className="border-b border-[#33443a] p-4">{record.dates}　·　休假日數 Leave days：{formatLeaveDaysBilingual(record.hours)}</div><div className="border-r border-[#33443a] p-4 font-bold">休假累計<br /><span className="font-normal">PTO Accrual</span></div><div className="p-4">本次 {record.type === "PTO" ? formatLeaveDaysBilingual(record.hours) : formatDayCountBilingual(0)}　／　年度已使用 {formatDayCountBilingual(record.ptoUsedDays)}</div><div className="border-t border-r border-[#33443a] p-4 font-bold">事病假累計<br /><span className="font-normal">Sick/Personal Leave Accrual</span></div><div className="border-t border-[#33443a] p-4">本次 {record.type === "PTO" ? formatDayCountBilingual(0) : formatLeaveDaysBilingual(record.hours)}　／　年度已使用 {formatDayCountBilingual(record.sickPersonalUsedDays)}</div></div><div className="grid grid-cols-2 border-t-2 border-[#33443a] text-sm"><div className="min-h-[112px] border-b border-r border-[#33443a] p-4">請假人簽章<br /><span className="text-xs">Applicant’s Signature</span></div><div className="min-h-[112px] border-b border-[#33443a] p-4">教學組課務登記<br /><span className="text-xs">Approval of Section Chief of Curriculum</span></div><div className="min-h-[112px] border-b border-r border-[#33443a] p-4">單位主管簽章<br /><span className="text-xs">Director's Approval</span></div><div className="min-h-[112px] border-b border-[#33443a] p-4">校長核示簽章<br /><span className="text-xs">Principal’s Approval</span></div></div></div>)}</div>}
      <div className="mt-5 text-center text-xs text-[#788279] print:hidden">列印時每筆請假卡會自動分頁。</div>
    </div>
  </div>;
}

`;
source = source.replace(marker, component + marker);
source = source.replace(
  '  const [printRecord, setPrintRecord] = useState<LeaveRecord | null>(null);',
  '  const [printRecord, setPrintRecord] = useState<LeaveRecord | null>(null);\n  const [printCollection, setPrintCollection] = useState<{ records: LeaveRecord[]; title: string } | null>(null);',
);
source = source.replace(
  '  const filteredTeacherRecords = useMemo(() => filterHistoryRecords(records, historyTypeFilter, historyStatusFilter as "all" | "Pending" | "Approved" | "Rejected"), [historyStatusFilter, historyTypeFilter, records]);',
  '  const filteredTeacherRecords = useMemo(() => filterHistoryRecords(records, historyTypeFilter, historyStatusFilter as "all" | "Pending" | "Approved" | "Rejected"), [historyStatusFilter, historyTypeFilter, records]);\n  const availablePrintMonths = useMemo(() => Array.from(new Set(records.flatMap((record) => { const months: string[] = []; const cursor = new Date(`${record.startDate}T12:00:00`); const end = new Date(`${record.endDate}T12:00:00`); while (cursor <= end) { months.push(cursor.toISOString().slice(0, 7)); cursor.setMonth(cursor.getMonth() + 1); } return months; })).sort(), [records]);\n  const defaultPrintMonth = availablePrintMonths[0] ?? "2025-06";\n  const [printMonth, setPrintMonth] = useState(defaultPrintMonth);\n  const [printTerm, setPrintTerm] = useState<"first" | "second">("first");\n  const academicYearStart = Number(calendarSettings.contractStart.slice(0, 4));',
);
source = source.replace(
  'onPrint: (record: LeaveRecord) => void; onPreviewAttachment:',
  'onPrint: (record: LeaveRecord) => void; onPrintCollection: (scope: PrintScope) => void; onPreviewAttachment:',
);
source = source.replace(
  'onClick={() => onPrint(filtered[0])}><CalendarDays',
  'onClick={() => onPrintCollection("month")}><CalendarDays',
);
source = source.replace(
  'onClick={() => onPrint(filtered[0])}><FileText',
  'onClick={() => onPrintCollection("all")}><FileText',
);
source = source.replace(
  '<CardHeader><CardTitle className="text-lg">列印篩選 · Print filters</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">',
  '<CardHeader><CardTitle className="text-lg">列印篩選 · Print filters</CardTitle><p className="mt-1 text-sm text-[#92978f]">選擇日期範圍後，將產生真正的資料集合列印。</p></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><label className="space-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7e8c82]">月份 · Month<select value={printMonth} onChange={(event) => setPrintMonth(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#deded5] bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#405049]">{availablePrintMonths.length === 0 ? <option value={printMonth}>{printMonth}</option> : availablePrintMonths.map((month) => <option key={month} value={month}>{month.replace("-", " / ")}</option>)}</select></label><label className="space-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7e8c82]">學期 · Term<select value={printTerm} onChange={(event) => setPrintTerm(event.target.value as "first" | "second")} className="mt-1 h-10 w-full rounded-xl border border-[#deded5] bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#405049]"><option value="first">上學期 · First semester</option><option value="second">下學期 · Second semester</option></select></label>');
source = source.replace(
  '<small className="text-[#9a9e98]">單月／單學期</small>',
  '<small className="text-[#9a9e98]">單月集合 · Month collection</small>',
);
source = source.replace(
  '<small className="text-[#9a9e98]">全部資料</small>',
  '<small className="text-[#9a9e98]">全部集合 · All records</small>',
);
source = source.replace(
  'onPrint={setPrintRecord} onPreviewAttachment={onPreviewAttachment}',
  'onPrint={setPrintRecord} onPrintCollection={(scope) => { const collection = scope === "month" ? filterRecordsByMonth(filtered, printMonth) : scope === "term" ? filterRecordsByTerm(filtered, printTerm, academicYearStart) : filtered; const title = scope === "month" ? `${printMonth.replace("-", " / ")} 月請假紀錄 · Monthly Leave Records` : scope === "term" ? `${academicYearStart} 學年度${printTerm === "first" ? "上" : "下"}學期請假紀錄 · Semester Leave Records` : "全部請假紀錄 · All Leave Records"; setPrintCollection({ records: collection, title }); }} onPreviewAttachment={onPreviewAttachment}',
);
source = source.replace(
  '    {printRecord && <LeaveCardPrint record={printRecord} onClose={() => setPrintRecord(null)} />}\n',
  '    {printRecord && <LeaveCardPrint record={printRecord} onClose={() => setPrintRecord(null)} />}\n    {printCollection && <LeaveCollectionPrint records={printCollection.records} title={printCollection.title} onClose={() => setPrintCollection(null)} />}\n',
);
fs.writeFileSync(path, source);
