import fs from "node:fs";
const path = "/home/ubuntu/foreign-teacher-leave-management/client/src/pages/Home.tsx";
const source = fs.readFileSync(path, "utf8");
const replacement = String.raw`function LeaveCardPrint({ record, onClose }: { record: LeaveRecord; onClose: () => void }) {
  const leaveDays = formatLeaveDays(record.hours);
  const isPto = record.type === "PTO";
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f4f0e8] p-4 sm:p-8 print:static print:overflow-visible print:bg-white print:p-0">
    <div className="mx-auto max-w-[900px] bg-white p-8 text-[#1f2a26] shadow-xl print:max-w-none print:p-0 print:shadow-none">
      <div className="mb-6 flex items-start justify-between print:hidden"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a948c]">Print preview</p><h2 className="mt-1 text-2xl font-semibold">請假卡 · Leave Application Form</h2></div><Button variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" />Close</Button></div>
      <div className="border-2 border-[#33443a]">
        <div className="border-b-2 border-[#33443a] p-5 text-center"><p className="text-lg font-bold tracking-[0.22em]">臺南市青山國民小學　114 學年度　請假卡</p><p className="mt-1 text-sm font-medium tracking-[0.1em]">Tainan Municipal Cingshan Elementary School　114 Academic Year　Leave Application Form</p><p className="mt-2 text-[10px] text-[#6e776f]">113.08.15 修訂 · Bilingual Official Leave Record</p></div>
        <div className="grid grid-cols-2 border-b border-[#33443a] text-sm"><div className="border-r border-[#33443a] p-3"><span className="font-semibold">姓名 Name：</span> Lavinia Cruz</div><div className="p-3"><span className="font-semibold">單位 Department：</span> Academic Affairs</div><div className="border-r border-t border-[#33443a] p-3"><span className="font-semibold">職別 Job Title：</span> Foreign Nationality English Teacher</div><div className="border-t border-[#33443a] p-3"><span className="font-semibold">假單編號 Leave No.：</span> {record.id}</div></div>
        <div className="grid grid-cols-[180px_1fr] text-sm"><div className="border-b border-r border-[#33443a] p-4 font-bold">假別<br /><span className="font-normal">Type of Leave</span></div><div className="border-b border-[#33443a] p-4">{record.typeZh} · {record.type}</div><div className="border-b border-r border-[#33443a] p-4 font-bold">請假事由說明<br /><span className="font-normal">Reason for Leave</span></div><div className="border-b border-[#33443a] p-4">{record.reason}</div><div className="border-b border-r border-[#33443a] p-4 font-bold">公文字號及地點<br /><span className="font-normal">Official Document No. and Location</span></div><div className="border-b border-[#33443a] p-4">—</div><div className="border-b border-r border-[#33443a] p-4 font-bold">起訖時間<br /><span className="font-normal">Dates and Interval</span></div><div className="border-b border-[#33443a] p-4">{record.dates}　·　休假日數 Leave days：{leaveDays}</div><div className="border-r border-[#33443a] p-4 font-bold">休假累計<br /><span className="font-normal">PTO Accrual</span></div><div className="p-4">本次 {isPto ? leaveDays : "0 日"}　／　年度已使用 {isPto ? "3 日" : "0 日"}</div><div className="border-t border-r border-[#33443a] p-4 font-bold">事病假累計<br /><span className="font-normal">Sick/Personal Leave Accrual</span></div><div className="border-t border-[#33443a] p-4">本次 {isPto ? "0 日" : leaveDays}　／　年度已使用 {isPto ? "0 日" : "1.5 日"}</div></div>
        <div className="grid grid-cols-2 border-t-2 border-[#33443a] text-sm"><div className="min-h-[112px] border-b border-r border-[#33443a] p-4">請假人簽章<br /><span className="text-xs">Applicant’s Signature</span></div><div className="min-h-[112px] border-b border-[#33443a] p-4">教學組課務登記<br /><span className="text-xs">Approval of Section Chief of Curriculum</span></div><div className="min-h-[112px] border-b border-r border-[#33443a] p-4">單位主管簽章<br /><span className="text-xs">Director's Approval</span></div><div className="min-h-[112px] border-b border-[#33443a] p-4">校長核示簽章<br /><span className="text-xs">Principal's Approval</span></div></div>
      </div>
      <div className="mt-5 text-center text-xs text-[#788279] print:hidden">列印時將自動隱藏網站導覽列、操作按鈕與預覽工具。</div>
    </div>
  </div>;
}

export default function Home`;
const next = source.replace(/function LeaveCardPrint[\s\S]*?\n}\n\nexport default function Home/, replacement);
if (next === source) throw new Error("LeaveCardPrint block not found");
fs.writeFileSync(path, next);
