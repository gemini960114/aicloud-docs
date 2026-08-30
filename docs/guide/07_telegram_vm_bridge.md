# 第 7 章：HostSpark 24/7 主機 AI 代理與 Telegram 行動自主維運

在前面的章節中，我們學會了如何建立「對外提供服務」的 Web AI 應用（Next.js + LiteLLM + Cloudflare Tunnel）。本章將帶領學員切入另一個極具企業價值的面向——**「對內 AIOps 主機自主維運」**。

我們將在晶創雲 Ubuntu VM 上部署 **HostSpark（主機上的 AI 啟動核心：24/7 Autonomous AI Agent for Linux Hosts）**。透過 HostSpark 代理，管理員能夠在手機端透過 Telegram 隨身操控伺服器上的 HostSpark 專屬主機代理（底層驅動 Antigravity CLI `agy`），進行即時系統巡檢、故障排除，並利用**HostSpark 持久定時任務（Persistent Scheduled Tasks）**實現 24 小時無人值守的自動化巡檢！

---

## 1. 專案定位與分層架構哲學

### 1.1 Unix 哲學：輕量核心代理，而非重複發明輪子
**HostSpark** 遵循簡潔的 Unix 分工原則，不重複發明笨重的 Agent 框架：
* **Telegram**：提供手機端隨身通訊介面與安全通道（長輪詢 Long Polling，**主機完全不需要開放對外 Inbound Port**）。
* **HostSpark Core Engine (Python + SQLite)**：負責單一管理員身分驗證（數字 User ID 白名單）、確定性斜線指令路由、持久排程資料庫、全域並行執行鎖、子程序超時控制與敏感字串脫敏。
* **Antigravity CLI (`agy`)**：負責大語言模型推理、多輪對話上下文、工具呼叫（Tool Calling）、檔案操作與指令執行。
* **Ubuntu Linux VM**：提供計算、檔案系統、Docker 容器與 systemd 系統資源。

```text
┌─────────────────────────────────────────────────────────┐
│                     Telegram Client                     │
│                (手機 / 電腦端管理員介面)                   │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS (長輪詢 Long Polling，免開 Inbound Port)
                             ▼
┌─────────────────────────────────────────────────────────┐
│          HostSpark Core Engine (Python + SQLite)        │
│  ├─ 驗證層 (ALLOWED_USER_ID 白名單過濾)                  │
│  ├─ 控制層 (斜線指令 / HostSpark 持久排程器 / 執行鎖)    │
│  └─ 安全層 (Timeout / Output Cap / 敏感字串遮罩)         │
└────────────────────────────┬────────────────────────────┘
                             │ Local Subprocess (agy -p)
                             ▼
┌─────────────────────────────────────────────────────────┐
│              HostSpark 專屬主機代理 (AGY CLI)            │
│         (模型推理 / 工具呼叫 / 權限審核 / Workspace)      │
└────────────────────────────┬────────────────────────────┘
                             │ Local Execution
                             ▼
┌─────────────────────────────────────────────────────────┐
│                     Ubuntu Linux VM                     │
│               (檔案 / Docker / 服務 / 系統資源)          │
└─────────────────────────────────────────────────────────┘
```

### 1.2 核心架構哲學：確定性控制 vs 概率性推理
在 AI 系統工程中，混淆「控制指令」與「AI 對話」是導致系統不穩定與幻覺（Hallucination）的主因：
* **確定性控制面（Deterministic Control Plane）**：排程的建立、列表、暫停、恢復、刪除，以及工作階段重置，**必須由 HostSpark 的確定性斜線指令（Slash Commands）與 SQLite 資料庫控制**。
* **概率性推理面（Probabilistic Reasoning Plane）**：任務的具體目標描述、伺服器巡檢邏輯、故障排查判斷，交由大語言模型（HostSpark 專屬主機代理）以**自然語言**進行彈性推理。

---

## 2. 🤖 自然語言 Prompt 配方（可直接複製給 AI Agent）

在 Antigravity 終端機中，你可以直接複製以下 Prompt 請 AI 協助完成 HostSpark 部署與組態檢查：

### 模式 A：HostSpark 環境自動部署與組態檢查

