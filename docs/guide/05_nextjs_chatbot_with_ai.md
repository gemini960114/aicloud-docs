# 第 5 章：用 AI 協作建立 Next.js 全端 Chatbot

本章不提供一份讓學員整段貼上的完整程式碼。學員會把需求、架構限制與驗收條件交給 Antigravity，審閱它的計畫與變更，再透過測試逐步完成 Chatbot。

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

> 我要在 ~/aicloud-course/chatbot 建立一個 Next.js 全端 AI Chatbot。瀏覽器只能呼叫同源的 /api/chat，伺服器端再使用 OpenAI-compatible Chat Completions 介面呼叫 LiteLLM。LiteLLM Base URL、Virtual Key 與模型別名都必須由伺服器端環境變數讀取，不能出現在前端 Bundle、日誌或 Git。請先檢查 Node.js 環境與目錄狀態，提出架構、檔案清單、資料流、錯誤處理及測試計畫，暫時不要建立檔案。

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

## 8. 測試提示詞

> 請為目前 Chatbot 建立一份驗收清單並逐項測試：首頁載入、空白輸入、一般串流、連續兩次提問、使用者取消、錯誤 Virtual Key、不存在模型、LiteLLM 停止、上游逾時、行動裝置寬度，以及前端 Bundle／Git 中是否出現 Secret。測試前先說明會改變哪些狀態；不得顯示任何金鑰值。

### 必須由學員人工確認

- 瀏覽器開發者工具看不到 LiteLLM Key。
- Network Request 只送到 Chatbot 的 `/api/chat`。
- Git 變更中沒有 `.env`。
- 停止 LiteLLM 後，Chatbot 顯示安全且可理解的錯誤。
- 重新啟動 LiteLLM 後，Chatbot 可以恢復。

## 9. 最後請 AI 整理交付文件

> 請更新 README，包含用途、架構、必要環境變數名稱、開發啟動、測試、正式 Build、停止與故障排除方式。只可使用假值，不得複製目前環境的 Secret。另列出尚未完成、上線前必須處理的安全事項。

## 10. 本章完成條件

- [ ] Next.js 前後端位於同一專案
- [ ] 瀏覽器只呼叫 `/api/chat`
- [ ] LiteLLM Virtual Key 只存在伺服器端
- [ ] 串流、取消與錯誤處理驗證成功
- [ ] Antigravity Ports 可預覽 `localhost:3000`
- [ ] Lint、型別檢查及 Production Build 成功
- [ ] README 不含真正 Secret

下一章會把開發預覽轉為 [Cloudflare Tunnel 正式服務](/guide/06_cloudflare_deployment)。
