# 第 7 章：HostSpark 24/7 主機 AI 代理與 Telegram 行動自主維運

在前面的章節中，我們學會了如何在晶創雲 Linux VM 上以 AI 協作打造**互動式四連桿機械模擬器**（第 5 章），並透過 **Cloudflare Tunnel** 安全發布給手機即時觸控操作（第 6 章）。

本章將帶領學員切入全課程的終極高峰——**「對內行動 DevAIOps：手機端隨身 AI 工程特工」**。

我們將在晶創雲 Ubuntu VM 上部署開源專案 **HostSpark（24/7 Autonomous AI Agent for Linux Hosts）**。透過 HostSpark 與 Telegram，管理員不僅能在手機上隨身監控伺服器資源與設定持久定時排程，更能在手機上直接以自然語言命令主機**自動編寫代碼、封裝 Docker 容器並拉起 Cloudflare 穿透，在手機上直接存取剛剛由 AI 部署的新服務！**

---

## 1. 專案定位與分層架構哲學

### 1.1 為什麼需要 HostSpark？手機隨身控制台的威力

傳統雲端主機維運必須依賴個人電腦、SSH 客戶端與終端機。當工程師出門在外只有智慧型手機時，一旦遇到需要臨時部署新服務、重啟容器或檢查系統負載，往往束手無策。

**HostSpark** 正是為了解決這個痛點而生：它將 Telegram 轉化為隨身可控的超級終端，背後以 Google Antigravity CLI (`agy`) 作為強大推理引擎，讓主機成為 24 小時在線的專屬工程師。

```text
┌─────────────────────────────────────────────────────────┐
│                    Telegram Client                      │
│        (手機 / 平板 / 電腦端管理員即時通訊介面)             │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS (長輪詢 Long Polling，免開任何 Inbound Port)
                             ▼
┌─────────────────────────────────────────────────────────┐
│         HostSpark Core Engine (Python + SQLite)         │
│  ├─ 多使用者白名單驗證 (ALLOWED_USER_IDS / Chat ID)       │
│  ├─ Per-Chat 獨立狀態 (Model / Mode / Effort / Workspace) │
│  ├─ Live Stream 即時串流進度更新與 Auto-Interrupt 合併   │
│  ├─ SQLite 持久排程器 (5 欄 Cron、變數模板、3次失敗熔斷)   │
│  └─ 安全隔離層 (非 Shell 調用、機密過濾、防路徑穿透)        │
└────────────────────────────┬────────────────────────────┘
                             │ Local Subprocess (agy)
                             ▼
┌─────────────────────────────────────────────────────────┐
│              HostSpark 專屬主機代理 (AGY CLI)            │
│         (模型推理 / 檔案讀寫 / 工具操作 / 容器管理)        │
└────────────────────────────┬────────────────────────────┘
                             │ Local Execution
                             ▼
┌─────────────────────────────────────────────────────────┐
│                     Ubuntu Linux VM                     │
│         (檔案系統 / Docker 容器 / Nginx / 系統資源)      │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Unix 分工原則：輕量協同，而非重複發明輪子
* **Telegram**：提供手機端隨身通訊介面與安全通道（長輪詢 Long Polling，**主機完全不需要開放對外 Inbound Port**）。
* **HostSpark Core Engine (Python + SQLite)**：負責身分授權驗證、Per-Chat 獨立設定、即時串流反饋、任務佇列、持久排程資料庫、執行鎖與機密脫敏。真正的 AI 推理與工具呼叫交由底層 AGY 負責。
* **Antigravity CLI (`agy`)**：負責大語言模型推理（支援 Gemini、Claude 等）、上下文管理、工具調用（Tool Calling）、程式碼編輯與指令執行。
* **晶創雲 Ubuntu Linux VM**：提供計算、儲存、Docker 容器與 systemd 系統資源。

---

## 2. ⚙️ 環境設定與安全模型 (`.env`)

### 核心安全原則
1. **多使用者白名單**：透過 `ALLOWED_USER_IDS` 限制只有授權的 Telegram 數字帳號才能操作，其餘訊息一律靜默拒絕。
2. **非 Shell 安全呼叫**：所有子程序一律透過 `create_subprocess_exec` 呼叫，絕不使用 Shell 拼接字串，免疫注入攻擊。
3. **機密過濾（Redaction）**：子程序自動過濾 Telegram Token、SSH 私鑰、AWS Key 與 JWT，絕不外流至聊天室或日誌。
4. **安全模式（Safe vs Full）**：
   - `safe` 模式（預設）：遵循 AGY 權限規則，工具需危險操作時會受限或提示確認。
   - `full` 模式：自動加上 `--dangerously-skip-permissions`，工具操作自動核准，適合讓 AI 全自動在主機上編程與建置容器。

---

## 3. 💻 終端機手動安裝與部署 (Step-by-Step)

### Step 1：取得 Telegram Bot Token 與個人 User ID

1. **取得 Bot Token**：
   - 在 Telegram 搜尋官方 `@BotFather`。
   - 傳送 `/newbot`，依提示命名（例如 `My_HostSpark_Bot`）。
   - BotFather 會回傳專屬的 `HTTP API Token`（如 `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`）。
2. **取得個人 User ID**：
   - 在 Telegram 搜尋 `@userinfobot` 並點擊 Start。
   - 記錄回傳的數字 `Id`（例如 `987654321`）。

---

### Step 2：下載 HostSpark 並配置環境變數

在遠端 VM 終端機執行：

```bash
# 1. Clone 專案至家目錄
cd ~
git clone https://github.com/gemini960114/HostSpark.git
cd HostSpark

