# 第 6 章：Cloudflare Tunnel 與正式部署

Antigravity Ports 解決的是「學員如何查看遠端開發服務」；Cloudflare Tunnel 搭配 Cloudflare Zero Trust 解決的是「外部使用者如何透過固定 HTTPS 網域安全、持續地存取正式發布的 AI 應用」。

---

## 1. 開發預覽與正式發布架構

在進入實作前，必須明確區分開發階段、臨時測試與正式生產階段的環境差異：

| 項目 | Antigravity Ports | Quick Tunnel (`--url`) | 具名 Tunnel + Access (正式) |
| :--- | :--- | :--- | :--- |
| **主要目的** | 個人開發、即時熱重載除錯 | 臨時快速展示、跨裝置短暫測試 | 正式對外提供穩定、受控的生產環境服務 |
| **目標受眾** | 目前連線中的開發者本人 | 臨時觀看 Demo 的特定對象 | 經身分驗證授權的外部使用者／團隊成員 |
| **生命週期** | 依賴 Remote SSH / IDE 工作階段 | 依賴終端機指令（中斷即失效） | 由 Linux `systemd` 服務常駐運行，重啟自動恢復 |
| **連線網址** | 本機預覽位址（`localhost:<port>` 轉發） | 隨機產生的 `trycloudflare.com` 網址 | 固定自訂 HTTPS 網域（如 `meeting.yourdomain.com`） |
| **安全驗證** | 開發工具工作階段權限 | ❌ 無（公網公開） | Cloudflare Access 身分驗證（Email OTP / SSO） |
| **SSE 串流** | ✅ 完整支援 | ❌ 易中斷或無法即時串流 | ✅ 完整支援 HTTP/2 與 SSE 長連線 |

> [!WARNING]
> **切勿將開發伺服器當作正式部署**：開發模式（如 `npm run dev`）包含大量除錯程式碼、熱重載開銷，且未經過打包最佳化，亦缺乏安全防護。

---

## 2. 正式服務零信任（Zero Trust）拓撲

正式發布時，主機上的所有後端與資料庫服務均不得直接對公網開放 Inbound Port。整個流量路徑如下：

```text
[外部使用者 / 瀏覽器]
       │ HTTPS（固定自訂網域：meeting.yourdomain.com）
       ▼
[Cloudflare Access 邊緣層] ──▶ 檢查身分驗證（Email OTP / 組織白名單）
       │ 驗證通過
       ▼
[Cloudflare Tunnel（加密 Outbound 通道）]
       │ 安全穿透（主機無須開放 Inbound 80/443 Port）
       ▼
[Linux VM 主機：cloudflared connector (systemd)]
       │ 轉發至本地容器
       ▼
[Next.js 會議轉錄前端 :3000 (Production Build)]
       │ 使用專屬受限 Virtual Key (僅限 meeting-stt, meeting-llm)
       ▼
[LiteLLM Gateway :4000 (內部 Docker 網路)] ──▶ [PostgreSQL :5432 (內部儲存)]
       │ 持有真正 Provider Keys (集中管控)
       ├── 國網 TAIWAN AI RAP API
       └── 其他授權模型 API (OpenAI / Claude / etc.)
```

### 核心安全原則
1. **零開放 Inbound 端口**：VM 主機完全不需要在晶創雲防火牆開放 80、443 或 3000 埠號，杜絕公網 Port 掃描。
2. **自動 HTTPS / TLS**：由 Cloudflare 邊緣節點自動配發並續期 SSL 憑證，並預設提供全球 CDN 與 DDoS 防護。
3. **最小暴露面**：外部僅能存取 Next.js 會議系統；LiteLLM Gateway、PostgreSQL 資料庫與所有上游 API Key 全數封裝在內部網路中。

---

## 3. 🤖 自然語言 Prompt 配方（可直接複製給 AI Agent）

在 Antigravity 或終端機 AI Agent 環境中，你可以直接複製以下 Prompt 讓 AI 協助執行部署規劃與驗證。

