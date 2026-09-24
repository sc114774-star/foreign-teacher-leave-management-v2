import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SupabaseTeacherContract, SupabaseTeacherProfile } from "@/lib/supabaseLeave";

export default function ContractSettingsPanel({
  teachers,
  contracts,
  canEdit,
  onSave,
  onAction,
}: {
  teachers: SupabaseTeacherProfile[];
  contracts: SupabaseTeacherContract[];
  canEdit: boolean;
  onSave: (teacherId: string, contractStart: string, contractEnd: string) => Promise<void>;
  onAction: (message: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, { start: string; end: string }>>({});
  const valueFor = (teacherId: string) => {
    const existing = contracts.find((contract) => contract.teacher_id === teacherId);
    return drafts[teacherId] ?? { start: existing?.contract_start ?? "", end: existing?.contract_end ?? "" };
  };
  return (
    <Card className="border-0 bg-white/90 shadow-[0_18px_45px_rgba(81,73,58,0.08)]">
      <CardHeader>
        <CardTitle className="text-lg">合約期間設定 · Contract period per teacher</CardTitle>
        <p className="text-sm text-[#92978f]">為每位外師個別設定本次合約的起訖日期，只保留目前這一份合約。</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {teachers.length === 0 ? (
          <p className="rounded-xl bg-[#faf9f5] p-4 text-sm text-[#92978f]">目前尚未找到外師帳號 · No teacher profiles found.</p>
        ) : (
          teachers.map((teacher) => {
            const value = valueFor(teacher.user_id);
            return (
              <div key={teacher.user_id} className="flex flex-col gap-3 rounded-2xl border border-[#eeeae1] bg-[#fcfbf8] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-[#405049]">{teacher.name || teacher.email || teacher.user_id}</p>
                  <p className="mt-1 text-xs text-[#92978f]">{teacher.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    aria-label={`${teacher.email ?? teacher.user_id} contract start`}
                    type="date"
                    disabled={!canEdit}
                    value={value.start}
                    onChange={(event) => setDrafts((current) => ({ ...current, [teacher.user_id]: { start: event.target.value, end: value.end } }))}
                    className="h-10 w-40 bg-white"
                  />
                  <span className="text-sm text-[#718076]">—</span>
                  <Input
                    aria-label={`${teacher.email ?? teacher.user_id} contract end`}
                    type="date"
                    disabled={!canEdit}
                    value={value.end}
                    onChange={(event) => setDrafts((current) => ({ ...current, [teacher.user_id]: { start: value.start, end: event.target.value } }))}
                    className="h-10 w-40 bg-white"
                  />
                  {canEdit && (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl bg-[#304b3b] hover:bg-[#41644f]"
                      onClick={async () => {
                        if (!value.start || !value.end) {
                          onAction("請輸入完整的合約起訖日期 · Enter both contract dates");
                          return;
                        }
                        if (value.end <= value.start) {
                          onAction("結束日期必須晚於開始日期 · End date must be after start date");
                          return;
                        }
                        try {
                          await onSave(teacher.user_id, value.start, value.end);
                          onAction("合約期間已儲存 · Contract period saved");
                        } catch (error) {
                          onAction(error instanceof Error ? error.message : "Unable to save contract period");
                        }
                      }}
                    >
                      儲存
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
