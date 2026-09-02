# Verification notes

- 青山國小行政角色的「寒暑假設定 Settings」頁已顯示合約開始／結束、暑假開始／結束、寒假開始／結束欄位；青山可編輯並儲存。
- 外師請假表單的假別選單已包含 `Make-up Leave · 補假／補休`。
- 切換補假後會顯示「實際補休日期」與「補休學校」，並在自動分派區顯示指定學校優先於星期規則。
- 行政端列印預覽已包含雙語假別、事由、公文字號及地點、起訖時間、休假日數、PTO 累計、事病假累計，以及請假人、教學組課務、單位主管、校長四個簽章留白區。
- `print:hidden` 已套用至側邊導覽與主要網頁 UI；列印預覽提供 `Print · 列印` 按鈕呼叫 `window.print()`。
- `pnpm check` 與完整 Vitest 測試通過：6 個測試檔、18 個測試案例。

## Latest UI verification

青山國小主聘校設定頁目前同時顯示合約期間、寒暑假日期區間，以及補休日期、負責學校和補休事由欄位；畫面中的範例補休日期為 2025-06-12，負責學校為東原國中，事由為運動會補休。

## Multi-day management verification

重新載入青山國小行政端設定頁後，頁面顯示「已登錄補休日 · Registered make-up days」、日期筆數、補休日資料，以及 Edit／Delete 操作；目前預設資料為 2025/06/12、東原國中、運動會補休。

## Make-up application verification

外師端新增申請視窗已顯示 Make-up Leave · 補假／補休選項，休假日數改為 0.5 步進的 Leave days 欄位，並保留起訖日期與時間欄位。

## Teacher history filter and bilingual day labels

- Desktop preview shows the available balance and contract metrics as `14 日 / 14 days` and `284 日 / 284 days`.
- Mobile preview at 390px keeps the bilingual metrics readable without clipping; dashboard cards stack vertically.
- The history card includes leave-type and approval-status selectors, a Clear action, result count, and an empty-state message. Interactive selection behavior is covered by `shared/historyFilters.test.ts`.

## History filtering and bilingual day-format verification

桌面完整頁面已確認歷史紀錄區出現「假別 · Leave type」與「審核狀態 · Approval status」兩個篩選器、Clear · 清除按鈕、結果筆數及空結果提示；各筆紀錄與額度統計均顯示雙語日數，例如 `0.5 日 / 0.5 days`、`2 日 / 2 days`。

390px 手機完整頁面已確認儀表板卡片直向排列，`14 日 / 14 days`、`284 日 / 284 days` 與額度條列可讀，歷史篩選器堆疊排列且不超出畫面；歷史表格維持水平可瀏覽。

## Attachment and live-estimate verification

桌面 1280×900 已以 `/?role=teacher&previewAttachment=1` 開啟附件 modal，確認檔名 `研習公文.pdf`、MIME metadata、預覽區與下載按鈕狀態；另以 `/?role=teacher&previewAttachment=download` 驗證 `研習補充資料.zip` 的不可直接預覽／download-only 版面。390×844 手機 viewport 亦已開啟附件 modal，確認 modal 寬度、檔名、關閉按鈕與底部操作列可讀。

請假表單已以 `/?role=teacher&previewForm=1` 在 1280×900 與 390×844 開啟，確認 controlled date/time inputs、`2 日 / 2 days` 預估扣除日數、青山作息說明、自動分派提示與附件入口均可見；跨午休與跨日數學案例由 `shared/attendanceRules.liveEstimate.test.ts` 覆蓋。Supabase adapter contract tests 已驗證本人可看、他人教師拒絕、兩校行政可看、附件關聯不匹配拒絕與 signed URL 呼叫。

## Supabase-only and LINE verification

Repository 已移除 Express、tRPC、Drizzle、MySQL、Nodemailer 與 SMTP runtime path；`package.json` 目前使用 Vite dev/build，`vercel.json` 仍負責 `pnpm build`、`dist/public` 與 SPA rewrite。`supabase/functions/send-line-notification/index.ts` contract tests 驗證 LINE channel access token、recipient routing、signature helper 與錯誤回應；真正的 Supabase migration、Edge Function deploy、RLS 與 LINE push smoke test 仍需由部署者在自己的帳號執行。