```markdown
請協助我在這台晶創雲 Ubuntu VM 上部署 HostSpark (agy-telegram-bot) 專案：

1. 檢查系統是否已安裝 Python 3.10+、uv 與 agy CLI（執行 agy -p "reply ok" 驗證 CLI 可用）。
2. 在家目錄下 clone 專案倉庫：git clone https://github.com/gemini960114/agy-telegram-bot.git ~/agy-telegram-bot。
3. 協助建立 .env 檔案範本，設定權限為 chmod 600 .env。
4. 提示我手動填入 TELEGRAM_BOT_TOKEN 與 ALLOWED_USER_ID，切勿要求我將 Token 貼入對話。
5. 執行 ./install.sh 進行依賴同步與 systemd 服務註冊，並檢查 sudo systemctl status agy-telegram.service。
```

### 模式 B：安全模式（Safe vs Full）評估與 Sudo 權限管理

```markdown
請檢查目前 HostSpark 的安全設定模式：

1. 檢查 .env 中的 AGY_PERMISSION_MODE（確認為 safe 或是 full）。
2. 說明 Safe 模式（工具需人工確認時自動拒絕）與 Full 模式（自動加上 --dangerously-skip-permissions）的風險邊界。
3. 檢查當前使用者是否擁有免密碼 sudo 權限；若有，請提醒我僅在特定維運期間開啟，維運結束後應立即執行 sudo rm -f /etc/sudoers.d/$USER 還原。
```

### 模式 C：HostSpark 持久定時任務與靜默回報規劃

```markdown
請為我的伺服器規劃三個實用的 HostSpark 定時維運排程：

1. 伺服器健康度排程：每 30 分鐘檢查一次 CPU、記憶體與磁碟空間，若使用率未達 85% 則輸出 [NO_REPORT]（靜默不洗版）。
2. Docker 容器狀態巡檢：每小時檢查一次 Docker 容器是否處於 restart 迴圈或異常停止，若有異常即刻推播。
3. 產出對應的 /schedule_add cron 指令格式與預期行為說明。
```

---

## 3. 💻 終端機手動安裝與 systemd 運維 (Step-by-Step)

### Step 1：取得 Telegram Bot Token 與個人 User ID

1. **取得 Bot Token**：
   - 在 Telegram 搜尋官方 `@BotFather`。
   - 傳送 `/newbot`，依提示設定機器人名稱（如 `HostSpark_Bot`）與 username。
   - BotFather 會回傳專屬的 `HTTP API Token`（格式如 `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`）。
2. **取得個人 User ID**：
   - 在 Telegram 搜尋 `@userinfobot` 並點擊 Start。
   - 記錄回傳的 `Id`（一串純數字，如 `987654321`）。

---

### Step 2：下載 HostSpark 並配置環境變數

在遠端 VM 終端機執行：

```bash
# 1. Clone 專案至家目錄
cd ~
git clone https://github.com/gemini960114/agy-telegram-bot.git
cd agy-telegram-bot

# 2. 建立 .env 設定檔並鎖定權限
cp .env.example .env
chmod 600 .env

# 3. 編輯設定檔
nano .env
```

在 `.env` 中填入你的必要設定：

```dotenv
# 必要設定
TELEGRAM_BOT_TOKEN=你的_Telegram_Bot_Token
ALLOWED_USER_ID=你的數字_User_ID
AGY_PERMISSION_MODE=safe

# HostSpark 持久定時任務選配設定
AGY_SCHEDULE_TIMEZONE=Asia/Taipei
AGY_SCHEDULE_MIN_INTERVAL_MINUTES=15
AGY_SCHEDULE_MAX_TASKS=20
AGY_RULE_PROMPT="只操作指定的專案目錄；修改前先說明；使用繁體中文回覆。"
```

---

### Step 3：執行 HostSpark 一鍵自動化安裝 (`install.sh`)

```bash
# 給予執行權限並執行安裝
chmod +x install.sh
./install.sh
```

`install.sh` 會自動完成以下標準化作業：
1. 檢查非 root 的一般使用者權限。
2. 自動使用 `uv` 或標準 `python3 -m venv` 建立獨立虛擬環境。
3. 依據 `requirements.lock` 安裝鎖定的依賴套件（`python-telegram-bot`, `croniter` 等）。
4. 執行 `python bot.py --check-config` 進行組態防呆驗證。
5. 自動產生加固的 `systemd` 服務檔（`/etc/systemd/system/agy-telegram.service`）。
6. 啟動服務並設定開機自啟動。

---

