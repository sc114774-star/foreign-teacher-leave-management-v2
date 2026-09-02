import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getSupabaseAttachmentUrl, fetchSupabaseLeaveApplications, createSupabaseLeaveApplication, uploadSupabaseLeaveAttachment, decideSupabaseLeaveApplication, type SupabaseLeaveApplication } from "@/lib/supabaseLeave";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Printer,
  School,
  Settings2,
  ShieldCheck,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { canReviewLeave } from "@shared/schoolAccess";
import { routeSchool, type MakeupDay, type VacationPeriod } from "@shared/leaveRules";
import { estimateLeaveHoursForRange, leaveDaysFromHours, type School as AttendanceSchool } from "@shared/attendanceRules";
import { splitLeaveDays, validateSingleSchoolApplication, requiresAttachment } from "@shared/leaveRules";
import { canEditPrimarySettings, removeMakeupDay, upsertMakeupDay } from "@shared/primarySettings";
import { formatDayCountBilingual, formatLeaveDaysBilingual } from "@shared/bilingualFormat";
import { filterHistoryRecords } from "@shared/historyFilters";
import { isInlinePreviewable, type AttachmentSummary } from "@shared/attachmentAccess";
import { filterRecordsByMonth, filterRecordsByTerm, getAcademicTermRange, sortRecordsForPrint, type PrintScope } from "@shared/printFilters";
import LeaveBalancePanel from "@/components/LeaveBalancePanel";
import PtoSettingsPanel from "@/components/PtoSettingsPanel";
import { fetchSupabasePtoSettings, fetchSupabaseTeacherProfiles, upsertSupabasePtoSetting } from "@/lib/supabaseLeave";
import { academicYearForDate, calculateLeaveBalance, type BalanceRecord } from "@shared/leaveBalanceRules";

type Role = "teacher" | "cingshan" | "dongyuan";
type LeaveStatus = "Pending" | "Approved" | "Rejected";

type CalendarSettings = {
  contractStart: string;
  contractEnd: string;
  vacationPeriods: VacationPeriod[];
};

type LeaveRecord = {
  id: string;
  startDate: string;
  endDate: string;
  applicationId?: number;
  type: string;
  typeZh: string;
  dates: string;
  hours: number;
  school: string;
  status: LeaveStatus;
  reason: string;
  route: string;
  applicant: string;
  department: string;
  jobTitle: string;
  officialDocument: string;
  location: string;
  ptoUsedDays: number;
  sickPersonalUsedDays: number;
  attachments?: AttachmentSummary[];
};

const leaveRecords: LeaveRecord[] = [
  { id: "LV-114-006", startDate: "2025-06-17", endDate: "2025-06-17", type: "Personal Leave", typeZh: "事假", dates: "2025/06/17 · 08:00–12:00", hours: 4, school: "青山國小", status: "Approved", reason: "Personal appointment", route: "Tue → Cingshan", applicant: "Lavinia Cruz", department: "Academic Affairs", jobTitle: "Foreign Nationality English Teacher", officialDocument: "—", location: "Cingshan Elementary School", ptoUsedDays: 3, sickPersonalUsedDays: 1.5 },
  { id: "LV-114-005", startDate: "2025-06-09", endDate: "2025-06-10", type: "PTO", typeZh: "特別休假", dates: "2025/06/09–06/10", hours: 16, school: "東原國中", status: "Pending", reason: "Family travel", route: "Mon/Wed → Dongyuan", applicant: "Lavinia Cruz", department: "Academic Affairs", jobTitle: "Foreign Nationality English Teacher", officialDocument: "—", location: "Dongyuan Junior High School", ptoUsedDays: 3, sickPersonalUsedDays: 1.5 },
  { id: "LV-114-004", startDate: "2025-05-22", endDate: "2025-05-22", type: "Sick Leave", typeZh: "病假", dates: "2025/05/22", hours: 8, school: "青山國小", status: "Approved", reason: "Medical care", route: "Thu → Cingshan", applicant: "Lavinia Cruz", department: "Academic Affairs", jobTitle: "Foreign Nationality English Teacher", officialDocument: "—", location: "Cingshan Elementary School", ptoUsedDays: 3, sickPersonalUsedDays: 1.5 },
  { id: "LV-114-003", startDate: "2025-04-28", endDate: "2025-04-28", type: "Official Leave", typeZh: "公假", dates: "2025/04/28", hours: 8, school: "東原國中", status: "Rejected", reason: "Teacher workshop", route: "Mon → Dongyuan", applicant: "Lavinia Cruz", department: "Academic Affairs", jobTitle: "Foreign Nationality English Teacher", officialDocument: "EDU-114-0428", location: "Dongyuan Junior High School", ptoUsedDays: 3, sickPersonalUsedDays: 1.5, attachments: [{ id: "demo-att-003", fileName: "研習公文.pdf", mimeType: "application/pdf" }] },
];

const defaultCalendarSettings: CalendarSettings = {
  contractStart: "2025-08-01",
  contractEnd: "2026-07-31",
  vacationPeriods: [
    { start: "2025-07-01", end: "2025-08-31", label: "Summer vacation" },
    { start: "2026-01-21", end: "2026-02-10", label: "Winter vacation" },
  ],
};

const defaultMakeupDays: MakeupDay[] = [
  { date: "2025-06-12", school: "東原國中", sourceDate: "2025-06-07", note: "運動會補休" },
];

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

const balances = [
  { label: "PTO · 特別休假", total: 80, used: 24, color: "bg-[#7d9b85]" },
  { label: "Sick · 病假", total: 56, used: 8, color: "bg-[#c58b74]" },
  { label: "Personal · 事假", total: 40, used: 4, color: "bg-[#7c91b6]" },
  { label: "Official · 公假", total: 24, used: 0, color: "bg-[#b9a16d]" },
];

function formatDate(value: string) {
  return value.replace(/-/g, "/");
}

function formatApiDate(value: Date | string) {
  return formatDate(new Date(value).toISOString().slice(0, 10));
}