# 2. 建立 .env 設定檔並鎖定權限
cp .env.example .env
chmod 600 .env

# 3. 編輯設定檔
nano .env
```

在 `.env` 中填入你的最新設定：

```dotenv
# Telegram Bot API Token（必填，從 @BotFather 取得）
TELEGRAM_BOT_TOKEN=你的_Bot_Token

# 授權操作的 Telegram 數字 User ID（必填，多個以逗號分隔）
ALLOWED_USER_IDS=你的數字_User_ID

# 權限模式：safe 遵循安全確認；full 自動核准所有工具操作
AGY_PERMISSION_MODE=safe

# 僅允許私訊操作（1=是, 0=否，預設 1）
TELEGRAM_PRIVATE_ONLY=1

# 串流進度顯示模式（compact=精簡單行, full=完整, delete=完成後刪除）
AGY_PROGRESS_MODE=compact

# 新訊息進入時自動中斷前次任務並合併指示（預設 1）
AGY_AUTO_INTERRUPT=1

# 定時任務時區
AGY_SCHEDULE_TIMEZONE=Asia/Taipei
```

---

### Step 3：執行自動化安裝指令碼 (`install.sh`)

```bash
chmod +x install.sh
./install.sh
```

`install.sh` 會自動完成：
1. 建立獨立 Python 虛擬環境並安裝 `requirements.lock` 鎖定套件。
2. 執行 `python bot.py --check-config` 進行組態防呆測試。
3. 建立 systemd 服務檔（`/etc/systemd/system/agy-telegram.service`）。
4. 啟動服務並設定開機自啟動。

```bash
# 檢查 HostSpark 服務狀態 (確認顯示 active (running))
sudo systemctl status agy-telegram.service --no-pager

