# 附錄：AI 協作提示詞模板庫

這些 Prompt Recipes 不是答案，也不是要原封不動貼上的咒語。使用前必須把中括號內容換成自己的環境與目標，刪除不適用的要求，並確認 AI 提出的指令、套件來源及影響範圍。

## 1. 通用 Prompt 結構

一個可審閱的工程提示詞至少包含：

~~~text
背景與現況：
[目前主機、專案、已完成事項與已知問題]

目標：
[這一輪只要達成的一個可觀察成果]

技術限制：
[版本、框架、網路、檔案位置、相容協定]

安全限制：
[Secret、權限、監聽位址、資料政策]

禁止事項：
[不可修改、不可公開、不可刪除的項目]

驗收條件：
[指令結果、HTTP 狀態、頁面行為、負向測試]

執行節奏：
先唯讀檢查並提出計畫，等我確認後一次執行一個階段。

輸出格式：
分開列出已驗證事實、推測、變更摘要、測試結果與未完成事項。

停損點：
遇到 sudo、刪除、覆寫、公開 Port、顯示 Secret 或改變資料格式時停下來詢問。
~~~

好的 Prompt 會限制工作範圍並定義成功；它不會以「幫我全部弄好」取代工程判斷。

## 2. Recipe：唯讀環境盤點

適用於第一次連上晶創雲 VM。

> 背景與現況：我剛透過 Antigravity Remote SSH 連上晶創雲 VM，目前不確定環境狀態。
> 目標：建立一份不修改系統的環境盤點。
> 請檢查作業系統、核心、CPU、記憶體、磁碟、目前使用者、群組、IP、DNS、外部 HTTPS 連線，以及 Git、curl、Docker、Docker Compose、Node.js、npm 的版本與服務狀態。
> 安全限制：不得讀取或輸出環境變數值、SSH key、Token、Cookie、.env 或 Shell History。
> 驗收：將實際檢查結果、缺少工具與異常分開列出。這一輪不得安裝或修改任何內容。

## 3. Recipe：變更前安裝計畫

> 背景與現況：[貼上不含敏感資訊的盤點摘要]。
> 目標：安裝 [工具名稱與課程指定版本策略]。
> 請先比較可用的官方安裝方式，列出套件來源、預計指令、需要 sudo 的原因、建立或修改的檔案、服務影響、磁碟需求、回復方法與逐步驗證。
> 禁止事項：不得使用來源不明的安裝腳本，不得修改 SSH、防火牆或公開 Port。
> 執行節奏：先提出計畫，不要執行；等我確認後一次完成一個階段。

## 4. Recipe：RAP 與 LiteLLM Gateway

> 背景與現況：我已在 RAP Lightweight Portal 選擇正確計畫，API Base URL、API入口金鑰與 Model ID 會由我透過遠端終端機設定為環境變數。
> 目標：建立只監聽 127.0.0.1:4000 的 LiteLLM Gateway，並把實際 RAP 模型映射成 nchc-chat。
> 技術限制：先依 RAP API Guide 測試 GET /models，再測試 Chat Completions 的非串流與 SSE；LiteLLM 使用鎖定版本的容器與只引用環境變數的設定檔。
> 安全限制：不得讀取、輸出、記錄或提交任何金鑰；不得在晶創雲開放 4000。
> 驗收：正確請求成功，錯誤 Key、錯誤模型與上游中斷均有明確結果，重啟後設定仍存在。
> 請先列出資料流、檔案清單、版本路徑風險、測試矩陣及回復方法，不要建立檔案。

## 5. Recipe：Next.js Chatbot 規格

> 背景與現況：LiteLLM 的 nchc-chat 已通過非串流與 SSE 測試。
> 目標：在 [專案目錄] 建立 Next.js 全端 Chatbot。
> 架構限制：瀏覽器只呼叫同源 /api/chat；Next.js 伺服器端使用 LiteLLM Virtual Key；不得把 RAP Base URL、RAP API入口金鑰或 LiteLLM Key 送到瀏覽器。
> 功能：使用者／助理訊息、串流更新同一則回覆、送出與停止、等待與錯誤狀態、鍵盤及行動裝置基本可用。
> 不包含：RAG、Agent、Tool Calling、檔案上傳、ASR、TTS、Rerank、Image 或對話資料庫。
> 驗收：Lint、型別檢查與 Production Build 成功；前端 Bundle、Git 與日誌不含 Secret；錯誤 Key、模型不存在、上游逾時與使用者取消皆有測試。
> 請先提出架構、檔案清單、資料流與測試計畫，不要寫程式碼。

## 6. Recipe：SSE 串流除錯