function toLeaveRecord(row: { application: { id: number; applicationNo: string; leaveType: string; reason: string; officialDocumentNo: string | null; officialLocation: string | null; startAt: Date | string; endAt: Date | string; totalHours: string | number; status: LeaveStatus }; days: Array<{ assignedSchool: string; routeReason: string }>; attachments: AttachmentSummary[] }): LeaveRecord {
  const start = formatApiDate(row.application.startAt);
  const end = formatApiDate(row.application.endAt);
  const dates = start === end ? start : `${start}–${end}`;
  const firstDay = row.days[0];
  const typeZh = { PTO: "特別休假", "Sick Leave": "病假", "Personal Leave": "事假", "Official Leave": "公假", "Make-up Leave": "補假／補休" }[row.application.leaveType] ?? row.application.leaveType;
  return { id: row.application.applicationNo, startDate: start.replace(/\//g, "-"), endDate: end.replace(/\//g, "-"), applicationId: row.application.id, type: row.application.leaveType, typeZh, dates, hours: Number(row.application.totalHours), school: firstDay?.assignedSchool ?? "青山國小", status: row.application.status, reason: row.application.reason, route: firstDay?.routeReason ?? "Database route", applicant: "Lavinia Cruz", department: "Academic Affairs", jobTitle: "Foreign Nationality English Teacher", officialDocument: row.application.officialDocumentNo ?? "—", location: row.application.officialLocation ?? "—", ptoUsedDays: 0, sickPersonalUsedDays: 0, attachments: row.attachments };
}

export function resolveHomeRole(identityRole: Role): Role {
  return identityRole;
}

function toSupabaseLeaveRecord(application: SupabaseLeaveApplication): LeaveRecord {
  return toLeaveRecord({
    application: {
      id: application.id,
      applicationNo: application.application_no,
      leaveType: application.leave_type,
      reason: application.reason,
      officialDocumentNo: application.official_document_no,
      officialLocation: application.official_location,
      startAt: application.start_at,
      endAt: application.end_at,
      totalHours: application.total_hours,
      status: application.status,
    },
    days: (application.foreign_teacher_leave_days ?? []).map((day) => ({ assignedSchool: day.assigned_school, routeReason: day.route_reason })),
    attachments: (application.foreign_teacher_leave_attachments ?? []).map((attachment) => ({ id: attachment.id, fileName: attachment.file_name, mimeType: attachment.mime_type, uploadedAt: attachment.uploaded_at })),
  });
}


function StatusBadge({ status }: { status: LeaveStatus }) {
  const styles = { Pending: "border-[#d8be7c] bg-[#fff8e8] text-[#9a7629]", Approved: "border-[#a9c7af] bg-[#eef8f0] text-[#41714c]", Rejected: "border-[#e1b1a9] bg-[#fff1ef] text-[#a55045]" };
  const labels = { Pending: "待審核 · Pending", Approved: "已核准 · Approved", Rejected: "已退件 · Rejected" };
  return <Badge variant="outline" className={cn("rounded-full px-3 py-1 font-medium", styles[status])}>{labels[status]}</Badge>;
}

function AttachmentViewer({ attachment, onClose }: { attachment: AttachmentSummary; onClose: () => void }) {
  const previewable = isInlinePreviewable(attachment.mimeType);
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#27352f]/45 p-4 backdrop-blur-sm"><div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-[#fbfaf7] shadow-2xl"><div className="flex items-center justify-between border-b border-[#e8e3d9] px-6 py-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#87968a]">Attachment preview · 附件預覽</p><p className="mt-1 font-semibold text-[#304b3b]">{attachment.fileName}</p></div><Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button></div><div className="min-h-[260px] bg-[#f4f1e9] p-4">{attachment.storageUrl && previewable ? attachment.mimeType.startsWith("image/") ? <img src={attachment.storageUrl} alt={attachment.fileName} className="mx-auto max-h-[520px] rounded-xl object-contain" /> : <iframe title={attachment.fileName} src={attachment.storageUrl} className="h-[520px] w-full rounded-xl border border-[#deded5] bg-white" /> : <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-[#d4d2c8] bg-white p-8 text-center text-sm text-[#7e887f]">此檔案將透過安全連結預覽 · Secure preview URL will be loaded here.<br />不可直接預覽的檔案請下載查看 · Download unsupported file types to view.</div>}</div><div className="flex flex-col gap-3 border-t border-[#e8e3d9] px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[#8a938b]">{attachment.mimeType}</p>{attachment.storageUrl ? <a href={attachment.storageUrl} download={attachment.fileName} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-xl bg-[#304b3b] px-4 text-sm font-medium text-white hover:bg-[#41644f]"><Download className="mr-2 h-4 w-4" />Download · 下載</a> : <Button disabled className="rounded-xl">Download unavailable · 尚無下載連結</Button>}</div></div></div>;
}

function AttachmentActions({ applicationId, attachments, onPreview }: { applicationId?: number; attachments?: AttachmentSummary[]; onPreview: (attachment: AttachmentSummary) => void }) {
  const first = attachments?.[0];
  if (!first) return <span className="text-xs text-[#a2a69f]">No attachment · 無附件</span>;
  const handlePreview = async () => {
    if (isSupabaseConfigured() && typeof applicationId === "number" && typeof first.id === "number") {
      try {
        const secured = await getSupabaseAttachmentUrl(applicationId, first.id);
        onPreview({ ...first, storageUrl: secured.url });
        return;
      } catch {
        // Keep metadata preview available if Storage/RLS denies the request.
      }
    }
    onPreview(first);
  };
  return <Button type="button" variant="ghost" size="sm" className="text-[#6c8470]" onClick={handlePreview}><Eye className="mr-2 h-4 w-4" />View attachment · 查看附件</Button>;
}

function MetricCard({ icon: Icon, label, value, helper, tone }: { icon: typeof Clock3; label: string; value: string; helper: string; tone: string }) {
  return <Card className="border-0 bg-white/80 shadow-[0_12px_35px_rgba(81,73,58,0.07)]">
    <CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c897f]">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-[#27352f]">{value}</p><p className="mt-1 text-sm text-[#8d9189]">{helper}</p></div><div className={cn("rounded-2xl p-3", tone)}><Icon className="h-5 w-5" /></div></div></CardContent>
  </Card>;
}

function LeaveCollectionPrint({ records, title, onClose }: { records: LeaveRecord[]; title: string; onClose: () => void }) {
  const orderedRecords = sortRecordsForPrint(records);
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f4f0e8] p-4 sm:p-8 print:static print:overflow-visible print:bg-white print:p-0">
    <div className="mx-auto max-w-[900px] bg-white p-8 text-[#1f2a26] shadow-xl print:max-w-none print:p-0 print:shadow-none">
      <div className="mb-6 flex items-start justify-between print:hidden"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a948c]">Collection print preview</p><h2 className="mt-1 text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-[#92978f]">共 {orderedRecords.length} 筆請假紀錄 · {orderedRecords.length} leave records</p></div><div className="flex gap-2"><Button variant="outline" onClick={onClose}>Close · 關閉</Button><Button className="bg-[#304b3b] hover:bg-[#41644f]" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print all · 全部列印</Button></div></div>
      {orderedRecords.length === 0 ? <div className="rounded-2xl border border-dashed border-[#d4d2c8] p-12 text-center text-sm text-[#7e887f]">此範圍沒有請假紀錄 · No leave records in this range.</div> : <div className="space-y-8">{orderedRecords.map((record, index) => <div key={record.id} className="break-after-page border-2 border-[#33443a] last:break-after-auto"><div className="border-b-2 border-[#33443a] p-5 text-center"><p className="text-lg font-bold tracking-[0.22em]">臺南市青山國民小學　114 學年度　請假卡</p><p className="mt-1 text-sm font-medium tracking-[0.1em]">{record.school}　114 Academic Year　Leave Application Form</p><p className="mt-2 text-[10px] text-[#6e776f]">第 {index + 1} 筆 / Record {index + 1} · {record.id}</p></div><div className="grid grid-cols-2 border-b border-[#33443a] text-sm"><div className="border-r border-[#33443a] p-3"><span className="font-semibold">姓名 Name：</span> {record.applicant}</div><div className="p-3"><span className="font-semibold">單位 Department：</span> {record.department}</div><div className="border-r border-t border-[#33443a] p-3"><span className="font-semibold">職別 Job Title：</span> {record.jobTitle}</div><div className="border-t border-[#33443a] p-3"><span className="font-semibold">假單編號 Leave No.：</span> {record.id}</div></div><div className="grid grid-cols-[180px_1fr] text-sm"><div className="border-b border-r border-[#33443a] p-4 font-bold">假別<br /><span className="font-normal">Type of Leave</span></div><div className="border-b border-[#33443a] p-4">{record.typeZh} · {record.type}</div><div className="border-b border-r border-[#33443a] p-4 font-bold">請假事由說明<br /><span className="font-normal">Reason for Leave</span></div><div className="border-b border-[#33443a] p-4">{record.reason}</div><div className="border-b border-r border-[#33443a] p-4 font-bold">公文字號及地點<br /><span className="font-normal">Official Document No. and Location</span></div><div className="border-b border-[#33443a] p-4">{record.officialDocument} · {record.location}</div><div className="border-b border-r border-[#33443a] p-4 font-bold">起訖時間<br /><span className="font-normal">Dates and Interval</span></div><div className="border-b border-[#33443a] p-4">{record.dates}　·　休假日數 Leave days：{formatLeaveDaysBilingual(record.hours)}</div><div className="border-r border-[#33443a] p-4 font-bold">休假累計<br /><span className="font-normal">PTO Accrual</span></div><div className="p-4">本次 {record.type === "PTO" ? formatLeaveDaysBilingual(record.hours) : formatDayCountBilingual(0)}　／　年度已使用 {formatDayCountBilingual(record.ptoUsedDays)}</div><div className="border-t border-r border-[#33443a] p-4 font-bold">事病假累計<br /><span className="font-normal">Sick/Personal Leave Accrual</span></div><div className="border-t border-[#33443a] p-4">本次 {record.type === "PTO" ? formatDayCountBilingual(0) : formatLeaveDaysBilingual(record.hours)}　／　年度已使用 {formatDayCountBilingual(record.sickPersonalUsedDays)}</div></div><div className="grid grid-cols-2 border-t-2 border-[#33443a] text-sm"><div className="min-h-[112px] border-b border-r border-[#33443a] p-4">請假人簽章<br /><span className="text-xs">Applicant’s Signature</span></div><div className="min-h-[112px] border-b border-[#33443a] p-4">教學組課務登記<br /><span className="text-xs">Approval of Section Chief of Curriculum</span></div><div className="min-h-[112px] border-b border-r border-[#33443a] p-4">單位主管簽章<br /><span className="text-xs">Director's Approval</span></div><div className="min-h-[112px] border-b border-[#33443a] p-4">校長核示簽章<br /><span className="text-xs">Principal’s Approval</span></div></div></div>)}</div>}
      <div className="mt-5 text-center text-xs text-[#788279] print:hidden">列印時每筆請假卡會自動分頁。</div>
    </div>
  </div>;
}

function LeaveCardPrint({ record, onClose }: { record: LeaveRecord; onClose: () => void }) {
  const leaveDays = formatLeaveDaysBilingual(record.hours);
  const isPto = record.type === "PTO";
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f4f0e8] p-4 sm:p-8 print:static print:overflow-visible print:bg-white print:p-0">
    <div className="mx-auto max-w-[900px] bg-white p-8 text-[#1f2a26] shadow-xl print:max-w-none print:p-0 print:shadow-none">
      <div className="mb-6 flex items-start justify-between print:hidden"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a948c]">Print preview</p><h2 className="mt-1 text-2xl font-semibold">請假卡 · Leave Application Form</h2></div><div className="flex gap-2"><Button variant="outline" onClick={onClose}>Close · 關閉</Button><Button className="bg-[#304b3b] hover:bg-[#41644f]" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print · 列印</Button></div></div>
      <div className="border-2 border-[#33443a]">
        <div className="border-b-2 border-[#33443a] p-5 text-center"><p className="text-lg font-bold tracking-[0.22em]">臺南市青山國民小學　114 學年度　請假卡</p><p className="mt-1 text-sm font-medium tracking-[0.1em]">{record.school}　114 Academic Year　Leave Application Form</p><p className="mt-2 text-[10px] text-[#6e776f]">113.08.15 修訂 · Bilingual Official Leave Record</p></div>
        <div className="grid grid-cols-2 border-b border-[#33443a] text-sm"><div className="border-r border-[#33443a] p-3"><span className="font-semibold">姓名 Name：</span> {record.applicant}</div><div className="p-3"><span className="font-semibold">單位 Department：</span> {record.department}</div><div className="border-r border-t border-[#33443a] p-3"><span className="font-semibold">職別 Job Title：</span> {record.jobTitle}</div><div className="border-t border-[#33443a] p-3"><span className="font-semibold">假單編號 Leave No.：</span> {record.id}</div></div>
        <div className="grid grid-cols-[180px_1fr] text-sm"><div className="border-b border-r border-[#33443a] p-4 font-bold">假別<br /><span className="font-normal">Type of Leave</span></div><div className="border-b border-[#33443a] p-4">{record.typeZh} · {record.type}</div><div className="border-b border-r border-[#33443a] p-4 font-bold">請假事由說明<br /><span className="font-normal">Reason for Leave</span></div><div className="border-b border-[#33443a] p-4">{record.reason}</div><div className="border-b border-r border-[#33443a] p-4 font-bold">公文字號及地點<br /><span className="font-normal">Official Document No. and Location</span></div><div className="border-b border-[#33443a] p-4">{record.officialDocument} · {record.location}</div><div className="border-b border-r border-[#33443a] p-4 font-bold">起訖時間<br /><span className="font-normal">Dates and Interval</span></div><div className="border-b border-[#33443a] p-4">{record.dates}　·　休假日數 Leave days：{leaveDays}</div><div className="border-r border-[#33443a] p-4 font-bold">休假累計<br /><span className="font-normal">PTO Accrual</span></div><div className="p-4">本次 {isPto ? leaveDays : formatDayCountBilingual(0)}　／　年度已使用 {formatDayCountBilingual(record.ptoUsedDays)}</div><div className="border-t border-r border-[#33443a] p-4 font-bold">事病假累計<br /><span className="font-normal">Sick/Personal Leave Accrual</span></div><div className="border-t border-[#33443a] p-4">本次 {isPto ? formatDayCountBilingual(0) : leaveDays}　／　年度已使用 {formatDayCountBilingual(record.sickPersonalUsedDays)}</div></div>
        <div className="grid grid-cols-2 border-t-2 border-[#33443a] text-sm"><div className="min-h-[112px] border-b border-r border-[#33443a] p-4">請假人簽章<br /><span className="text-xs">Applicant’s Signature</span></div><div className="min-h-[112px] border-b border-[#33443a] p-4">教學組課務登記<br /><span className="text-xs">Approval of Section Chief of Curriculum</span></div><div className="min-h-[112px] border-b border-r border-[#33443a] p-4">單位主管簽章<br /><span className="text-xs">Director's Approval</span></div><div className="min-h-[112px] border-b border-[#33443a] p-4">校長核示簽章<br /><span className="text-xs">Principal's Approval</span></div></div>
      </div>
      <div className="mt-5 text-center text-xs text-[#788279] print:hidden">列印時將自動隱藏網站導覽列、操作按鈕與預覽工具。</div>
    </div>
  </div>;
}

export default function Home() {
  const auth = useAuth();
  const supabaseLeaveQuery = useQuery({ queryKey: ["supabase", "leave-applications", auth.user?.id], queryFn: fetchSupabaseLeaveApplications, enabled: Boolean(auth.user) && auth.supabaseConfigured, retry: false });
  const records = useMemo(() => (supabaseLeaveQuery.data ?? []).map(toSupabaseLeaveRecord), [supabaseLeaveQuery.data]);
  const dataLoading = supabaseLeaveQuery.isLoading;
  const dataError = supabaseLeaveQuery.error;
  const dataStateNotice = dataLoading ? "Loading leave records · 正在載入請假紀錄" : dataError ? "Unable to load leave records · 無法載入請假紀錄" : !records.length ? "No leave records yet · 目前尚無請假紀錄" : null;
  const identityRole: Role = auth.user?.role === "cingshan" ? "cingshan" : auth.user?.role === "dongyuan" ? "dongyuan" : "teacher";
  const role = resolveHomeRole(identityRole);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>(() => readStored("foreign-teacher-calendar-settings", defaultCalendarSettings));
  const academicYear = academicYearForDate(calendarSettings.contractStart);
  const ptoSettingsQuery = useQuery({ queryKey: ["supabase", "pto-settings", academicYear, auth.user?.id, role], queryFn: () => fetchSupabasePtoSettings(academicYear, role === "teacher" ? auth.user?.id : undefined), enabled: Boolean(auth.user) && auth.supabaseConfigured, retry: false });
  const teacherProfilesQuery = useQuery({ queryKey: ["supabase", "teacher-profiles"], queryFn: fetchSupabaseTeacherProfiles, enabled: role === "cingshan" && auth.supabaseConfigured, retry: false });
  const ptoTotal = role === "teacher" ? Number(ptoSettingsQuery.data?.[0]?.total_days ?? 0) : 0;
  const balanceSummary = calculateLeaveBalance(records, academicYear, ptoTotal);
  const displayName = auth.user?.name ?? "Foreign Teacher";
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const [active, setActive] = useState("Dashboard");
  const [showForm, setShowForm] = useState(false);
  const [printRecord, setPrintRecord] = useState<LeaveRecord | null>(null);
  const [printCollection, setPrintCollection] = useState<{ records: LeaveRecord[]; title: string } | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<AttachmentSummary | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "2025-06-09", end: "2025-06-10" });
  const [makeupDays, setMakeupDays] = useState<MakeupDay[]>(() => readStored("foreign-teacher-makeup-days", defaultMakeupDays));
  const [notice, setNotice] = useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("all");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");

  useEffect(() => {
    try {
      window.localStorage.setItem("foreign-teacher-calendar-settings", JSON.stringify(calendarSettings));
      window.localStorage.setItem("foreign-teacher-makeup-days", JSON.stringify(makeupDays));
    } catch {
      // Local preview can still operate if storage is unavailable.
    }
  }, [calendarSettings, makeupDays]);

  const selectedRoute = useMemo(() => {
    const dates = [dateRange.start, dateRange.end];
    const schoolSet = new Set(dates.map((date) => routeSchool(date, calendarSettings.vacationPeriods, makeupDays)));
    return schoolSet.size > 1 ? "跨校日期：建議拆單申請 · Split into separate applications" : `${Array.from(schoolSet)[0]} · Single school route`;
  }, [dateRange, makeupDays, calendarSettings.vacationPeriods]);

  const submissionSchool: AttendanceSchool = selectedRoute.includes("東原國中") ? "東原國中" : "青山國小";
  const submissionHours = estimateLeaveHoursForRange(submissionSchool, dateRange.start, "08:00", dateRange.end, "17:00");
  const filteredTeacherRecords = useMemo(() => filterHistoryRecords(records, historyTypeFilter, historyStatusFilter as "all" | "Pending" | "Approved" | "Rejected"), [historyStatusFilter, historyTypeFilter, records]);

  const navItems = role === "teacher" ? [
    { key: "Dashboard", zh: "儀表板", Icon: LayoutDashboard }, { key: "Apply Leave", zh: "請假申請", Icon: Plus }, { key: "History", zh: "歷史紀錄", Icon: FileText }, { key: "Calendar", zh: "年度行事曆", Icon: CalendarDays },
  ] : [{ key: "Pending Review", zh: "待簽核假單", Icon: FileCheck2 }, { key: "Leave Records", zh: "假單紀錄", Icon: FileText }, { key: "Print Center", zh: "列印中心", Icon: Printer }, { key: "Settings", zh: "寒暑假設定", Icon: Settings2 }];

  const handleAction = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 3200); };

  return <div className="relative min-h-screen overflow-hidden bg-[#f7f5f0] text-[#27352f]"><div aria-hidden="true" className="pointer-events-none absolute -left-24 top-24 h-[520px] w-[520px] rounded-full border border-[#dce7d8]/80" /><div aria-hidden="true" className="pointer-events-none absolute right-[-180px] top-[-140px] h-[620px] w-[620px] rotate-12 border border-[#e6dcca]/80" /><div aria-hidden="true" className="pointer-events-none absolute bottom-[-220px] left-[38%] h-[460px] w-[460px] -rotate-12 border border-[#dbe6e0]/70" />
    <div className="flex min-h-screen">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-[272px] border-r border-[#e8e3d9] bg-[#fbfaf7] px-5 py-6 transition-transform lg:static lg:translate-x-0 print:hidden", mobileNav ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center gap-3 px-2"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#304b3b] text-white shadow-lg shadow-[#304b3b]/15"><GraduationCap className="h-6 w-6" /></div><div><p className="font-semibold tracking-tight">外師差勤 · Leave Office</p><p className="text-[11px] uppercase tracking-[0.16em] text-[#9a9a90]">Leave Office</p></div></div>
        <div className="mt-10 rounded-2xl bg-[#eef2ed] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#809084]">Current workspace</p><div className="mt-3 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8e2d6] text-sm font-bold text-[#47634e]">{initials}</div><div><p className="text-sm font-medium">{displayName}</p><p className="text-xs text-[#7f8b82]">{role === "teacher" ? "Foreign Teacher" : role === "cingshan" ? "Cingshan School Office" : "Dongyuan School Office"}</p></div></div></div>
        <nav className="mt-8 space-y-1">{navItems.map(({ key, zh, Icon }) => <button key={key} onClick={() => { setActive(key); setMobileNav(false); }} className={cn("flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition", active === key ? "bg-[#304b3b] text-white shadow-md shadow-[#304b3b]/10" : "text-[#7e847c] hover:bg-[#f0eee8] hover:text-[#304b3b]")}><span className="flex items-center gap-3"><Icon className="h-4 w-4" /><span>{zh}<span className={cn("ml-2 text-xs", active === key ? "text-white/65" : "text-[#adb0a8]")}>{key}</span></span></span>{active === key && <ChevronRight className="h-4 w-4" />}</button>)}</nav>
        <div className="mt-auto hidden border-t border-[#e8e3d9] pt-5 lg:block"><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#8a8d86] hover:bg-[#f0eee8]"><ShieldCheck className="h-4 w-4" />帳號與權限 · Access</button><button onClick={async () => { await auth.logout(); window.location.href = "/login"; }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#8a8d86] hover:bg-[#f0eee8]"><LogOut className="h-4 w-4" />登出 · Sign out</button></div>
      </aside>
      {mobileNav && <button aria-label="Close navigation" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-[#27352f]/20 lg:hidden" />}
      <main className="min-w-0 flex-1 print:hidden">
        <header className="flex h-[76px] items-center justify-between border-b border-[#e8e3d9] bg-[#fbfaf7]/80 px-5 backdrop-blur lg:px-10"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)}><Menu className="h-5 w-5" /></Button><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a19f95]">114 Academic Year · 2025</p><h1 className="mt-1 text-xl font-semibold tracking-tight">{role === "teacher" ? `Good morning, ${displayName}` : role === "cingshan" ? "青山國小 · School Office" : "東原國中 · School Office"}</h1></div></div><div className="flex items-center gap-3"><button className="relative rounded-full p-2 text-[#8b928a] hover:bg-[#f0eee8]" onClick={() => handleAction("No new notifications · 目前沒有新通知")}><Bell className="h-5 w-5" /><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#c58b74]" /></button><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9e3d6] text-xs font-bold text-[#47634e]">{initials}</div></div></header>
        <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10">
          {(notice || dataStateNotice) && <div className={cn("mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm", dataError ? "border-[#e1b1a9] bg-[#fff1ed] text-[#a55045]" : "border-[#b7d1bb] bg-[#eef8f0] text-[#41714c]")}><Check className="h-4 w-4" />{notice || dataStateNotice}</div>}
          {role === "teacher" ? <>
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-[#7f8d82]">{active === "Dashboard" ? "Your leave overview · 您的請假總覽" : navItems.find((item) => item.key === active)?.zh}</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#27352f]">Leave at a glance<span className="text-[#a6b6a2]">.</span></h2></div><Button onClick={() => setShowForm(true)} className="h-11 rounded-xl bg-[#304b3b] px-5 shadow-lg shadow-[#304b3b]/15 hover:bg-[#41644f]"><Plus className="mr-2 h-4 w-4" /> New leave application</Button></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard icon={Clock3} label="Available days" value="14 日 / 14 days" helper="跨校共用額度 · Across shared balance" tone="bg-[#e3eee1] text-[#59765d]" /><MetricCard icon={CalendarDays} label="Contract period" value="284 日 / 284 days" helper={`合約期間 · ${formatDate(calendarSettings.contractStart)} — ${formatDate(calendarSettings.contractEnd)}`} tone="bg-[#e9e5f2] text-[#72628f]" /><MetricCard icon={FileCheck2} label="Pending review" value="01" helper="Awaiting school action" tone="bg-[#f4ead4] text-[#97773d]" /><MetricCard icon={Bell} label="Latest update" value="Today" helper="Application routed" tone="bg-[#f2e2dc] text-[#a05d4d]" /></div>
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <LeaveBalancePanel records={records} academicYear={academicYear} ptoTotal={ptoTotal} />
              <Card className="border-0 bg-[#304b3b] text-white shadow-[0_12px_35px_rgba(48,75,59,0.18)]"><CardContent className="relative h-full overflow-hidden p-7"><div className="absolute -right-10 -top-12 h-48 w-48 rounded-full border-[28px] border-white/5" /><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Contract period</p><p className="mt-5 text-2xl font-semibold">{formatDate(calendarSettings.contractStart)} — {formatDate(calendarSettings.contractEnd)}</p><div className="mt-8 flex items-end justify-between"><div><p className="text-sm text-white/60">Primary school</p><p className="mt-1 text-sm font-medium">臺南市青山國民小學</p></div><div className="text-right"><p className="text-sm text-white/60">Partner school</p><p className="mt-1 text-sm font-medium">東原國中</p></div></div><div className="mt-7 border-t border-white/15 pt-4 text-xs text-white/55">Shared appointment · 主共聘合併管理</div></CardContent></Card>
            </div>
            <Card className="mt-6 border-0 bg-white/85 shadow-[0_12px_35px_rgba(81,73,58,0.07)]"><CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="text-lg">Recent applications · 歷史請假紀錄</CardTitle><p className="mt-1 text-sm text-[#92978f]">依假別或審核狀態快速尋找歷史假單 · Filter by leave type or approval status</p></div><Button variant="ghost" className="text-[#5b7861]" onClick={() => setActive("History")}>View all · 查看全部 <ChevronRight className="ml-1 h-4 w-4" /></Button></CardHeader><CardContent><div className="mb-5 grid gap-3 rounded-2xl border border-[#e8e3d9] bg-[#faf9f5] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="space-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7e8c82]">假別 · Leave type<select value={historyTypeFilter} onChange={(event) => setHistoryTypeFilter(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#deded5] bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#405049]"><option value="all">全部假別 · All leave types</option><option value="PTO">特別休假 · PTO</option><option value="Sick Leave">病假 · Sick Leave</option><option value="Personal Leave">事假 · Personal Leave</option><option value="Official Leave">公假 · Official Leave</option><option value="Make-up Leave">補假／補休 · Make-up Leave</option></select></label><label className="space-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7e8c82]">審核狀態 · Approval status<select value={historyStatusFilter} onChange={(event) => setHistoryStatusFilter(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#deded5] bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#405049]"><option value="all">全部狀態 · All statuses</option><option value="Pending">待審核 · Pending</option><option value="Approved">已核准 · Approved</option><option value="Rejected">已退件 · Rejected</option></select></label><Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => { setHistoryTypeFilter("all"); setHistoryStatusFilter("all"); }}>Clear · 清除</Button></div><div className="mb-3 flex items-center justify-between text-xs text-[#8d968e]"><span>{filteredTeacherRecords.length} records · 筆</span><span>{historyTypeFilter === "all" && historyStatusFilter === "all" ? "Showing all history · 顯示全部紀錄" : "Filtered history · 已套用篩選"}</span></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-[#eeeae1] text-xs uppercase tracking-[0.12em] text-[#a0a29a]"><th className="pb-3 font-medium">Leave type</th><th className="pb-3 font-medium">Dates & leave days</th><th className="pb-3 font-medium">Routed school</th><th className="pb-3 font-medium">Status</th><th className="pb-3 text-right font-medium">Action</th></tr></thead><tbody>{filteredTeacherRecords.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-sm text-[#92978f]">No matching leave records · 找不到符合條件的請假紀錄</td></tr> : filteredTeacherRecords.map((record) => <tr key={record.id} className="border-b border-[#f1eee8] last:border-0"><td className="py-4"><p className="font-medium text-[#405049]">{record.typeZh}</p><p className="mt-1 text-xs text-[#9a9e98]">{record.type} · {record.id}</p></td><td className="py-4 text-[#727c74]">{record.dates}<p className="mt-1 text-xs text-[#a0a59f]">休假日數 / Leave days：{formatLeaveDaysBilingual(record.hours)}</p></td><td className="py-4"><p className="text-[#5e6d63]">{record.school}</p><p className="mt-1 text-xs text-[#a0a59f]">{record.route}</p></td><td className="py-4"><StatusBadge status={record.status} /></td><td className="py-4 text-right"><div className="flex justify-end gap-1"><AttachmentActions applicationId={record.applicationId} attachments={record.attachments} onPreview={setAttachmentPreview} /><Button variant="ghost" size="sm" className="text-[#6c8470]" onClick={() => setPrintRecord(record)}><Printer className="mr-2 h-4 w-4" />Print</Button></div></td></tr>)}</tbody></table></div></CardContent></Card>
          </> : <SchoolView records={records} role={role} active={active} academicYear={academicYear} ptoSettings={ptoSettingsQuery.data ?? []} teacherProfiles={teacherProfilesQuery.data ?? []} onSavePto={async (teacherId, totalDays) => { await upsertSupabasePtoSetting({ teacherId, academicYear, totalDays }); await ptoSettingsQuery.refetch(); }} calendarSettings={calendarSettings} onSaveSettings={setCalendarSettings} makeupDays={makeupDays} onSaveMakeup={setMakeupDays} onAction={handleAction} onDecision={async (applicationId, schoolName, decision) => { if (!applicationId) return; try { await decideSupabaseLeaveApplication({ application_id: applicationId, school: schoolName as "青山國小" | "東原國中", decision }); await supabaseLeaveQuery.refetch(); handleAction(`${decision === "Approved" ? "Application approved" : "Application rejected"} · 已更新簽核狀態，LINE 通知已排程`); } catch (error) { handleAction(error instanceof Error ? error.message : "Unable to update application · 無法更新假單"); } }} onPrint={setPrintRecord} onCollectionPrint={(collection, title) => setPrintCollection({ records: collection, title })} onPreviewAttachment={setAttachmentPreview} />}
        </div>
      </main>
    </div>
    {showForm && <LeaveForm route={selectedRoute} dateRange={dateRange} setDateRange={setDateRange} calendarSettings={calendarSettings} makeupDays={makeupDays} balanceRecords={records} academicYear={academicYear} salaryWarnings={balanceSummary.salaryWarnings} ptoRemaining={balanceSummary.ptoRemaining} onClose={() => setShowForm(false)} onSubmit={async (kind, makeupDate, makeupSchool, reason, selectedLeaveType, attachmentFile, startTime = "08:00", endTime = "17:00") => { if (auth.supabaseConfigured && auth.user?.id) { try { const startAt = `${dateRange.start}T${startTime}:00+08:00`; const endAt = `${dateRange.end}T${endTime}:00+08:00`; const routeSchoolName = kind === "makeup" ? makeupSchool : (selectedRoute.includes("東原國中") ? "東原國中" : "青山國小"); const dates = datesBetween(dateRange.start, dateRange.end); const splitDays = splitLeaveDays(dates, 8, calendarSettings.vacationPeriods, makeupDays).map((day) => ({ ...day, hours: estimateLeaveHoursForRange(day.school, day.date, startTime, day.date, endTime) })); const validation = validateSingleSchoolApplication(splitDays); if (!validation.valid) throw new Error(validation.message); const applicationId = await createSupabaseLeaveApplication({ application_no: `LV-${Date.now()}`, teacher_id: auth.user.id, leave_type: (kind === "makeup" ? "Make-up Leave" : (selectedLeaveType ?? "PTO")) as "PTO" | "Sick Leave" | "Personal Leave" | "Official Leave" | "Make-up Leave", reason: reason ?? "", official_document_no: null, official_location: null, start_at: startAt, end_at: endAt, total_hours: splitDays.reduce((sum, day) => sum + day.hours, 0), foreign_teacher_leave_days: splitDays.map((day) => ({ leave_date: day.date, hours: day.hours, assigned_school: day.school, route_reason: day.school === "東原國中" ? "Weekday routing → Dongyuan" : "Weekday/vacation/makeup routing → Cingshan" })) }); if (attachmentFile) await uploadSupabaseLeaveAttachment(applicationId, attachmentFile); await supabaseLeaveQuery.refetch(); setShowForm(false); handleAction("Application submitted · 已送出申請，LINE 通知已排程"); } catch (error) { handleAction(error instanceof Error ? error.message : "Unable to submit application · 無法送出申請"); } } else { setShowForm(false); handleAction(kind === "makeup" ? `Make-up leave routed to ${makeupSchool} on ${makeupDate} · 補假已依實際補休日期分派並排入 LINE 通知` : "Application submitted · 已送出申請，LINE 通知已排程"); } }} />}
    {printRecord && <LeaveCardPrint record={printRecord} onClose={() => setPrintRecord(null)} />}
    {printCollection && <LeaveCollectionPrint records={printCollection.records} title={printCollection.title} onClose={() => setPrintCollection(null)} />}
    {attachmentPreview && <AttachmentViewer attachment={attachmentPreview} onClose={() => setAttachmentPreview(null)} />}
  </div>;
}

function datesBetween(start: string, end: string) { const dates: string[] = []; const cursor = new Date(`${start}T12:00:00`); const final = new Date(`${end}T12:00:00`); while (cursor <= final) { dates.push(cursor.toISOString().slice(0, 10)); cursor.setDate(cursor.getDate() + 1); } return dates; }

function LeaveForm({ route, dateRange, setDateRange, calendarSettings, makeupDays, balanceRecords, academicYear, salaryWarnings, ptoRemaining, onClose, onSubmit }: { route: string; dateRange: { start: string; end: string }; setDateRange: (v: { start: string; end: string }) => void; calendarSettings: CalendarSettings; makeupDays: MakeupDay[]; balanceRecords: BalanceRecord[]; academicYear: string; salaryWarnings: string[]; ptoRemaining: number; onClose: () => void; onSubmit: (kind: "regular" | "makeup", makeupDate?: string, makeupSchool?: string, reason?: string, leaveType?: string, attachmentFile?: File, startTime?: string, endTime?: string) => void }) {
  const [leaveType, setLeaveType] = useState("PTO");
  const [makeupDate, setMakeupDate] = useState(makeupDays[0]?.date ?? "");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | undefined>();
  const isMakeup = leaveType === "Make-up Leave";
  const configuredMakeup = makeupDays.find((item) => item.date === makeupDate);
  const resolvedMakeupSchool = configuredMakeup?.school ?? "";
  const scheduleSchool: AttendanceSchool = isMakeup ? (resolvedMakeupSchool === "東原國中" ? "東原國中" : "青山國小") : route.includes("東原國中") ? "東原國中" : "青山國小";
  const estimatedHours = estimateLeaveHoursForRange(scheduleSchool, dateRange.start, startTime, dateRange.end, endTime);
  const estimatedDays = leaveDaysFromHours(estimatedHours);
  const attachmentRule = requiresAttachment(leaveType as "PTO" | "Sick Leave" | "Personal Leave" | "Official Leave" | "Make-up Leave", estimatedDays, calendarSettings.vacationPeriods, datesBetween(dateRange.start, dateRange.end));
  const projectedWarnings = calculateLeaveBalance([...balanceRecords, { startDate: dateRange.start, endDate: dateRange.end, type: leaveType, hours: estimatedHours, status: "Pending" }], academicYear, 0).salaryWarnings;
  const exceedsPto = leaveType === "PTO" && estimatedDays > ptoRemaining;
  const canSubmit = (!isMakeup || Boolean(configuredMakeup)) && (!attachmentRule.required || Boolean(attachmentFile)) && !exceedsPto;
  const displayRoute = isMakeup ? configuredMakeup ? `${resolvedMakeupSchool} · 補休日期 ${makeupDate} · Primary school setting` : `尚未設定 ${makeupDate || "補休日期"} · 請由青山國小先登錄` : route;
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#27352f]/35 p-4 backdrop-blur-sm"><div className="mx-auto my-6 max-w-2xl rounded-3xl bg-[#fbfaf7] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#87968a]">New application · 請假申請</p><h2 className="mt-2 text-2xl font-semibold text-[#304b3b]">Take time with clarity.</h2><p className="mt-1 text-sm text-[#90978f]">填寫假單後，系統會自動分派至對應學校。</p></div><Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button></div><div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-[#58655d]">假別 · Type of leave<select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="h-11 w-full rounded-xl border border-[#deded5] bg-white px-3 text-sm outline-none focus:border-[#78947c]"><option value="PTO">PTO · 特別休假</option><option value="Sick Leave">Sick Leave · 病假</option><option value="Personal Leave">Personal Leave · 事假</option><option value="Official Leave">Official Leave · 公假</option><option value="Make-up Leave">Make-up Leave · 補假／補休</option></select></label><label className="space-y-2 text-sm font-medium text-[#58655d]">預估扣除日數 · Estimated deduction<Input type="text" readOnly value={formatDayCountBilingual(estimatedDays)} className="h-11 bg-[#f5f7f3] font-semibold text-[#405049]" /><span className="block text-xs font-normal text-[#7e8c82]">依 {scheduleSchool} 作息與午休自動估算 · Schedule-aware estimate</span></label>{exceedsPto && <div className="rounded-2xl border border-[#edc1b8] bg-[#fff3f0] p-4 text-sm font-semibold text-[#a55045]">特休額度不足 · PTO limit exceeded<br /><span className="text-xs font-normal">本次 {formatDayCountBilingual(estimatedDays)}，剩餘 {formatDayCountBilingual(ptoRemaining)}。</span></div>}{projectedWarnings.length > 0 && <div className="rounded-2xl border border-[#edc1b8] bg-[#fff3f0] p-4 text-sm font-semibold text-[#a55045]">即將扣薪 · Will deduct salary{projectedWarnings.map((warning) => <p key={warning} className="mt-1 text-xs font-normal">{warning}</p>)}</div>}<label className="space-y-2 text-sm font-medium text-[#58655d]">起始日期 · Start date<Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="h-11 bg-white" /></label><label className="space-y-2 text-sm font-medium text-[#58655d]">結束日期 · End date<Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="h-11 bg-white" /></label></div><div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-[#58655d]">起始時間 · Start time<Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="h-11 bg-white" /></label><label className="space-y-2 text-sm font-medium text-[#58655d]">結束時間 · End time<Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="h-11 bg-white" /></label></div><label className="mt-5 block space-y-2 text-sm font-medium text-[#58655d]">請假事由 · Reason<Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Please describe the reason for leave..." className="min-h-24 resize-none bg-white" /></label>{isMakeup && <div className="mt-5 grid gap-5 rounded-2xl border border-[#d8be7c] bg-[#fffaf0] p-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-[#58655d]">實際補休日期 · Make-up date<Input type="date" value={makeupDate} onChange={(e) => setMakeupDate(e.target.value)} className="h-11 bg-white" /></label><div className="space-y-2 text-sm font-medium text-[#58655d]"><span className="block">補休學校 · Responsible school</span><div className="flex h-11 items-center rounded-xl border border-[#deded5] bg-[#f5f7f3] px-3 text-sm text-[#647469]">{configuredMakeup?.school ?? "尚未設定 · Not configured"}</div></div><p className="sm:col-span-2 text-xs leading-5 text-[#8b733f]">補假會依主聘校登錄的實際補休日期與指定學校送審，優先於一般星期分派規則。</p></div>}<div className="mt-5 rounded-2xl border border-[#cbd9ca] bg-[#f1f7f0] p-4"><div className="flex items-start gap-3"><School className="mt-0.5 h-5 w-5 text-[#66836c]" /><div><p className="text-sm font-semibold text-[#46634d]">自動分派結果 · Automatic routing</p><p className="mt-1 text-sm text-[#648069]">{displayRoute}</p><p className="mt-2 text-xs leading-5 text-[#7b927f]">星期一、三 → 東原國中；星期二、四、五 → 青山國小。寒暑假日期一律分派青山國小。</p></div></div></div><div className="mt-5 rounded-2xl border border-dashed border-[#cfcfc4] bg-white p-4"><div className="flex items-center gap-3"><UploadCloud className="h-5 w-5 text-[#78947c]" /><div><p className="text-sm font-semibold text-[#56645a]">附件 · Supporting document</p><p className="mt-1 text-xs text-[#929991]">病假 3 日以上、公假、非寒暑假特休將強制檢附證明。</p>{attachmentFile && <p className="mt-2 text-xs font-semibold text-[#46634d]">已選擇 · {attachmentFile.name}</p>}{attachmentRule.required && !attachmentFile && <p className="mt-2 text-xs font-semibold text-[#a15d43]">必須上傳：{attachmentRule.reason} · Required before submit</p>}</div><label className="ml-auto cursor-pointer rounded-xl border border-[#deded5] px-4 py-2 text-sm font-medium text-[#56645a] hover:bg-[#f5f7f3]">Choose file<input type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png,.doc,.docx,.zip" onChange={(event) => setAttachmentFile(event.target.files?.[0])} /></label></div></div><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="outline" className="rounded-xl" onClick={onClose}>Cancel · 取消</Button><Button className="rounded-xl bg-[#304b3b] px-6 hover:bg-[#41644f]" disabled={!canSubmit || !reason.trim()} onClick={() => onSubmit(isMakeup ? "makeup" : "regular", makeupDate, resolvedMakeupSchool, reason.trim(), leaveType, attachmentFile, startTime, endTime)}>Submit application · 送出</Button></div></div></div>;
}

function SchoolSettings({ role, academicYear, ptoSettings, teacherProfiles, onSavePto, calendarSettings, onSaveSettings, makeupDays, onSaveMakeup, onAction }: { role: Role; academicYear: string; ptoSettings: import("@/lib/supabaseLeave").SupabasePtoSetting[]; teacherProfiles: import("@/lib/supabaseLeave").SupabaseTeacherProfile[]; onSavePto: (teacherId: string, totalDays: number) => Promise<void>; calendarSettings: CalendarSettings; onSaveSettings: (settings: CalendarSettings) => void; makeupDays: MakeupDay[]; onSaveMakeup: (days: MakeupDay[]) => void; onAction: (message: string) => void }) {
  const isPrimary = role !== "teacher" && canEditPrimarySettings(role);
  const [contractStart, setContractStart] = useState(calendarSettings.contractStart);
  const [contractEnd, setContractEnd] = useState(calendarSettings.contractEnd);
  const [summerStart, setSummerStart] = useState(calendarSettings.vacationPeriods[0]?.start ?? "2025-07-01");
  const [summerEnd, setSummerEnd] = useState(calendarSettings.vacationPeriods[0]?.end ?? "2025-08-31");
  const [winterStart, setWinterStart] = useState(calendarSettings.vacationPeriods[1]?.start ?? "2026-01-21");
  const [winterEnd, setWinterEnd] = useState(calendarSettings.vacationPeriods[1]?.end ?? "2026-02-10");
  const [makeupDate, setMakeupDate] = useState(makeupDays[0]?.date ?? "2025-06-12");
  const [makeupSourceDate, setMakeupSourceDate] = useState(makeupDays[0]?.sourceDate ?? "2025-06-07");
  const [makeupSchool, setMakeupSchool] = useState(makeupDays[0]?.school ?? "青山國小");
  const [makeupNote, setMakeupNote] = useState(makeupDays[0]?.note ?? "運動會補休");
  return <div className="space-y-6"><div><p className="text-sm font-medium text-[#7f8d82]">主聘校設定 · Primary school settings</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Academic calendar & contract<span className="text-[#a6b6a2]">.</span></h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#8b948c]">青山國小管理本年度計畫合約與寒暑假期間；東原國中可查看設定，但無法修改。</p></div><PtoSettingsPanel academicYear={academicYear} teachers={teacherProfiles} settings={ptoSettings} canEdit={isPrimary} onSave={onSavePto} onAction={onAction} />{!isPrimary && <Card className="border-[#e3d7b8] bg-[#fffaf0]"><CardContent className="flex items-start gap-3 p-5 text-sm text-[#8b733f]"><ShieldCheck className="mt-0.5 h-5 w-5" /><p>唯讀模式 · Read-only mode<br /><span className="text-xs">Only Cingshan Elementary can edit these dates.</span></p></CardContent></Card>}<Card className="border-0 bg-white/85 shadow-[0_12px_35px_rgba(81,73,58,0.07)]"><CardHeader><CardTitle className="text-lg">本年度計畫合約期間 · Contract period</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-[#58655d]">開始日期 · Start date<Input type="date" value={contractStart} disabled={!isPrimary} onChange={(e) => setContractStart(e.target.value)} className="h-11 bg-white" /></label><label className="space-y-2 text-sm font-medium text-[#58655d]">結束日期 · End date<Input type="date" value={contractEnd} disabled={!isPrimary} onChange={(e) => setContractEnd(e.target.value)} className="h-11 bg-white" /></label></CardContent></Card><Card className="border-0 bg-white/85 shadow-[0_12px_35px_rgba(81,73,58,0.07)]"><CardHeader><CardTitle className="text-lg">寒暑假日期區間 · Vacation periods</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-[#58655d]">暑假開始 · Summer start<Input type="date" value={summerStart} disabled={!isPrimary} onChange={(e) => setSummerStart(e.target.value)} className="h-11 bg-white" /></label><label className="space-y-2 text-sm font-medium text-[#58655d]">暑假結束 · Summer end<Input type="date" value={summerEnd} disabled={!isPrimary} onChange={(e) => setSummerEnd(e.target.value)} className="h-11 bg-white" /></label><label className="space-y-2 text-sm font-medium text-[#58655d]">寒假開始 · Winter start<Input type="date" value={winterStart} disabled={!isPrimary} onChange={(e) => setWinterStart(e.target.value)} className="h-11 bg-white" /></label><label className="space-y-2 text-sm font-medium text-[#58655d]">寒假結束 · Winter end<Input type="date" value={winterEnd} disabled={!isPrimary} onChange={(e) => setWinterEnd(e.target.value)} className="h-11 bg-white" /></label>{isPrimary && <div className="sm:col-span-2 flex justify-end"><Button className="rounded-xl bg-[#304b3b] hover:bg-[#41644f]" onClick={() => { onSaveSettings({ contractStart, contractEnd, vacationPeriods: [{ start: summerStart, end: summerEnd, label: "Summer vacation" }, { start: winterStart, end: winterEnd, label: "Winter vacation" }] }); onAction("Settings saved · 合約與寒暑假設定已儲存"); }}>Save settings · 儲存設定</Button></div>}</CardContent></Card><Card className="border-0 bg-white/85 shadow-[0_12px_35px_rgba(81,73,58,0.07)]"><CardHeader><CardTitle className="text-lg">補休設定 · Make-up day</CardTitle><p className="text-sm text-[#92978f]">補休日期與指定學校優先於一般週別分派。</p></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-[#58655d]">實際補休日期 · Date<Input type="date" value={makeupDate} disabled={!isPrimary} onChange={(e) => setMakeupDate(e.target.value)} className="h-11 bg-white" /></label><label className="space-y-2 text-sm font-medium text-[#58655d]">原定活動日 · Source date<Input type="date" value={makeupSourceDate} disabled={!isPrimary} onChange={(e) => setMakeupSourceDate(e.target.value)} className="h-11 bg-white" /></label><label className="space-y-2 text-sm font-medium text-[#58655d]">負責學校 · Responsible school<select value={makeupSchool} disabled={!isPrimary} onChange={(e) => setMakeupSchool(e.target.value as "青山國小" | "東原國中")} className="h-11 w-full rounded-xl border border-[#deded5] bg-white px-3 text-sm"><option value="青山國小">青山國小 · Cingshan</option><option value="東原國中">東原國中 · Dongyuan</option></select></label><label className="space-y-2 text-sm font-medium text-[#58655d] sm:col-span-2">補休事由 · Note<Input value={makeupNote} disabled={!isPrimary} onChange={(e) => setMakeupNote(e.target.value)} className="h-11 bg-white" /></label>{isPrimary && <div className="sm:col-span-2 flex justify-end"><Button className="rounded-xl bg-[#304b3b] hover:bg-[#41644f]" onClick={() => { try { onSaveMakeup(upsertMakeupDay(role, makeupDays, { date: makeupDate, sourceDate: makeupSourceDate || undefined, school: makeupSchool as "青山國小" | "東原國中", note: makeupNote })); onAction("Make-up day saved · 補休日期與分派學校已儲存"); } catch (error) { onAction(error instanceof Error ? error.message : "Unable to save make-up day"); } }}>Save make-up day · 儲存補休</Button></div>}<div className="sm:col-span-2 rounded-2xl border border-[#e8e3d9] bg-[#faf9f5] p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-[#56645a]">已登錄補休日 · Registered make-up days</p><span className="text-xs text-[#92978f]">{makeupDays.length} dates</span></div>{makeupDays.length === 0 ? <p className="text-sm text-[#92978f]">尚未登錄補休日期 · No dates configured.</p> : <div className="space-y-2">{makeupDays.map((day) => <div key={day.date} className="flex flex-col gap-3 rounded-xl bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-[#405049]">{formatDate(day.date)} · {day.school}</p><p className="mt-1 text-xs text-[#92978f]">原定活動日 · Source: {day.sourceDate ? formatDate(day.sourceDate) : "—"}</p><p className="mt-1 text-xs text-[#92978f]">{day.note || "No note"}</p></div>{isPrimary && <div className="flex gap-2"><Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => { setMakeupDate(day.date); setMakeupSourceDate(day.sourceDate ?? ""); setMakeupSchool(day.school); setMakeupNote(day.note ?? ""); }}>Edit · 編輯</Button><Button type="button" variant="outline" size="sm" className="rounded-lg border-[#e1b1a9] text-[#a55045]" onClick={() => { onSaveMakeup(removeMakeupDay(role, makeupDays, day.date)); onAction("Make-up day removed · 補休日期已刪除"); }}>Delete · 刪除</Button></div>}</div>)}</div>}</div></CardContent></Card></div>;
}

function SchoolView({ records, role, active, academicYear, ptoSettings, teacherProfiles, onSavePto, calendarSettings, onSaveSettings, makeupDays, onSaveMakeup, onAction, onDecision, onPrint, onCollectionPrint, onPreviewAttachment }: { records: LeaveRecord[]; role: Role; active: string; academicYear: string; ptoSettings: import("@/lib/supabaseLeave").SupabasePtoSetting[]; teacherProfiles: import("@/lib/supabaseLeave").SupabaseTeacherProfile[]; onSavePto: (teacherId: string, totalDays: number) => Promise<void>; calendarSettings: CalendarSettings; onSaveSettings: (settings: CalendarSettings) => void; makeupDays: MakeupDay[]; onSaveMakeup: (days: MakeupDay[]) => void; onAction: (message: string) => void; onDecision: (applicationId: number | undefined, school: string, decision: "Approved" | "Rejected") => void; onPrint: (record: LeaveRecord) => void; onCollectionPrint: (records: LeaveRecord[], title: string) => void; onPreviewAttachment: (attachment: AttachmentSummary) => void }) {
  const availablePrintMonths = useMemo(() => Array.from(new Set(records.flatMap((record) => { const months: string[] = []; const cursor = new Date(record.startDate + 'T12:00:00'); const end = new Date(record.endDate + 'T12:00:00'); while (cursor <= end) { months.push(cursor.toISOString().slice(0, 7)); cursor.setMonth(cursor.getMonth() + 1); } return months; }))).sort(), [records]);
  const [printMonth, setPrintMonth] = useState(availablePrintMonths[0] ?? '2025-06');
  const [printTerm, setPrintTerm] = useState<"first" | "second">("first");
  const academicYearStart = Number(calendarSettings.contractStart.slice(0, 4));
  if (active === "Settings") return <SchoolSettings role={role} academicYear={academicYear} ptoSettings={ptoSettings} teacherProfiles={teacherProfiles} onSavePto={onSavePto} calendarSettings={calendarSettings} onSaveSettings={onSaveSettings} makeupDays={makeupDays} onSaveMakeup={onSaveMakeup} onAction={onAction} />;
  const school = role === "cingshan" ? "青山國小" : "東原國中";
  const allRecords = records;
  const onPrintCollection = (scope: PrintScope) => { const collection = scope === 'month' ? filterRecordsByMonth(filtered, printMonth) : scope === 'term' ? filterRecordsByTerm(filtered, printTerm, academicYearStart) : filtered; const title = scope === 'month' ? printMonth.replace('-', ' / ') + ' 月請假紀錄 · Monthly Leave Records' : scope === 'term' ? academicYearStart + ' 學年度' + (printTerm === 'first' ? '上' : '下') + '學期請假紀錄 · Semester Leave Records' : '全部請假紀錄 · All Leave Records'; onCollectionPrint(collection, title); };
  const filtered = allRecords;
  const ownPendingCount = allRecords.filter((record) => record.school === school && record.status === "Pending").length;
  return <><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-[#7f8d82]">行政簽核工作台 · School approval desk</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">{school} applications<span className="text-[#a6b6a2]">.</span></h2></div><div className="flex gap-2"><Button variant="outline" className="rounded-xl" onClick={() => onAction("Print filters opened · 已開啟列印篩選")}><Printer className="mr-2 h-4 w-4" />Print center</Button><Button className="rounded-xl bg-[#304b3b] hover:bg-[#41644f]" onClick={() => onAction("LINE notification settings opened · 已開啟 LINE 通知設定")}><Bell className="mr-2 h-4 w-4" />LINE notifications</Button></div></div><div className="grid gap-4 sm:grid-cols-3"><MetricCard icon={FileCheck2} label="My pending review" value={String(ownPendingCount).padStart(2, "0")} helper="本校待簽核假單" tone="bg-[#f4ead4] text-[#97773d]" /><MetricCard icon={Check} label="Approved this term" value="12" helper="本學期已核准" tone="bg-[#e3eee1] text-[#59765d]" /><MetricCard icon={School} label="Full leave overview" value={String(allRecords.length).padStart(2, "0")} helper="兩校皆可查看完整紀錄" tone="bg-[#e9e5f2] text-[#72628f]" /></div><Card className="mt-6 border-0 bg-white/85 shadow-[0_12px_35px_rgba(81,73,58,0.07)]"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-lg">完整請假紀錄 · Complete leave register</CardTitle><p className="mt-1 text-sm text-[#92978f]">完整請假紀錄皆可查看；僅能簽核分派至 {school} 的假單</p></div><Badge variant="outline" className="rounded-full border-[#d8be7c] bg-[#fff8e8] text-[#9a7629]">{ownPendingCount} own pending</Badge></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-[#eeeae1] text-xs uppercase tracking-[0.12em] text-[#a0a29a]"><th className="pb-3 font-medium">Applicant</th><th className="pb-3 font-medium">Leave request</th><th className="pb-3 font-medium">Routing logic</th><th className="pb-3 font-medium">Status</th><th className="pb-3 text-right font-medium">Decision</th></tr></thead><tbody>{filtered.map((record) => <tr key={record.id} className="border-b border-[#f1eee8] last:border-0"><td className="py-5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9e3d6] text-xs font-bold text-[#47634e]">LC</div><div><p className="font-medium">Lavinia Cruz</p><p className="text-xs text-[#9a9e98]">Foreign Teacher</p></div></div></td><td className="py-5"><p className="font-medium">{record.typeZh} · {record.type}</p><p className="mt-1 text-xs text-[#858e87]">{record.dates} · 休假日數 / Leave days：{formatLeaveDaysBilingual(record.hours)}</p></td><td className="py-5 text-xs text-[#788279]">{record.route}<br /><span className="text-[#a2a69f]">Shared balance</span></td><td className="py-5"><StatusBadge status={record.status} /></td><td className="py-5 text-right">{canReviewLeave(school as "青山國小" | "東原國中", record.school, record.status) ? <div className="flex justify-end gap-1"><AttachmentActions applicationId={record.applicationId} attachments={record.attachments} onPreview={onPreviewAttachment} /><Button size="sm" variant="outline" className="rounded-lg border-[#e1b1a9] text-[#a55045]" onClick={() => onDecision(record.applicationId, school, "Rejected")}><X className="mr-1 h-3.5 w-3.5" />Reject</Button><Button size="sm" className="rounded-lg bg-[#52775b] hover:bg-[#41644f]" onClick={() => onDecision(record.applicationId, school, "Approved")}><Check className="mr-1 h-3.5 w-3.5" />Approve</Button></div> : record.status === "Pending" ? <div className="flex items-center justify-end gap-2"><AttachmentActions applicationId={record.applicationId} attachments={record.attachments} onPreview={onPreviewAttachment} /><span className="text-xs font-medium text-[#a19f95]">Read-only · 唯讀</span></div> : <div className="flex items-center justify-end gap-1"><AttachmentActions applicationId={record.applicationId} attachments={record.attachments} onPreview={onPreviewAttachment} /><Button variant="ghost" size="sm" className="text-[#6c8470]" onClick={() => onPrint(record)}><Printer className="mr-2 h-4 w-4" />Print card</Button></div>}</td></tr>)}</tbody></table></div></CardContent></Card><div className="mt-6 grid gap-6 lg:grid-cols-2"><Card className="border-0 bg-white/85 shadow-[0_12px_35px_rgba(81,73,58,0.07)]"><CardHeader><CardTitle className="text-lg">列印篩選 · Print filters</CardTitle><p className="mt-1 text-sm text-[#92978f]">選擇日期範圍後，將產生真正的資料集合列印。</p></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><label className="space-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7e8c82]">月份 · Month<select value={printMonth} onChange={(event) => setPrintMonth(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#deded5] bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#405049]">{availablePrintMonths.length === 0 ? <option value={printMonth}>{printMonth}</option> : availablePrintMonths.map((month) => <option key={month} value={month}>{month.replace("-", " / ")}</option>)}</select></label><label className="space-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7e8c82]">學期 · Term<select value={printTerm} onChange={(event) => setPrintTerm(event.target.value as "first" | "second")} className="mt-1 h-10 w-full rounded-xl border border-[#deded5] bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#405049]"><option value="first">上學期 · First semester</option><option value="second">下學期 · Second semester</option></select></label><Button variant="outline" className="h-14 justify-start rounded-xl" onClick={() => onPrint(filtered[0])}><FileDown className="mr-3 h-4 w-4 text-[#78947c]" /><span className="text-left"><b className="block">Single record</b><small className="text-[#9a9e98]">單筆假卡</small></span></Button><Button variant="outline" className="h-14 justify-start rounded-xl" onClick={() => onPrintCollection("month")}><CalendarDays className="mr-3 h-4 w-4 text-[#78947c]" /><span className="text-left"><b className="block">Month collection</b><small className="text-[#9a9e98]">單月集合 · Month collection</small></span></Button><Button variant="outline" className="h-14 justify-start rounded-xl" onClick={() => onPrintCollection("term")}><CalendarDays className="mr-3 h-4 w-4 text-[#78947c]" /><span className="text-left"><b className="block">Semester collection</b><small className="text-[#9a9e98]">單學期集合 · Semester records</small></span></Button><Button variant="outline" className="h-14 justify-start rounded-xl sm:col-span-2" onClick={() => onPrintCollection("all")}><FileText className="mr-3 h-4 w-4 text-[#78947c]" /><span className="text-left"><b className="block">All leave records</b><small className="text-[#9a9e98]">全部集合 · All records</small></span></Button></CardContent></Card><Card className="border-0 bg-[#f0f5ef] shadow-none"><CardContent className="p-6"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 text-[#66836c]" /><div><p className="font-semibold text-[#46634d]">Permission boundary</p><p className="mt-2 text-sm leading-6 text-[#6d8272]">你可以查看外師完整請假紀錄；只有分派給 {school} 的 Pending 假單可操作核准或退件，其他學校資料維持唯讀。通知僅透過 LINE 推播。</p></div></div></CardContent></Card></div></>;
}
