# 第 4 章：Virtual Key、多租戶權限與流量治理

上一章我們使用 LiteLLM Master Key 完成管理者初次測試。本章的核心目標是**將「單一 API Gateway」升級為「具備多租戶隔離、模型權限控管與流量治理的企業級平台」**。

最核心的安全架構原則：
> **上游真實金鑰僅由 Gateway 保管；Master Key 僅供系統管理員維運；所有下游應用程式（如 Next.js 會議系統）與各團隊僅持有「最小權限、特定模型白名單、設有 RPM/TPM 上限且可隨時獨立撤銷的 Virtual Key」。**

---

## 1. 四層身分與金鑰職責劃分

```text
[層級 1：上游模型 Provider]
  ├── 國網 TAIWAN AI RAP API Key / OpenAI Key
  └── 僅儲存於 Gateway 伺服器端 .env，嚴禁流出

[層級 2：LiteLLM 系統管理員]
  ├── 持有 LITELLM_MASTER_KEY
  └── 僅用於發放 Virtual Key、管理資料庫與調整費率政策

[層級 3：應用程式後端 (Next.js)]
  ├── 持有專用 Virtual Key (如 sk-meeting-prod-xxx)
  └── 限制僅能存取 meeting-stt 與 meeting-llm 模型，設定 RPM 限額

[層級 4：終端使用者 / 團隊成員]
  └── 透過瀏覽器存取會議系統 Web 介面（由 Cloudflare Access 驗證身分，無須持有任何 API Key）
```

---

## 2. 🤖 自然語言 Prompt 配方（可直接複製給 AI Agent）

在 Antigravity 終端機中，你可以直接複製以下 Prompt 請 AI 協助完成資料庫升級與 Virtual Key 發放：

### 模式 A：PostgreSQL 資料庫持久化與 Docker Compose 擴充

```markdown
請協助我將 ~/aicloud-course/gateway 的 LiteLLM 升級為支援 PostgreSQL 資料庫持久化：

1. 在 .env 中新增隨機產生的 DB_PASSWORD 與 DATABASE_URL（postgresql://litellm_admin:<PWD>@postgres:5432/litellm）。
2. 修改 compose.yaml，新增 postgres:16-alpine 服務：
   - 建立專屬 named volume 確保資料重啟不遺失。
   - 不發布 host port（僅限內部容器網路互通）。
   - 設定 litellm 服務 depends_on: postgres。
3. 重啟 Docker Compose 並檢查資料庫連線日誌，確認 LiteLLM 成功完成 DB Schema Migration。
```

### 模式 B：專用受限 Virtual Key 產生與配額發放

```markdown
請使用 LiteLLM 管理 API（/key/generate）為 Next.js 會議轉錄系統建立專用 Virtual Key：

1. 使用環境變數中的 LITELLM_MASTER_KEY 發起 POST 請求至 http://127.0.0.1:4000/key/generate。
2. 參數設定：
   - key_alias: "meeting-app-prod"
   - models: ["meeting-stt", "meeting-llm"]（嚴禁存取其他模型）
   - max_budget: 100（預算上限）
   - tpm_limit: 50000 / rpm_limit: 30
   - duration: "30d"（有效期 30 天）
3. 取得產生的 sk-... 虛擬金鑰，並將其安全寫入會議系統的 .env 檔案中，切勿在終端機輸出明文金鑰。
```

### 模式 C：金鑰權限與限流負向測試驗收

```markdown
請對剛產生的 meeting-app-prod Virtual Key 進行全套負向測試：

1. 正向測試：呼叫 meeting-stt 與 meeting-llm，確認能正常回應。
2. 越權測試：嘗試呼叫未授權的模型別名（如 nchc-chat 或 openai-chat），確認 Gateway 回傳 400/403 錯誤。
3. 撤銷測試：示範透過 /key/delete 撤銷金鑰，並驗證立即回傳 401 Unauthorized。
4. 輸出測試結果矩陣，確保日誌中不含完整敏感 Token。
```

---

## 3. 💻 終端機手動執行指令 (Manual Commands & Step-by-Step)

### Step 1：升級 Docker Compose 支援 PostgreSQL 持久化

LiteLLM 的 Virtual Key 與使用量統計必須依賴關聯式資料庫。

```bash
cd ~/aicloud-course/gateway

# 1. 產生高強度資料庫密碼並寫入 .env
DB_PASS=$(openssl rand -hex 12)
echo "DB_PASSWORD=${DB_PASS}" >> .env
echo "DATABASE_URL=postgresql://litellm_user:${DB_PASS}@postgres:5432/litellm" >> .env

# 2. 更新 compose.yaml (加入 PostgreSQL 容器)
cat <<'EOF' > compose.yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: litellm-postgres
    restart: always
    environment:
      POSTGRES_DB: litellm
      POSTGRES_USER: litellm_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal_net
    # 嚴禁發布 host port，僅限容器內部網路互通

  litellm:
    image: ghcr.io/berriai/litellm:main-v1.40.0
    container_name: aicloud-litellm
    restart: always
    ports:
      - "127.0.0.1:4000:4000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      LITELLM_MASTER_KEY: ${LITELLM_MASTER_KEY}
    env_file:
      - .env
    volumes:
      - ./config.yaml:/app/config.yaml
    command: ["--config", "/app/config.yaml", "--port", "4000"]
    depends_on:
      - postgres
    networks:
      - internal_net

networks:
  internal_net:
    driver: bridge

volumes:
  postgres_data:
EOF

# 3. 重新啟動服務
docker compose up -d

# 4. 確認資料庫連線成功
docker compose logs litellm | grep -i "database"
```

