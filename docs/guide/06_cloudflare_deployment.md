# 第 6 章：Cloudflare Tunnel 與正式部署

Antigravity Ports 解決的是「學員如何在個人電腦查看遠端 VM 上的開發服務」；而 **Cloudflare Tunnel 搭配 Cloudflare Zero Trust** 解決的是「如何免開防火牆連接埠，將在遠端主機上運行的應用程式（如第 5 章打造的**互動式四連桿機械模擬器**），安全發布至網際網路，讓任何人或自己在智慧型手機上流暢操作」。

---

## 1. 開發預覽與正式發布架構

在進入實作前，必須明確區分開發階段、臨時測試與正式生產階段的環境差異：

| 項目 | Antigravity Ports | Quick Tunnel (`--url`) | 具名 Tunnel + Access (正式) |
| :--- | :--- | :--- | :--- |
| **主要目的** | 個人開發、即時熱重載除錯 | 臨時快速展示、手機跨裝置體驗 | 正式對外提供穩定、受控的生產環境服務 |
| **目標受眾** | 目前連線中的開發者本人 | 臨時觀看 Demo 的特定對象、課堂即時互動 | 經身分驗證授權的外部使用者／組織成員 |
| **生命週期** | 依賴 Remote SSH / IDE 工作階段 | 依賴終端機指令（中斷即失效） | 由 Linux `systemd` 服務常駐運行，重啟自動恢復 |
| **連線網址** | 本機預覽位址（`localhost:<port>` 轉發） | 隨機產生的 `trycloudflare.com` 網址 | 固定自訂 HTTPS 網域（如 `linkage.yourdomain.com`） |
| **安全驗證** | 開發工具工作階段權限 | ❌ 無（公網公開） | Cloudflare Access 身分驗證（Email OTP / SSO） |
| **連線效率** | 本地 SSH 隧道轉發 | Cloudflare 邊緣 CDN 動態穿透 | 完整邊緣快取、自訂防護規則與 HTTP/2 支援 |

> [!WARNING]
> **切勿將開發伺服器直接暴露公網**：
> 在第 5 章中，我們已經將四連桿模擬器透過 Dockerfile 打包成極輕量的 Nginx 靜態映像並綁定在 `127.0.0.1:8090`，這具備了生產部署的標準體質。

---

## 2. 雲端零信任（Zero Trust）部署拓撲

正式發布時，Linux VM 主機**完全不需要在晶創雲防火牆（Security Group）開放 80、443 或 8090 埠號**。

```text
[學員手機 / 外部訪客瀏覽器]
       │ HTTPS (固定網域: linkage.yourdomain.com 或 臨時 trycloudflare.com)
       ▼
[Cloudflare 邊緣防護層 (Anycast CDN + DDoS Protection)]
       │ (選用) Cloudflare Access 身分驗證 (OTP / 組織白名單)
       ▼
[Cloudflare Tunnel 加密 Outbound 雙向通道]
       │ 安全穿透 (主機無須開放任何 Inbound 端口)
       ▼
[Linux VM 主機：cloudflared connector (systemd)]
       │ 本地轉發至 127.0.0.1:8090
       ▼
[四連桿機械模擬器 Docker 容器 :8090]
       ├── 前端：60 FPS Canvas 物理引擎、生活預設庫與死點警示
       └── 後端：POST /api/diagnose (持有第 4 章 fourbar-app-key)
              │ (主機內部通訊，絕不暴露公網)
              ▼
[LiteLLM Gateway :4000 (內部隔離)] ──▶ [國網 TAIWAN AI RAP API]
       └── 提供 tutor-llm 智慧幾何死點診斷與一鍵修復建議
```

### 核心安全原則
1. **零開放 Inbound 端口**：VM 主機完全不對公網開放端口，有效杜絕惡意 Port 掃描與網路攻擊。
2. **自動 HTTPS / TLS**：由 Cloudflare 邊緣節點自動配發並續期 SSL 憑證，手機開啟不會跳出安全警告。
3. **內部大腦隔離防護**：外部訪客僅能存取四連桿 Web 前端，背後的 LiteLLM Gateway (`:4000`)、PostgreSQL 與國網 API Key 100% 封裝在主機內部，完全對外隱蔽。

---

## 3. 🤖 自然語言 Prompt 配方（可直接複製給 AI Agent）

在 Antigravity 對話框中，你可以直接複製以下 Prompt 讓 AI 協助執行部署規劃與驗證：

### 模式 A：快速展示測試（免網域、免帳號 Quick Tunnel）

