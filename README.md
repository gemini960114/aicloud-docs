# 晶創雲雲平台 AI 應用開發課程

這是一套以國研院晶創雲雲平台（AI-Cloud）為核心環境的繁體中文實戰課程教材，主題完整貫穿：**基礎設施建置 ➔ 遠端協作 ➔ 統一模型網關與多租戶治理 ➔ 互動 Web 與 AI 智能賦能 ➔ 零信任安全發布 ➔ 手機端 24/7 行動 DevAIOps 自主維運**。

- 🌐 [線上課程網站 (GitHub Pages)](https://gemini960114.github.io/aicloud-docs/)
- 📌 [課程總綱與學習地圖](https://gemini960114.github.io/aicloud-docs/guide/00_course_syllabus.html)
- ☁️ [晶創雲雲平台使用手冊](https://docs.central.iic.nchc.org.tw/user-panel/)
- 🚀 [TAIWAN AI RAP API Guide](https://rap.genai.nchc.org.tw/doc?section=api-guide)

---

## ✨ 課程核心特色

1. **基礎設施與受控維運**：使用 Antigravity Remote SSH 與自然語言協助完成受控的 Linux VM 環境盤點、更新與工具鏈配置。
2. **多模型統整與 API 治理**：先直接驗證 TAIWAN AI RAP API，再由 LiteLLM 統一模型別名（如 `tutor-llm`、`nchc-chat`）；利用 PostgreSQL 持久化 Virtual Key、模型白名單、RPM/TPM 與預算限額，落實多租戶隔離。
3. **AI 智能賦能軟體 (AI-Augmented Software)**：
   - 不僅以 4 輪階梯式 Prompt 打造 React + HTML5 Canvas 60 FPS 四連桿機械運動學模擬器；
   - 更為模擬器注入「AI 大腦」：當學生拉錯桿長卡死時，系統調用 LiteLLM 網關進行白話幾何死點診斷，並提供「✨ 一鍵套用修復」自動回正滑桿！
4. **雲端零信任發布 (Zero Trust)**：主機防火牆嚴格禁止開放 8090、4000 等公網端口，透過 Cloudflare Access 與 Tunnel 安全對映至網際網路與手機平板。
5. **隨身 AI 工程特工 (Mobile DevAIOps)**：部署開源專案 HostSpark，在手機 Telegram 上隨身監控伺服器負載、設定 SQLite 持久定時巡檢（具備 3 次失敗自動熔斷機制），甚至能直接在手機上下達指令，命令主機自動編程、打包 Docker 並拉起 Tunnel 發布新服務！
6. **企業級延伸實戰案例庫**：獨立歸檔完整的全端 Next.js、LiteLLM STT 語音辨識與 Server-Sent Events (SSE) 即時串流會議紀錄系統。

---

## 🗺️ 全系列課程地圖

| 章節 | 主題 | 核心成果與技術交付物 |
| :--- | :--- | :--- |
| **第 1 章** | 晶創雲雲平台基礎設施與 VM 建立 | 建立 VM，完成 Console、浮動 IP／跳板機與最小化 SSH 安全群組（禁止公網開放應用連接埠） |
| **第 2 章** | Antigravity Remote SSH 與 Ports 預覽 | 受控檢查與更新系統，安裝 Docker、Node.js LTS、uv，建立標準工作目錄並預覽遠端服務 |
| **第 3 章** | TAIWAN AI RAP 與 LiteLLM Gateway | 統一國網與多模型為單一 Endpoint，配置 `tutor-llm`（連桿 AI 導師）、`nchc-chat` 模型別名 |
| **第 4 章** | Virtual Key、多租戶權限與流量治理 | 部署 PostgreSQL 持久化，發放 `fourbar-app-key` 專用金鑰（限制存取 `tutor-llm`，限制 RPM=30） |
| **第 5 章** | 四連桿模擬器與 AI 智能賦能 | 4 輪階梯式 Prompt 打造 Canvas 物理模擬器，結合 LiteLLM 幾何死點 AI 診斷與一鍵神修復 (Port 8090) |
| **第 6 章** | Cloudflare Tunnel 與正式部署 | 主機免開 Inbound Port，透過 Quick Tunnel 與具名 Zero Trust 將四連桿模擬器安全發布至手機與公網 |
| **第 7 章** | HostSpark 24/7 主機 AI 代理與行動 DevAIOps | 部署 HostSpark 核心，在手機 Telegram 上隨身巡檢主機，並以自然語言下指令自動編程與發布新服務 |

### 💡 延伸實戰案例庫 (Case Studies)

- [案例 1：AI 會議轉錄與紀錄系統](docs/cases/01_ai_meeting_transcription.md)：企業級 Next.js 全端、LiteLLM STT 語音辨識與 SSE 即時串流 Markdown 會議摘要生成。

### 🧩 課程附錄

- [AI 協作提示詞模板庫](docs/guide/prompt_recipes.md)：把背景、目標、限制、驗收與停損點組合成可重複使用的工程 Prompt Recipe。

---

## 🏛️ 全系列核心架構圖

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
│   ├── 四連桿機械模擬器 Docker 容器 (:8090) ──▶ Nginx + React 物理引擎    │
│   │      └── 後端代理：POST /api/diagnose (持有 fourbar-app-key)        │
│   │             │ (主機內部通訊，絕不對外暴露公網)                      │
│   │             ▼                                                      │
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

## 📂 Repository 結構

```text
.
├── docs/
│   ├── index.md                  # 課程網站首頁 (8 大卡片導覽)
│   ├── guide/                    # 課綱、7 大章節核心教材與 Prompt 附錄
│   │   ├── 00_course_syllabus.md
│   │   ├── 01_aicloud_infrastructure_setup.md
│   │   ├── 02_ssh_proxyjump_and_dev_env.md
│   │   ├── 03_litellm_gateway.md
│   │   ├── 04_litellm_api_governance.md
│   │   ├── 05_four_bar_linkage_simulator.md
│   │   ├── 06_cloudflare_deployment.md
│   │   ├── 07_telegram_vm_bridge.md
│   │   └── prompt_recipes.md
│   ├── cases/                    # 延伸實戰案例庫
│   │   └── 01_ai_meeting_transcription.md
│   └── .vitepress/config.js      # VitePress 導覽、側邊欄與網站設定
├── .github/workflows/deploy.yml  # GitHub Pages 自動化 CI/CD 部署
├── package.json
└── README.md
```

---

## 💻 本機預覽與靜態編譯

本專案使用 [VitePress](https://vitepress.dev/) 構建，需要 Node.js 20+ 環境：

```bash
# 1. 安裝相依套件
npm install

# 2. 啟動本機開發伺服器
npm run docs:dev

# 3. 靜態站點正式編譯驗收
npm run docs:build

# 4. 本機預覽編譯產物
npm run docs:preview
```

Push 到 `main` 分支後，GitHub Actions 會自動建置並發布至 GitHub Pages。

---

## 🔒 安全與授權原則

- **金鑰嚴禁入庫**：絕不將 TAIWAN AI RAP API 入口金鑰、LiteLLM Master Key、Virtual Key、Telegram Bot Token 或 Cloudflare Tunnel Token 提交到 Git。
- **上游供應商隔離**：上游 API 金鑰僅由 LiteLLM 保管；四連桿應用僅持有最小權限 Virtual Key；瀏覽器端絕不直接接觸任何模型金鑰。
- **最小網路暴露面**：主機防火牆嚴格禁止對公網開放應用程式連接埠，所有對外流量一律由 Cloudflare Tunnel 安全穿透。
- **免責聲明**：平台介面、模型版本、價格與限制可能隨時間更新，教學時請以各服務官方最新資訊為準。

---

## 🏷️ 名稱規範

**TAIWAN AI RAP** 是國網核心服務名稱；需要指稱程式介面時統一使用「TAIWAN AI RAP API」。
