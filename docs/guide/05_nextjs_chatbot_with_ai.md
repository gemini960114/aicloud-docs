# 第 5 章：用 AI 協作建立 Next.js 全端 Chatbot

本章不提供一份讓學員整段貼上的完整程式碼。學員會把需求、架構限制與驗收條件交給 Antigravity，審閱它的計畫與變更，再透過測試逐步完成 Chatbot。可搭配[AI 協作提示詞模板庫](/guide/prompt_recipes)改寫適合自己環境的 Prompt。

## 1. 為什麼選擇 Next.js 全端架構

Next.js 讓頁面與伺服器端 API 放在同一個專案中，適合本課程的最小架構：

```text
[瀏覽器]
    │ 只呼叫同源 /api/chat
    ▼
[Next.js]
├── Chat UI
└── Server API Route
        │ LITELLM_API_KEY 只存在伺服器
        ▼
[LiteLLM localhost:4000]
        ▼
[國網／其他授權模型]
```

相較於分離的 React 與 Express 專案，這樣可以減少：

- 兩套啟動與部署流程
- 跨來源 CORS 設定
- 把 API Key 誤放進前端的機會
- 額外的反向代理設定

## 2. 先寫需求，不要先叫 AI 寫 Code

最小可行版本需要：

- 單一聊天頁面
- 使用者與助理訊息清楚區分
- 輸入框、送出及停止按鈕
- 串流顯示模型回覆
- Loading、空輸入、網路中斷與 API 錯誤狀態
- 手機與桌面基本可用
- 不顯示模型內部思考過程
- 伺服器端呼叫 LiteLLM
- 環境變數不進入前端 Bundle

本課程暫不要求：

- 使用者註冊
- 對話資料庫
- 檔案上傳
- RAG
- Tool Calling 或 Agent
- 語音、多模態與複雜後台

## 3. 第一輪提示：請 AI 規劃

> 我要在 ~/aicloud-course/chatbot 建立一個 Next.js 全端 AI Chatbot。瀏覽器只能呼叫同源的 /api/chat，伺服器端再使用 OpenAI-compatible Chat Completions 介面呼叫 LiteLLM 的 nchc-chat 模型別名。請依 TAIWAN AI RAP API Guide 使用 messages，並支援 stream=true 的 SSE 回覆；不要使用 Legacy Completions，也不要把 ASR、TTS、Rerank 或 Image Endpoint 混入本章。LiteLLM Base URL、Virtual Key 與模型別名都必須由伺服器端環境變數讀取，不能出現在前端 Bundle、日誌或 Git。請先檢查 Node.js 環境與目錄狀態，提出架構、檔案清單、資料流、錯誤處理及測試計畫，暫時不要建立檔案。

審閱計畫時確認：

- 是否真的有伺服器端 API 邊界
- 是否錯把 `NEXT_PUBLIC_*` 用在 Secret
- 是否使用本章需要的最少套件
- 是否包含 Streaming 中斷與錯誤處理
- 是否有可執行的驗收方式

## 4. 第二輪提示：建立最小版本

> 請依照已確認的計畫建立最小可運作版本。先初始化 Next.js 專案與 .gitignore、.env.example、README，再建立 Chat UI 與伺服器端 /api/chat。每完成一個階段先執行 lint 或型別檢查並摘要變更，不要一次建立所有功能。真正的 LiteLLM Key 由我在遠端終端機設定，你不得讀取、輸出或寫入檔案。

不要只看 AI 回覆「完成」。學員要檢查實際檔案差異與指令結果。

## 5. 第三輪提示：加入串流

> 請把 Chatbot 改為串流回覆。前端應逐步更新同一則助理訊息；後端應處理 LiteLLM 的非成功 HTTP 狀態、逾時、上游中斷與使用者取消。不得把原始錯誤堆疊、Authorization Header 或上游回應中的敏感資訊直接顯示給瀏覽器。請先說明串流資料流與取消機制，再修改。

驗收項目：

- 第一段文字不用等完整答案才出現
- 串流只新增一則助理訊息
- 停止按鈕能取消目前請求
- 中斷後輸入框可以再次使用
- 錯誤訊息對使用者有意義，但不洩漏內部資訊

## 6. 第四輪提示：介面與可用性

> 請在不加入大型 UI 框架的前提下改善介面。保留簡潔、可閱讀、可鍵盤操作與手機可用的設計；加入明確焦點狀態、送出中禁用規則、空白輸入防護與 aria 標示。不要增加模型思考鏈、主機終端輸出或系統管理功能。

Chatbot 顯示的是使用者訊息與最終回覆，不把模型內部推理包裝成「思考鏈」。

## 7. 使用 Antigravity Ports 預覽

開發伺服器在遠端 VM 的 `localhost:3000` 啟動後：