### 模式 A：生產環境映像打包與 Docker Compose 部署

```markdown
請檢查 ~/aicloud-course 目錄下的 Next.js 會議轉錄系統（meeting-app）與 LiteLLM Gateway（gateway），協助我建立正式環境的 Docker Compose 部署配置：

1. Next.js 必須使用 Production Build（Dockerfile），並確認所有靜態資源打包成功。
2. 在 ~/aicloud-course 目錄下建立 docker-compose.prod.yml：
   - Next.js 服務綁定主機 127.0.0.1:3000:3000。
   - LiteLLM 僅綁定 127.0.0.1:4000:4000（或僅保留於容器內部網路）。
   - PostgreSQL 嚴禁發布主機 Port（僅容器內部互通）。
3. 設定 restart: always 以確保開機與當機時自動重啟。
4. 啟動所有容器並執行健康檢查，驗證本機 127.0.0.1:3000 與 127.0.0.1:4000 可正常回應。
5. 切勿輸出任何 API Key、資料庫密碼或機密設定。
```

### 模式 B：正式生產部署（具名 Tunnel + 自訂網域 + Systemd 常駐）

```markdown
請協助我在這台 Linux 主機上安裝 Cloudflare Connector（cloudflared）並設定正式常駐服務：

1. 檢查主機 CPU 架構（x86_64 / arm64）與作業系統版本，下載官方對應的 cloudflared .deb 套件並安裝。
2. 驗證 cloudflared --version 安裝成功。
3. 提示：當需要執行含有 Cloudflare Tunnel Token 的安裝指令時，請暫停並提示我手動在終端機貼上執行，切勿要求我將 Token 提供給對話日誌。
4. 在我手動安裝 connector 後，協助檢查 systemd 服務狀態（sudo systemctl status cloudflared）與近期日誌。
5. 驗證本機 127.0.0.1:3000 的連線狀態，確保 Connector 能正常轉發流量。
```

### 模式 C：部署健康檢查與連線除錯

```markdown
請對目前的正式部署環境進行全鏈路健康檢查與狀態診斷：

1. 檢查 Docker 容器運行狀態（docker compose -f docker-compose.prod.yml ps）與記憶體/CPU 資源佔用。
2. 測試本機 Next.js 首頁與 API 健康檢查端點（curl -I http://127.0.0.1:3000）。
3. 檢查 cloudflared 系統服務運行狀態與錯誤日誌（journalctl -u cloudflared -n 50 --no-pager）。
4. 驗證 Next.js 容器能否正常解析並連線至 LiteLLM 容器（http://litellm:4000/health）。
5. 回報檢查摘要，若有異常請指出具體修復建議，切勿輸出任何機密 Token。
```

### 模式 D：快速展示測試（免網域、免帳號 Quick Tunnel）

```markdown
請幫我在這台 Linux 主機上安裝 cloudflared，並為目前本機執行的服務建立臨時的免費 HTTPS 測試通道（Quick Tunnel）：

1. 檢查系統是否已安裝 `cloudflared`，若無請下載官方 .deb 套件安裝。
2. 啟動臨時通道：`cloudflared tunnel --url http://localhost:3000`。
3. 擷取並回傳終端機中產生的 `https://xxxx.trycloudflare.com` 公開測試網址。
4. 提醒：這僅供臨時展示測試使用，測試完畢後按 Ctrl+C 即可中斷。
```

---

## 4. 💻 終端機手動執行指令 (Manual Commands & Step-by-Step)

以下為在 Linux VM（Ubuntu / Debian）終端機中手動執行的完整操作流程。

### Step 1：安裝 `cloudflared` (適用 Ubuntu / Debian)

無論是快速測試還是正式部署，第一步都是在 Linux VM 上安裝官方 `cloudflared` 工具：

```bash
# 1. 檢查主機硬體架構 (x86_64 或 arm64)
ARCH=$(dpkg --print-architecture)
echo "目前系統架構: $ARCH"