```markdown
請幫我在這台 Linux 主機上安裝 cloudflared，並為目前在 Port 8090 運行的四連桿機械模擬器容器建立臨時的免費 HTTPS 測試通道（Quick Tunnel）：

1. 檢查系統是否已安裝 cloudflared，若無請依主機架構下載官方最新 .deb 安裝。
2. 確認本機 127.0.0.1:8090 服務正常響應（curl -I http://127.0.0.1:8090）。
3. 啟動臨時通道：cloudflared tunnel --url http://localhost:8090。
4. 擷取終端機中產生的 https://xxxx.trycloudflare.com 網址並回報給我，讓我能用手機掃描或點擊測試。
```

### 模式 B：正式生產部署（具名 Tunnel + 自訂網域 + Systemd 常駐）

```markdown
請協助我在這台 Linux 主機上設定正式的 Cloudflare Tunnel 常駐服務：

1. 驗證 cloudflared --version 安裝狀態。
2. 提示：當需要執行含有 Cloudflare Tunnel Token 的安裝指令時，請暫停並提示我手動在終端機貼上執行，切勿要求我將 Token 傳入對話紀錄中。
3. 在我手動安裝 Connector 後，協助檢查 systemd 服務狀態（sudo systemctl status cloudflared）與近期日誌。
4. 驗證本機 127.0.0.1:8090 的連線轉發狀態。
```

### 模式 C：四連桿模擬器 Docker 容器健康檢查與修復

```markdown
請對目前的四連桿模擬器容器進行健康檢查：
1. 檢查 Docker 容器運行狀態（docker ps -a | grep four-bar-app）。
2. 若容器未啟動或當機，請重新啟動並確保綁定至 127.0.0.1:8090:80。
3. 透過 curl -I http://127.0.0.1:8090 測試 Nginx 回應標頭與 HTTP 200 狀態。
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

### Step 2（極速體驗）：免網域 Quick Tunnel 讓手機連線四連桿模擬器

> 適合 5 分鐘內的課堂即時互動、手機平板跨裝置觸控操作或展示給朋友。

#### 1. 確保第 5 章的四連桿容器正在運行
```bash
# 檢查 Port 8090 是否正常回應
curl -I http://127.0.0.1:8090

# 若尚未啟動，請執行啟動指令：
# docker run -d --name four-bar-app --restart always -p 127.0.0.1:8090:80 four-bar-simulator:v1
```

#### 2. 啟動 Quick Tunnel
```bash
cloudflared tunnel --url http://localhost:8090
```

*終端機輸出範例：*
```text
2026-09-03T08:00:00Z INF +--------------------------------------------------------------------------------------------+
2026-09-03T08:00:00Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2026-09-03T08:00:00Z INF |  https://creative-machinery-test.trycloudflare.com                                       |
2026-09-03T08:00:00Z INF +--------------------------------------------------------------------------------------------+
```

#### 3. 拿起手機掃描或輸入網址！
- 在手機瀏覽器中開啟該 `https://*.trycloudflare.com` 網址。
- **動手玩玩看**：用手指在手機螢幕上拖曳曲柄節點 A，觀察汽車雨刷與柴比雪夫直線機構的 60 FPS 即時流暢渲染！
- 測試結束後，在終端機按下 `Ctrl + C` 即可停止並關閉通道。

---

### Step 3：正式生產部署：Cloudflare Zero Trust 具名 Tunnel

若希望擁有**固定自訂網域**（例如 `linkage.yourdomain.com`）且伺服器重啟後自動恢復，請依序完成具名 Tunnel 設定：

> [!IMPORTANT]
> **Token 安全守則**：Tunnel Token 代表該通道的控制權限。**請親自在終端機貼上執行，切勿寫入 Git、README 或 AI 提示詞中**。

