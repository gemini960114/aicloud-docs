# 第 3 章：TAIWAN AI RAP 與 LiteLLM 多模型 API Gateway

本章目標在於將 **國網 TAIWAN AI RAP API** 與其他授權模型集中整合至 **LiteLLM 多模型 API Gateway** 後方。Gateway 負責保管所有上游供應商的真實金鑰，並將不同供應商的模型統一映射為標準別名（如 `nchc-chat`、`meeting-stt`、`meeting-llm`）。應用程式僅需透過統一的 Base URL 與 Virtual Key 即可呼叫模型，實現金鑰集中管理與架構解耦。

---

## 1. Gateway 集中管理架構

```text
[上游模型供應商 / Provider]
 ├── 國網 TAIWAN AI RAP API (Chat / STT / Whisper)
 ├── OpenAI API (選配: GPT-4o / etc.)
 └── Anthropic API (選配: Claude 3.5 Sonnet / etc.)
              │
              │ (持真實 Provider API Keys，受限私網)
              ▼
[LiteLLM Proxy Gateway :4000 (Docker 容器)]
 ├── 統一模型別名路由：
 │    ├── nchc-chat    ➔ 國網聊天模型
 │    ├── meeting-stt  ➔ 國網語音轉錄 (Whisper/STT)
 │    ├── meeting-llm  ➔ 國網會議摘要 (LLM)
 │    └── openai-chat  ➔ (選配) OpenAI 模型
 ├── 集中治理：Master Key 管理、RPM/TPM 限流、成本與使用量追蹤
              │
              │ (發放受限 Virtual Key，僅綁定必要別名)
              ▼
[應用程式與團隊端]
 ├── Next.js 會議轉錄系統 (第 5、6 章)
 └── 其他內部應用 / 開發人員
```

---

## 2. 🤖 自然語言 Prompt 配方（可直接複製給 AI Agent）

在 Antigravity 終端機中，你可以直接複製以下 Prompt 讓 AI 協助規劃、部署與測試 LiteLLM Gateway：

### 模式 A：國網 TAIWAN AI RAP API 連線與模型清單探測

```markdown
請協助我驗證目前遠端主機與國網 TAIWAN AI RAP API 的連線狀態：

1. 讀取環境變數中的 NCHC_API_BASE 與 NCHC_API_KEY（請勿在日誌中明文顯示 Key）。
2. 發送 GET 請求至 <NCHC_API_BASE>/models 取得目前專案可用的 Model ID 清單。
3. 發送一次簡單的 POST /chat/completions 測試請求，驗證對話回應正常。
4. 整理回傳的可用模型名稱清單（如 Chat 模型與 STT 模型 ID），供後續 LiteLLM 設定檔使用。
```

### 模式 B：LiteLLM Gateway Docker 部署與設定檔產生

```markdown
請在 ~/aicloud-course/gateway 目錄下協助我建立 LiteLLM Gateway 的 Docker Compose 部署配置：

1. 建立 .env 範本，包含隨機產生的高強度 LITELLM_MASTER_KEY、NCHC_API_BASE 與 NCHC_API_KEY。
2. 建立 config.yaml：
   - 建立 tutor-llm 別名（指向國網 Chat 模型，專供第 5 章四連桿模擬器之 AI 導師與幾何診斷使用）。
   - 建立 nchc-chat 別名（指向國網通用 Chat 模型）。
   - 建立 meeting-stt 與 meeting-llm 別名（指向國網 STT 轉錄與會議摘要模型，供延伸案例庫使用）。
   - 設定 general_settings 引用環境變數中的 master_key。
3. 建立 compose.yaml，將 LiteLLM 容器鎖定監聽 127.0.0.1:4000，掛載 config.yaml 與 .env。
4. 啟動容器並驗證健康檢查端點（http://127.0.0.1:4000/health/readiness）。
```

### 模式 C：多模型別名路由與 SSE 串流驗收

