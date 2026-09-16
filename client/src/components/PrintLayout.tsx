import React from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PrintRecord = {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  typeZh: string;
  dates: string;
  hours: number;
  school: string;
  reason: string;
  applicant: string;
  department: string;
  jobTitle: string;
  officialDocument: string;
  location: string;
  ptoUsedDays: number;
  sickPersonalUsedDays: number;
};

type PrintLayoutProps = {
  records: PrintRecord[];
  academicYear: string;
  title?: string;
  onClose: () => void;
};

const emptyRowCount = 12;

function schoolCopy(school: string) {
  return school.includes("東原")
    ? {
        zh: "臺 南 市 東 原 國 民 中 學",
        en: "Tainan Municipal Dongyuan Junior High School",
      }
    : {
        zh: "臺 南 市 青 山 國 民 小 學",
        en: "Tainan Municipal Cingshan Elementary School",
      };
}

function dateParts(value: string) {
  const normalized = value.replace(/\//g, "-").split("T")[0];
  const [year = "", month = "", date = ""] = normalized.split("-");
  return { year, month, date };
}

function leaveDays(hours: number) {
  return `${(hours / 8).toFixed(2).replace(/\.00$/, "")} 日 / ${(hours / 8).toFixed(2).replace(/\.00$/, "")} days`;
}

function PrintTable({ record, academicYear }: { record?: PrintRecord; academicYear: string }) {
  const school = schoolCopy(record?.school ?? "青山國小");
  const year = Number(academicYear.slice(0, 4)) - 1911;
  const start = dateParts(record?.startDate ?? "");
  const end = dateParts(record?.endDate ?? "");
  const interval = record
    ? `${start.year}/${start.month}/${start.date}–${end.year}/${end.month}/${end.date}`
    : "";
  const blankRows = Array.from({ length: emptyRowCount });

  return (
    <section className="print-card break-after-page mx-auto h-auto w-full overflow-hidden border-2 border-slate-800 bg-white text-[10px] text-slate-900 print:break-after-page print:w-full print:text-[9px]">
      <header className="border-b-2 border-slate-800 px-3 py-2 text-center font-semibold break-words whitespace-pre-wrap">
        <div className="text-[15px] tracking-[0.28em] print:text-[12px]">{school.zh} {year} 學 年 度 請 假 卡</div>
        <div className="mt-1 text-[10px] tracking-wide print:text-[8px]">{school.en} {year} Academic Year Leave Application Form</div>
      </header>

      <div className="grid grid-cols-3 border-b-2 border-slate-800 font-semibold break-words whitespace-pre-wrap">
        <div className="border-r border-slate-800 px-2 py-2">姓名 (Name)：<span className="font-normal">{record?.applicant ?? ""}</span></div>
        <div className="border-r border-slate-800 px-2 py-2">單位 (Department)：<span className="font-normal">{record?.department || "教務處 (Academic Affairs)"}</span></div>
        <div className="px-2 py-2">職別 (Job Title)：<span className="font-normal">{record?.jobTitle || "外籍教師 (Foreign Nationality English Teacher)"}</span></div>
      </div>

      <table className="w-full table-fixed border-collapse break-words whitespace-normal print:text-[9px]">
        <colgroup>
          <col className="w-[8%]" /><col className="w-[13%]" /><col className="w-[13%]" /><col className="w-[22%]" /><col className="w-[8%]" /><col className="w-[9%]" /><col className="w-[6%]" /><col className="w-[7%]" /><col className="w-[7%]" /><col className="w-[3.5%]" /><col className="w-[3.5%]" />
        </colgroup>
        <thead>
          <tr className="border-b-2 border-slate-800 bg-slate-100 text-center font-semibold break-words whitespace-normal">
            <th className="border-r border-slate-800 p-1">假別<br />(Type of Leave)</th>
            <th className="border-r border-slate-800 p-1">請假事由說明<br />(Reason for Leave)</th>
            <th className="border-r border-slate-800 p-1">公文字號及地點<br />(Official Document No. and Location)</th>
            <th className="border-r border-slate-800 p-1">起訖時間<br />(Dates and Interval)</th>
            <th className="border-r border-slate-800 p-1">休假累計<br />(PTO Accrual)</th>
            <th className="border-r border-slate-800 p-1">事病假累計<br />(Sick/Personal Leave Accrual)</th>
            <th className="border-r border-slate-800 p-1">請假人簽章<br />(Applicant’s Signature)</th>
            <th className="border-r border-slate-800 p-1">職務代理人簽章<br />(Substitute’s Signature)</th>
            <th className="border-r border-slate-800 p-1">教學組課務登記<br />(Approval of Section Chief of Curriculum)</th>
            <th className="border-r border-slate-800 p-1">單位主管簽章<br />(Director’s Approval)</th><th className="p-1">校長核示簽章<br />(Principal’s Approval)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="h-[75px] border-b border-slate-800 align-top break-words whitespace-pre-wrap">
            <td className="border-r border-slate-800 p-1">{record ? `${record.typeZh} (${record.type})` : ""}</td>
            <td className="border-r border-slate-800 p-1">{record?.reason ?? ""}</td>
            <td className="border-r border-slate-800 p-1">{record ? `${record.officialDocument} · ${record.location}` : ""}</td>
            <td className="border-r border-slate-800 p-1">
              <div className="grid grid-cols-6 gap-0 text-center"><span>年<br />(Year)<br />{start.year}</span><span>月<br />(Month)<br />{start.month}</span><span>日<br />(Date)<br />{start.date}</span><span>時<br />(Hour)<br />—</span><span>分<br />(Minute)<br />—</span><span>小計<br />(Total)<br />{record ? leaveDays(record.hours) : ""}</span></div>
              <div className="mt-2 text-center break-words">{interval}</div>
            </td>
            <td className="border-r border-slate-800 p-1">{record?.type === "PTO" ? leaveDays(record.hours) : ""}<br />年度已用<br />{record?.ptoUsedDays ?? ""}</td>
            <td className="border-r border-slate-800 p-1">{record?.type !== "PTO" ? leaveDays(record?.hours ?? 0) : ""}<br />年度已用<br />{record?.sickPersonalUsedDays ?? ""}</td>
            <td className="border-r border-slate-800 p-1" />
            <td className="border-r border-slate-800 p-1" />
            <td className="border-r border-slate-800 p-1" />
            <td className="border-r border-slate-800 p-1" />
            <td className="p-1" />
          </tr>
          {blankRows.map((_, index) => <tr key={index} className="h-[24px] border-b border-slate-800 break-words whitespace-normal last:border-b-0">{Array.from({ length: 11 }).map((__, cell) => <td key={cell} className={cell < 10 ? "border-r border-slate-800" : ""} />)}</tr>)}
        </tbody>
      </table>
    </section>
  );
}

export default function PrintLayout({ records, academicYear, title, onClose }: PrintLayoutProps) {
  const pages = records.length ? records : [undefined];
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-100 p-4 print:static print:block print:overflow-visible print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-[1400px] print:w-full print:max-w-none">
        <div className="mb-4 flex items-center justify-between rounded-xl bg-white p-3 shadow print:hidden">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">PrintLayout · 橫式假卡</p><h2 className="text-lg font-semibold break-words whitespace-pre-wrap">{title ?? "請假卡 · Leave Application Form"}</h2><p className="text-xs text-slate-500">共 {records.length} 筆；每張假卡獨立分頁。</p></div>
          <div className="flex gap-2"><Button variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />關閉</Button><Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />列印</Button></div>
        </div>
        <div className="hidden print:block print:w-full print:bg-white">{pages.map((record, index) => <PrintTable key={record?.id ?? `empty-${index}`} record={record} academicYear={academicYear} />)}</div>
        <div className="print:hidden">{pages.map((record, index) => <PrintTable key={`preview-${record?.id ?? index}`} record={record} academicYear={academicYear} />)}</div>
      </div>
    </div>
  );
}
