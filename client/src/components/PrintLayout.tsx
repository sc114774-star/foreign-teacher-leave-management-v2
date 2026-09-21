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
  const time = value.includes("T") ? value.split("T")[1].replace(/[+-].*$/, "").slice(0, 5) : "";
  const [hour = "", minute = ""] = time.split(":");
  return { year, month, date, hour, minute };
}

function leaveDays(hours: number) {
  return `${(hours / 8).toFixed(2).replace(/\.00$/, "")} 日 / ${(hours / 8).toFixed(2).replace(/\.00$/, "")} days`;
}

function PrintTable({ record, academicYear }: { record?: PrintRecord; academicYear: string }) {
  const school = schoolCopy(record?.school ?? "青山國小");
  const year = Number(academicYear.slice(0, 4)) - 1911;
  const start = dateParts(record?.startDate ?? "");
  const end = dateParts(record?.endDate ?? "");
  const blankRows = Array.from({ length: emptyRowCount });

  return (
    <section className="mx-auto h-auto w-full overflow-hidden border-2 border-slate-800 bg-white text-[10px] text-slate-900 print:w-full print:text-[9px]">
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
          <col className="w-[6%]" /><col className="w-[15%]" /><col className="w-[12%]" /><col className="w-[25%]" /><col className="w-[6%]" /><col className="w-[6%]" /><col className="w-[6%]" /><col className="w-[6%]" /><col className="w-[6%]" /><col className="w-[6%]" /><col className="w-[6%]" />
        </colgroup>
        <thead>
          <tr className="border-b-2 border-slate-800 bg-slate-100 text-center font-semibold break-words whitespace-normal">
            <th className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">假別<br />(Type of Leave)</th>
            <th className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">請假事由說明<br />(Reason for Leave)</th>
            <th className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">公文字號及地點<br />(Official Document No. and Location)</th>
            <th className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">起訖時間<br />(Dates and Interval)</th>
            <th className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">休假累計<br />(PTO Accrual)</th>
            <th className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">事病假累計<br />(Sick/Personal Leave Accrual)</th>
            <th className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">請假人簽章<br />(Applicant’s Signature)</th>
            <th className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">職務代理人簽章<br />(Substitute’s Signature)</th>
            <th className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">教學組課務登記<br />(Approval of Section Chief of Curriculum)</th>
            <th className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">單位主管簽章<br />(Director’s Approval)</th><th className="px-1 py-2 text-center break-words whitespace-normal">校長核示簽章<br />(Principal’s Approval)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="h-[75px] border-b border-slate-800 align-top break-words whitespace-pre-wrap">
            <td className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">{record ? `${record.typeZh} (${record.type})` : ""}</td>
            <td className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">{record?.reason ?? ""}</td>
            <td className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">{record ? `${record.officialDocument} · ${record.location}` : ""}</td>
            <td className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">
              <div className="grid grid-cols-6 gap-0 text-center"><span>年<br />(Year)<br />{start.year}{record && end.year !== start.year ? `~${end.year}` : ""}</span><span>月<br />(Month)<br />{start.month}{record && end.month !== start.month ? `~${end.month}` : ""}</span><span>日<br />(Date)<br />{start.date}{record && end.date !== start.date ? `~${end.date}` : ""}</span><span>時<br />(Hour)<br />{start.hour || "—"}{record && end.hour && end.hour !== start.hour ? `~${end.hour}` : ""}</span><span>分<br />(Minute)<br />{start.minute || "—"}{record && end.minute && end.minute !== start.minute ? `~${end.minute}` : ""}</span><span>小計<br />(Total)<br />{record ? leaveDays(record.hours) : ""}</span></div>
            </td>
            <td className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">{record?.type === "PTO" ? leaveDays(record.hours) : ""}</td>
            <td className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal">{record?.type !== "PTO" ? leaveDays(record?.hours ?? 0) : ""}</td>
            <td className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal" />
            <td className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal" />
            <td className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal" />
            <td className="border-r border-slate-800 px-1 py-2 text-center break-words whitespace-normal" />
            <td className="px-1 py-2 text-center break-words whitespace-normal" />
          </tr>
          {blankRows.map((_, index) => <tr key={index} className="h-[24px] border-b border-slate-800 break-words whitespace-normal last:border-b-0">{Array.from({ length: 11 }).map((__, cell) => <td key={cell} className={`px-1 py-2 text-center break-words whitespace-normal ${cell < 10 ? "border-r border-slate-800" : ""}`} />)}</tr>)}
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
        <div className="hidden print:block print:w-full print:bg-white">{pages.map((record, index) => <div key={record?.id ?? `empty-${index}`} className="print-card" style={{ pageBreakAfter: index === pages.length - 1 ? "auto" : "always" }}><PrintTable record={record} academicYear={academicYear} /></div>)}</div>
        <div className="print:hidden">{pages.map((record, index) => <div key={`preview-${record?.id ?? index}`} className="mb-6"><PrintTable record={record} academicYear={academicYear} /></div>)}</div>
      </div>
    </div>
  );
}