```markdown
請對剛啟動的 LiteLLM Gateway 進行全面驗收測試：

1. 測試 tutor-llm：使用 Master Key 呼叫 http://127.0.0.1:4000/v1/chat/completions，發送物理提問驗證回應。
2. 測試 nchc-chat：驗證通用對話非串流回應。
3. 測試 meeting-llm 串流：啟用 stream: true，驗證 Server-Sent Events (SSE) 文字流能逐段接收並正常結束。
4. 測試 meeting-stt：使用一個短音檔發送 POST /v1/audio/transcriptions 進行語音轉錄測試。
5. 測試異常處理：使用錯誤的 API Key 呼叫，驗證 Gateway 能正確回傳 401 Unauthorized。
6. 輸出測試摘要報告，確保日誌中不含敏感金鑰。
```

---

## 3. 💻 終端機手動執行指令 (Manual Commands & Step-by-Step)

### Step 1：手動直接測試國網 TAIWAN AI RAP API

在建置 Gateway 前，先確認國網 API 入口金鑰與連線無誤：

```bash
# 1. 設定臨時環境變數 (請替換為你在 Lightweight Portal 取得的實際值)
export NCHC_API_BASE="https://rap.genai.nchc.org.tw/api/v1" # 依 Portal 實際 Base URL 為準
export NCHC_API_KEY="your-nchc-api-key"

# 2. 查詢該計畫可用的模型清單
curl -s -X GET "${NCHC_API_BASE}/models" \
  -H "Authorization: Bearer ${NCHC_API_KEY}" | jq .

# 3. 測試單次聊天對話 (Chat Completions)
curl -s -X POST "${NCHC_API_BASE}/chat/completions" \
  -H "Authorization: Bearer ${NCHC_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<填入步驟2查到的 Chat Model ID>",
    "messages": [{"role": "user", "content": "你好，請說一句測試訊息"}]
  }' | jq .
```

---

### Step 2：建立 LiteLLM Gateway 專案目錄與環境變數

```bash
# 1. 建立專案目錄
mkdir -p ~/aicloud-course/gateway
cd ~/aicloud-course/gateway

# 2. 產生高強度隨機 Master Key
MASTER_KEY=$(openssl rand -hex 16)
echo "產生的 Master Key: sk-$MASTER_KEY"

# 3. 建立 .env 檔案
cat <<EOF > .env
LITELLM_MASTER_KEY=sk-${MASTER_KEY}
NCHC_API_BASE=${NCHC_API_BASE}
NCHC_API_KEY=${NCHC_API_KEY}
# 選配上游 (若有可填入，若無可留空)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
EOF

# 4. 鎖定 .env 權限
chmod 600 .env
```

---

### Step 3：建立 LiteLLM 設定檔 (`config.yaml`)

建立標準模型別名設定檔：

```bash
cat <<'EOF' > config.yaml
model_list:
  # 1. 第 5 章四連桿 AI 導師與機構診斷專用別名 (指向國網 Chat 模型)
  - model_name: tutor-llm
    litellm_params:
      model: openai/<填入實際國網 Chat Model ID>
      api_base: os.environ/NCHC_API_BASE
      api_key: os.environ/NCHC_API_KEY

  # 2. 國網通用對話模型別名
  - model_name: nchc-chat
    litellm_params:
      model: openai/<填入實際國網 Chat Model ID>
      api_base: os.environ/NCHC_API_BASE
      api_key: os.environ/NCHC_API_KEY

  # 3. 延伸案例庫：會議轉錄專用 STT 模型別名 (語音轉文字)
  - model_name: meeting-stt
    litellm_params:
      model: openai/<填入實際國網 STT Model ID>
      api_base: os.environ/NCHC_API_BASE
      api_key: os.environ/NCHC_API_KEY
    model_info:
      mode: audio_transcription

  # 4. 延伸案例庫：會議摘要專用 LLM 模型別名 (文字整理)
  - model_name: meeting-llm
    litellm_params:
      model: openai/<填入實際國網 LLM Model ID>
      api_base: os.environ/NCHC_API_BASE
      api_key: os.environ/NCHC_API_KEY

  # 4. (選配) OpenAI 模型別名
  # - model_name: openai-chat
  #   litellm_params:
  #     model: openai/gpt-4o-mini
  #     api_key: os.environ/OPENAI_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY

litellm_settings:
  drop_params: true
  set_verbose: false
EOF
```

> [!TIP]
> 請務必將 `<填入實際國網 Model ID>` 替換為你在 `GET /models` 實際查詢到的模型名稱（如 `Llama-3.1-8B-Instruct` 或 `whisper-large-v3`）。

---

