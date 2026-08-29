# 第 06 章：穿透發布與 24/7 維運篇 (方案 A)

在[第 05 章](file:///home/ubuntu/aicloud_agent_course/05_react_agent_dashboard.md)中，我們已經在本機晶創雲 CPU VM 完成了完整的 **AI Agent Runtime 後端 (FastAPI)** 與 **視覺化觀測台 (React)**。  
在最後一章中，我們將解決核心上線難題：  
👉 **「國網 VM 處於內網無公網 IP、僅借道跳板機，如何在不開放任何防火牆 Port 的前提下，將服務發布至全世界並獲得專屬 HTTPS 網址？」**

我們將使用 **Cloudflare Tunnel (方案 A)** 實現零開 Port 穿透，並以 **Systemd** 將服務配置為 24 小時不中斷開機自啟！

---

## 🔒 一、 為什麼選擇 Cloudflare Tunnel (方案 A 獨立模式)？

```
[ 晶創雲內網 VM (10.0.0.99) ] 
       │ 內部主動連出 (Outbound 加密通道)
       ▼
[ Cloudflare 全球邊緣節點 (台北 tpe01) ] ◄── (使用者瀏覽器 HTTPS) ── [ 外部全世界使用者 ]
```

- **零防火牆負擔**：晶創雲安全群組**完全不用開 80 或 443 Port**，免疫外部黑客掃描。
- **免固定公網 IP**：不需要向國網申請昂貴的浮動/固定 IP。
- **自帶 Valid HTTPS 與 DDoS 防護**：由 Cloudflare 全球節點負責簽發 SSL 憑證。

---

## 🚀 二、 極速測試：一行指令產生公開 HTTPS

在 VM 終端機中，只需一行指令即可將前端（Port 5173）發布至公網：

```bash
cloudflared tunnel --protocol http2 --url http://localhost:5173
```

終端機將輸出：
```text
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                                          |
|  https://xxxx-xxxx-xxxx.trycloudflare.com                                                  |
+--------------------------------------------------------------------------------------------+
```
👉 在任何手機或外部電腦直接打開該 `https://...` 網址，即可直接遠端操作您的 AI Agent！

---

## 🌐 三、 正式上線：綁定自有網域 (例如 `*.biobank.org.tw`)

若您在 Cloudflare 代管了網域名稱（例如 `biobank.org.tw`）：

### 步驟 1：在 Cloudflare Zero Trust 取得 Token
1. 登入 [Cloudflare Zero Trust 後台](https://one.dash.cloudflare.com/) ➔ **Networks** ➔ **Tunnels** ➔ **Add a tunnel**。
2. 命名為 `aicloud-agent-node`，複製系統生成的 Token。

### 步驟 2：在 VM 註冊為系統服務
```bash
sudo cloudflared service install <貼上您的_TUNNEL_TOKEN>
sudo systemctl enable --now cloudflared
```

### 步驟 3：在後台設定子網域 (Public Hostname)
- **Subdomain**：`agent`
- **Domain**：`biobank.org.tw`
- **Service**：`HTTP://localhost:5173`
- 點擊 **Save hostname**。

👉 10 秒內，全球使用者即可透過 **`https://agent.biobank.org.tw`** 永久穩定存取！

---

## ⚙️ 四、 系統背景常駐守護 (Systemd 24/7 配置)

為了確保 SSH 斷線或 VM 重開機後，前後端服務依然自動在背景運行：

### 1. 配置後端 Systemd (`/etc/systemd/system/aicloud-backend.service`)
```ini
[Unit]
Description=AI Cloud Agent Backend Service (FastAPI)
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/aicloud-agent-app/backend
ExecStart=/home/ubuntu/.local/bin/uv run uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 2. 配置前端 Systemd (`/etc/systemd/system/aicloud-frontend.service`)
```ini
[Unit]
Description=AI Cloud Agent Frontend Service (React)
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/aicloud-agent-app/frontend
ExecStart=/usr/bin/npm run dev -- --host
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 3. 一鍵啟用所有常駐服務
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aicloud-backend aicloud-frontend cloudflared
```

檢查運行狀態：
```bash
sudo systemctl status aicloud-backend
sudo systemctl status aicloud-frontend
```

---

## 🎓 全課程結業總結

恭喜您完成了整套 **《國研院晶創雲 (AI-CLOUD) 實戰課程》**！🎉

回顧我們的完整全端鏈路：
1. ☁️ 在 **晶創雲 (AI-CLOUD)** 建立了安全的虛擬網路、最小權限安全群組與專屬 CPU VM。
2. 💻 設定了個人電腦 **SSH ProxyJump 一鍵穿透跳板機** 與現代化全端開發環境（uv / pnpm / Docker）。
3. 🧠 串接了 **Taiwan AI 雲端大模型**，實現安全 Token 管理與 SSE 打字機串流。
4. 🤖 親手打造了 **自研 AI Agent Runtime**，讓大模型具備調用 Linux Bash、Python 腳本的自主執行能力。
5. ⚛️ 開發了 **React 深色玻璃擬態 Agent 即時觀測台**，直觀看見 AI 思考鏈與主機硬體負載。
6. 🔒 透過 **Cloudflare Tunnel (方案 A)** 實現零開 Port、免公網 IP 的專屬 HTTPS 服務發布！

您已經掌握了現代雲端基礎設施、全端工程與 AI 智能體系統開發的核心全貌！
