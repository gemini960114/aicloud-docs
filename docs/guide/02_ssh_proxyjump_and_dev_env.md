# 第 02 章：遠端連線與 AI Agentic IDE 賦能篇

在[第 01 章](file:///home/ubuntu/aicloud_agent_course/01_aicloud_infrastructure_setup.md)中，我們在晶創雲建立了一台具備 IP 的雲端 VM（例如 IP 為 `140.110.164.93`），並下載了私鑰金鑰（例如 `~/.ssh/h100.pem`）。

本章將帶領學員掌握：
1. **傳統終端機 SSH 連線方式**：理解底層連線原理。
2. **現代 AI Agentic 連線模式 (Antigravity / VS Code Remote SSH)**：透過配置 `~/.ssh/config`，讓強大的 **AI Agent（以 Google Gemini 模型為核心）直接進駐在 VM 內部**，與開發者進行結對編程（Pair Programming）與主機操作！
3. **VM 內全端與容器環境一鍵初始化**：配置 `uv`、Python、`Node.js`、`Docker`。

---

## 💻 第一部分：傳統終端機 SSH 登入示範

在過去，開發者通常需要打開終端機，手動輸入帶有金鑰路徑的長指令：

```bash
# 傳統終端機連線指令
ssh -i ~/.ssh/h100.pem ubuntu@140.110.164.93
```

- **優點**：簡單直接、不需要任何 IDE。
- **缺點**：每次都要指定金鑰路徑；若網路不穩容易斷線；無法享用現代 AI Agent 的自動化編程與視覺化檔案管理功能。

---

## 🤖 第二部分：現代 AI Agentic 模式 (Antigravity / VS Code Remote)

現代軟體工程的最佳實踐是：**將 AI Agent（如 Antigravity IDE，以 Gemini 為大腦）直接掛載至遠端 VM 內部**，讓 AI 能夠即時看懂專案程式碼、自動修復 Bug、執行終端機命令！

### 1. 在個人電腦配置 `~/.ssh/config`
打開您自己電腦上的 `~/.ssh/config`（Windows 為 `C:\Users\你的帳號\.ssh\config`，Mac/Linux 為 `~/.ssh/config`），加入這段標準企業級連線設定：

```ssh-config
Host twcc
  HostName 140.110.164.93
  User ubuntu
  IdentityFile ~/.ssh/h100.pem
  IdentitiesOnly yes
  IPQoS none
  ServerAliveInterval 30
  ServerAliveCountMax 3
```

#### 參數深度解析（針對國網 VM 環境優化）：
- **`IdentitiesOnly yes`**：強制只使用指定的 `h100.pem` 私鑰，避免因嘗試其他金鑰導致被伺服器阻擋。
- **`IPQoS none`**：修復部分機房/學術網路（TANet）因封包 QoS 標籤導致 SSH 卡頓或連線凍結的問題。
- **`ServerAliveInterval 30` & `ServerAliveCountMax 3`**：每 30 秒自動發送心跳封包，防止長時間無操作被雲端防火牆主動切斷連線。

---

### 2. 透過 Antigravity IDE (或 VS Code) 直連 VM

1. 打開 **Antigravity IDE**（或 VS Code）。
2. 按下快速鍵 `Ctrl + Shift + P`（Mac 為 `Cmd + Shift + P`）➔ 輸入 **`Remote-SSH: Connect to Host...`**。
3. 選擇清單中的 **`twcc`**。
4. **效果**：
   - IDE 會自動在晶創雲 VM 內部啟動後台服務。
   - **AI Agent（以 Gemini 為預設模型）正式進駐這台 VM**！
   - 您可以直接在對話框對 AI 說：*「請幫我檢查這台 VM 的磁碟空間，並安裝 Python 與 Docker」*，AI 就會直接在 VM 終端機替您執行！

---

## ⚡ 第三部分：VM 內開發環境一鍵極速初始化

透過 Antigravity / SSH 進入 VM 終端機後，我們執行一鍵腳本安裝全套現代工具鏈：

```bash
# 1. 系統更新與基礎工具 (git, curl, build-essential, jq, htop)
sudo DEBIAN_FRONTEND=noninteractive apt update && \
sudo DEBIAN_FRONTEND=noninteractive apt install -y \
  build-essential curl wget git jq htop tree unzip ca-certificates gnupg \
  docker.io docker-compose-v2

# 2. 啟用 Docker 並加入使用者群組 (免 sudo 操作容器)
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# 3. 安裝官方最新版 uv (Rust 極速 Python 環境管理器)
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env 2>/dev/null || export PATH="$HOME/.local/bin:$PATH"
uv python install 3.11 3.12

# 4. 安裝 NVM + Node.js LTS + pnpm (現代前端環境)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
npm install -g pnpm

# 5. 驗證所有工具安裝狀態
echo -e "\n=== 🎉 環境安裝完成驗證 ==="
git --version
docker --version
uv --version
node -v
npm -v
pnpm -v
```

---

## 🧠 第四部分：為什麼初始模型首選 Google Gemini？

在 Antigravity 等 AI Agentic IDE 中，初始模型強烈推薦選擇 **Google Gemini**（如 Gemini 1.5 Pro / Flash、Gemini 3.7）：
1. **超長 Context Window（百萬級上下文）**：能夠一次性讀取整台 VM 的所有專案檔案、日誌與設定檔，不會遺忘上下文。
2. **多模態與代碼推理力**：能看懂架構圖與後台截圖，並精準生成無 Bug 的 Python / Bash 腳本。
3. **超低延遲與高性價比**：在進行高頻度的 Agent 工具調用（Tool Calling）與結對編程時反應極快。

---

## 🎯 本章學習總結
- 了解傳統 SSH 指令與現代 `~/.ssh/config` 最佳化配置差異。
- 掌握 **Antigravity / VS Code Remote SSH** 模式，實現 **AI Agent (Gemini) 直接進駐 VM 協同開發**。
- 一鍵完成 VM 內部 `uv`、Python 3.12、Node.js LTS、pnpm、Docker 現代工具鏈初始化。

👉 **下一章預告**：在[第 03 章](file:///home/ubuntu/aicloud_agent_course/03_taiwan_ai_api_integration.md)中，我們將透過 Python 與 FastAPI 串接 **Taiwan AI RAP 雲端大模型**，實作 Token 安全管理與 SSE 串流打字機推播！
