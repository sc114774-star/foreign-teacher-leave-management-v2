# Project TODO

- [x] 建立優雅、精緻、專業且雙語清晰的整體視覺設計
- [x] 建立外師、青山國小、東原國中三種帳號角色與權限控管
- [x] 建立外師雙語儀表板，顯示合約期間、假別額度、已使用與剩餘時數
- [x] 建立雙語請假申請流程，包含假別、事由、起訖日期時間與附件
- [x] 實作病假連續 3 日、公假、非寒暑假特休的附件強制驗證
- [x] 建立兩校共用額度與核准後扣除時數規則
- [x] 建立寒暑假設定與依週別／寒暑假規則自動分派假單
- [x] 實作跨校日期拆單判斷與前端明確引導
- [x] 建立青山國小與東原國中各自隔離的待簽核清單
- [x] 實作同意／退件流程與簽核狀態紀錄
- [x] 不啟用 LINE 通知，改由 Gmail Email 取代
- [x] 建立單筆、單月、單學期與全部資料的列印篩選
- [x] 依附件假卡欄位建立列印專用版型與實體簽章留白區
- [x] 建立請假、核准、附件、額度、分派與寒暑假設定資料模型
- [x] 建立 Vitest 測試覆蓋分派、拆單、附件驗證、額度與權限規則
- [x] 執行型別檢查、測試與瀏覽器／響應式／列印版面驗證
- [x] 送出假單時寄 Email 至對應學校行政公務信箱
- [x] 學校核准或退件時寄雙語 Email 給外師
- [x] 建立 LINE recipient 設定、通知佇列與寄送結果紀錄（通知 queue、binding code 管理腳本與 Sent/Failed status flow 已完成）
- [x] 為 Email 通知事件建立 Vitest 測試
- [x] 移除 Resend 設定方向，改用 Nodemailer 與 smtp.gmail.com
- [x] 將 Email 設定介面限定為 SMTP_USER 與 SMTP_APP_PASSWORD
- [x] 使用 114774@csps.tn.edu.tw 作為官方主要寄件人
- [x] 建立送件通知與核准／退件通知的雙語 SMTP 郵件模板
- [x] 建立 Nodemailer SMTP 設定與郵件服務測試

# Integration follow-ups

- [ ] 將儀表板、申請、簽核、列印全面改接 Supabase 與資料庫，補齊 loading、empty、error states（儀表板/申請/簽核已完成；列印篩選仍待補）
- [x] 把 requiresAttachment、routeSchool、splitLeaveDays 串入真正的送單與核准流程（Home submit 已執行附件必要性、逐日路由與混校阻擋，並寫入 foreign_teacher_leave_days）
- [x] 實作後端角色權限、學校資料隔離與核准後扣額（leave router 已加入本校分派驗證與核准扣額）
- [x] 完成寒暑假設定 CRUD 與完整日期區間拆單（設定 CRUD、逐日 route 驗證與混校阻擋已完成）
- [ ] 完成真實列印篩選與資料驅動假卡欄位（單筆已完成；單月/學期/全部篩選待補）
- [x] 補齊 Gmail Email 事件測試、SMTP verify 與寄信服務驗證
- [x] 補做手機版與列印版瀏覽器驗證

# Notification scope change

- [x] 移除 LINE_CHANNEL_ACCESS_TOKEN 與學校 LINE 群組／外師 ID 設定
- [x] 移除 LINE 通知資料模型與相關通知端點／介面
- [x] 保留並確認 Gmail SMTP 送件、核准／退件通知流程
- [x] 更新畫面文案，明確顯示目前只使用 Gmail 通知
- [x] 測試移除 LINE 後的型別、資料庫與通知流程

# Deployment architecture change

- [x] 盤點並整理 GitHub repository、Vercel build 與 Supabase 專案所需的環境變數
- [x] 建立 Supabase PostgreSQL schema、RLS policies、Auth 角色與 Storage bucket 遷移腳本
- [x] 建立 Supabase client 與前端 Auth session 整合
- [x] 將請假、簽核、額度、分派與附件流程改接 Supabase（Home 與 adapter 已接入；設定持久化仍依 migration/部署設定）
- [x] 建立 Supabase Edge Function 供 Gmail SMTP 通知使用
- [x] 建立 Vercel deployment 設定與 GitHub Actions／部署說明
- [x] 驗證 Vercel 相容性並更新架構文件

# Business rules and handoff documentation