# 2. 下載官方最新 deb 安裝檔並安裝
curl -L --output /tmp/cloudflared.deb "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" && \
sudo dpkg -i /tmp/cloudflared.deb && \
rm -f /tmp/cloudflared.deb

# 3. 驗證安裝結果
cloudflared --version
```

---

### Step 2（快速體驗）：免網域 Quick Tunnel 測試

> 適合 5 分鐘內的快速 Demo、手機端跨裝置預覽或臨時分享給同事。

```bash
# 針對前端 Next.js / React 服務 (Port 3000)
cloudflared tunnel --url http://localhost:3000

# 針對後端 FastAPI / Express 服務 (Port 8000)
# cloudflared tunnel --url http://localhost:8000
```

*終端機輸出範例：*
```text
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://random-words-1234.trycloudflare.com                                               |
+--------------------------------------------------------------------------------------------+
```

複製該網址即可在任何聯網裝置上透過 HTTPS 開啟服務。按下 `Ctrl + C` 即可停止並關閉通道。

> [!NOTE]
> Quick Tunnel 適合快速驗證介面版面；若要進行完整的 AI 會議轉錄（錄音檔上傳與 SSE 即時串流）與長期穩定運行，請繼續依照下方步驟進行**正式具名 Tunnel 部署**。

---

### Step 3：正式生產環境打包與 Docker Compose 啟動

在 `~/aicloud-course` 目錄下整合前述章節之 `gateway` 與 `meeting-app`，以 Production 模式運行：

```bash
# 1. 進入課程統一工作目錄
cd ~/aicloud-course

# 2. 建立正式環境 Docker Compose 設定檔 (docker-compose.prod.yml)
cat <<'EOF' > docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: meeting-postgres
    restart: always
    environment:
      POSTGRES_DB: litellm
      POSTGRES_USER: litellm_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal_net
    # 注意：不發布 host ports，嚴禁直接暴露公網

  litellm:
    image: ghcr.io/berriai/litellm:main-v1.40.0
    container_name: meeting-litellm
    restart: always
    ports:
      - "127.0.0.1:4000:4000" # 僅綁定本機 localhost
    environment:
      DATABASE_URL: "postgresql://litellm_user:${DB_PASSWORD}@postgres:5432/litellm"
      LITELLM_MASTER_KEY: ${LITELLM_MASTER_KEY}
    volumes:
      - ./gateway/config.yaml:/app/config.yaml
    command: ["--config", "/app/config.yaml", "--port", "4000"]
    depends_on:
      - postgres
    networks:
      - internal_net

  nextjs-app:
    build:
      context: ./meeting-app
      dockerfile: Dockerfile
    container_name: meeting-frontend
    restart: always
    ports:
      - "127.0.0.1:3000:3000" # 僅綁定本機 localhost，供 cloudflared 轉發
    environment:
      NODE_ENV: production
      LITELLM_BASE_URL: "http://litellm:4000"
      LITELLM_VIRTUAL_KEY: ${MEETING_VIRTUAL_KEY}
    depends_on:
      - litellm
    networks:
      - internal_net

networks:
  internal_net:
    driver: bridge

volumes:
  postgres_data:
EOF

# 3. 啟動生產環境服務
docker compose -f docker-compose.prod.yml up -d --build

