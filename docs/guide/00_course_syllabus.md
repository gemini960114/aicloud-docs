# 晶創雲雲平台 AI 應用開發課程

## 課程定位

本課程以國研院 **晶創雲雲平台（AI-Cloud）** 為教學環境，帶領學員建立雲端 VM，透過 **Antigravity Remote SSH** 連線，使用自然語言協助檢查環境、安裝軟體、設定服務與驗證成果。

課程包含兩大實戰主軸：
1. **對外 Web AI 應用**：先驗證 **TAIWAN AI RAP** 模型 API，部署 **LiteLLM Gateway** 實現多模型統一管理與 Virtual Key 治理，接著以 Prompt 協作開發「錄音檔轉錄與 LLM 會議紀錄系統」，並透過 **Cloudflare Tunnel + Zero Trust Access** 安全發布至公網。
2. **對內 AIOps 行動維運（進階）**：在 Linux VM 部署 **HostSpark（24/7 Autonomous AI Agent for Linux Hosts）**，利用持久定時任務（Persistent Scheduled Tasks）實現 24 小時無人值守的伺服器巡檢與 Telegram 手機端自主維運。

> **名稱說明：**「TAIWAN AI RAP」是服務名稱；「TAIWAN AI RAP API」是該服務提供的程式介面。教材首次出現時使用完整名稱，後文簡稱 RAP。

---

## 適合對象

- 想認識晶創雲雲平台 VM 與網路環境的開發者或研究人員
- 想用 AI 輔助完成 Linux 操作與應用開發的初學者
- 想統一管理多個模型 API 的平台或應用開發人員
- 想透過手機（Telegram）遠端監控伺服器並建立 24/7 AI 自動化排程的維運工程師

---

## 課前準備

- 可登入晶創雲雲平台，並已加入具備可用配額的專案
- 可在個人電腦安裝 Antigravity IDE
- 具備 iService／TAIWAN AI RAP 使用資格、可用計畫與 API入口金鑰
- 若要完成第 6 章正式發布：可使用 Cloudflare Zero Trust，並有可管理的網域
- 若要完成第 7 章行動維運：具備 Telegram 帳號，並可向 `@BotFather` 申請 Bot Token

---

## 完成後能做到什麼

1. 建立並安全登入晶創雲雲平台 VM，配置嚴格的安全群組。
2. 使用 Antigravity Remote SSH 與自然語言協助完成受控的系統操作。
3. 使用 Antigravity Ports 預覽遠端 VM 上的 `localhost` 開發服務。
4. 透過 LiteLLM 將 TAIWAN AI RAP 與其他授權模型整合成統一的模型 API Gateway。
5. 向不同團隊與應用程式發放獨立 Virtual Key，分別管理模型權限、流量、期限與預算。
6. 以 4 輪階梯式 Prompt 引導 AI 打造互動式四連桿模擬器，並以 Docker 封裝交付。
7. 使用 Cloudflare Access 與 Tunnel，將四連桿模擬器免開防火牆發布至公網供手機操作。
8. 部署 HostSpark 主機 AI 代理，利用確定性排程與自然語言推理實現手機端伺服器自主維運。

---

## 課程章節

| 章節 | 主題 | 主要成果 |
| :--- | :--- | :--- |
| [第 1 章](/guide/01_aicloud_infrastructure_setup) | 晶創雲雲平台基礎設施與 VM 建立 | VM 為 `active`，完成 Console、浮動 IP／跳板機與 SSH 安全群組準備 |
| [第 2 章](/guide/02_ssh_proxyjump_and_dev_env) | Antigravity Remote SSH、自然語言維運與 Ports 預覽 | 完成受控更新、Docker、Node.js 與 uv 等必要工具，並安全預覽測試服務 |
| [第 3 章](/guide/03_litellm_gateway) | TAIWAN AI RAP 與 LiteLLM 多模型 API Gateway | 將國網、OpenAI、Anthropic Claude 等已授權上游統一為模型別名與單一 Endpoint |
| [第 4 章](/guide/04_litellm_api_governance) | Virtual Key、多租戶權限與流量治理 | 為團隊與應用服務發放不同權限、限額、期限及可撤銷的憑證 |
| [第 5 章](/guide/05_four_bar_linkage_simulator) | 動手玩機構：互動式四連桿模擬器與 AI 智能賦能 | 4 輪階梯式 Prompt 打造 Canvas 物理模擬器、LiteLLM 死點 AI 診斷與一鍵修復 (Port 8090) |
| [第 6 章](/guide/06_cloudflare_deployment) | Cloudflare Tunnel 與正式部署 | 免開防火牆端口，透過 Quick Tunnel 與具名 Zero Trust 將四連桿模擬器安全發布至公網與手機 |
| [第 7 章](/guide/07_telegram_vm_bridge) | HostSpark 24/7 主機 AI 代理與行動 DevAIOps | 部署 HostSpark 核心，在手機 Telegram 上隨身監控伺服器，並以自然語言下指令自動編程、建置 Docker 與發布服務 |