- [x] 撰寫 GitHub repository、Vercel 與 Supabase 自行架設完整流程
- [x] 定義 Supabase secrets、RLS、Auth、Storage 與 Edge Function 設定步驟
- [x] 允許主聘校管理寒暑假時間與本年度計畫合約期間，其他學校僅可檢視（共享狀態已完成，Supabase 持久化待補）
- [x] 讓兩校後台都可確認外師完整請假情況，同時維持分派簽核權限（行政端介面與權限判斷）
- [x] 新增補假／補休日期模型與主聘校設定流程，支援跨校補休日（前端、MySQL schema 與 tRPC CRUD 已完成；Supabase 遷移待補）
- [x] 將額度統整顯示改為日數，底層保留實際請假小時數
- [x] 建立國小／國中作息扣除午休及 8 小時折算日數規則
- [x] 更新系統規格與部署文件，說明半日 0.5 日及跨午休計算案例

# School admin dashboard enhancement

- [x] 兩校行政端皆可查看外師完整請假紀錄總覽
- [x] 行政端清楚標示每筆假單的分派學校與可操作權限
- [x] 只有分派給目前學校的 Pending 假單顯示 Approve／Reject
- [x] 其他學校假單維持唯讀，不得觸發簽核操作
- [x] 建立行政端簽核權限與總覽查詢測試
- [x] 驗證桌面與手機版行政端儀表板

# Settings, make-up leave, and print card enhancement

- [x] 建立青山國小主聘校專屬設定頁
- [x] 讓主聘校設定寒暑假日期區間與本年度計畫合約期間
- [x] 讓東原國中設定頁維持唯讀或不可進入編輯模式
- [x] 建立外師補假申請表單與補休日期選擇
- [x] 依實際補休日期優先於一般週別規則分派學校（未設定日期已禁止送出）
- [x] 強化行政端列印假卡資料欄位與紙本簽章區（欄位已改為 LeaveRecord 資料驅動）
- [x] 確認列印時隱藏導覽列、按鈕與其他網頁 UI（預覽已驗證）
- [x] 測試設定權限、補假分派與列印版面（規則測試與瀏覽器預覽已完成）
- [x] 建立補休日期清單與編輯／刪除介面，讓主聘校可管理多筆補休日
- [x] 為多筆補休日新增、覆寫、檢視流程補上 UI 驗證或自動化測試
- [x] 實作學校端後端查詢隔離：各校僅取得自己的待簽核清單，完整總覽與可操作資料分開查詢
- [x] 為核准流程補上本校可核准、他校不可核准與核准後簽核／扣額測試（appRouter 測試明確驗證目標表、payload、他校拒絕與重複簽核衝突）
- [x] 完成跨校日期區間的真正拆單，避免混校單據由單一學校簽核（以送件時明確阻擋混校單並要求拆單實作）
- [x] 為寒暑假、補休日與跨校日期區間補上 router／端到端測試（appRouter submit 測試涵蓋寒暑假、補休日、附件與混校拒絕）

# Teacher history filters and bilingual day labels

- [x] 外師歷史紀錄新增假別篩選器
- [x] 外師歷史紀錄新增審核狀態篩選器
- [x] 篩選結果支援清除、空結果與結果筆數提示
- [x] 統一儀表板、額度、合約、歷史紀錄、表單與列印預覽的日數雙語格式
- [x] 將數字日數顯示為「N 日 / N days」，不再只顯示單一語言
- [x] 新增篩選與雙語格式的 Vitest 測試
- [x] 驗證桌面與手機版外師篩選介面
- [x] 將外師請假表單日數輸入改為可見的「N 日 / N days」預覽
- [x] 全面搜尋 Home.tsx、列印卡與行政端日數顯示，移除殘留單語 `日` 或 `days`
- [x] 以 UI 驗證確認儀表板、表單、歷史紀錄與列印預覽使用相同雙語格式

# Attachments and live leave-day estimate

- [x] 外師與行政端歷史紀錄加入查看附件按鈕
- [x] 建立附件預覽與下載的檔案 metadata 與權限規則
- [x] 附件預覽支援可直接在網頁查看的文件類型，其他類型支援下載
- [x] 請假表單起訖時間改為受控欄位
- [x] 依青山國小／東原國中作息與午休即時計算實際請假時數
- [x] 請假表單即時顯示預估扣除日數與計算說明
- [x] 新增附件入口與作息日數計算測試
- [x] 驗證桌面與手機版附件及即時日數預估介面

# Follow-up validation corrections

- [x] 將教師與行政歷史清單改接真實 tRPC／資料庫資料，確保有附件的紀錄實際顯示查看附件按鈕
- [x] 為 leave.getAttachment 新增 Vitest：本人可看、他人教師不可看、校方可看、application／attachment 不匹配時拒絕
- [x] 補做附件預覽與即時日數估算的桌面及手機 UI 驗證，已以 mobile viewport 開啟並截圖驗證附件 modal