1. 開啟瀏覽器，登入 [Cloudflare Zero Trust 控制台](https://one.dash.cloudflare.com/)。
2. 進入 **Networks** ➔ **Tunnels** ➔ 點擊 **Add a tunnel**。
3. 選擇 **Cloudflared** 類型，為 Tunnel 命名（例如 `fourbar-linkage-prod`）。
4. 在 **Install and run a connector** 頁籤中選擇 **Debian** / **64-bit**，複製系統產生的安裝指令。
5. 回到 Linux VM 終端機執行該指令：

```bash
# 由 Cloudflare 後台複製產生之專屬指令（示例如下）：
sudo cloudflared service install <YOUR_TUNNEL_TOKEN>
```

該指令會自動完成：
- 在 `/etc/systemd/system/cloudflared.service` 建立服務設定。
- 將 Tunnel 憑證安全保存在系統目錄。
- 啟動 `cloudflared` 並設為開機自動啟動。

---

### Step 4：常用 systemd 管理與連線監控指令

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

# 查看即時連線日誌
sudo journalctl -u cloudflared -f
```

---

### Step 5：Cloudflare Zero Trust 路由設定 (Public Hostname)

完成 Connector 連線後，在 Cloudflare 後台設定網域路由：

1. 在 Zero Trust 後台進入 **Networks** ➔ **Tunnels** ➔ 點擊剛才建立的 Tunnel ➔ 點選 **Configure**。
2. 切換到 **Public Hostnames** 頁籤 ➔ 點擊 **Add a public hostname**。
3. 填寫轉發設定：
   - **Public Hostname**：
     - Subdomain：`linkage`（或自訂子網域）
     - Domain：`yourdomain.com`（你在 Cloudflare 代管的網域）
     - Path：留空（代表根路徑）
   - **Service**：
     - Type：`HTTP`
     - URL：`127.0.0.1:8090`（精準指向四連桿模擬器 Docker 容器）
4. 點擊 **Save hostname**。全球 DNS 紀錄與 SSL 憑證將在數秒內自動生效。

---

### Step 6（進階防護）：設定 Cloudflare Access 存取原則

若你的應用程式僅供課堂內部或特定團隊存取，可啟用 Access 身分驗證防護：

1. 在 Zero Trust 後台導航至 **Access** ➔ **Applications** ➔ 點擊 **Add an application**。
2. 選擇 **Self-hosted**。
3. 設定應用程式名稱（如 `Four-Bar Linkage Simulator`）與網域名稱（`linkage.yourdomain.com`）。
4. 新增存取規則（**Add Policy**）：
   - Action：`Allow`
   - Configure rules：選擇 `Emails` 或 `Emails ending in`（例如學校信箱 `@school.edu.tw`）。
5. 儲存後，訪客存取該網址時，Cloudflare 會先在邊緣層要求輸入 Email 驗證碼（OTP），驗證通過後才轉發至你的主機，達成真正的「零信任安全防護」！

---

## 5. 部署驗收清單與分層故障排除 (Troubleshooting SOP)

當部署完成或遭遇連線問題時，請遵循「**由外向內、由淺入深**」的分層排除原則：

```text
[1. 手機/瀏覽器端]
      │
      ▼
[2. Cloudflare Access 驗證層] ── 檢查是否出現 403 Forbidden 或 OTP 驗證失敗
      │
      ▼
[3. Cloudflare Tunnel / Connector] ── 檢查 sudo systemctl status cloudflared 是否在線
      │
      ▼
[4. 四連桿 Docker 容器 (:8090)] ── 檢查 docker ps 與 curl -I http://127.0.0.1:8090
```

### 常見問題排查

#### Q1：手機開啟網址顯示 `502 Bad Gateway`
- **原因**：Cloudflare Tunnel 連線正常，但本地 `127.0.0.1:8090` 容器未啟動或埠號配置錯誤。
- **排除步驟**：
  ```bash
  # 1. 檢查容器是否運行中
  docker ps | grep four-bar-app
  
  # 2. 本機直接 curl 測試
  curl -I http://127.0.0.1:8090
  
  # 3. 檢查 Nginx 容器日誌
  docker logs four-bar-app
  ```

#### Q2：Quick Tunnel 終端機顯示連線逾時
- **原因**：主機對 Cloudflare 邊緣節點的 Outbound 7844 (UDP/TCP) 或 443 埠連線不穩。
- **排除步驟**：可嘗試加入 `--protocol http2` 參數重新執行：
  ```bash
  cloudflared tunnel --protocol http2 --url http://localhost:8090
  ```

---

## 6. 課後資源清理與停機 SOP

課程結束或展示完畢後，請執行清理以維護系統清潔：

```bash
# 1. 停止並移除 cloudflared 系統服務
sudo systemctl stop cloudflared
sudo systemctl disable cloudflared
sudo cloudflared service uninstall

# 2. 停止並刪除四連桿模擬器容器
docker stop four-bar-app
docker rm four-bar-app

# 3. 前往 Cloudflare Zero Trust 控制台刪除 Public Hostname 與 Tunnel 實例
```

---

## 7. 🎯 全章完成檢核清單 (Checklist)

請確認以下每一項均已完成驗收：

- [ ] **容器運行**：四連桿模擬器容器在背景正常運行，本機 `curl -I http://127.0.0.1:8090` 回傳 HTTP 200。
- [ ] **套件安裝**：Linux VM 已安裝最新官方 `cloudflared`，並驗證 `cloudflared --version`。
- [ ] **Quick Tunnel 體驗**：成功使用 `cloudflared tunnel --url http://localhost:8090` 並在手機上流暢操作連桿機構。
- [ ] **正式具名部署**：已了解並實作 Connector 註冊為 `systemd` 服務與自訂網域路由。
- [ ] **機密防護**：Tunnel Token 由本人直接於終端機操作，未記錄在對話紀錄或公開文件中。

> [!TIP]
> 下一步：前往 [第 7 章：HostSpark 24/7 主機 AI 代理與 Telegram 行動自主維運](/guide/07_telegram_vm_bridge)，探索如何透過 HostSpark 代理隨身監控這台伺服器並設定自動化巡檢！