### Step 4：常用 systemd 系統維運指令

```bash
# 檢查 HostSpark 服務狀態 (確認顯示 active (running))
sudo systemctl status agy-telegram.service --no-pager

# 查看即時動態日誌 (追蹤 Telegram 訊息處理與排程執行)
sudo journalctl -u agy-telegram.service -f

# 重新啟動 HostSpark 服務 (修改 .env 後需重啟生效)
sudo systemctl restart agy-telegram.service

# 停止服務
sudo systemctl stop agy-telegram.service
```

---

## 4. HostSpark 持久定時任務（Persistent Scheduled Tasks）深度解析

### 4.1 為什麼需要主機層級排程？
若讓大語言模型在單次交談中接收「請每 1 分鐘幫我報天氣」，LLM 可能會在單次 headless CLI 執行中開啟內部無限迴圈，導致 Telegram Bot 的單次對話進程被卡死（Hang）。

因此 HostSpark 引入 **Host-level Scheduler**，實現完全解耦：

```text
[Telegram /schedule_add]
       ↓ (1. 呼叫 HostSpark 代理整理為獨立任務模板)
[AGY Prompt Refinement (Safe 模式)]
       ↓ (2. Telegram 彈出 Inline Keyboard 按鈕)
[管理員點擊確認建立]
       ↓ (3. 寫入 SQLite schedules.db)
[背景輪詢 Schedule Loop (每 20 秒)]
       ↓ (4. 到期時喚醒獨立子程序執行 agy -p)
[推播結果至 Telegram]
```

---

### 4.2 關鍵排程機制設計

#### A. 兩階段確認機制（Two-Phase Confirmation）
1. 使用者輸入：`/schedule_add */15 * * * * 檢查磁碟容量若超過80%通知我`
2. HostSpark 啟動獨立進程要求 AI 重寫為可重複執行的標準 Prompt 模板（此階段強制以 Safe 權限執行）。
3. HostSpark 在 Telegram 呈現 Inline Keyboard 按鈕：
   `[ ✅ 確認建立 ]` `[ ❌ 取消 ]`
4. 唯有經過管理員人工點擊確認，排程才會正式寫入 SQLite。

#### B. 工作目錄隔離（Workspace Isolation）
* 每個排程分配獨立工作目錄：`~/.local/state/agy-telegram-bot/workspaces/schedule-<ID>`。
* 執行時透過 `--add-dir` 開放主要專案目錄（`AGY_WORKDIR`）。
* **優點**：排程執行不會使用一般對話的 `--continue` 階段，**絕不污染**使用者的日常對話歷史。

#### C. 全域並行鎖（Asyncio Concurrency Lock）
* 排程執行與人工即時對話共用單一 `agy_lock = asyncio.Lock()`。
* 保證同一時間伺服器上只有一個 AGY 進程在運行，杜絕並行磁碟衝突與資源競爭。

#### D. 執行時動態變數（Runtime Variables）
在 Prompt 模板中可包含動態時間標籤，觸發時由 Python 自動代入實際數值：
* `{{now}}`：實際執行時間（ISO 格式）。
* `{{date}}`：實際執行日期（YYYY-MM-DD）。
* `{{time}}`：實際執行時間（HH:MM:SS）。
* `{{timezone}}`：排程時區（例如 `Asia/Taipei`）。
* `{{scheduled_at}}`：原訂排程觸發時間。
* `{{run_number}}`：累計執行序號。

#### E. 靜默回報機制（`[NO_REPORT]`）
對於例行性健康巡檢（例如「正常時不要發訊息」），HostSpark 整理後的 Prompt 會約定：若一切正常無須通知，只輸出精確字串 `[NO_REPORT]`。
HostSpark 偵測到該值後，會將狀態標記為成功，但**主動抑制 Telegram 訊息傳送**，防止通知洗版。

#### F. 熔斷保護機制（Circuit Breaker）
* 當某個排程因外部 API 異常或命令錯誤**連續失敗 3 次**：
  1. 系統自動將該排程標記為暫停（`enabled=0`）。
  2. 清除下次執行時間。
  3. 即時主動推播告警訊息至 Telegram，通知管理員排障並以 `/schedule_resume <ID>` 恢復。

#### G. 重啟持久化與防集中補跑
* 排程資料保存於 SQLite（`schedules.db`）。
* 若主機停機 1 小時（錯過 4 次執行），重啟後算法會自動跳過歷史過期時間，**最多只補跑一次**，並將下次時間對齊未來。