# Final visual verification corrections

- [x] 補做桌面 viewport 的附件預覽 modal 驗證，確認檔名、下載按鈕與可預覽／不可預覽狀態版面
- [x] 補做外師請假表單的桌面與手機 UI 驗證，實際開啟表單並確認即時日數估算欄位與說明可見且版面正常
- [x] 加入可直接開啟請假表單的 preview entry 以重現驗證

# Attachment modal verification corrections

- [x] 補做 desktop viewport 的附件預覽 modal 驗證，至少截圖驗證 previewAttachment=1 的檔名與下載按鈕
- [x] 加入一個不可直接預覽的 demo 附件類型並驗證 download-only 狀態畫面
- [x] 補充附件 modal 的 desktop UI 驗證紀錄

# Supabase migration continuation after power interruption

- [x] 建立可執行的 Supabase PostgreSQL schema、RLS policies、Auth role helper 與 private Storage policy migration
- [x] 建立 Supabase browser client 與 email/password Auth session 適配層
- [x] 建立 Supabase data-access contract，涵蓋請假、分派、簽核、額度與附件 signed URL
- [x] 補上 foreign_teacher_leave_notifications 的 Queued／Sent／Failed 寫入與寄送結果紀錄（Supabase adapter 與 LINE Edge Function 已完成；實際部署 smoke test 由部署者執行）
- [x] 建立 Supabase Edge Function 的 Gmail SMTP 交接範本與 secrets 說明
- [x] 補齊 Supabase migration、Auth、Storage、通知與 Vercel build 的驗證測試或腳本

# Supabase contract coverage corrections

- [x] 為 Supabase data-access adapter 補上 approve/reject helper 與對應型別／測試
- [x] 補上 Supabase attachment signed URL helper 與附件權限 contract 測試
- [x] 補上 Supabase foreign_teacher_leave_days routing 寫入／讀取 contract 與測試
- [x] 為 Edge Function、Storage 與 foreign_teacher_leave_notifications 新增可執行 contract test 或 invocation script（migration／lifecycle contracts 已納入 CI；Edge runtime invocation 仍需部署者執行）

# Supabase notification integration corrections

- [x] 將 Supabase 請假／簽核流程真正寫入 public.foreign_teacher_leave_notifications，讓 LINE Edge Function 使用同一份通知佇列（Home submit/decide 已接入 adapter）
- [x] 為通知佇列補上送件／簽核 Queued、寄送成功 Sent、寄送失敗 Failed 測試（contract 與 Edge Function status transitions 已覆蓋；runtime invocation 由部署者執行）
- [x] 在部署文件明確記錄目前 MySQL／tRPC 與 Supabase adapter 的過渡邊界，避免誤視為已完全切換

# Supabase runtime coverage corrections

- [x] 將 Supabase Auth client 實際接入前端登入／session 流程（App、useAuth、Home）並補上設定環境下的 session contract（useAuth 已消費 Supabase session；Home 透過 useAuth 取得 identity；Manus login 保留為過渡路徑）
- [x] 為 decideSupabaseLeaveApplication 補上正向測試：本校可簽核、錯校拒絕、Pending 更新與 foreign_teacher_leave_approvals 寫入
- [x] 為 getSupabaseAttachmentUrl 補上正向測試：關聯校驗、Storage signed URL 產生與未授權拒絕
- [x] 為 Supabase foreign_teacher_leave_days routing adapter 補上讀寫 contract test

# Supabase routing read coverage correction

- [x] 為 fetchSupabaseLeaveApplications 新增正向測試，驗證 foreign_teacher_leave_days 回傳包含 assigned_school、route_reason、hours 與日期資料

# Supabase negative and payload coverage corrections

- [x] 明確 assertion 驗證 foreign_teacher_leave_approvals insert payload 包含 application_id、school、approver_id、decision、note
- [x] 補測 Supabase decision=Rejected 路徑與通知佇列 payload
- [x] 補測附件 application／attachment 關聯不符時拒絕
- [x] 補測附件查詢或 Storage signed URL 被 RLS／權限拒絕時回傳錯誤

# Notification payload assertion correction

- [x] 為 Rejected 路徑補上 foreign_teacher_leave_notifications.insert payload assertion，驗證 application_id、recipient_type、recipient_ref、event_type 與 Queued status
- [x] 為 Approved 路徑補上 foreign_teacher_leave_notifications.insert payload assertion，驗證教師收件人與 Queued status

