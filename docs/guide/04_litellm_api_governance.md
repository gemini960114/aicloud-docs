# 第 4 章：Virtual Key、多租戶權限與流量治理

上一章使用 LiteLLM Master Key 完成管理者測試。本章要把「能呼叫多個上游」提升為「能安全提供給不同團隊與應用程式使用」。

最重要的原則是：

> 上游供應商 Key 只交給 Gateway；LiteLLM Master Key 只交給管理者；每個應用程式使用獨立、最小權限、可撤銷的 Virtual Key。

這裡的「多租戶」是指在已授權範圍內，讓不同內部團隊、專案或應用程式共用一個 Gateway，但各自擁有獨立身分、模型權限與用量限制；不是共用或轉售上游帳號。

## 1. 四層身分與憑證

| 層級 | 使用者 | 憑證用途 | 是否可放入瀏覽器 |
| :--- | :--- | :--- | :---: |
| 上游 Provider | LiteLLM | 呼叫國網或其他模型 | 否 |
| LiteLLM 管理者 | 維運人員 | 管理模型、Key、團隊與設定 | 否 |
| 應用程式 | Next.js 後端 | 呼叫允許的 LiteLLM STT 與 LLM 模型 | 否 |
| 終端使用者 | 會議系統使用者 | 第 6 章由 Cloudflare Access 控制入口 | 不使用模型 API Key |

如果把 Master Key 放進會議系統，應用程式就可能取得不必要的管理權限；如果把 Virtual Key 放進前端 JavaScript，瀏覽器使用者仍可複製並在其他地方濫用。

## 2. 資料庫是治理功能的前提

LiteLLM 的 Virtual Key、使用者／團隊與預算管理需要資料庫。課程正式啟用這些功能前，應加入 PostgreSQL 並驗證資料持久化。

沒有資料庫時，不要宣稱已具備可靠的：

- Virtual Key 管理
- 使用者或團隊預算
- 使用量歸屬
- 重啟後仍可查詢的治理資料

