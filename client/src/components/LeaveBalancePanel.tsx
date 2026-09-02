import React from "react";
import { AlertTriangle, CheckCircle2, Infinity, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calculateLeaveBalance, formatLeaveDays, type BalanceRecord } from "@shared/leaveBalanceRules";

type Props = { records: BalanceRecord[]; academicYear: string; ptoTotal: number; className?: string };

const unlimitedItems = [
  { key: "sickUsed", label: "病假 · Sick Leave", tone: "text-[#a15d4d]" },
  { key: "personalUsed", label: "事假 · Personal Leave", tone: "text-[#6b7ea7]" },
  { key: "officialUsed", label: "公假 · Official Leave", tone: "text-[#9a7a3d]" },
] as const;

export default function LeaveBalancePanel({ records, academicYear, ptoTotal, className }: Props) {
  const summary = calculateLeaveBalance(records, academicYear, ptoTotal);
  return <Card className={cn("border-0 bg-white/90 shadow-[0_18px_45px_rgba(81,73,58,0.08)]", className)}>
    <CardHeader className="border-b border-[#eeeae1] pb-4"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#91a094]">Leave Balance</p><CardTitle className="mt-2 text-xl">假別額度</CardTitle><p className="mt-1 text-sm text-[#92978f]">{academicYear} 年度累計 · Applied leave by academic year</p></div><div className="rounded-2xl bg-[#edf5eb] p-3 text-[#5f7d65]"><ShieldCheck className="h-5 w-5" /></div></div></CardHeader>
    <CardContent className="space-y-5 p-6">
      <div className="rounded-2xl border border-[#d6e4d3] bg-[#f4faf2] p-4"><div className="mb-3 flex items-center justify-between gap-4"><div><p className="font-semibold text-[#46634d]">特休 · PTO</p><p className="mt-1 text-xs text-[#7c907e]">依外師年資由管理端設定 · Annual limit</p></div><span className="text-sm font-semibold text-[#46634d]">已申請: {formatLeaveDays(summary.ptoUsed)} 日 / 剩餘: {formatLeaveDays(summary.ptoRemaining)} 日<br /><span className="text-xs font-normal text-[#718076]">Applied: {formatLeaveDays(summary.ptoUsed)} / Remaining: {formatLeaveDays(summary.ptoRemaining)}</span></span></div><div className="h-2 overflow-hidden rounded-full bg-[#dfeadd]"><div className="h-full rounded-full bg-[#6f9a78] transition-all" style={{ width: `${summary.ptoTotal > 0 ? Math.min(100, summary.ptoUsed / summary.ptoTotal * 100) : 0}%` }} /></div><p className="mt-2 text-right text-xs text-[#87988a]">年度上限 · Annual total: {formatLeaveDays(summary.ptoTotal)} 日</p></div>
      <div className="grid gap-3 sm:grid-cols-3">{unlimitedItems.map((item) => <div key={item.key} className="rounded-2xl border border-[#eeeae1] bg-[#fcfbf8] p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#55635a]">{item.label}</p><Infinity className={cn("h-4 w-4", item.tone)} /></div><p className="mt-4 text-sm font-medium text-[#405049]">已申請: {formatLeaveDays(summary[item.key])} 日</p><p className="mt-1 text-xs text-[#8a938b]">Applied: {formatLeaveDays(summary[item.key])}</p></div>)}</div>
      {summary.salaryWarnings.length > 0 ? <div className="space-y-2 rounded-2xl border border-[#edc1b8] bg-[#fff3f0] p-4 text-sm font-semibold text-[#a55045]"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />扣薪提醒 · Salary deduction warning</div>{summary.salaryWarnings.map((warning) => <p key={warning} className="pl-6 text-xs font-medium">{warning}</p>)}</div> : <div className="flex items-center gap-2 rounded-2xl bg-[#f6f8f3] p-4 text-xs text-[#75877a]"><CheckCircle2 className="h-4 w-4 text-[#6f9a78]" />目前未達扣薪提醒門檻 · No salary deduction warning</div>}
    </CardContent>
  </Card>;
}