---

## 5. 指令手冊與核心口訣

> 📌 **核心口訣：「斜線指令管排程系統，自然語言寫任務內容」**
> - **管理排程（查、刪、停、啟）** ➜ 敲 HostSpark 專屬斜線指令（如 `/schedule_list`、`/schedule_delete 1`）。
> - **排程要執行的工作內容** ➜ 寫自然語言即可（如 `/schedule_add 0 9 * * * 每天早上九點巡檢伺服器`）。

### 完整指令清單速查表

| 指令 | 類型 | 說明 | 範例 |
|---|---|---|---|
| `/start` 或 `/help` | 資訊 | 顯示 HostSpark 狀態、目前權限模式（Safe/Full）及完整指令指南 | `/help` |
| `/status` | 維運 | 即時檢查 VM 運行狀態（Uptime、負載、磁碟剩餘、記憶體與 Docker 容器） | `/status` |
| `/clear` | 工作階段 | 清除當前 HostSpark 對話上下文，開啟全新獨立的問答階段 | `/clear` |
| `/schedule_help` | 排程 | 查看定時排程的 cron 語法、時區、可用變數與安全限制 | `/schedule_help` |
| `/schedule_add` | 排程 | 建立定時任務（先經 AI 整理提示詞並在 Telegram 預覽確認） | `/schedule_add */15 * * * * 檢查伺服器記憶體` |
| `/schedule_list` | 排程 | 列出目前所有已註冊、已啟用或已暫停的定時任務 | `/schedule_list` |
| `/schedule_show <ID>`| 排程 | 查看特定排程的完整細節、執行次數統計與 Prompt 模板 | `/schedule_show 1` |
| `/schedule_pause <ID>`| 排程 | 暫停指定排程（保留設定但暫停定時觸發） | `/schedule_pause 1` |
| `/schedule_resume <ID>`| 排程 | 恢復暫停的排程，並自動重新計算下一次執行時間 | `/schedule_resume 1` |
| `/schedule_delete <ID>`| 排程 | 永久刪除指定的定時任務與相關資料 | `/schedule_delete 1` |
| `一般純文字` | 即時對話 | 直接交給 HostSpark 專屬主機代理進行對話問答或單次指令執行 | `幫我檢查 Nginx 設定檔語法` |

---

## 6. 安全模型與權限治理體系

### 6.1 身分驗證機制
* 程式啟動時強制檢查 `ALLOWED_USER_ID`。
* 任何非授權的 Telegram ID 訊息一律拒絕並記錄日誌，杜絕未授權存取時間差。

### 6.2 Safe 模式 vs Full 模式

```text
┌──────────────────────────────────────────────────────────────┐
│                    AGY_PERMISSION_MODE                       │
├──────────────────────────────┬───────────────────────────────┤
│             safe             │              full             │
│   (開源專案 / 預設安全模式)   │   (私人專用 VM / 全自動維運)   │
├──────────────────────────────┼───────────────────────────────┤
│ • 不帶 --dangerously-... 參數│ • 自動加上 --dangerously-...  │
│ • 工具呼叫需確認時會被拒絕   │ • 工具操作自動核准無須手動確認 │
│ • 權限不足時回傳友善提示     │ • 適合無人值守但需承擔風險     │
└──────────────────────────────┴───────────────────────────────┘
```

### 6.3 敏感資訊防護與過濾（Redaction）
* **正則脫敏**：HostSpark 內建過濾機制，自動將輸出中的 Telegram Bot Token、Bearer Token、API Key、密碼遮罩為 `[REDACTED]`。
* **檔案權限**：`.env` 與 `schedules.db` 強制限制為 `600`（僅服務使用者可讀寫）。

### 6.4 Sudo 權限安全原則
* **原則**：HostSpark 正常運作（含排程、Docker ps、磁碟查詢）**不需要** root 或 sudo 權限。
* **臨時維運需求**：若要讓 HostSpark 代理能自動執行 `sudo apt update` 或服務重啟，可手動設定免密碼 sudo，並於**任務完成後立即還原**：
  ```bash
  # 啟用免密碼 sudo（僅限專用測試/維運 VM）
  echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee "/etc/sudoers.d/$USER" && sudo chmod 0440 "/etc/sudoers.d/$USER"

  # 維運完成後立即還原安全狀態
  sudo rm -f "/etc/sudoers.d/$USER"
  ```

