# GitHub + Vercel + Supabase 自行架設流程

## 一、建議架構

本系統建議採用 GitHub 管理原始碼、Vercel 部署 React/Vite 前端、Supabase 提供 PostgreSQL、Auth、Storage 與 Edge Functions。Vercel 可連接 GitHub repository，預設在 branch push 與 Pull Request 建立部署與 Preview URL；合併至 production branch 後更新正式網域。[1]

目前專案原始版本含有 Express/tRPC 與 Manus OAuth。正式架構應將瀏覽器資料存取改為 `@supabase/supabase-js`，登入改為 Supabase Auth email/password，檔案改存 Supabase Storage，並把需要秘密金鑰的 LINE Messaging API push 移至 Supabase Edge Function。不要把 LINE_CHANNEL_ACCESS_TOKEN、LINE_CHANNEL_SECRET、Supabase service role key 或任何私密金鑰放在 Vercel 的 `VITE_` 變數或前端程式中。

## 二、建立 GitHub repository

先在 GitHub 建立 private repository，例如 `foreign-teacher-leave-management`。在本機執行：

```bash
git clone https://github.com/<YOUR_ACCOUNT>/foreign-teacher-leave-management.git
cd foreign-teacher-leave-management
pnpm install
pnpm check
pnpm test
git add .
git commit -m "chore: prepare Supabase and Vercel deployment"
git push -u origin main
```

建議分支規則為 `main` 對應正式環境、`develop` 對應整合環境、功能使用短期 feature branch。不要提交 `.env`、`.env.local`、Supabase access token、service role key、LINE channel token 或任何私密金鑰。

## 三、建立 Supabase project

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard/)，建立 project，選擇靠近使用者的 region。
2. 在 SQL Editor 執行專案提供的 Supabase PostgreSQL migration。
3. 在 Authentication > Providers 啟用 Email，使用 email/password；關閉不需要的 OAuth provider。
4. 在 Storage 建立 private bucket，例如 `leave-attachments`。附件下載必須由登入使用者透過 Storage policy 或 signed URL 取得。
5. 在 Authentication > URL Configuration 設定 Site URL 為 Vercel production URL，並加入 Preview URL pattern 或必要的 redirect URLs。

Supabase Auth 會發行 JWT，並可與 PostgreSQL Row Level Security（RLS）逐列授權整合。[4] 所有業務表均應啟用 RLS；不要以「前端隱藏按鈕」代替資料庫權限。

## 四、Vercel 連接 GitHub

