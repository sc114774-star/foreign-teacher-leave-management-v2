import fs from "node:fs";

const path = "client/src/pages/Home.tsx";
let source = fs.readFileSync(path, "utf8");

const replacements = [
  [
    'function formatDate(value: string) {\n  return value.replace(/-/g, "/");\n}',
    'function formatDate(value: string) {\n  return value.replace(/-/g, "/");\n}\n\nfunction formatDayCountBilingual(days: number | string) {\n  const numeric = typeof days === "string" ? Number(days) : days;\n  const normalized = Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2).replace(/0+$/, "").replace(/\\.$/, "");\n  return `${normalized} 日 / ${normalized} days`;\n}\n\nfunction formatLeaveDaysBilingual(actualHours: number) {\n  return formatDayCountBilingual(actualHours / 8);\n}',
  ],
  ['const leaveDays = formatLeaveDays(record.hours);', 'const leaveDays = formatLeaveDaysBilingual(record.hours);'],
  ['本次 {isPto ? leaveDays : "0 日"}　／　年度已使用 {record.ptoUsedDays} 日', '本次 {isPto ? leaveDays : formatDayCountBilingual(0)}　／　年度已使用 {formatDayCountBilingual(record.ptoUsedDays)}'],
  ['本次 {isPto ? "0 日" : leaveDays}　／　年度已使用 {record.sickPersonalUsedDays} 日', '本次 {isPto ? formatDayCountBilingual(0) : leaveDays}　／　年度已使用 {formatDayCountBilingual(record.sickPersonalUsedDays)}'],
  ['value="14 日" helper="Across shared balance"', 'value="14 日 / 14 days" helper="跨校共用額度 · Across shared balance"'],
  ['value="284 days" helper={`${formatDate(calendarSettings.contractStart)} — ${formatDate(calendarSettings.contractEnd)}`}', 'value="284 日 / 284 days" helper={`合約期間 · ${formatDate(calendarSettings.contractStart)} — ${formatDate(calendarSettings.contractEnd)}`}'],
  ['{formatLeaveDays(balance.used)} / {formatLeaveDays(balance.total)}', '{formatLeaveDaysBilingual(balance.used)} / {formatLeaveDaysBilingual(balance.total)}'],
  ['休假日數 {formatLeaveDays(record.hours)}', '休假日數 / Leave days：{formatLeaveDaysBilingual(record.hours)}'],
  ['const [notice, setNotice] = useState("");', 'const [notice, setNotice] = useState("");\n  const [historyTypeFilter, setHistoryTypeFilter] = useState("all");\n  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");'],
  ['  const navItems = role === "teacher" ?', '  const filteredTeacherRecords = useMemo(() => leaveRecords.filter((record) => (historyTypeFilter === "all" || record.type === historyTypeFilter) && (historyStatusFilter === "all" || record.status === historyStatusFilter)), [historyStatusFilter, historyTypeFilter]);\n\n  const navItems = role === "teacher" ?'],
  ['<Card className="mt-6 border-0 bg-white/85 shadow-[0_12px_35px_rgba(81,73,58,0.07)]"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-lg">Recent applications</CardTitle><p className="mt-1 text-sm text-[#92978f]">歷史請假紀錄與目前簽核狀態</p></div><Button variant="ghost" className="text-[#5b7861]" onClick={() => setActive("History")}>View all <ChevronRight className="ml-1 h-4 w-4" /></Button></CardHeader>', '<Card className="mt-6 border-0 bg-white/85 shadow-[0_12px_35px_rgba(81,73,58,0.07)]"><CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="text-lg">Recent applications · 歷史請假紀錄</CardTitle><p className="mt-1 text-sm text-[#92978f]">依假別或審核狀態快速尋找歷史假單 · Filter by leave type or approval status</p></div><Button variant="ghost" className="text-[#5b7861]" onClick={() => setActive("History")}>View all · 查看全部 <ChevronRight className="ml-1 h-4 w-4" /></Button></CardHeader><CardContent><div className="mb-5 grid gap-3 rounded-2xl border border-[#e8e3d9] bg-[#faf9f5] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="space-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7e8c82]">假別 · Leave type<select value={historyTypeFilter} onChange={(event) => setHistoryTypeFilter(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#deded5] bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#405049]"><option value="all">全部假別 · All leave types</option><option value="PTO">特別休假 · PTO</option><option value="Sick Leave">病假 · Sick Leave</option><option value="Personal Leave">事假 · Personal Leave</option><option value="Official Leave">公假 · Official Leave</option><option value="Make-up Leave">補假／補休 · Make-up Leave</option></select></label><label className="space-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7e8c82]">審核狀態 · Approval status<select value={historyStatusFilter} onChange={(event) => setHistoryStatusFilter(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#deded5] bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#405049]"><option value="all">全部狀態 · All statuses</option><option value="Pending">待審核 · Pending</option><option value="Approved">已核准 · Approved</option><option value="Rejected">已退件 · Rejected</option></select></label><Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => { setHistoryTypeFilter("all"); setHistoryStatusFilter("all"); }}>Clear · 清除</Button></div><div className="mb-3 flex items-center justify-between text-xs text-[#8d968e]"><span>{filteredTeacherRecords.length} records · 筆</span><span>{historyTypeFilter === "all" && historyStatusFilter === "all" ? "Showing all history · 顯示全部紀錄" : "Filtered history · 已套用篩選"}</span></div>'],
  ['<tbody>{leaveRecords.map((record) =>', '<tbody>{filteredTeacherRecords.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-sm text-[#92978f]">No matching leave records · 找不到符合條件的請假紀錄</td></tr> : filteredTeacherRecords.map((record) =>'],
  ['</td></tr>)}</tbody></table></div></CardContent></Card>', '</td></tr>)}</tbody></table></div></CardContent></Card>'],
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) throw new Error(`Pattern not found: ${from.slice(0, 80)}`);
  source = source.replace(from, to);
}

fs.writeFileSync(path, source);