# 4. 驗收本機服務監聽狀況（確認僅 127.0.0.1 監聽，無 0.0.0.0）
ss -tulpn | grep -E ':(3000|4000)'
curl -I http://127.0.0.1:3000
```

---

### Step 4：Cloudflare Zero Trust 建立具名 Tunnel (Named Tunnel)

> [!IMPORTANT]
> **Token 安全守則**：Tunnel Token 代表該通道的控制權限。**請親自在終端機貼上執行，切勿寫入 Git、README 或 AI 提示詞中**。

1. 開啟瀏覽器，登入 [Cloudflare Zero Trust 控制台](https://one.dash.cloudflare.com/)。
2. 進入 **Networks** ➔ **Tunnels** ➔ 點擊 **Add a tunnel**。
3. 選擇 **Cloudflared** 類型，為 Tunnel 命名（例如 `aicloud-meeting-prod`）。
4. 在 **Install and run a connector** 頁籤中選擇 **Debian** / **64-bit**，複製系統產生的安裝指令。
5. 回到 Linux VM 終端機執行該指令（包含 service install 與 token 註冊）：

```bash
# 由 Cloudflare 後台複製產生之專屬指令（示例如下）：
sudo cloudflared service install <YOUR_TUNNEL_TOKEN>
```

該指令會自動完成：
- 在 `/etc/systemd/system/cloudflared.service` 建立服務設定。
- 將 Tunnel 憑證安全保存在系統目錄。
- 啟動 `cloudflared` 並設為開機自動啟動。

---

### Step 5：常用 systemd 管理與連線監控指令

在日常維運時，請使用以下指令管理 Connector：

```bash
# 檢查 cloudflared 服務狀態（確認顯示 active (running)）
sudo systemctl status cloudflared --no-pager

# 啟動 / 停止 / 重啟服務
sudo systemctl start cloudflared
sudo systemctl stop cloudflared
sudo systemctl restart cloudflared

# 設定 / 取消開機自啟動
sudo systemctl enable cloudflared
sudo systemctl disable cloudflared

# 查看即時連線日誌 (追蹤連線邊緣節點狀態)
sudo journalctl -u cloudflared -f

