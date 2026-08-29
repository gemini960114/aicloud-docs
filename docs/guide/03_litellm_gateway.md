# 第 3 章：TAIWAN AI RAP 與 LiteLLM 多模型 API Gateway

本章先驗證 **TAIWAN AI RAP** 提供的模型 API，再將國網及其他已取得授權的模型放在同一個 LiteLLM Gateway 後方。Gateway 集中保管上游憑證；團隊與應用程式只取得 LiteLLM 發出的 Virtual Key，並透過一個 Base URL 與課程定義的模型別名呼叫服務。

LiteLLM 支援許多供應商，但各家的模型、參數、串流與錯誤行為不一定完全相同。本章採取「先驗證 TAIWAN AI RAP，再逐一增加其他上游」的方式。當期資訊請以 [TAIWAN AI RAP API Guide](https://rap.genai.nchc.org.tw/doc?section=api-guide) 為準。

> **名稱說明：** TAIWAN AI RAP 是服務名稱；需要指稱程式介面時，本章使用「TAIWAN AI RAP API」。後文的 RAP 是服務簡稱。

## 1. 先理解 Gateway 的角色

```text
[TAIWAN AI RAP API] ───────────┐
[OpenAI API（選配）] ──────────┼──▶ [LiteLLM Proxy :4000]
[Anthropic Claude API（選配）] ┘              │
                                              ├── nchc-chat
                                              ├── meeting-stt（語音轉錄）
                                              ├── meeting-llm（會議整理）
                                              ├── openai-chat／claude-chat（選配）
                                              └── general-chat（選配路由別名）
                                                       │
                                                       ▼
                                      [受控 Virtual Key 的團隊與應用程式]
```

LiteLLM 可以協助統一：

- 呼叫 Endpoint 與驗證方式
- 應用程式看到的模型別名
- 串流回應格式
- Retry、Timeout、Fallback 與路由
- Virtual Key、流量限制及使用紀錄

它不會自動保證不同模型的答案品質、功能或資料政策相同，這些仍需由管理者驗證。

### 本課程要完成的 Gateway 成果

本章不是單純安裝 LiteLLM，也不是把同一組上游 API Key 複製給所有人。完成後應能：

1. 將 TAIWAN AI RAP API 設為主要上游。
2. 視課程可用授權加入 OpenAI、Anthropic Claude 或其他模型 API。
3. 用模型別名隱藏上游實際 Model ID，讓應用程式不必跟著供應商設定變動。
4. 只讓 LiteLLM 持有上游 API Key。
5. 在下一章向不同團隊與應用程式發放各自的 Virtual Key，分別限制模型、流量、期限及預算。

> **授權邊界：** LiteLLM 提供集中管理與受控分發的技術能力，不會自動授予 API 轉售、轉借或公開分享權利。本課程只在帳號、計畫與各供應商條款允許的範圍內，建立內部 AI API Gateway。

## 2. 先取得 TAIWAN AI RAP API入口金鑰

依 TAIWAN AI RAP 官方文件，先登入 [Lightweight Portal](https://portal.genai.nchc.org.tw/login)，完成：

1. 使用 iService 帳號登入。
2. 選擇具備可用餘額的計畫。
3. 查看該計畫可使用的模型清單。
4. 在「API入口」建立或管理 API入口金鑰。
5. 記錄該計畫畫面提供的 API Base URL 與可用 Model ID。

RAP 模型請求使用 **API入口金鑰**作為 Bearer Token。Portal 另有用於管理或查詢功能的使用者金鑰，兩者不要混用；實際名稱與權限以 Portal 畫面為準。

金鑰應由學員在遠端終端機安全寫入 `.env`，不要貼入 Antigravity 對話、課堂截圖或共用文件。

## 3. TAIWAN AI RAP API 範圍

TAIWAN AI RAP API Guide 目前列出：

| API 類別 | 主要用途 | 本課程 |
| :--- | :--- | :--- |
| Models | 取得計畫可用模型 | 必做 |
| Chat Completions | 以 `messages` 產生對話回覆 | 必做 |
| Embeddings | 將文字轉成向量 | 延伸 |
| Audio／Transcriptions | 將錄音檔轉成文字 | 第 5 章必做 |
| Audio／Speech | 將文字轉成語音 | 延伸 |
| Rerank | 依 Query 重排文件 | 延伸 |
| Image | 圖片生成與編輯 | 延伸 |
| Completions | 舊式文字補全 | Legacy，不作主流程 |

本課程要求 **Models＋Chat Completions＋Audio Transcriptions**：Chat Completions 用於整理會議紀錄，Audio Transcriptions 用於第 5 章的錄音檔轉錄。不要把 STT、TTS、Rerank 或 Image 當成聊天模型；它們有不同 Endpoint、Request Body 與回應格式。

官方 Chat Completions 規格重點：

- `POST /chat/completions`
- Bearer API Key 驗證
- `model`：從計畫可用模型清單選擇
- `messages`：每筆包含 `role` 與 `content`
- `max_tokens`：限制最多生成 Token
- `temperature`：官方文件目前說明範圍為 0 至 1
- `stream`：是否使用 SSE；未提供時預設為 `false`

Base URL 應直接複製自己計畫「API入口」顯示的值，不在教材硬編固定環境。組合 Endpoint 時要避免重複附加 `/api/v1` 或 `/v1`。

## 4. 蒐集其他上游 API 資訊

每一個上游至少需要：

| 欄位 | 說明 |
| :--- | :--- |
| Provider／協定 | LiteLLM 原生 Provider，或 OpenAI-compatible Endpoint |
| Base URL | 上游 API 的服務位址 |
| Model ID | 上游實際接受的模型名稱 |
| API Key | 只存於伺服器端環境變數 |
| 功能 | Chat、Streaming、Audio Transcriptions、Embedding、Tool Calling 等 |
| 限制 | RPM、TPM、Context、資料政策與費率 |

不要從舊教材複製 Base URL 或模型名稱。請使用帳號後台、講師提供資料及供應商官方文件確認當期資訊。

## 5. 先直接測試 TAIWAN AI RAP API

在加入 LiteLLM 前，先依 TAIWAN AI RAP 官方文件直接測試：

- DNS 與 TLS 可連線
- Bearer API入口金鑰有效
- `GET /models` 可取得該計畫可用模型
- Chat 與 STT 使用的 Model ID 確實存在於回傳清單
- 使用無敏感資訊的課堂短音檔直接呼叫 Audio Transcriptions 成功
- 非串流 Chat 可回覆
- 串流 Chat 可正常結束
- 錯誤時會回傳可辨識的 HTTP 狀態

建議請 Antigravity 協助，但不要把 Key 放進提示詞：

> 請先閱讀 TAIWAN AI RAP API Guide 與目前專案中的 .env.example，提出一個不顯示、不記錄 API入口金鑰的連線測試計畫。先以 GET /models 確認可用 Model ID，再測試 Audio Transcriptions 短音檔，以及 Chat Completions 的非串流、SSE 串流、錯誤模型名稱與未授權請求。Base URL 必須使用我在計畫 API入口取得的環境變數，不可自行猜測或寫死。先列出預期結果，不要執行。

若直接呼叫尚未成功，不要急著加入 LiteLLM，否則會同時排查兩層問題。

## 6. 建立 LiteLLM 專案

建議目錄：

```text
~/aicloud-course/gateway/
├── compose.yaml
├── config.yaml
├── .env
├── .env.example
└── README.md
```

`.env` 保存真正的 Secret；`config.yaml` 只引用環境變數。

基本概念如下，實際 Provider 前綴、參數與映像版本請依 [LiteLLM 官方文件](https://docs.litellm.ai/)及國網 API 相容性測試調整：

```yaml
model_list:
  - model_name: nchc-chat
    litellm_params:
      model: openai/<UPSTREAM_MODEL_ID>
      api_base: os.environ/NCHC_API_BASE
      api_key: os.environ/NCHC_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

安全要求：

- `LITELLM_MASTER_KEY` 使用高強度隨機值，不使用教材範例。
- 上游 Key 與 Master Key 都不寫在 YAML、README 或 Git。
- LiteLLM 初期只監聽 `127.0.0.1:4000`。
- 不使用浮動的 `latest` 容器標籤作正式部署；鎖定課程驗證版本。

## 7. 請 Antigravity 協助部署

第一個提示詞：

> 請檢查 ~/aicloud-course/gateway，根據 TAIWAN AI RAP API Guide 與 LiteLLM 官方文件規劃 Docker Compose 部署。先確認 RAP Base URL 的版本路徑不會重複，並以 GET /models 驗證實際 Model ID。LiteLLM 只能監聽 127.0.0.1:4000，config.yaml 只能引用環境變數，真正金鑰放在不納入 Git 的 .env。請先提出檔案清單、映像版本、健康檢查、啟停與驗證方式，不要建立檔案。

審閱後再執行：

> 依照已確認的計畫逐步建立 Gateway。每建立一個檔案先顯示不含 Secret 的差異；啟動後檢查容器狀態與健康端點。輸出日誌時必須遮蔽 Authorization、Cookie、API Key 與完整 Prompt。

## 8. 建立會議應用必要別名並驗證統一 API

先在已驗證的 RAP 上游加入第 5 章需要的兩個固定別名。以下只呈現設定形狀；`<...>` 必須換成該計畫 `GET /models` 實際回傳且已直接測試成功的 Model ID：

```yaml
model_list:
  - model_name: nchc-chat
    litellm_params:
      model: openai/<RAP_MODEL_ID>
      api_base: os.environ/NCHC_API_BASE
      api_key: os.environ/NCHC_API_KEY

  - model_name: meeting-stt
    litellm_params:
      model: openai/<RAP_STT_MODEL_ID>
      api_base: os.environ/NCHC_API_BASE
      api_key: os.environ/NCHC_API_KEY
    model_info:
      mode: audio_transcription

  - model_name: meeting-llm
    litellm_params:
      model: openai/<RAP_LLM_MODEL_ID>
      api_base: os.environ/NCHC_API_BASE
      api_key: os.environ/NCHC_API_KEY
```

[LiteLLM 官方 Audio Transcriptions 文件](https://docs.litellm.ai/docs/audio_transcription)使用 `model_info.mode: audio_transcription` 標示音訊轉錄模型。RAP 雖提供 OpenAI-compatible API，仍需以課程鎖定的 LiteLLM 版本實測 Provider 前綴、`api_base`、multipart 轉送與回應格式；設定檔可載入不等於音訊代理已相容。

至少完成以下測試：

1. 使用 Master Key 呼叫 `nchc-chat` 成功。
2. 使用無敏感資訊的短音檔呼叫 `meeting-stt` 成功。
3. `meeting-llm` 的非串流與 SSE 呼叫成功。
4. 錯誤 Key 回傳 401／403，而不是進入上游。
5. 不存在的模型別名回傳明確錯誤。
6. Streaming 能逐段傳回並正常結束。
7. LiteLLM 重新啟動後設定仍存在。
8. 上游 API 暫時失敗時，能在日誌中定位是 Gateway 或 Provider 問題。

開發階段如需查看 LiteLLM UI 或 API 文件，可透過 Antigravity Ports 暫時預覽 4000，不要在晶創雲開放公網 Ingress。

## 9. 選配：加入其他授權上游

TAIWAN AI RAP 與三個必要別名通過全部測試後，才依實際授權加入 OpenAI、Anthropic Claude 或其他供應商。課堂不要求每位學員持有第二家供應商帳號；沒有額外授權時，完成 RAP、Virtual Key 與會議系統流程即可完成核心練習，多供應商比較改為選修。

以下設定接續附加到既有 `model_list`，只呈現組合方式；`<...>` 必須換成帳號後台當期可用的 Model ID，真正金鑰仍放在 `.env`：

```yaml
model_list:
  - model_name: openai-chat
    litellm_params:
      model: openai/<OPENAI_MODEL_ID>
      api_key: os.environ/OPENAI_API_KEY

  - model_name: claude-chat
    litellm_params:
      model: anthropic/<ANTHROPIC_MODEL_ID>
      api_key: os.environ/ANTHROPIC_API_KEY
```

實際 Provider 前綴與參數以 [LiteLLM Providers 文件](https://docs.litellm.ai/docs/providers)為準。不要因為範例出現 OpenAI 或 Anthropic，就假設學員已取得相關 API 使用或再分發授權。

為不同用途建立穩定別名，例如：

- `nchc-chat`
- `meeting-stt`
- `meeting-llm`
- `openai-chat`
- `claude-chat`
- `general-chat`
- `embedding`

`meeting-stt` 與 `meeting-llm` 是第 5 章固定使用的應用別名；其他指定上游別名方便驗證與權限管理。`general-chat` 才適合依政策配置多個部署、負載平衡或備援。不要直接把供應商當期的完整 Model ID 散布在所有應用程式。模型別名讓管理者可以在 Gateway 調整後端，而不必同步修改每一個使用端。

新增後依 Endpoint 分開測試：

- Chat 模型是否接受預期的 `messages`、參數與 SSE
- STT 模型是否接受實際音訊格式、multipart 欄位與檔案大小
- 不把 Chat Request 傳給 STT，也不把音訊上傳傳給 Chat 模型
- 各模型的 Timeout 與錯誤格式
- Token、請求數與費率資料是否可正確記錄
- 錄音、逐字稿與 Prompt 是否允許傳送至該供應商

建議提示詞：

> 請根據 LiteLLM 官方 Provider 文件與目前 `.env.example`，規劃把我已取得授權的其他上游加入既有 Gateway。不得假設我一定持有 OpenAI 或 Anthropic Claude 帳號；只處理我明確確認可用的 Provider。保留第 5 章需要的 `meeting-stt`、`meeting-llm` 與 `nchc-chat`，為新增上游建立獨立別名；真正 Model ID 與金鑰只從環境變數取得。先列出必要欄位、相容性測試、資料政策與失敗停損點，不要讀取 Secret，也不要立即修改檔案。

## 10. RAP 非聊天模型要獨立驗證

RAP 官方特殊模型文件提供以下例子：

- STT／ASR：`POST /audio/transcriptions`，使用 multipart 上傳音訊檔；這是第 5 章必做項目。
- TTS：`POST /audio/speech`，回傳二進位音訊；官方明確不建議使用 SSE。
- Rerank：`POST /rerank`，輸入 `query`、`documents` 與 `top_n`。
- Safeguard：需要在 Policy Prompt 明確定義指令、定義、違規／安全標準、範例與輸出格式。

第 5 章會使用 Audio Transcriptions；TTS、Rerank 與 Safeguard 則列為延伸。每一項都要獨立驗證 LiteLLM Provider 支援、請求格式與資料政策，不應只更換 `model` 就假設能沿用同一流程。

## 11. OpenAI-compatible 的範圍

本課程主要使用 Chat Completions 風格的 `messages` 與串流回應，因為這通常是第三方 Gateway 的共同相容面。OpenAI 官方 API 本身仍持續演進；「OpenAI-compatible」只表示特定介面形狀相容，不代表所有 OpenAI 功能或模型行為皆相同。

可參考[OpenAI Chat Completions API Reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions)，並以 LiteLLM 與實際上游文件確認支援範圍。

## 12. 本章完成條件

- [ ] 已從 Lightweight Portal 選擇正確計畫並建立 API入口金鑰
- [ ] `GET /models` 已確認實際可用 Model ID
- [ ] RAP Chat Completions 在 LiteLLM 之外直接測試成功
- [ ] LiteLLM 只監聽遠端 localhost
- [ ] `.env` 未加入 Git
- [ ] `nchc-chat` 非串流與串流測試成功
- [ ] TAIWAN AI RAP STT 已用無敏感資訊的短音檔直接測試成功
- [ ] `meeting-stt` 已透過 LiteLLM 完成 Audio Transcriptions 測試
- [ ] `meeting-llm` 已完成非串流與 SSE 測試
- [ ] 選修多供應商時已驗證其他授權模型；未選修時已明確記錄核心流程只使用 RAP
- [ ] 每個上游都有獨立別名，應用程式不需要知道上游 API Key
- [ ] 已分別測試指定上游別名；尚未驗證前不啟用跨供應商 Fallback
- [ ] 學員能說明 Base URL、上游 Key、Master Key 與模型別名的差異

下一章將進一步設定 [API 金鑰與服務治理](/guide/04_litellm_api_governance)。