---

## 7. 🧪 三大實戰演練（Labs）

### 🧪 Lab 1：基礎狀態查詢與延續對話測試
1. 在 Telegram 對 HostSpark 傳送 `/start` ➜ 確認顯示歡迎訊息與模式。
2. 傳送 `/status` ➜ 確認回報主機 Uptime、負載、磁碟、記憶體與 Docker 狀態。
3. 傳送 `請記住暗號 ALPHA` ➜ 確認 HostSpark 代理回應記住。
4. 傳送 `剛才暗號是什麼？` ➜ 確認能延續對話上下文回覆 ALPHA。
5. 傳送 `/clear` ➜ 重置對話階段。

---

### 🧪 Lab 2：建立定時巡檢排程
1. 傳送：`/schedule_add */15 * * * * 檢查系統負載與記憶體，若有異常則簡要回報`
2. 檢視 HostSpark 回傳的 Prompt 預覽，點擊 **[✅ 確認建立]**。
3. 傳送 `/schedule_list` ➜ 確認 ID #1 狀態為「啟用」，下次執行時間正確。
4. 到期時 ➜ HostSpark 自動主動推播巡檢報告至 Telegram。
5. 傳送 `/schedule_delete 1` ➜ 刪除排程，再次 `/schedule_list` 確認已清空。

---

### 🧪 Lab 3：建立靜默異常巡檢（`[NO_REPORT]` 測試）
1. 傳送：`/schedule_add 0 * * * * 檢查磁碟剩餘空間，若使用率未達 90% 則只輸出 [NO_REPORT]`
2. 點擊確認建立。
3. 整點到達時，若磁碟正常，Telegram 不會收到干擾通知；於 `/schedule_show 1` 可見執行次數增加且狀態為 `success`。

---

## 8. 故障排除 SOP 與常見問題

| 現象 / 錯誤 | 原因分析 | 處置方式 |
|---|---|---|
| 輸入「停止排程」後 HostSpark 回覆已停止但排程仍在跑 | 純文字輸入被當成一般 AI 對話處理，AI 產生幻覺確認但無法修改底層 DB | 必須使用斜線指令 `/schedule_delete <ID>` 或 `/schedule_pause <ID>` |
| HostSpark 顯示「思考與執行中」長達數分鐘不回應 | 對話中要求 AI 自行輪詢或耗時命令卡住 | 終端機執行 `ps aux \| grep agy` 找出該子進程並 `kill <PID>` 中止 |
| 排程收到「排程已自動暫停」通知 | 任務連續失敗 3 次觸發熔斷保護 | 使用 `/schedule_show <ID>` 查看上次錯誤原因，修復後以 `/schedule_resume <ID>` 恢復 |
| 收到 `Safe 模式權限拒絕` | 任務需要執行受限制的系統工具 | 評估是否真需修改權限；若確認安全可在 `.env` 切換為 `AGY_PERMISSION_MODE=full` |

---

## 9. 🎯 本章完成檢核清單 (Checklist)

請確認以下項目均已順利通過：

- [ ] **身分綁定**：已取得 Telegram Bot Token 與數字 User ID，且 `.env` 權限鎖定為 600。
- [ ] **服務常駐**：HostSpark `agy-telegram.service` 成功啟動並設為開機自啟動（`systemctl is-active` 為 active）。
- [ ] **指令互動**：成功在 Telegram 執行 `/status` 並取得主機狀態回報。
- [ ] **上下文管理**：已驗證多輪對話與 `/clear` 重置上下文功能。
- [ ] **排程兩階段確認**：成功使用 `/schedule_add` 建立 HostSpark 持久定時任務，並透過 Inline Keyboard 點擊確認。
- [ ] **靜默機制**：已測試 `[NO_REPORT]` 靜默回報機制，確認例行無異常時不洗版。
- [ ] **熔斷與恢復**：理解連續失敗 3 次自動熔斷保護與 `/schedule_resume` 恢復機制。

> [!TIP]
> 恭喜您完成全套課程！至此您不僅掌握了雲端基礎建設、多模型 API 治理、Web 全端 AI 應用開發與正式安全部署，更進一步解鎖了使用 HostSpark 進行 24/7 行動端伺服器自主維運的進階架構能力！
