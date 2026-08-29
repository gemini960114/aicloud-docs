# 第 5 章：用 Prompt 協作建立 AI 會議轉錄與紀錄系統

本章不提供一份讓學員整段貼上的完整程式碼。學員會把需求、架構限制與驗收條件分階段交給 Antigravity，先審閱計畫與差異，再透過測試逐步完成一套可運作的會議錄音轉錄系統。可搭配[AI 協作提示詞模板庫](/guide/prompt_recipes)調整 Prompt。

本章的核心不是「請 AI 一次把整個專案寫完」，而是練習把一個真實產品拆成可驗證的小成果。

## 1. 本章最小可行成果

```text
錄音檔案
   │
   ▼
[Next.js /api/transcribe]
   │ 固定的 meeting-stt 模型別名
   ▼
[LiteLLM localhost:4000]
   │
   ▼
[TAIWAN AI RAP STT]
   │
   ▼
可人工修訂的逐字稿
   │
   ▼
[Next.js /api/minutes]
   │ 固定的 meeting-llm 模型別名
   ▼
[LiteLLM → LLM]
   │ SSE 串流
   ▼
結構化會議紀錄 → 複製／Markdown／TXT
```

完成後，學員應能上傳一個短錄音檔，取得逐字稿、人工校正內容，再由 LLM 整理成不虛構資訊的會議紀錄。

## 2. 為什麼繼續使用 Next.js 全端架構

Next.js 讓頁面與伺服器端 API 位於同一個專案，適合本課程的安全邊界：

```text
[瀏覽器]
    │ 只呼叫同源 API
    ├── POST /api/transcribe
    └── POST /api/minutes
             │
             ▼
[Next.js Server]
    │ LITELLM_BASE_URL、Virtual Key、模型別名只存在伺服器
    ▼
[LiteLLM 127.0.0.1:4000]
```

這樣可以減少兩套前後端啟動流程、CORS、開發 Proxy 與 Secret 誤入前端的風險。外部使用者不需要也不能直接連線到 VM 的 `127.0.0.1:4000`；該位址由同一台 VM 上的 Next.js 後端使用。

如果第 6 章把 Next.js 與 LiteLLM 分別放入 Docker Compose 容器，則改用 Compose service name，例如 `http://litellm:4000`，不能繼續使用容器內的 `127.0.0.1`。

## 3. 本章刻意固定的範圍

| 項目 | 本章決定 |
| :--- | :--- |
| 應用程式帳號 | 不建立；開發期使用 Antigravity Ports，正式發布由 Cloudflare Access 保護 |
| 模型選擇 | UI 不提供選擇器，固定使用 `meeting-stt` 與 `meeting-llm` |
| 模型憑證 | Next.js 只持有最小權限 LiteLLM Virtual Key |
| 錄音來源 | 只提供既有錄音檔上傳，不使用瀏覽器麥克風 |
| 資料保存 | 不建立資料庫，不保存歷史紀錄 |
| LLM 功能 | 固定產生一種結構化會議紀錄，不提供任意自訂 Prompt |
| 匯出 | 複製、Markdown、TXT |
| 長音訊 | 不做分段、佇列或背景工作；先使用課堂短音檔驗證同步流程 |

這裡的「不建立資料庫」是指會議應用不保存錄音、逐字稿、會議紀錄或使用者歷史。第 4、6 章的 PostgreSQL 只保存 LiteLLM 的 Virtual Key、團隊、限制與使用量等治理資料，不是會議內容資料庫。

本章不要求：

- 登入、登出、Session 或使用者輸入 API Key
- 使用者修改 LiteLLM Base URL
- STT／LLM 模型下拉選單
- 瀏覽器 MediaRecorder
- 說話者辨識、時間軸或字幕檔
- 長音訊切片、非同步 Queue、Object Storage
- RAG、Agent、Tool Calling 或會議歷史資料庫

這些可以成為後續專題，但不能混入第一個可運作版本。