### 💡 延伸實戰案例庫

- [案例 1：AI 會議轉錄與紀錄系統](/cases/01_ai_meeting_transcription)：全端 Next.js、LiteLLM STT 語音辨識與 SSE 串流會議紀錄生成企業級架構。

### 課程附錄

- [AI 協作提示詞模板庫](/guide/prompt_recipes)：把背景、目標、限制、驗收與停損點組合成可重複使用的 Prompt Recipe。

---

## 全系列核心架構圖

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          學員本機 / 管理員手機                           │
│   ├── Antigravity Remote SSH (開發預覽: localhost:8090 / 4000)         │
│   ├── 手機 / 外部訪客瀏覽器 (Cloudflare Tunnel: linkage.yourdomain.com) │
│   └── 管理員 Telegram App (HostSpark 行動 DevAIOps: 手機下指令/巡檢)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        晶創雲 Linux VM (Ubuntu)                        │
│                                                                        │
│  【應用模組 A：Web 與模型服務】                                         │
│   ├── 四連桿機械模擬器 (:8090) ──(fourbar-app-key 呼叫 tutor-llm)──▶    │
│   └── LiteLLM Gateway (:4000) ──(Provider Key)──▶ 國網 RAP API / AI     │
│          └── PostgreSQL (:5432 持久化 / 支援延伸企業案例)               │
│                                                                        │
│  【應用模組 B：HostSpark 行動 DevAIOps 自主代理】                       │
│   ├── HostSpark Core Engine (Python systemd 服務 / Telegram 長輪詢)    │
│   ├── SQLite schedules.db (持久定時排程器 / 3次失敗熔斷機制)           │
│   └── HostSpark 專屬主機代理 (AGY CLI：手機對話 ➔ 自動寫代碼/建容器/發布)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 貫穿全課程的 AI 協作原則

每次請 Antigravity 操作 VM 或專案時，都依循以下流程：

```text
先檢查 → 提出計畫 → 人工確認 → 分步執行 → 驗證結果 → 整理紀錄
```

建議通用提示詞：

> 請先檢查目前狀態並提出計畫，不要立即修改。列出預計使用的指令、影響範圍、風險與驗證方式；等我確認後再逐步執行。遇到 sudo、刪除資料、修改防火牆、公開服務或顯示敏感資訊時，必須停下來再次詢問。

---

## 安全底線

- API Key 不貼入對話、不寫入程式碼、不提交 Git。
- TAIWAN AI RAP API入口金鑰依計畫個別管理；不要與 Portal 的使用者金鑰或 LiteLLM Virtual Key 混用。
- 應用服務對外由 Cloudflare Tunnel 安全發布，內部模型閘道與資料庫嚴格禁止直接對公網開放。
- 開發服務透過 Antigravity Ports 預覽，不開放晶創雲的 8090、3000、4000 等入站連接埠。
- Cloudflare Tunnel 搭配 Cloudflare Access 保護使用者入口，LiteLLM Virtual Key、模型白名單與限流保護模型服務。
- HostSpark 強制限定數字 `ALLOWED_USER_IDS` 白名單，並預設以 `safe` 模式運行。
- 課程結束後停止或刪除不再使用的計費資源，並撤銷臨時金鑰。
