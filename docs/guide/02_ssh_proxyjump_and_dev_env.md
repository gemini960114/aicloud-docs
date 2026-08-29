# 第 02 章：開發連線與極速全端環境篇

在[第 01 章](file:///home/ubuntu/aicloud_agent_course/01_aicloud_infrastructure_setup.md)中，我們在國研院晶創雲建立了一台內網 CPU VM（例如私有 IP 為 `10.0.0.99`）。  
本章將完成兩大目標：
1. **在個人電腦設定 SSH ProxyJump**：實現 VS Code 與終端機「一鍵穿透公用跳板機直連內網 VM」，徹底告別繁瑣的手動二次跳轉。
2. **在 VM 內一鍵初始化極速開發環境**：安裝現代化的 `uv` (Python)、`Node.js + pnpm` 以及 `Docker`。

---

## 🔑 第一部分：個人電腦端 SSH ProxyJump 直連設定

> 💡 **原理**：`ProxyJump` 是 OpenSSH 內建的穿透機制。流量在底層由跳板機自動轉發，您在自己電腦輸入一個指令，就能直達內網機器，**完全不需在別人的跳板機上安裝任何軟體**。

### 1. 打開個人電腦的 `~/.ssh/config`
- **Mac / Linux**：`~/.ssh/config`
- **Windows**：`C:\Users\你的使用者名稱\.ssh\config`

### 2. 寫入穿透跳板機設定

```ssh-config
# 1. 國網公用跳板機 (有公網 IP 的中繼站)
Host twcc-jump
    HostName 203.145.217.185     # 跳板機的公網 IP (依晶創雲分配)
    User ubuntu                  # 跳板機使用者帳號
    IdentityFile ~/.ssh/nchc2aicloud.pem

# 2. 您在晶創雲的專屬內網 VM (透過 ProxyJump 自動穿透)
Host aicloud-node
    HostName 10.0.0.99           # 您的 VM 私有 IP (第01章記下的 IP)
    User ubuntu                  # VM 使用者帳號
    ProxyJump twcc-jump          # 關鍵設定：指定穿透跳板機
    IdentityFile ~/.ssh/nchc2aicloud.pem
```

### 3. 一秒直連驗證
在您自己的筆電終端機直接輸入：
```bash
ssh aicloud-node
```
👉 **瞬間直接進入晶創雲內網 VM 的終端機！**  
在 VS Code 擴充套件 **Remote - SSH** 中，點擊 `aicloud-node`，即可像在本地電腦一樣進行圖形化寫程式與檔案管理。

---

## ⚡ 第二部分：VM 開發環境一鍵極速初始化

進入 `aicloud-node` 終端機後，我們使用現代化工具鏈進行初始化：

### 1. 複製並執行一鍵安裝腳本

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

## 📦 工具鏈選型優勢說明

| 工具 | 傳統做法對比 | 為什麼本課程選擇它？ |
| :--- | :--- | :--- |
| **`uv`** | 原生 pip / virtualenv / poetry | **速度快 10~100 倍**。Rust 編寫，自動管理 Python 版本（不需 pyenv），專案免手動 activate。 |
| **`pnpm`** | 傳統 npm / yarn | **節省 70% 硬碟空間**，使用 Hard link 機制，安裝依賴速度極快。 |
| **`Docker`** | 手動安裝 DB / Redis | 支援容器化沙盒隔離，方便後續 Agent 安全執行任務。 |

---

## 🎯 本章學習總結
- 掌握 SSH ProxyJump 穿透技術，實現本地 VS Code 直連國網內網 VM。
- 完成 Linux 系統現代化開發工具鏈（uv, Python 3.12, Node.js LTS, pnpm, Docker）配置。

👉 **下一章預告**：在[第 03 章](file:///home/ubuntu/aicloud_agent_course/03_taiwan_ai_api_integration.md)中，我們將透過 Python 與 FastAPI 串接 **Taiwan AI RAP 雲端大模型**，實作 Token 安全管理與 SSE 串流打字機推播！