---

### Step 2：透過 REST API 產生受限 Virtual Key

使用 `LITELLM_MASTER_KEY` 向 Gateway 發送 `/key/generate` 請求：

```bash
# 讀取 Master Key
source .env

# 產生會議系統專用 Virtual Key (僅限 meeting-stt 與 meeting-llm)
curl -s -X POST "http://127.0.0.1:4000/key/generate" \
  -H "Authorization: Bearer ${LITELLM_MASTER_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "meeting-app-prod",
    "models": ["meeting-stt", "meeting-llm"],
    "duration": "30d",
    "rpm_limit": 30,
    "tpm_limit": 50000,
    "metadata": {"project": "meeting-transcription", "env": "prod"}
  }' | jq .
```

*回傳範例：*
```json
{
  "key": "sk-litellm-123456abcdef...",
  "key_alias": "meeting-app-prod",
  "expires": "2026-09-30T00:00:00.000Z",
  "models": ["meeting-stt", "meeting-llm"]
}
```

> [!IMPORTANT]
> 請立即將回傳的 `key`（如 `sk-litellm-...`）記錄並保存至會議系統專案的 `.env` 中；該完整 Key 僅在建立當下顯示一次。

---

### Step 3：多租戶權限與負向測試指令

驗證 Virtual Key 是否確實被模型白名單限制：

```bash
# 設定剛產生的 Virtual Key
export MEETING_VIRTUAL_KEY="sk-litellm-你的金鑰"

# 1. 【正向測試】呼叫允許的模型 (meeting-llm) ➔ 應回傳 200 OK
curl -s -X POST "http://127.0.0.1:4000/v1/chat/completions" \
  -H "Authorization: Bearer ${MEETING_VIRTUAL_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meeting-llm",
    "messages": [{"role": "user", "content": "測試授權模型"}]
  }' | jq .

# 2. 【負向測試】越權呼叫未開放的模型 (nchc-chat) ➔ 應回傳 400/403 錯誤
curl -s -X POST "http://127.0.0.1:4000/v1/chat/completions" \
  -H "Authorization: Bearer ${MEETING_VIRTUAL_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nchc-chat",
    "messages": [{"role": "user", "content": "嘗試越權呼叫"}]
  }' | jq .
```

---

### Step 4：查詢金鑰狀態與緊急撤銷 (Key Revoke)

在管理維運與安全應變時的常用指令：

```bash
# 1. 查詢特定 Virtual Key 的使用資訊與剩餘額度
curl -s -X GET "http://127.0.0.1:4000/key/info?key=${MEETING_VIRTUAL_KEY}" \
  -H "Authorization: Bearer ${LITELLM_MASTER_KEY}" | jq .

# 2. 緊急撤銷 Virtual Key (刪除金鑰)
curl -s -X POST "http://127.0.0.1:4000/key/delete" \
  -H "Authorization: Bearer ${LITELLM_MASTER_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "keys": ["'"${MEETING_VIRTUAL_KEY}"'"]
  }' | jq .

# 3. 驗證撤銷後呼叫立即被拒絕 (回傳 401)
curl -s -o /dev/null -w "HTTP 狀態碼: %{http_code}\n" -X POST "http://127.0.0.1:4000/v1/chat/completions" \
  -H "Authorization: Bearer ${MEETING_VIRTUAL_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"model": "meeting-llm", "messages": []}'
```

---

## 4. 課堂多租戶劃分標準配置表

| 租戶 / Virtual Key | 允許存取之模型別名 | RPM 限制 | TPM 限制 | 建議有效期 | 主要用途 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `team-a-dev` | `nchc-chat` | 10 | 20,000 | 7 天 | 一般內部團隊對話練習 |
| `team-b-eval` | `nchc-chat`, `openai-chat` (選配) | 20 | 40,000 | 14 天 | 多模型評測與比較 |
| `meeting-app-prod` | `meeting-stt`, `meeting-llm` | 30 | 60,000 | 30 天 | **第 5、6 章會議轉錄系統** |

---

## 5. 🎯 本章完成檢核清單 (Checklist)

請確認以下項目均已驗證通過：

- [ ] **資料庫持久化**：已成功部署 PostgreSQL 容器，且 LiteLLM 容器重啟後金鑰資料依然存在。
- [ ] **權限隔離**：已為會議系統發放專用 Virtual Key，並明確限制僅允許 `meeting-stt` 與 `meeting-llm`。
- [ ] **正向測試通過**：使用 Virtual Key 呼叫 `meeting-llm` 成功取得回應。
- [ ] **負向防禦驗證**：使用 Virtual Key 呼叫未授權模型時確實被 Gateway 攔截並回傳錯誤。
- [ ] **金鑰撤銷演練**：已掌握透過 `/key/delete` 撤銷金鑰並驗證 401 拒絕之流程。
- [ ] **機密保護**：PostgreSQL 密碼與 Master Key 僅保留於伺服器端 `.env`，未提交至 Git。

> [!TIP]
> 下一步：前往 [第 5 章：從生活看機械：互動式四連桿模擬器與 AI 輔助開發](/guide/05_four_bar_linkage_simulator)，學習如何以 4 輪階梯式 Prompt 引導 AI 打造動態 Web 應用與 Docker 封裝！（若想探索企業級語音轉錄與串流摘要實作，亦可前往 [延伸案例 1：AI 會議轉錄與紀錄系統](/cases/01_ai_meeting_transcription)）