詳細需求與版本差異請參考 [LiteLLM Virtual Keys](https://docs.litellm.ai/docs/proxy/virtual_keys) 與官方預算文件。課程使用的資料庫密碼同樣只能放在伺服器端 Secret。

## 3. 受控示範 LiteLLM Admin UI

LiteLLM Admin UI 適合把抽象的模型、金鑰與用量治理轉成可視化操作，但它是**管理介面**，不是一般學員或外部使用者的入口。

示範前先確認：

- LiteLLM 已啟用管理者驗證。
- PostgreSQL 已連線，重啟後治理資料仍存在。
- 使用無敏感資訊的測試 Prompt。
- 只透過 Antigravity Ports 私人預覽遠端 4000。
- 不在晶創雲開放 4000，也不建立指向 Admin UI 的 Cloudflare Public Hostname。

課堂可示範：

1. 查看課程定義的模型別名。
2. 建立一組只能呼叫 `nchc-chat` 的測試 Virtual Key。
3. 觀察請求狀態、Token、延遲及錯誤。
4. 修改模型權限或流量限制，執行正向與負向測試。
5. 撤銷測試 Key，確認它立即失效。

### 成本欄位的限制

Admin UI 顯示的金額取決於 LiteLLM 是否有該模型的正確價格資料，以及自訂模型是否已配置成本。RAP 模型若沒有可靠的成本對照，教材只能把畫面解讀為 **Token／請求／延遲等使用量觀測**，不得把估算金額當成國網正式帳務；正式餘額與用量仍以 RAP Portal 為準。

示範完成後：

- 撤銷臨時 Key。
- 關閉 4000 的 Antigravity Port 預覽。
- 檢查截圖與學習紀錄沒有 Secret、完整 Prompt 或個人資料。

## 4. 為會議轉錄系統建立專用 Virtual Key

建議權限：

- Key 名稱：可辨識環境與應用，例如 `course-meeting-dev`
- Models：只允許 `meeting-stt` 與 `meeting-llm`
- 到期時間：課程或專案可接受的最短期限
- RPM／TPM：先使用保守上限，再依量測調整
- Budget：若上游計價資料可靠，再設定預算與週期
- Metadata：只記錄非敏感的專案、環境與負責人代號

不要讓學員把 Master Key 貼給 Antigravity。可在遠端終端機以 Secret 環境變數提供，並要求 AI 不讀取或輸出值。

### 不要混淆三種 RAP／LiteLLM 金鑰

| 金鑰 | 建立位置 | 主要用途 |
| :--- | :--- | :--- |
| TAIWAN AI RAP API入口金鑰 | TAIWAN AI RAP Lightweight Portal 的計畫／API入口 | LiteLLM 呼叫國網模型 |
| RAP 使用者金鑰 | RAP Portal 使用者功能 | 管理或查詢相關使用量功能，以 Portal 說明為準 |
| LiteLLM Virtual Key | 自建 LiteLLM Gateway | Next.js 會議系統呼叫 `meeting-stt` 與 `meeting-llm` |

Next.js 只取得最小權限 LiteLLM Virtual Key；TAIWAN AI RAP API入口金鑰只存在 LiteLLM 環境中。

建議提示詞：

> 請依 LiteLLM 官方文件規劃一組給 `course-meeting-dev` 使用的 Virtual Key。它只能呼叫 `meeting-stt` 與 `meeting-llm`，需有到期時間、保守的 RPM／TPM、平行請求限制，並可被獨立撤銷。先列出管理 API 操作、必要前提與兩種 Endpoint 的驗證方法，不要顯示 Master Key，也不要執行。

## 5. 多租戶受控分發實作

本節把 LiteLLM 從單一應用程式 Proxy 提升為可治理的內部模型服務。課堂建立三個用途不同的主體；數值是教學起始值，講師應依上游額度與實測結果調整：

| 主體／Key | 允許的模型別名 | 教學限制 | 用途 |
| :--- | :--- | :--- | :--- |
| `team-a-dev` | `nchc-chat` | 10 RPM、保守 TPM、短期到期 | 驗證單一國網模型權限 |
| `team-b-eval` | `nchc-chat`、`claude-chat` | 20 RPM、獨立 TPM 與期限 | 比較兩個已授權上游 |
| `meeting-app-prod` | `meeting-stt`、`meeting-llm` | 正式環境 RPM／TPM、平行請求數與可用的週期預算 | 第 5、6 章的會議轉錄系統 |

若沒有 Anthropic Claude 授權，`team-b-eval` 可改用另一個已授權上游；不可為完成表格而使用未授權憑證。

### 操作順序

1. 建立 Team A、Team B 與正式會議系統的非敏感識別資料。
2. 設定每個主體允許的模型清單、RPM、TPM、平行請求數、期限與預算週期。
3. 各自產生 Virtual Key，僅在建立當下安全交付給指定使用端。
4. 分別執行允許模型、禁止模型、限流、到期及撤銷測試。
5. 在 Admin UI 或管理 API 確認用量可歸屬到正確的 Team、Key 與模型。

LiteLLM 可在 Team、使用者、Key 及個別模型層級設定預算或流量限制。課程先採用容易解釋的「Team 共用上限＋Key 個別上限」；實際生效順序與版本差異以 [LiteLLM Budgets and Rate Limits](https://docs.litellm.ai/docs/proxy/users)為準。

建議提示詞：

> 請依 LiteLLM 官方 Virtual Keys 與 Budgets／Rate Limits 文件，規劃 `team-a-dev`、`team-b-eval`、`meeting-app-prod` 三種受控存取。列出每個主體的允許模型、RPM、TPM、平行請求數、期限、預算與非敏感 Metadata，並說明 Team 上限和 Key 上限如何配合。先產生不含 Secret 的操作計畫及驗收矩陣，不要執行，也不要在輸出中顯示 Master Key 或 Virtual Key。

## 6. 權限與限制的驗收矩陣

| 測試 | 預期結果 |
| :--- | :--- |
| Team A Key＋`nchc-chat` | 成功，且用量歸屬 Team A |
| Team A Key＋`claude-chat` | 拒絕，不呼叫上游 |
| Team B Key＋已允許模型 | 成功，且用量歸屬 Team B |
| 會議系統 Key＋`meeting-stt`／`meeting-llm` | 成功，不暴露實際上游憑證 |
| 錯誤或撤銷 Key | 401／403 |
| 超過 RPM／TPM | 429 或文件定義的限制錯誤 |
| 超過可靠計價模型的週期預算 | 拒絕或依設定執行預算政策 |
| 過期 Key | 拒絕 |
| 重新啟動 LiteLLM | Key 與治理資料仍存在 |

課堂上應真的執行負向測試，不能只測成功路徑。若 RAP 模型缺少可靠價格資料，以請求數、Token、RPM／TPM 做限制，預算測試改用成本資料已驗證的模型；不要把 LiteLLM 估算當作 RAP 正式餘額。

## 7. 模型路由與備援

Fallback 不等於永遠重試。先依失敗類型決定行為：

- Authentication error：停止並通知管理者，不切換來掩蓋設定錯誤。
- Rate limit／暫時性服務錯誤：可依政策 Retry 或 Fallback。
- Bad request：回報應用程式修正，不應無限重試。
- Timeout：有限次重試，並記錄總等待時間。
- 內容政策或資料限制：不得為取得答案而繞到未授權供應商。

若 `nchc-chat` 要設定多個部署或備援模型，必須先確認：

- 模型是否接受相同輸入參數
- 回應品質與語言是否符合需求
- 資料是否允許傳送至備援供應商
- 費率與 Token 計算能否正確記錄
- Streaming 與錯誤行為是否一致

## 8. 日誌與隱私

至少記錄：

- 時間
- 應用程式／Key 代號
- 模型別名
- HTTP 狀態
- 延遲
- Token 或使用量
- 上游 Provider／部署
- Request ID
- RAP 計畫及 API入口金鑰的非敏感代號

預設不要完整記錄：

- Authorization Header
- API Key、Cookie、Session
- 完整 Prompt 與模型回覆
- 個人資料、機敏研究資料或未公開程式碼

若教學需要觀察 Prompt，使用無敏感資料的測試內容，並說明保存期限與可存取人員。

## 9. 金鑰生命週期

```text
建立 → 發給單一應用 → 監控 → 定期輪替 → 撤銷 → 驗證不可再使用
```

發現 Key 可能外洩時：

1. 立即撤銷，不要先等待調查完成。
2. 建立新 Key 並更新伺服器端環境變數。
3. 重新啟動或重新部署使用該 Key 的服務。
4. 檢查異常流量與費用。
5. 確認 Git 歷史、日誌與前端 Bundle 是否含有 Secret。

任何上游供應商的 API Key 都應只透過後端保存及呼叫，不得部署到瀏覽器或提交版本控制。

## 10. 請 Antigravity 產生治理報告

> 請在不讀取或顯示任何 Secret 的前提下，檢查目前 LiteLLM 的治理設定。請回報：資料庫持久化、模型別名、Virtual Key 權限、到期時間、RPM／TPM、預算、日誌遮蔽、備援條件及撤銷流程。將已驗證事實、推測及尚未設定項目分開列出，並提出負向測試清單。先不要修改設定。

這份報告應放入 `notes/`，但不得包含 Key、完整 Prompt 或個人資料。

## 11. 本章完成條件

- [ ] PostgreSQL 與 LiteLLM 治理資料可持久化
- [ ] Admin UI 只透過 Antigravity Ports 私人預覽
- [ ] 能區分觀測用量與 RAP 正式帳務
- [ ] Team A、Team B 與會議系統各有獨立 Virtual Key
- [ ] 各 Virtual Key 只能呼叫指定模型，且用量可正確歸屬
- [ ] 已驗證 Team／Key 的 RPM、TPM、期限與可用的預算政策
- [ ] 錯誤、撤銷、過期及限流測試符合預期
- [ ] 日誌不含 Secret
- [ ] 已記錄輪替與事件處理流程

下一章將使用這組專用 Key，透過提示詞引導 AI 建立 [AI 會議轉錄與紀錄系統](/guide/05_ai_meeting_transcription)。