## 4. 前置條件：先驗證兩個模型別名

開始寫應用程式前，第 3、4 章應已完成：

- `meeting-stt`：映射到已授權且通過測試的 TAIWAN AI RAP STT 模型
- `meeting-llm`：映射到已授權的會議整理 LLM
- 應用程式 Virtual Key：只允許這兩個模型別名
- LiteLLM：只監聽遠端 localhost
- STT：已用課堂短音檔驗證 `multipart/form-data`
- LLM：已驗證 Chat Completions 與 SSE 串流

TAIWAN AI RAP 的 Base URL、Model ID、支援格式與參數以當期 [TAIWAN AI RAP API Guide](https://rap.genai.nchc.org.tw/doc?section=api-guide)及計畫模型清單為準。LiteLLM 是否能代理該 STT 模型也必須實測，不因 Endpoint 名稱相似就假設相容。

## 5. 伺服器端環境變數

真正的設定放在未納入 Git 的 `.env.local`；如果課程專案統一使用 `.env`，安全規則相同。Repository 只提交假值 `.env.example`：

```dotenv
LITELLM_BASE_URL=http://127.0.0.1:4000
LITELLM_VIRTUAL_KEY=replace-with-course-virtual-key
STT_MODEL_ALIAS=meeting-stt
LLM_MODEL_ALIAS=meeting-llm
MAX_UPLOAD_BYTES=26214400
UPSTREAM_TIMEOUT_MS=120000
```

注意：

- 不使用任何 `NEXT_PUBLIC_*` 變數保存 Base URL、模型別名或 Key。
- `LITELLM_VIRTUAL_KEY` 是第 4 章發給應用程式的 Key，不是 LiteLLM Master Key。
- TAIWAN AI RAP API入口金鑰只存在 LiteLLM 環境，不能放進 Next.js。
- `MAX_UPLOAD_BYTES` 與 Timeout 是課堂起始值，上線前需依實際模型、反向代理及 Cloudflare 限制重新驗證。
- 應用程式不得自行拼接出 `/v1/v1/...`；先定義 Base URL 是否已包含版本路徑。

## 6. 第一輪 Prompt：只做規劃

> 我要在 `~/aicloud-course/meeting-app` 建立一個 Next.js 全端「AI 會議轉錄與紀錄系統」。瀏覽器只能呼叫同源的 `POST /api/transcribe` 與 `POST /api/minutes`；Next.js 伺服器端使用 `LITELLM_BASE_URL`、`LITELLM_VIRTUAL_KEY`、`STT_MODEL_ALIAS=meeting-stt` 與 `LLM_MODEL_ALIAS=meeting-llm`。使用者只上傳既有錄音檔，不做登入、Session、任意 Base URL、API Key 輸入、麥克風、模型選擇、歷史資料庫或自訂 Prompt。請先檢查 Node.js、目錄與既有檔案，核對 TAIWAN AI RAP API Guide 與 LiteLLM 官方文件，提出架構、檔案清單、資料流、上傳限制、暫存檔清理、錯誤處理、隱私風險及分階段測試計畫。不要讀取 `.env` 或任何 Secret，暫時不要建立檔案。

審閱計畫時確認：

- 是否維持 Next.js 伺服器端 API 邊界
- 是否誤把 Secret 放入 Client Component 或 `NEXT_PUBLIC_*`
- 是否把 STT 與 Chat Completions 當成兩種不同請求格式
- 是否先做錄音檔上傳，不偷加麥克風功能
- 是否說明檔案大小、格式、Timeout 與清理方式
- 是否將實作拆成多個可驗收階段

## 7. 第二輪 Prompt：建立最小專案與安全邊界

> 請依已確認的計畫初始化 Next.js TypeScript 專案，建立 `.gitignore`、使用假值的 `.env.example` 與 README 骨架。首頁先只顯示本系統用途、錄音資料將送往經授權模型服務的提醒、檔案選擇區及尚未實作的狀態，不要先串接 API。伺服器端設定必須集中讀取並檢查必要環境變數，但不得顯示值。每完成一個階段先執行 Lint 或型別檢查並顯示不含 Secret 的差異，等待我確認後再繼續。

驗收：

- 專案可啟動
- `.env.local`／`.env` 未被 Git 追蹤
- 前端 Bundle 沒有 LiteLLM Base URL 或 Key
- 缺少必要伺服器設定時安全失敗，不回傳 Secret

## 8. 第三輪 Prompt：錄音檔上傳與 STT

> 請建立 `POST /api/transcribe` 與錄音檔上傳 UI。瀏覽器以 `multipart/form-data` 上傳單一檔案；Server 驗證檔案存在、允許的副檔名／MIME、大小上限與固定 `meeting-stt` 別名，再代理至 LiteLLM 的 Audio Transcriptions Endpoint。不要信任瀏覽器提供的 MIME，也不要讓使用者指定上游 URL、API Key 或模型。處理成功、上游 4xx／5xx、Timeout、格式不支援、空檔與回應格式異常；任何暫存檔在成功或失敗後都要清理。請先說明實際使用記憶體或暫存檔的方式及風險，再修改。

介面至少包含：

- 拖曳或選取錄音檔
- 檔名、大小與可播放時的音訊預覽
- 上傳中、辨識中、成功與錯誤狀態
- 「開始轉錄」按鈕
- 可編輯、複製與清除的逐字稿區

不要顯示假的百分比進度；若上游只有同步回應，就顯示真實處理階段。

## 9. 第四輪 Prompt：產生結構化會議紀錄

會議紀錄固定使用下列結構：

```markdown
# 會議紀錄

## 會議摘要

## 討論重點

## 決議事項

## 待辦事項
| 待辦事項 | 負責人 | 期限 |
| --- | --- | --- |

## 待確認事項

## 風險與阻礙
```

> 請建立 `POST /api/minutes`，只接受使用者已人工確認的逐字稿，Server 使用固定 `meeting-llm` 模型別名與伺服器端會議紀錄指令呼叫 LiteLLM Chat Completions，並將 SSE 串流安全轉發給瀏覽器。模型不得捏造逐字稿中沒有的人名、日期、負責人、期限或決議；資訊不足時標示「未提供」或「待確認」，並將事實與推測分開。前端提供「產生會議紀錄」、停止、重新產生、複製及清除。請先說明串流資料框架、`[DONE]`、中止傳播、Timeout 與錯誤遮蔽，再修改。

驗收：

- 空白逐字稿不能送出
- 第一段結果不必等待整份完成
- 串流只更新同一份會議紀錄
- 停止按鈕會中止瀏覽器與上游請求
- 錯誤不洩漏 Authorization、內部 URL 或 Stack Trace
- 未出現在逐字稿的責任人與期限不會被模型自行補寫

## 10. 第五輪 Prompt：介面、匯出與隱私

> 請改善會議系統介面，但不加入大型 UI 框架。流程依序呈現「選擇錄音檔 → 轉錄 → 人工修訂 → 產生會議紀錄 → 匯出」，支援桌面與手機、鍵盤操作、焦點狀態及 aria 標示。加入 Markdown 與純文字下載，下載內容只包含使用者目前畫面上的逐字稿及會議紀錄。不要加入登入、麥克風、模型選擇、歷史列表、雲端儲存或分析追蹤。

頁面應清楚提醒：

- 錄音前應取得與會者同意
- 音訊與逐字稿會送至指定的模型服務處理
- 本課程版本不保存歷史紀錄
- 使用者離開頁面前應自行下載需要保留的結果

## 11. 使用 Antigravity Ports 預覽

開發伺服器在遠端 VM 的 `localhost:3000` 啟動後：

1. 先用 VM 內的請求確認首頁可回應。
2. 在 Antigravity Ports 面板找到 3000。
3. 從個人瀏覽器開啟私人預覽。
4. 使用無敏感資訊的短音檔測試上傳、轉錄、人工修訂、串流、停止與匯出。

開發階段不需要：

- 手動 `ssh -L`
- 晶創雲開放 Port 3000 或 4000
- Cloudflare Quick Tunnel
- 將 Next.js 或 LiteLLM 監聽到公網介面

本章沒有應用程式登入，因此在完成第 6 章 Cloudflare Access 前，不得將服務公開到網際網路。

## 12. 分層聯調矩陣

| 層級 | 測試方式 | 成功訊號 | 常見失敗 |
| :--- | :--- | :--- | :--- |
| RAP STT | VM 直接用短音檔測 Audio Transcriptions | 回傳可辨識逐字稿 | Model ID、格式、大小、Base URL、API入口金鑰 |
| LiteLLM → RAP STT | 使用應用 Virtual Key 呼叫 `meeting-stt` | 同一音檔可轉錄 | Provider 設定、模型權限、multipart 轉發 |
| RAP／其他授權 LLM | 直接測 Chat Completions | 非串流與 SSE 正常 | 模型參數、Context、餘額 |
| LiteLLM → LLM | 使用應用 Virtual Key 呼叫 `meeting-llm` | SSE 正常結束 | 模型別名、Virtual Key、Timeout |
| Next.js → LiteLLM | VM 呼叫 `/api/transcribe`、`/api/minutes` | 逐字稿與串流正常 | 環境變數、Request Body、容器網路 |
| Browser → Next.js | Antigravity Ports 預覽 3000 | 完成上傳至匯出流程 | 前端狀態、取消、下載、錯誤顯示 |

### 聯調提示詞

> 請依「RAP STT → LiteLLM meeting-stt → Next.js transcribe → Browser」及「LLM → LiteLLM meeting-llm → Next.js minutes → Browser」兩條路徑分開聯調。每次只測相鄰兩層，記錄 HTTP 狀態、Content-Type、Request ID、處理時間、SSE 首段延遲與結束狀態；不得同時修改多層設定，也不得輸出 Authorization、API Key、完整錄音、逐字稿或會議內容。失敗時分開列出已驗證事實、推測原因與下一個最小測試。

## 13. 必做測試

### 正常流程

- 上傳課程核准的短音檔
- 取得並人工修訂逐字稿
- 串流產生結構化會議紀錄
- 停止後可以重新產生
- Markdown 與 TXT 可以下載
- 行動裝置寬度仍可完成主要流程

### 失敗與安全情境

- 未選檔案、零位元檔案、超過大小限制
- 副檔名與 MIME 不符、上游不支援的音訊
- 錯誤或撤銷的 LiteLLM Virtual Key
- Virtual Key 無權使用 `meeting-stt` 或 `meeting-llm`
- LiteLLM 停止、RAP Timeout、上游回應格式異常
- 空白逐字稿、過長逐字稿、LLM 串流中斷
- 使用者在串流途中按停止
- 暫存音訊在成功與失敗後都已清理
- 前端 Bundle、Git、日誌與錯誤回應都不含 Secret

### 測試提示詞

> 請先為目前會議轉錄系統建立測試矩陣，不要立即執行。涵蓋錄音檔驗證、STT、逐字稿編輯、LLM 串流、停止、匯出、錯誤 Key、模型權限、服務中斷、Timeout、暫存檔清理、行動版及 Secret 洩漏檢查。每項列出前置條件、操作、預期結果與是否會改變狀態；測試資料只能使用無敏感資訊的課堂音檔。

## 14. 交付文件 Prompt

> 請更新 README，說明系統用途、資料流、必要環境變數名稱、支援格式的確認方式、檔案大小限制、開發啟動、測試、Production Build、停止與故障排除。明確說明本版本沒有帳號、麥克風、歷史資料庫與長音訊處理，正式公開前必須由 Cloudflare Access 保護。只使用假值，不得複製 `.env.local`、Virtual Key、逐字稿或會議內容。

## 15. 用 Prompt 完成 GitHub 版本交付

系統通過驗收後，先把可重現的原始碼交付到 GitHub，再進入正式部署。「全程使用 Prompt」不代表把帳號與發布決策交給 AI；登入、Repository 可見性、Stage、Commit 與首次 Push 都保留人工確認。

### 15.1 提交前唯讀檢查

> 請對 `~/aicloud-course/meeting-app` 做唯讀的 Git 交付檢查，不要初始化 Repository、登入、修改檔案、Stage、Commit 或 Push。確認分支、工作樹、Remote、`.gitignore`、未追蹤檔案與變更摘要；檢查 `.env*`、API Key、音訊檔、逐字稿、匯出結果、暫存檔、日誌與 Build 產物是否可能被提交。不得讀取或顯示內容，只回報檔名、風險類型與建議。最後列出預計交付檔案、排除項目、指令計畫與需要我決定的事項。

發現疑似 Secret 時立即停止；先撤銷與輪替金鑰，再處理 Git 歷史。音訊與會議內容即使不含 Key，也可能是敏感資料，不應提交到課程 Repository。

### 15.2 GitHub CLI Web／Device Flow

> 請先確認 GitHub CLI 是否可用並執行唯讀登入狀態檢查。若尚未登入，使用 GitHub CLI 官方 Web／Device Flow 引導我登入；到需要開啟網址、輸入裝置碼或核准權限時停下來，由我親自在瀏覽器完成。不得要求我把密碼、Token、Cookie、裝置碼或其他憑證貼進對話。完成後只回報登入帳號、Git Protocol 與必要權限是否符合。

若 VM 沒有 `gh`，先依官方文件提出安裝來源、版本、需要 `sudo` 的原因與驗證方式，等待確認後才安裝。

### 15.3 Repository、Commit 與 Push

> 根據唯讀結果提出 Repository 建立或連結計畫，先不要執行。若已有正確 Remote 不得覆寫；若尚未建立，先詢問擁有者、名稱及 Public／Private。Stage 前列出明確路徑，不使用 `git add .`；Stage 後再次檢查差異與敏感資訊。Commit 與 Push 前各自等待人工確認，禁止 Force Push、改寫歷史、刪除分支或猜測 Repository 可見性。

Push 後由學員在 GitHub 網頁確認：

- Repository 擁有者、名稱與可見性正確
- 分支與最新 Commit 正確
- README 足以讓另一位學員重建專案
- 沒有 `.env`、Key、錄音、逐字稿、會議紀錄、暫存檔、日誌或 Build 產物

## 16. 本章完成條件

- [ ] Next.js 前後端位於同一專案
- [ ] UI 沒有登入、API Key、Base URL 或模型選擇器
- [ ] 瀏覽器只呼叫 `/api/transcribe` 與 `/api/minutes`
- [ ] LiteLLM Virtual Key 只存在伺服器端
- [ ] `meeting-stt` 可將課堂短音檔轉成逐字稿
- [ ] 逐字稿可人工修訂、複製及清除
- [ ] `meeting-llm` 可串流產生固定結構的會議紀錄
- [ ] 模型不會自行補寫未提供的負責人、期限或決議
- [ ] 上傳限制、Timeout、錯誤遮蔽與暫存檔清理通過測試
- [ ] Markdown／TXT 匯出成功
- [ ] Antigravity Ports 可私人預覽 `localhost:3000`
- [ ] Lint、型別檢查及 Production Build 成功
- [ ] README 與 Git 不含 Secret、音訊或會議資料
- [ ] GitHub Web／Device Flow 由學員親自完成
- [ ] Repository 可見性、Stage、Commit 與首次 Push 均經人工確認

下一章會使用 [Cloudflare Access 與 Tunnel](/guide/06_cloudflare_deployment)保護並發布這套會議轉錄系統。需要設計或診斷 Prompt 時，可回到[提示詞模板庫](/guide/prompt_recipes)。