### Step 4：建立 `compose.yaml` 並啟動服務

```bash
cat <<'EOF' > compose.yaml
version: '3.8'

services:
  litellm:
    image: ghcr.io/berriai/litellm:main-v1.40.0 # 建議鎖定穩定版本
    container_name: aicloud-litellm
    restart: always
    ports:
      - "127.0.0.1:4000:4000" # 僅監聽本機 localhost，禁止對外暴露
    env_file:
      - .env
    volumes:
      - ./config.yaml:/app/config.yaml
    command: ["--config", "/app/config.yaml", "--port", "4000"]

EOF

# 啟動 LiteLLM 容器
docker compose up -d

# 檢查容器狀態與日誌
docker compose ps
docker compose logs --tail=20
```

---

### Step 5：透過 LiteLLM Gateway 驗收統一 API

現在所有請求都改向 Gateway 發送，驗證模型別名路由是否正常生效：

```bash
# 1. 讀取剛才產生的 Master Key
source .env

# 2. 測試 Gateway 健康檢查端點
curl -s http://127.0.0.1:4000/health/readiness

# 3. 測試 nchc-chat 模型別名
curl -s -X POST "http://127.0.0.1:4000/v1/chat/completions" \
  -H "Authorization: Bearer ${LITELLM_MASTER_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nchc-chat",
    "messages": [{"role": "user", "content": "測試 LiteLLM Gateway 對話"}]
  }' | jq .

# 4. 測試 meeting-llm SSE 串流輸出
curl -N -X POST "http://127.0.0.1:4000/v1/chat/completions" \
  -H "Authorization: Bearer ${LITELLM_MASTER_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meeting-llm",
    "messages": [{"role": "user", "content": "請從 1 數到 5"}],
    "stream": true
  }'

# 5. 測試錯誤 API Key 攔截 (預期回傳 401)
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://127.0.0.1:4000/v1/chat/completions" \
  -H "Authorization: Bearer sk-invalid-key" \
  -H "Content-Type: application/json" \
  -d '{"model": "nchc-chat", "messages": []}'
```

---

## 4. 敏感金鑰治理矩陣

| 金鑰類型 | 存放位置 | 持有者 | 授權邊界 |
| :--- | :--- | :--- | :--- |
| **Provider API Key**<br>(國網 API 入口金鑰 / OpenAI Key) | Gateway 伺服器端 `.env` | 僅 LiteLLM 服務內部 | 具備上游帳號完整計費權限，**嚴禁流出伺服器** |
| **LiteLLM Master Key** | Gateway 伺服器端 `.env` | 系統管理員 (Admin) | 具備 Gateway 完整管理權（發放金鑰、修改費率） |
| **Virtual Key (虛擬金鑰)**<br>(第 4 章產生) | 應用程式設定 / 使用者終端 | 開發團隊 / Next.js 應用 | **受限存取**：僅限特定模型別名、設定 RPM/TPM 與預算上限 |

---

## 5. 🎯 本章完成檢核清單 (Checklist)

請確認以下項目均已順利通過：

- [ ] **國網連線**：已從 Lightweight Portal 取得 API入口金鑰，並以 `curl` 直接測試 `GET /models` 成功。
- [ ] **目錄與金鑰**：已建立 `~/aicloud-course/gateway`，產生隨機 Master Key，且 `.env` 權限鎖定為 600。
- [ ] **模型別名**：`config.yaml` 已成功映射 `tutor-llm`（四連桿 AI 導師）、`nchc-chat` 以及延伸案例之 `meeting-stt` / `meeting-llm`。
- [ ] **容器運行**：LiteLLM 容器成功啟動且僅綁定 `127.0.0.1:4000`。
- [ ] **統一 API 驗證**：已透過 Gateway 成功驗收非串流對話、SSE 串流輸出與 401 錯誤攔截。
- [ ] **Ports 預覽 (選用)**：若需查看 LiteLLM Swagger 文件或 UI，可透過 Antigravity Ports 預覽 4000。

> [!TIP]
> 下一步：前往 [第 4 章：LiteLLM API 治理、權限控管與資料庫持久化](/guide/04_litellm_api_governance)，將 SQLite 升級為 PostgreSQL，並為第 5 章四連桿 AI 導師與延伸案例發放專屬的受控 Virtual Key！