# 查看最近 10 分鐘的日誌
sudo journalctl -u cloudflared --since "10 minutes ago" --no-pager
```

---

## 5. 深入解析：為什麼正式發布不採用 Quick Tunnel？

了解工具的邊界，是系統架構設計的重要一環：

| 評估維度 | Quick Tunnel (`trycloudflare.com`) | 具名 Tunnel (Named Tunnel) |
| :--- | :--- | :--- |
| **網址性質** | 每次啟動隨機產生，無法固定 | 固定自訂網域（`meeting.yourdomain.com`） |
| **SSE 串流支援** | ❌ **不支援 Server-Sent Events**（串流會中斷或失效） | ✅ **完整支援 HTTP/2 與 SSE 長連線串流** |
| **連線並發限制** | 超過並發連線即回傳 `429 Too Many Requests` | 企業級高頻寬與高並發支援 |
| **身分驗證防護** | ❌ 無法掛載 Cloudflare Access（公網裸露） | ✅ **可直接綁定 Cloudflare Access 身分驗證** |
| **連線常駐維運** | 需手動保持終端機 Session | 支援 `systemd` 背景常駐與當機自動重啟 |

> [!CAUTION]
> 本課程之會議轉錄系統高度依賴 **SSE (Server-Sent Events)** 即時串流語音辨識與 LLM 摘要，且 AI API 呼叫會耗費實質點數與費用。使用 Quick Tunnel 不僅會造成即時文字串流功能失效，更可能因公網裸露導致 API 額度被惡意盜刷。

---

## 6. Cloudflare Zero Trust 存取防護與網域路由設定

完成 Connector 安裝後，回到 Cloudflare Zero Trust 後台進行安全發布：

### 步驟一：設定 Cloudflare Access 應用程式防護（最重要防線）

因為我們的 Next.js 前端並未內建使用者註冊與資料庫帳密系統，**必須透過 Cloudflare Access 在邊緣層阻擋未授權存取**。

1. 在 Zero Trust 後台導航至 **Access** ➔ **Applications** ➔ 點擊 **Add an application**。
2. 選擇 **Self-hosted**。
3. 設定基本資訊：
   - **Application name**：`AI Meeting Transcription System`
   - **Session Duration**：選擇 `24 Hours`（依團隊安全政策調整）
   - **Application domain**：
     - Subdomain: `meeting`
     - Domain: `yourdomain.com`（你的代管網域）
4. 設定存取規則（**Add Policy**）：
   - **Policy Name**：`Allow Team Members`
   - **Action**：`Allow`
   - **Configure rules (Include)**：
     - 選擇 `Emails` ➔ 輸入允許授權的成員信箱（例如 `student@example.com`）
     - 或選擇 `Emails ending in` ➔ 輸入組織網域（例如 `@yourcompany.com`）
5. 點擊 **Save** 完成防護設定。使用者存取該網址時，會先看到 Cloudflare OTP 登入驗證頁面，驗證成功後才放行至應用程式。

---

### 步驟二：設定 Public Hostname 路由

1. 在 Zero Trust 後台進入 **Networks** ➔ **Tunnels** ➔ 點擊剛才建立的 Tunnel ➔ 點選 **Configure**。
2. 切換到 **Public Hostnames** 頁籤 ➔ 點擊 **Add a public hostname**。
3. 填寫轉發設定：
   - **Public Hostname**：
     - Subdomain：`meeting`
     - Domain：`yourdomain.com`
     - Path：留空（代表全部路徑）
   - **Service**：
     - Type：`HTTP`
     - URL：`127.0.0.1:3000`（轉發至本機 Next.js 服務）
4. 展開 **Additional application settings** ➔ **HTTP Settings**（建議設定）：
   - 開啟 **HTTP2 Support**（提升 SSE 串流與多請求效率）
   - Connection Timeout：`30s`
5. 點擊 **Save hostname**。DNS 紀錄與 SSL 憑證將在數秒內自動生效。

---

## 7. 為什麼嚴格禁止公開 LiteLLM API 與 PostgreSQL？

在標準架構中，外部使用者僅需使用會議轉錄 Web 介面，**絕不可把 LiteLLM API (`:4000`) 或 PostgreSQL (`:5432`) 直接設定為 Public Hostname**。

### 安全風險分析
1. **API Key 盜用與額度耗盡**：若 LiteLLM API 缺乏 Access 防護直接公開，任何取得端點的人均可濫用您的國網或商業模型額度。
2. **Master Key 洩漏風險**：LiteLLM 的管理介面（Dashboard）具備發放 Key 與修改費率權限，暴露於公網極易遭到暴力破解。
3. **資料庫注入與竊取**：PostgreSQL 儲存了所有對話紀錄、模型日誌與虛擬金鑰，必須只允許 Docker 內部網路存取。

> [!TIP]
> **若未來確實需要對外提供 API 服務**：
> 應另外建立專屬的 Public Hostname（如 `api.yourdomain.com`），並在 Cloudflare Access 中強制啟用 **Service Token 機器認證**，同時在 LiteLLM 內部為每個外部呼叫端分配獨立的 Virtual Key，設定嚴格的 RPM / TPM / 預算上限與模型白名單。

---

## 8. 部署驗收清單與分層故障排除 (Troubleshooting SOP)

當部署完成或遭遇連線問題時，請遵循「**由外向內、由淺入深**」的分層排除原則：

```text
[1. 瀏覽器端]
      │
      ▼
[2. Cloudflare Access 驗證層] ── 檢查是否出現 403 Forbidden 或 OTP 驗證失敗
      │
      ▼
[3. Cloudflare Tunnel / Connector] ── 檢查 sudo systemctl status cloudflared 是否連線
      │
      ▼
[4. Next.js 前端容器 (:3000)] ── 檢查 docker logs meeting-frontend 與本機 curl
      │
      ▼
[5. LiteLLM Gateway (:4000)] ── 檢查 Virtual Key 是否有效、是否被 Rate Limit
      │
      ▼