# 查看即時動態日誌
sudo journalctl -u agy-telegram.service -f
```

---

## 4. 📖 Telegram 指令手冊

HostSpark 具備豐富的指令系統，分為基礎控制、模型偏好、排程管理與原生 CLI 穿透：

| 分類 | 指令 | 說明 |
|---|---|---|
| **基礎控制** | `/start` 或 `/help` | 顯示歡迎訊息、當前權限狀態與功能清單 |
| | `/menu` | 開啟手機常駐快捷功能鍵盤 |
| | `/status` | 即時檢視 VM 負載、記憶體、磁碟、Docker 與任務佇列 |
| | `/cancel` | 取消目前正在執行或佇列中的任務 |
| **工作階段** | `/new` 或 `/clear` | 重置對話階段，下一次提問開啟全新 Session |
| | `/session` | 檢視當前 Chat 設定明細（Model、Mode、Effort 等） |
| | `/compact` | 壓縮目前對話上下文，保留核心狀態 |
| **模型偏好** | `/model [名稱]` | 切換當前模型（如 `gemini-3.7-flash-high`） |
| | `/effort low\|medium\|high` | 設定推理深度（Reasoning Effort） |
| | `/mode plan\|accept-edits` | 切換執行模式（`accept-edits` 自動套用代碼變更） |
| | `/verbose detailed\|compact` | 設定串流進度訊息詳細度 |
| **配額與工具** | `/usage` / `/quota` | 查詢 AGY 額度與配額重置進度 |
| | `/context` | 檢視上下文明細與 Token 消耗 |
| | `/agy [ARGS...]` | 直接執行原生 `agy` CLI 指令（危險操作觸發確認） |
| **定時排程** | `/schedule_add <cron> <任務>` | 建立定時任務（經 AI 整理並彈出確認按鈕） |
| | `/schedule_list` | 列出所有已排程的定時任務清單 |
| | `/schedule_delete <ID>` | 刪除指定定時任務 |

---

## 5. 🧪 四大實戰演練（Labs）

### 🧪 Lab 1：基礎狀態查詢與對話上下文測試
1. 在手機 Telegram 對 HostSpark 傳送 `/start` ➜ 確認收到歡迎訊息。
2. 傳送 `/status` ➜ 確認回報主機 Uptime、負載、磁碟剩餘空間與 Docker 狀態。
3. 傳送 `/menu` ➜ 喚出手機端快捷鍵盤。
4. 傳送 `/new` ➜ 開啟全新對話 Session。

---

### 🧪 Lab 2：建立主機定時巡檢（SQLite 持久排程）
1. 傳送：`/schedule_add */30 * * * * 檢查伺服器負載與記憶體，若有異常則簡要回報`
2. 檢視 HostSpark 回傳的 Prompt 預覽，點擊 **[✅ 確認建立]**。
3. 傳送 `/schedule_list` ➜ 確認排程已成功登錄至 SQLite，下次執行時間正確。
4. 測試結束後傳送 `/schedule_delete 1` 移除排程。

---

### 🧪 Lab 3：建立靜默異常巡檢（`[NO_REPORT]` 測試）
1. 傳送：`/schedule_add 0 * * * * 檢查磁碟剩餘空間，若使用率未達 90% 則只輸出 [NO_REPORT]`
2. 點擊確認建立。
3. 整點到達時，若磁碟正常，Telegram 不會發出干擾通知，達到無人值守之最高境界。

---

### 🧪 Lab 4（重磅實戰）：手機端一條龍開發 —— 在 Telegram 重現第 5、6 章成果！

> 🌟 **核心情境**：你現在手邊沒有電腦，只有智慧型手機。我們將透過 Telegram 向 HostSpark 下達指令，在晶創雲 VM 上全自動完成**「寫出新四連桿服務 ➔ 打包 Docker ➔ Cloudflare 公網穿透 ➔ 手機點開體驗」**！

#### 步驟 1：切換為自動套用代碼模式
在 Telegram 傳送：
```text
/mode accept-edits
```

#### 步驟 2：手機下達編程與容器化指令
在 Telegram 傳送以下 Prompt：
```text
請在 ~/aicloud-course/mobile-demo 目錄下建立一個極簡的四連桿機械模擬器前端：
1. 包含一個 HTML5 Canvas 畫布，用 JavaScript 繪製曲柄與連桿轉動。
2. 建立 Dockerfile 與 nginx.conf 將其打包。
3. 建立並啟動 Docker 容器，命名為 mobile-fourbar，綁定在 127.0.0.1:8091:80。
4. 啟動後用 curl 驗收本機連線，並回報結果給我。
```

- **觀察手機畫面**：HostSpark 會即時以串流（Live Stream）回報 AGY 正在建立檔案、撰寫 HTML5、編譯 Docker 映像檔與啟動容器的即時進度！
- 完成後，HostSpark 會在 Telegram 回傳：「Docker 容器已成功在 Port 8091 啟動，HTTP 200 回應正常！」

#### 步驟 3：手機下達公網穿透發布指令
接著在 Telegram 傳送：
```text
請幫我用 cloudflared 建立 Quick Tunnel，把本機 8091 埠號對映至公網，並把終端機產生的 HTTPS 網址傳給我。
```

- HostSpark 執行 `cloudflared tunnel --url http://localhost:8091` 並擷取終端機輸出。
- 在 Telegram 中，HostSpark 回覆：
  > 🚀 **服務已發布成功！**  
  > 體驗網址：`https://random-words-1234.trycloudflare.com`

