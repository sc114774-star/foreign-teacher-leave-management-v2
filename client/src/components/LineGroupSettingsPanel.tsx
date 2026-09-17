import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SupabaseLineGroupSetting } from "@/lib/supabaseLeave";

type School = "青山國小" | "東原國中";

export default function LineGroupSettingsPanel({ role, settings, onSave, onAction }: { role: "cingshan" | "dongyuan" | "admin"; settings: SupabaseLineGroupSetting[]; onSave: (school: School, groupId: string) => Promise<void>; onAction: (message: string) => void }) {
  const canEdit = role === "admin" || role === "cingshan" || role === "dongyuan";
  const editableSchools = useMemo<School[]>(() => role === "admin" ? ["青山國小", "東原國中"] : role === "cingshan" ? ["青山國小"] : ["東原國中"], [role]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const valueFor = (school: School) => drafts[school] ?? settings.find((item) => item.school === school)?.group_id ?? "";

  return <Card className="border-0 bg-white/90 shadow-[0_12px_35px_rgba(81,73,58,0.07)]">
    <CardHeader><CardTitle>LINE 行政群組通知 · LINE Group Push</CardTitle><p className="text-sm text-[#92978f]">請假送出後只推播至對應學校行政群組；核准與退件只更新網站狀態。</p></CardHeader>
    <CardContent className="space-y-5">
      <div className="rounded-xl border border-[#dce7d8] bg-[#f2f8f1] p-4 text-sm text-[#4d6c53]">LINE Channel Access Token 不會在瀏覽器或資料庫保存。請在 Supabase Edge Function secrets 設定 <code className="rounded bg-white px-1.5 py-0.5 text-xs">LINE_CHANNEL_ACCESS_TOKEN</code>。</div>
      {(["青山國小", "東原國中"] as School[]).map((school) => <label key={school} className="block space-y-2 text-sm font-medium text-[#58655d]"><span>{school} 行政群組 ID · Group ID</span><Input value={valueFor(school)} disabled={!canEdit || !editableSchools.includes(school)} placeholder="Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" onChange={(event) => setDrafts((current) => ({ ...current, [school]: event.target.value }))} className="h-11 bg-white" /><span className="block text-xs font-normal text-[#92978f]">{editableSchools.includes(school) ? "可管理此學校的群組通知對象。" : "唯讀：只有該校管理端或管理員可修改。"}</span>{editableSchools.includes(school) && <Button type="button" size="sm" className="rounded-lg bg-[#304b3b] hover:bg-[#41644f]" disabled={!valueFor(school).trim()} onClick={async () => { try { await onSave(school, valueFor(school).trim()); onAction(`${school} LINE 群組 ID 已儲存`); } catch (error) { onAction(error instanceof Error ? error.message : "LINE 群組設定儲存失敗"); } }}>儲存群組 ID · Save</Button>}</label>)}
    </CardContent>
  </Card>;
}