1. 用 VM 內的 `curl` 確認首頁可回應。
2. 在 Antigravity Ports 面板找到 3000。
3. 從個人瀏覽器開啟預覽。
4. 測試一般回覆、串流、取消及錯誤情境。

開發階段不需要：

- 手動 `ssh -L`
- 晶創雲開放 Port 3000
- Cloudflare Quick Tunnel
- 將 Next.js 監聽到公網介面

## 8. 全端聯調矩陣

不要一開始就只用瀏覽器測完整鏈路。依序確認每一層，才能知道錯誤發生在哪裡：

| 層級 | 測試方式 | 成功訊號 | 常見失敗 |
| :--- | :--- | :--- | :--- |
| RAP | 從 VM 直接測 `GET /models` 與 Chat Completions | 可用模型及回覆正常 | API入口金鑰、餘額、Model ID、Base URL |
| LiteLLM → RAP | 從 VM 呼叫 `nchc-chat` | 非串流與 SSE 都正常 | Provider 前綴、版本路徑、上游參數 |
| Next.js → LiteLLM | 從 VM 呼叫 `/api/chat` | 後端可取得串流 | Virtual Key、環境變數、容器網路 |
| Browser → Next.js | Antigravity Ports 預覽 3000 | UI 逐步顯示同一則回覆 | 前端串流解析、取消、錯誤狀態 |

### 必做失敗情境

- 使用錯誤 LiteLLM Virtual Key。
- 使用不存在或未授權的模型別名。
- 暫停 LiteLLM，再呼叫 Next.js。
- 模擬 RAP Timeout 或上游錯誤。
- 串流途中按下停止。
- 完成後恢復服務，確認不需重建整個專案。

### 聯調提示詞

> 請依 RAP → LiteLLM → Next.js API → Browser 的順序進行聯調。每次只測相鄰兩層，先記錄 HTTP 狀態、Content-Type、Request ID、首段回覆延遲與串流是否正常結束，再決定下一步。不得同時修改多層設定，也不得輸出 Authorization、Cookie、API Key 或完整敏感 Prompt。若失敗，請區分已驗證事實、推測原因與下一個最小測試。

## 9. 測試提示詞

> 請為目前 Chatbot 建立一份驗收清單並逐項測試：首頁載入、空白輸入、一般串流、連續兩次提問、使用者取消、錯誤 Virtual Key、不存在模型、LiteLLM 停止、上游逾時、行動裝置寬度，以及前端 Bundle／Git 中是否出現 Secret。測試前先說明會改變哪些狀態；不得顯示任何金鑰值。

### 必須由學員人工確認

- 瀏覽器開發者工具看不到 LiteLLM Key。
- Network Request 只送到 Chatbot 的 `/api/chat`。
- Browser Request 中不會出現 TAIWAN AI RAP API入口金鑰或 Base URL。
- Git 變更中沒有 `.env`。
- 停止 LiteLLM 後，Chatbot 顯示安全且可理解的錯誤。
- 重新啟動 LiteLLM 後，Chatbot 可以恢復。

## 10. 最後請 AI 整理交付文件

> 請更新 README，包含用途、架構、必要環境變數名稱、開發啟動、測試、正式 Build、停止與故障排除方式。只可使用假值，不得複製目前環境的 Secret。另列出尚未完成、上線前必須處理的安全事項。

## 11. 用 Prompt 完成 GitHub 版本交付

Chatbot 通過驗收後，先把可重現的原始碼交付到 GitHub，再進入正式部署。本節仍由 Antigravity 協助操作，但「全程使用 Prompt」不代表把帳號控制權交給 AI：登入、Repository 公開範圍與首次 Push 都保留人工確認。

### 11.1 先分清楚三種服務

| 服務 | 本課程用途 | 不負責的工作 |
| :--- | :--- | :--- |
| GitHub Repository | 保存原始碼、Commit 與版本歷史 | 不直接執行本章的 Next.js 伺服器 |
| GitHub Pages | 發布這份 VitePress 靜態教材 | 不代替需要 Node.js Runtime 的 Chatbot |
| Cloudflare Tunnel | 在第 6 章將 VM 上的正式 Chatbot 對外服務 | 不代替 Git 版本管理 |

### 11.2 第一輪：提交前唯讀檢查

> 請先對目前 Chatbot 專案做唯讀的 Git 交付檢查，不要初始化 Repository、登入 GitHub、修改檔案、Stage、Commit 或 Push。確認目前分支、工作樹、既有 Remote、.gitignore、未追蹤檔案與變更摘要；檢查 .env、金鑰、憑證、日誌、Build 產物及大型檔案是否可能被提交。不得讀取或顯示 Secret 值，只回報檔名、風險類型與建議處理方式。最後列出預計交付的檔案、排除項目、指令計畫與需要我決定的事項。