> 現象：[描述實際畫面、HTTP 狀態與何時中斷，不要只寫「不能用」]。
> 已驗證：[列出 RAP、LiteLLM、Next.js 各層已完成的測試]。
> 目標：找出串流在 RAP → LiteLLM → Next.js → Browser 的哪一層失效。
> 請一次只測相鄰兩層，檢查 HTTP 狀態、Content-Type、首段延遲、資料框架、結束訊號、Buffer 邊界與取消傳播。
> 禁止事項：不得同時修改前端、後端與 Gateway；不得把關閉驗證、停用 TLS 或公開 Port 當作解法。
> 輸出：分開列出已驗證事實、推測、下一個最小測試，以及該測試如何證明或排除假設。

## 7. Recipe：Secret 與權限檢查

> 目標：在不顯示 Secret 值的前提下，檢查專案是否可能洩漏憑證。
> 請檢查 Git 追蹤檔案、.gitignore、前端 Bundle、NEXT_PUBLIC_*、容器映像建置內容、Compose 設定、應用日誌、錯誤回應與瀏覽器 Network Request。
> 另確認 RAP API入口金鑰只存在 LiteLLM、LiteLLM Master Key 只供管理者使用、Next.js 只持有最小權限 Virtual Key。
> 不得執行會列出環境變數值或檔案內容的命令。只回報變數名稱、檔案位置、是否可能曝光與修正建議。發現疑似外洩時立即停下來，先建議撤銷與輪替。

## 8. Recipe：GitHub 版本交付

> 背景與現況：Chatbot 已通過 Lint、型別檢查、Production Build 與人工驗收，README 已使用假值說明環境變數。
> 目標：把可重現的原始碼安全交付到 GitHub；本輪不部署服務。
> 第一階段只做唯讀檢查：確認 Git 狀態、分支、Remote、.gitignore、差異、未追蹤檔案、大型檔案、Build 產物，以及 .env、金鑰、憑證或日誌的洩漏風險。不得讀取或顯示 Secret 值。
> 登入限制：未登入時使用 GitHub CLI 官方 Web／Device Flow；到瀏覽器授權步驟立即暫停，由我親自完成。不得要求我提供密碼、Token、Cookie 或裝置碼。
> 外部變更限制：建立 Repository 前先詢問擁有者、名稱及 Public／Private；已有 Remote 時不得覆寫。Stage 前列出明確檔案，Commit 與 Push 各自等待確認。
> 禁止事項：不得使用 git add .、Force Push、改寫歷史、刪除分支、猜測 Repository 可見性或提交 Secret。
> 驗收：GitHub 網頁上的擁有者、可見性、分支、最新 Commit、檔案與 README 均符合預期，且沒有 .env、Secret、日誌或 Build 產物。
> 請先提出分階段計畫、每一個人工確認點與失敗後的安全處理方式，不要執行。

## 9. Recipe：Production 部署審查

> 背景與現況：開發版已透過 Antigravity Ports 完成聯調。
> 目標：將 Next.js、LiteLLM 與 PostgreSQL 以可重現方式部署，並只透過 Cloudflare Access／Tunnel 公開 Chatbot。
> 技術限制：Next.js 使用 Production Build 與 Node.js Runtime，不使用開發伺服器或純靜態匯出；容器內以 service name 連線；PostgreSQL 不發布主機 Port。
> 安全限制：LiteLLM Admin UI、4000 Port、資料庫與任何 Secret 不可公開；Cloudflare Public Hostname 只指向 Chatbot。
> 驗收：健康檢查、未登入阻擋、登入後 SSE、VM 重啟自動恢復、日誌遮蔽、備份與回復演練。
> 先提出部署差異、停機風險、回復計畫與驗收順序，不要執行。

## 10. Recipe：分層故障診斷

> 使用者看到的現象：[錯誤訊息與發生時間]。
> 最近變更：[版本、設定或部署差異]。
> 請按 Browser → Cloudflare Access → Tunnel → Next.js → LiteLLM → RAP 的順序診斷，每次只確認相鄰兩層。
> 優先執行唯讀檢查；任何重啟、設定修改、Rollback 或資料操作前先說明影響並等待確認。
> 回報格式：時間線、已驗證事實、尚未驗證項目、最可能原因、下一個最小測試、暫時緩解與永久修正。不得輸出 Secret 或完整敏感 Prompt。

## 11. 送出 Prompt 前的人工檢查

- [ ] 這一輪只有一個主要目標
- [ ] 已提供必要背景，而不是要求 AI 猜測
- [ ] 已列出不能改動的範圍
- [ ] Secret 不在 Prompt 中
- [ ] 驗收條件可以實際觀察
- [ ] 要求先檢查與規劃，再執行
- [ ] 危險操作有人工確認停損點
- [ ] 要求分開呈現事實、推測與未完成事項

返回[課程總綱](/guide/00_course_syllabus)。
