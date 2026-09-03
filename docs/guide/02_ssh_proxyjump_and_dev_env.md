# 第 2 章：Antigravity Remote SSH、自然語言維運與 Ports 預覽

本章建立後續所有課程的核心工作流：
```text
透過 SSH 連上遠端 VM ➔ 自然語言指示 AI 檢查 ➔ 審閱安裝計畫 ➔ 自動化配置開發環境 ➔ 透過 Ports 即時預覽
```

完成本章後，學員將能在 Antigravity（或 VS Code）中流暢連線至晶創雲遠端 VM、安全安裝 Docker、Node.js LTS 與 Python uv 環境，並直接在個人本機瀏覽器中預覽遠端服務（如 `localhost:3000`），無需手動繁瑣地轉發 SSH 埠號。

---

## 1. 本機 SSH Config 設定指南

在連線前，請先在本機設定 `~/.ssh/config` 檔案，簡化連線指令並支援跳板機架構。

### 🔹 情境 A：直連晶創雲 VM（已綁定浮動 IP）

編輯本機 `~/.ssh/config`（Windows 為 `C:\Users\<帳號>\.ssh\config`）：

```ssh-config
Host aicloud-vm
  HostName <你的晶創雲浮動IP>
  User ubuntu
  IdentityFile ~/.ssh/course-key.pem
  IdentitiesOnly yes
  ServerAliveInterval 30
  ServerAliveCountMax 3
```

### 🔹 情境 B：透過跳板機連入私有 VM（ProxyJump）

若晶創雲 VM 僅有私有 IP，需透過具備公開 IP 的跳板機（Bastion Host）進入：

```ssh-config
# 1. 跳板機設定 (具有浮動 IP)
Host aicloud-bastion
  HostName <跳板機浮動IP>
  User ubuntu
  IdentityFile ~/.ssh/course-key.pem
  IdentitiesOnly yes

# 2. 目標開發 VM (透過跳板機轉發連線)
Host aicloud-vm
  HostName <目標VM私有IP>
  User ubuntu
  IdentityFile ~/.ssh/course-key.pem
  IdentitiesOnly yes
  ProxyJump aicloud-bastion
  ServerAliveInterval 30
  ServerAliveCountMax 3
```

#### 手動連線測試：
```bash
# 直接使用別名連線測試
ssh aicloud-vm
```

---

## 2. 🤖 自然語言 Prompt 配方（可直接複製給 AI Agent）

透過 Antigravity Remote SSH 連線至遠端 VM 後，可直接使用以下 Prompt 請 AI 協助檢查與安裝開發工具：

### 模式 A：系統唯讀健康診斷與環境盤點

```markdown
請對這台晶創雲 Ubuntu VM 進行唯讀的系統健康診斷與環境盤點：

1. 檢查作業系統版本、Linux 核心、CPU 核心數、記憶體與根目錄剩餘磁碟空間（uname -r, lscpu, free -h, df -h /）。
2. 檢查目前系統中是否已安裝：Git, curl, Docker, Docker Compose, Node.js, npm, uv。
3. 檢查是否有失敗的 systemd 服務（systemctl --failed）或待重啟狀態（/var/run/reboot-required）。
4. 請整理成 Markdown 表格輸出，切勿修改任何系統檔案或執行任何安裝指令。
```

### 模式 B：開發環境全套安裝（Docker + Node.js LTS + uv + Git）

```markdown
請根據剛才的環境盤點結果，協助我安裝本課程所需的全套開發環境：

1. 更新系統套件庫清單並安裝基礎工具（git, curl, ca-certificates, gnupg）。
2. 依 Docker 官方 APT Repository 安裝最新版 Docker Engine 與 Docker Compose Plugin，並將當前使用者加入 docker 群組。
3. 安裝 Node.js 20 LTS (Iron) 與 npm。
4. 使用 Astral 官方安裝腳本安裝 Python uv 套件管理器，並確認 PATH 設定生效。
5. 安裝完成後，執行各工具的 --version 與 docker run hello-world 驗證，並列出版本驗收清單。
```

### 模式 C：最小 HTTP 測試服務與 Ports 轉發驗收

```markdown
請在遠端 VM 建立一個最小、一次性的 Node.js 或 Python HTTP 測試服務：

1. 僅監聽本機 127.0.0.1:3000。
2. 當瀏覽器存取時，回傳簡單的 JSON 或 HTML，顯示主機 hostname 與當前時間。
3. 啟動服務後，先在遠端 VM 內以 curl -I http://127.0.0.1:3000 驗證。
4. 提示我如何在 Antigravity Ports 面板中開啟該 Port 並在我的本機瀏覽器預覽。
5. 驗證完成後協助我終止該測試程序並確認 Port 3000 已釋放。
```

---

## 3. 💻 終端機手動執行指令 (Manual Commands & Step-by-Step)

若要在遠端 VM 終端機中手動逐步安裝，請參考以下官方標準安裝指令：