1. 登入 [Vercel](https://vercel.com/dashboard)，選擇 New Project。
2. Import Git Repository，選取上述 GitHub repository。
3. 若目前使用 Vite，Build Command 使用 `pnpm build`，Output Directory 依目前 Vite 設定使用 `dist`。
4. 在 Settings > Environment Variables 設定以下公開變數：

| 變數 | 用途 | 可否暴露至前端 |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | 可以 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key | 可以，仍須依賴 RLS |
| `VITE_APP_TITLE` | 網站標題 | 可以 |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function 或 server-only 管理操作 | 不可以 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API push token | 僅 Edge Function secret |
| `LINE_CHANNEL_SECRET` | LINE webhook signature secret | 僅 Edge Function secret |
| `LINE_CINGSHAN_RECIPIENT_ID` | 青山國小行政群組／使用者 ID | 僅 Edge Function secret |
| `LINE_DONGYUAN_RECIPIENT_ID` | 東原國中行政群組／使用者 ID | 僅 Edge Function secret |

Vercel 與 Supabase 可透過整合自動同步部分環境變數；也可依官方流程由 Vercel import project，再在本機使用 `vercel env pull` 取得本機開發設定。[2] 前端公開 key 不是安全邊界，RLS 才是安全邊界。

## 五、Supabase Edge Function 與 LINE Messaging API

在 Supabase 專案目錄執行：

```bash
supabase init
supabase functions new send-line-notification
supabase secrets set LINE_CHANNEL_ACCESS_TOKEN=<LINE_CHANNEL_ACCESS_TOKEN> LINE_CHANNEL_SECRET=<LINE_CHANNEL_SECRET> LINE_CINGSHAN_RECIPIENT_ID=<CINGSHAN_GROUP_OR_USER_ID> LINE_DONGYUAN_RECIPIENT_ID=<DONGYUAN_GROUP_OR_USER_ID>
supabase functions deploy send-line-notification
```

Edge Functions 使用 TypeScript 與 Deno runtime，可從 Supabase CLI 建立、測試、部署及呼叫。[3] Edge Function 接收 `notification_id`，從資料庫查詢事件與 recipient，再呼叫 LINE Messaging API push endpoint。只有 Edge Function 讀取 service role key 與 LINE channel access token；瀏覽器只呼叫受 Auth 保護的 function endpoint。LINE webhook 會以 channel secret 驗證 `x-line-signature`，並接受一次性 `/bind CODE` 指令。先以 `node scripts/create-line-binding-code.mjs teacher <AUTH_USER_UUID>` 或 `node scripts/create-line-binding-code.mjs cingshan`／`dongyuan` 產生 SQL，在 Supabase SQL Editor 執行後，再從對應 LINE 帳號或群組送出 `/bind CODE`；確認 `used_at` 與 `profiles.line_user_id` 或 `line_group_id` 更新後，才測試通知推播。

## 六、部署前驗證清單

先在本機完成 `pnpm check`、`pnpm test` 與 production build。接著從 feature branch 發 Pull Request，確認 Vercel Preview 可登入、讀取 Supabase、上傳附件、建立待簽核假單與產生列印畫面。通過後合併至 `main`，再用正式帳號測試外師、青山國小與東原國中的權限邊界。

Vercel 外部部署不會自動沿用目前 Manus 內建的 project secrets、資料庫 migration 或預覽環境；這些都必須在 Supabase、Vercel 與 GitHub 各自重新設定。正式環境只應使用本 repository 的 Vite 前端、Supabase Auth/PostgreSQL/Storage 與 LINE Edge Function，不應設定或依賴 Manus OAuth、Express、tRPC、MySQL 或 SMTP。

## 十一、集合列印功能

學校行政角色的列印中心現在提供三種真正的資料集合列印：單月、單學期與全部請假紀錄。單月依請假區間與指定月份是否重疊篩選；學期依合約年度切分為 8 月 1 日至翌年 1 月 31 日的上學期，以及 2 月 1 日至 7 月 31 日的下學期；全部列印則使用目前權限範圍內的完整紀錄。每筆請假卡會在列印版面自動分頁，避免只列印第一筆資料。

## References

[1]: https://vercel.com/docs/git/vercel-for-github "Deploying GitHub Projects with Vercel"
[2]: https://supabase.com/partners/catalog/vercel "Supabase for Vercel"
[3]: https://supabase.com/docs/guides/functions/quickstart "Getting Started with Supabase Edge Functions"
[4]: https://supabase.com/docs/guides/auth "Supabase Auth"

## 八、附件預覽與即時日數估算交接說明

歷史紀錄 API 只回傳附件的 `id`、`fileName`、`mimeType` 與上傳時間，不直接暴露 Storage URL。使用者按下「查看附件 · View attachment」後，前端以受保護的 `leave.getAttachment` 查詢 application 與 attachment 的關聯，伺服器先確認外師只能查看自己的假單、兩校行政可查看完整紀錄，再使用 Storage key 產生短期 signed URL。PDF 與圖片可在頁面內預覽，其他格式顯示檔案 metadata 並提供下載；Supabase 版本應以 private bucket、Auth JWT 與 RLS／Storage policy 實作相同邊界。

請假表單的起訖日期與時間為 controlled inputs。預估扣除日數使用共同規則：青山國小為 08:00–16:00 的 8 小時，東原國中為 08:00–17:00 並扣除 12:00–13:00 午休；實際請假時間換算為 `actualLeaveHours / 8`，畫面統一顯示 `N 日 / N days`。跨日申請會以首日、末日的部分時段加上中間完整工作日估算；正式送件仍須由後端依逐日 routing、寒暑假與補休設定再次驗證，不應只信任前端估算值。

正式移轉至 Supabase 時，建議在 `leave_attachments` 儲存 `storage_path`、`file_name`、`mime_type`、`uploaded_at` 與 `application_id`，不要把檔案 bytes 寫入 PostgreSQL。預覽 Edge Function 或受保護 server route 應以 `application_id` 和 `attachment_id` 查詢並驗證權限，再呼叫 `createSignedUrl`；signed URL 應設定短期有效期限，且不要將 service role key 放入 `VITE_` 變數。

### 交接驗證案例

| 案例 | 預期結果 |
|---|---|
| 青山國小 08:00–12:00 | `0.5 日 / 0.5 days` |
| 東原國中 10:00–15:00 | 扣除午休後 `0.5 日 / 0.5 days` |
| 教師查看自己的 PDF／圖片附件 | 可取得短期 URL 並在頁面預覽 |
| 教師查看其他教師附件 | API 回傳拒絕，不產生 signed URL |
| 非圖片／PDF 附件 | 顯示 metadata，提供下載 |
| 跨日估算與正式送件 | 前端只作提示，後端重新依逐日學校規則驗證 |

## References

## 九、Repository migration artifacts

本 repository 現已提供可審閱的 `supabase/migrations/202608280001_initial_leave_management.sql`，內容包含 PostgreSQL 業務表、`profiles` Auth role helper、RLS policies、private `leave-attachments` bucket 與 Storage policies。套用前請先在 Supabase project 建立備份，確認既有資料是否需要轉換，再執行 `supabase db push`；migration 以 `auth.uid()`、`profiles.role` 與 `public.can_access_application()` 作為權限邊界，前端隱藏按鈕不是安全控制。

前端公開設定可由 `client/src/lib/supabase.ts` 讀取 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`，並以 `persistSession`、`autoRefreshToken`、`detectSessionInUrl` 管理 email/password session。缺少變數時會回傳未設定狀態，不會在 demo 預覽環境誤發出 Auth 請求。`supabase/functions/send-line-notification/index.ts` 是 LINE Messaging API Edge Function；請以 Supabase secrets 設定 `LINE_CHANNEL_ACCESS_TOKEN`、`LINE_CHANNEL_SECRET`、`LINE_CINGSHAN_RECIPIENT_ID`、`LINE_DONGYUAN_RECIPIENT_ID` 與既有 `SUPABASE_SERVICE_ROLE_KEY`，再依通知佇列的 `notification_id` 呼叫。service role key 與 LINE secrets 不得進入 `VITE_` 變數。

## 十、目前過渡邊界與切換順序

本 repository 的正式部署 path 使用 Supabase Auth、PostgreSQL、Storage 與 `send-line-notification` Edge Function；legacy Express/tRPC/Drizzle/MySQL 檔案與 dependencies 已移除，不會參與 Vite build。LINE binding 的 migration 為 `supabase/migrations/202609010001_line_recipient_bindings.sql`，管理腳本為 `scripts/create-line-binding-code.mjs`。Supabase migration、`client/src/lib/supabase.ts`、`client/src/lib/supabaseLeave.ts` 與 LINE Edge Function 提供對應 contract；部署者仍須完成資料匯入、Auth users、RLS 與 LINE secrets 設定，避免資料分裂。

正式部署時，部署者應依序套用 migration、建立三種 email/password Auth 身分並核對 `profiles.role`、匯入資料、設定 private Storage bucket 與 LINE secrets，再完成教師／兩校行政權限、通知佇列與 leave submit/decide runtime smoke test。RLS 與 Edge Function secret 是安全邊界，不是前端隱藏按鈕。

## 十一、Runtime switch 與角色消費流程

當 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY` 都存在時，App 會掛載 Supabase Auth session bridge；`useAuth()` 會把 Supabase session 映射為應用程式 identity，並停用 Manus `auth.me` query。Home 會在此模式啟用 Supabase leave query，將巢狀 `leave_days` 轉換為既有歷史／列印模型，並以 `app_metadata.role` 驅動 `teacher`、`cingshan` 或 `dongyuan` 流程。URL 的 `role` 只在 demo preview 使用，正式模式以登入 identity 為準。

本次 repository 已加入 Home component、useAuth hook、Supabase adapter、附件 signed URL、通知 payload 與 Edge Function contract tests；最新驗證為 27 個 test files、90 項測試通過。仍需由部署者在自己的 Supabase project 執行 migration、建立 Auth users、匯入資料、部署 Edge Function，並以實際 RLS／LINE credentials 執行 runtime smoke test；正式送件與簽核資料 path 也應完成端到端驗證。

### Home data-state contract

Home 的 demo `leaveRecords` 僅可在明確的 preview query（例如 `?role=teacher`）或尚未建立登入 session 的未登入預覽使用。只要使用者已 authenticated，Supabase leave adapter 的空結果都必須顯示 `No leave records yet · 目前尚無請假紀錄`，不可回退至 demo 假單；載入中與查詢錯誤則分別顯示雙語 loading／error 狀態。這項規則避免預覽資料遮蔽正式資料庫問題，也讓部署者能在 Vercel Preview 與正式環境區分測試資料與真實資料。