學員要先看懂 `git status` 與 `git diff` 摘要。發現疑似 Secret 時立即停止，不要用「刪掉那一行再提交」取代金鑰撤銷與輪替。

### 11.3 第二輪：GitHub CLI 網頁授權

> 請先確認 GitHub CLI 是否可用，並執行唯讀的登入狀態檢查。如果尚未登入，請使用 GitHub CLI 官方 Web／Device Flow 引導我登入；到需要開啟網址、輸入一次性裝置碼或核准權限時停下來，由我親自在瀏覽器完成。不得要求我把 GitHub 密碼、Token、Cookie、裝置碼或其他憑證貼進對話，也不得自行擴大授權範圍。完成後只回報登入帳號、Git Protocol 與必要權限是否符合，不顯示憑證。

如果 VM 尚未安裝 `gh`，先請 AI 查閱 GitHub CLI 官方 Linux 安裝說明，列出套件來源、版本、需要 `sudo` 的原因與驗證方式，等待確認後才安裝；不得改用來源不明的一鍵安裝腳本。

常見入口是 `gh auth login --web`。Remote SSH 環境不一定能自動開啟本機瀏覽器；此時由學員在自己的瀏覽器開啟 GitHub 顯示的網址並完成 Device Flow。裝置碼只輸入 GitHub 官方頁面，不貼回 Prompt。

### 11.4 第三輪：建立或連結 Repository

> 根據剛才的唯讀結果，提出 GitHub Repository 建立或連結計畫，但先不要執行。若已有正確 Remote，不得覆寫；若尚未建立 Repository，請先詢問名稱、擁有者以及 Public 或 Private。列出將使用的 gh 與 git 指令、預計 Push 的分支，以及 GitHub 上會發生的外部變更。禁止 Force Push、刪除分支、改寫歷史、提交 Secret 或未經確認建立公開 Repository。等我確認後，一次執行一個階段並立即驗證。

Repository 的 Public／Private 是資料公開決策，不能讓 AI 猜測。若課堂統一建立公開 Repository，仍要在 Push 前完成 Secret 與授權資料檢查。

### 11.5 第四輪：審閱、Commit 與 Push

> 請重新顯示不含 Secret 的變更摘要，將檔案依用途分組，提出一則能描述本次成果的 Commit 訊息。不要直接使用 git add .；先列出準備 Stage 的明確路徑，等我確認後才 Stage。Stage 後再次檢查差異與敏感資訊，再等我確認才 Commit。Push 前說明 GitHub Repository、Remote、分支與可見性；取得最後確認後才 Push。不得使用 --force、不得略過檢查，也不得在失敗時改寫歷史。

### 11.6 GitHub 網頁驗收

Push 成功不等於交付完成。學員要親自在 GitHub 網頁確認：

- Repository 擁有者、名稱與 Public／Private 符合決定。
- 預期分支與最新 Commit 已出現。
- README 能讓另一位學員重建與啟動專案。
- `.env`、真正金鑰、日誌、Build 產物與個人資料沒有出現。
- GitHub 顯示的檔案範圍與 AI 提交摘要一致。

若 GitHub 網頁出現 Secret，應先撤銷並輪替憑證，再處理 Git 歷史；不能只新增一個後續 Commit 把檔案刪掉。

### 11.7 官方文件

- [GitHub CLI：Linux 安裝方式](https://github.com/cli/cli/blob/trunk/docs/install_linux.md)
- [GitHub CLI：`gh auth login`](https://cli.github.com/manual/gh_auth_login)
- [GitHub CLI：`gh repo create`](https://cli.github.com/manual/gh_repo_create)
- [GitHub Docs：移除 Repository 中的敏感資料](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## 12. 本章完成條件

- [ ] Next.js 前後端位於同一專案
- [ ] 瀏覽器只呼叫 `/api/chat`
- [ ] LiteLLM Virtual Key 只存在伺服器端
- [ ] 串流、取消與錯誤處理驗證成功
- [ ] 已依 RAP → LiteLLM → Next.js → Browser 完成分層聯調
- [ ] 已完成錯誤 Key、錯誤模型、服務中斷與上游逾時測試
- [ ] Antigravity Ports 可預覽 `localhost:3000`
- [ ] Lint、型別檢查及 Production Build 成功
- [ ] README 不含真正 Secret
- [ ] 已用唯讀 Prompt 檢查 Git 差異、.gitignore 與 Secret 風險
- [ ] GitHub Web／Device Flow 由學員親自完成
- [ ] Repository 可見性、Stage、Commit 與首次 Push 均經人工確認
- [ ] 已從 GitHub 網頁確認檔案、分支與 Commit

下一章會把開發預覽轉為 [Cloudflare Tunnel 正式服務](/guide/06_cloudflare_deployment)。需要設計或診斷 Prompt 時，可回到[提示詞模板庫](/guide/prompt_recipes)。