#### 步驟 4：手機即刻驗收！
- **直接點擊 Telegram 訊息中的 HTTPS 連結**。
- 你的智慧型手機瀏覽器立刻打開了剛剛由你在手機上下達指令、晶創雲 VM 自動生成並容器化發布的四連桿模擬器！
- **用手指在手機螢幕上滑動旋轉連桿**——從發想到上線，完全不需要碰電腦鍵盤！

---

## 6. 故障排除 SOP 與常見問題

| 現象 / 錯誤 | 原因分析 | 處置方式 |
|---|---|---|
| 傳送訊息完全無回應 | 發送者的 Telegram User ID 未在 `ALLOWED_USER_IDS` 白名單中 | 檢查 `@userinfobot` 取得之 ID 是否正確填入 `.env` |
| 執行編程任務時被拒絕 | 目前處於 `safe` 模式，且部分系統寫入權限受限 | 在 Telegram 傳送 `/mode accept-edits` 或確認目錄讀寫權限 |
| Quick Tunnel 在背景被中止 | 終端進程結束 | 可請 HostSpark 以 `nohup cloudflared tunnel --url http://localhost:8091 > /tmp/tunnel.log 2>&1 &` 在背景運行 |
| 排程任務顯示熔斷暫停 | 任務連續失敗 3 次觸發安全熔斷 | 使用 `/schedule_show <ID>` 檢視錯誤日誌，修復後使用 `/schedule_resume <ID>` 恢復 |

---

## 7. 🎯 全章完成檢核清單 (Checklist)

請確認以下每一項均已完成驗收：

- [ ] **多使用者綁定**：已正確配置 `ALLOWED_USER_IDS`，且 `.env` 權限設定為 600。
- [ ] **服務常駐運行**：HostSpark systemd 服務處於 `active (running)` 狀態。
- [ ] **多功能指令操作**：成功在 Telegram 執行 `/status`、`/menu`、`/new` 與 `/session`。
- [ ] **持久定時排程**：成功透過 `/schedule_add` 建立定時任務，並驗證了確認按鈕與 `[NO_REPORT]` 靜默機制。
- [ ] **行動端一條龍開發 (Lab 4)**：成功在手機 Telegram 上發送 Prompt，命令主機寫出服務、打包 Docker、拉起 Cloudflare Tunnel，並在手機瀏覽器上點開驗收！

> [!TIP]
> **🎉 恭喜您完成晶創雲 AI 應用開發全系列課程！**  
> 您已經完整走過雲端基礎建設、多模型閘道治理、AI 互動應用開發、零信任安全發布，最終掌握了以 HostSpark 在手機端隨身實現**「行動自主開發與維運（Mobile DevAIOps）」**的頂尖能力！