### Step 1：更新系統並安裝基礎工具
```bash
sudo apt update && sudo apt install -y curl git ca-certificates gnupg lsb-release
```

---

### Step 2：安裝 Docker Engine 與 Docker Compose Plugin

依據 Docker 官方 Ubuntu 安裝流程：

```bash
# 1. 加入 Docker 官方 GPG 密鑰
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 2. 設定 Docker APT 倉庫來源
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 3. 安裝 Docker 套件
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. 將當前使用者加入 docker 群組 (免 sudo 執行 docker)
sudo usermod -aG docker $USER

# 5. 啟動並設定 Docker 開機自動啟動
sudo systemctl enable --now docker
```

> [!NOTE]
> 執行 `usermod -aG docker $USER` 後，需要**重新登入 SSH**（或在終端機執行 `newgrp docker`），群組權限才會正式生效。

---

### Step 3：安裝 Node.js 20 LTS 與 npm

使用 NodeSource 官方安裝腳本：

```bash
# 下載並設定 Node.js 20.x 倉庫來源
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 驗證 Node.js 與 npm 版本
node --version
npm --version
```

---

### Step 4：安裝 Python uv (高效套件與虛擬環境管理器)

使用 Astral 官方獨立安裝腳本：

```bash
# 下載並安裝 uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 載入環境變數
source $HOME/.local/bin/env

# 驗證 uv 版本
uv --version
```

---

### Step 5：全套環境驗收指令清單

在終端機中執行以下單行驗收指令，確認所有開發環境皆已就緒：

```bash
echo "=== 開發工具版本清單 ===" && \
git --version && \
curl --version | head -n 1 && \
docker --version && \
docker compose version && \
node --version && \
npm --version && \
uv --version && \
docker run --rm hello-world
```

---

## 4. 建立課程標準工作目錄結構

在遠端 VM 的家目錄下建立標準化專案目錄：

```bash
mkdir -p ~/aicloud-course/{gateway,four-bar-simulator,notes}
cd ~/aicloud-course
```

目錄規劃如下：
```text
~/aicloud-course/
├── gateway/             # 第 3、4 章：LiteLLM Gateway 與 PostgreSQL 治理配置
├── four-bar-simulator/  # 第 5、6 章：四連桿模擬器 (Canvas + AI 導師 + Docker)
├── notes/               # 個人學習筆記與非機密架構紀錄
└── (選配) meeting-app/  # 延伸實戰案例：企業級 Next.js AI 會議轉錄系統
```

---

## 5. 使用 Antigravity Ports 預覽遠端服務

Antigravity 內建自動 Port 轉發機制，能將遠端 VM 的 `localhost:3000` 或 `localhost:4000` 安全地映射到本機。

```text
[遠端 VM 服務]                     [Antigravity SSH 通道]               [本機瀏覽器]
127.0.0.1:3000  ─────────────▶  自動映射至本機 Local Port  ─────────────▶  http://localhost:3000
```

### 操作步驟：
1. 在遠端終端機啟動任何 Web 服務（例如 `python3 -m http.server 3000` 或 Next.js）。
2. 在 Antigravity 介面下方開啟 **Ports（連接埠）** 面板。
3. 系統通常會自動偵測並列出 `3000`；若未列出，可點擊 **Forward a Port** 並手動輸入 `3000`。
4. 點擊旁邊的地球圖示 🌐（Open in Browser），即可在個人電腦的瀏覽器中查看即時畫面。

> [!IMPORTANT]
> **Ports 預覽與正式發布的區別**：
> Ports 預覽僅供開發者本人在 IDE 工作階段中除錯使用；外部使用者無法透過此方式存取。正式對外發布需使用第 6 章的 **Cloudflare Tunnel**。

---

## 6. 🎯 本章完成檢核清單 (Checklist)

請確認以下項目均已順利通過：

- [ ] **SSH 連線**：已配置 `~/.ssh/config`，可透過 `ssh aicloud-vm` 或 Antigravity Remote SSH 連入 VM。
- [ ] **Docker 就緒**：Docker Engine 與 Docker Compose Plugin 已安裝，且執行 `docker run --rm hello-world` 成功。
- [ ] **Node.js 就緒**：已安裝 Node.js 20 LTS 與 npm，且 `node -v` 輸出正常。
- [ ] **Python uv 就緒**：已安裝 `uv`，且重新登入後仍可正常呼叫 `uv --version`。
- [ ] **專案目錄**：已建立 `~/aicloud-course` 標準目錄架構。
- [ ] **Ports 預覽**：已成功透過 Antigravity Ports 在本機瀏覽器預覽遠端測試服務。

> [!TIP]
> 下一步：前往 [第 3 章：TAIWAN AI RAP 與 LiteLLM 多模型 API Gateway](/guide/03_litellm_gateway)，開始配置國網模型與多模型統一路由！