[6. 上游 Provider (國網 RAP)] ── 檢查上游 API Key 餘額與網路連線狀態
```

### 常見問題排查與解決對策

#### Q1：瀏覽器出現 `502 Bad Gateway`
- **可能原因**：Cloudflare Tunnel 連線正常，但本地 `127.0.0.1:3000` 服務未啟動或無法回應。
- **排除步驟**：
  ```bash
  # 1. 檢查 Next.js 容器是否正常運行
  docker compose -f docker-compose.prod.yml ps
  
  # 2. 測試本機能否連通 3000 埠
  curl -I http://127.0.0.1:3000
  
  # 3. 檢查 Next.js 容器錯誤日誌
  docker compose -f docker-compose.prod.yml logs --tail=50 nextjs-app
  ```

#### Q2：會議紀錄摘要無法即時串流（SSE 卡住或一次性吐出）
- **可能原因**：Proxy 緩衝區（Buffer）阻擋了串流封包，或使用了 Quick Tunnel。
- **排除步驟**：
  1. 確認未在 Quick Tunnel 下執行。
  2. 檢查 Cloudflare Tunnel 的 Public Hostname 設定中是否啟用了 HTTP2。
  3. 確認 Next.js API Route 中回應標頭包含：
     ```http
     Content-Type: text/event-stream
     Cache-Control: no-cache, no-transform
     Connection: keep-alive
     ```

#### Q3：Tunnel Token 意外洩漏（出現在 Git 或日誌中）
- **應急處理 SOP**：
  1. 立即登入 Cloudflare Zero Trust 控制台。
  2. 進入 **Networks** ➔ **Tunnels** ➔ 選擇該 Tunnel ➔ 點擊 **Delete** 刪除該通道。
  3. 重新建立新 Tunnel 並取得全新 Token。
  4. 在 Linux 主機重新執行 `sudo cloudflared service install <NEW_TOKEN>`。

---

## 9. 課後資源清理與金鑰撤銷 SOP

當課程結束或專案下線時，請依序執行清理以避免安全隱憂或非預期計費：

```bash
# 1. 撤銷會議系統專用 Virtual Key (登入 LiteLLM Dashboard 或透過 Admin API 刪除)

# 2. 停止並移除 cloudflared 系統服務
sudo systemctl stop cloudflared
sudo systemctl disable cloudflared
sudo cloudflared service uninstall

# 3. 停止並刪除所有專案容器與網路
cd ~/aicloud-course
docker compose -f docker-compose.prod.yml down -v

# 4. 前往 Cloudflare Zero Trust 控制台：
#    - 刪除 Public Hostname 路由 (meeting.yourdomain.com)
#    - 刪除 Access Application
#    - 刪除 Tunnel 實例

# 5. 檢查晶創雲主機資源與磁碟，若不再使用請停止或釋放 VM
```

---

## 10. 全章完成檢核清單 (Checklist)

請確認以下每一項均已完成驗收：

- [ ] **生產打包**：Next.js 已完成 Production Build，非 `npm run dev` 開發伺服器。
- [ ] **內部隔離**：LiteLLM Gateway 與 PostgreSQL 未發布公網 Port，僅限本機或內部容器網路通訊。
- [ ] **套件安裝**：Linux VM 已安裝最新官方 `cloudflared`，並驗證 `cloudflared --version`。
- [ ] **常駐服務**：`cloudflared` 已註冊為 `systemd` 服務，且重啟 VM 後能自動恢復連線。
- [ ] **機密防護**：Tunnel Token 由本人於終端機直接操作，未出現在對話紀錄、Git 或截圖中。
- [ ] **身分驗證**：已設定 Cloudflare Access 應用程式，未經授權之訪客會被攔截並要求登入。
- [ ] **清理演練**：已熟悉 Virtual Key 撤銷、Tunnel 註銷與容器關閉之清理流程。

> [!TIP]
> 下一步：前往 [第 7 章：HostSpark 24/7 主機 AI 代理與 Telegram 行動自主維運](/guide/07_telegram_vm_bridge)，探索如何透過 HostSpark 代理隨身監控這台伺服器並設定自動化巡檢！