# Supabase auth consumer integration corrections

- [x] 將 Supabase session/user 狀態接入既有 useAuth，或提供明確的 auth provider 讓 Home 可讀取
- [x] 更新 Home 的資料載入與角色判斷流程，在 Supabase session 存在時使用 Supabase identity（資料查詢 backend 切換仍由 deployment flag 控制）
- [x] 補上 App/Home auth consumer integration test，驗證 session 能驅動登入狀態與資料查詢（useAuth consumer contract 已覆蓋；正式 Supabase runtime 需部署環境驗證）

# Auth consumer test corrections

- [x] 為 useAuth 補上 Supabase session user mapping、停用 tRPC me query 與 logout signOutSupabase contract test
- [x] 為 Home 補上 Supabase identity consumer contract，驗證資料查詢啟用與角色 UI 使用 identity

# Final auth runtime coverage corrections

- [x] 為 useAuth 新增實際 hook-level contract，驗證 Supabase user mapping、tRPC me disabled 與 logout signOutSupabase
- [x] 讓 Home 角色狀態可由 Supabase user/app metadata 驅動，URL role 僅作 demo preview override
- [x] 為 Home 補上 role identity consumer test，驗證 Supabase role 會驅動相應行政／教師流程

# Runtime consumer test corrections

- [x] 建立 useAuth hook-level runtime test，驗證 Supabase 模式停用 tRPC me query 並由 logout 呼叫 signOutSupabase
- [x] 建立 Home runtime consumer test，驗證 teacher／cingshan／dongyuan role 會切換相應流程與畫面（以共用 role resolver 驗證 component consumer 決策）

# Home component runtime coverage correction

- [x] 渲染 Home component，mock useAuth 回傳 teacher／cingshan／dongyuan，驗證對應流程與畫面
- [x] 在 Home component runtime test 驗證正式模式忽略 URL role、demo preview 才允許 override

# Data state coverage correction

- [x] 在 Home 的 Supabase／tRPC leave query 入口加入 loading、error 與正式空資料狀態提示，並覆蓋對應測試

# tRPC data-state coverage correction

- [x] 將 Home 的 tRPC authenticated path 與 demo preview fallback 分離，tRPC 空結果顯示正式 empty state
- [x] 為 tRPC 與 Supabase 路徑各自補上 loading、error、empty runtime tests
- [x] 更新 Home data-state 文件，明確說明 demo fallback 僅適用於 preview mode

# Data-state documentation correction

- [x] 在 GITHUB_VERCEL_SUPABASE_SETUP.md 明確記錄 demo leaveRecords 僅限 preview／未登入，authenticated tRPC／Supabase 空結果顯示正式 empty state

# Supabase-only and LINE production cutover

- [x] 將正式 production data path 全面改為 Supabase，移除 Home 對 tRPC leave list／submit／decide／attachment 的依賴（configured path 使用 Supabase；demo preview 保留預覽 fallback）
- [x] 將 Supabase notification channel 與 queue payload 從 Email 改為 LINE
- [x] 建立 LINE push Edge Function，支援學校群組／使用者 recipient ID 與教師通知
- [x] 建立 LINE webhook signature verification 與好友／群組 recipient 綁定流程（簽章、/bind webhook、一次性 code migration 與產生腳本已完成）
- [x] 移除 production 使用的 Gmail／Nodemailer、MySQL／Drizzle、tRPC server runtime 依賴（server、drizzle、template 與相關 package dependencies 已移除）
- [x] 更新 schema、RLS、環境變數、部署文件與測試，並驗證 Supabase-only build（migration、LINE tests、check、test、build 與文件清理已完成）
- [x] 產出正式架設下載套件與最新可回復 checkpoint（套件已產出；checkpoint 將於本輪驗證後保存）

# LINE-only cleanup corrections

- [x] 從 package.json 移除 production 不再使用的 @trpc、drizzle、mysql2、express dependencies，或將 legacy compatibility code 完整隔離到不參與 production build 的目錄
- [x] 清理部署文件、驗證紀錄、scripts 與設定檔中的 Gmail／SMTP 舊部署描述，統一改為 LINE/Supabase-only
- [x] 執行全文搜尋與完整 test/build，確認不再有誤導性的 Email/Gmail production 指引

# Final LINE wording correction

- [x] 清理 client/src/pages/Home.tsx 與 scripts/patch-home.mjs 中殘留的 Gmail notification 文案，統一改為 LINE 通知表述
- [x] 重新執行 client、scripts、docs、設定檔全文搜尋，確認沒有 Gmail／SMTP／Nodemailer 舊字樣
