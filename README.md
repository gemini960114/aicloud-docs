# 晶創雲雲平台 AI 應用開發課程

這是一套以國研院晶創雲雲平台（AI-Cloud）為教學環境的繁體中文課程教材，主題涵蓋 Antigravity 遠端協作、TAIWAN AI RAP、LiteLLM API Gateway、AI 會議轉錄系統、GitHub 版本交付，以及 Cloudflare Access／Tunnel 正式發布。

- [線上課程網站](https://gemini960114.github.io/aicloud-docs/)
- [課程總綱與學習地圖](https://gemini960114.github.io/aicloud-docs/guide/00_course_syllabus.html)
- [晶創雲雲平台使用手冊](https://docs.central.iic.nchc.org.tw/user-panel/)
- [TAIWAN AI RAP API Guide](https://rap.genai.nchc.org.tw/doc?section=api-guide)

## 課程特色

- 使用 Antigravity Remote SSH 與自然語言協助完成受控的 Linux 維運與開發操作。
- 先直接驗證 TAIWAN AI RAP API，再由 LiteLLM 統一模型別名、上游金鑰與呼叫入口。
- 透過 Virtual Key、模型白名單、RPM／TPM、期限及預算，練習多團隊與應用程式的 API 治理。
- 不提供整份範例程式碼，改以需求、限制、停損點與驗收條件組成 Prompt，引導 AI 分階段實作。
- 建立「錄音檔上傳 → STT 逐字稿 → 人工修訂 → LLM 結構化會議紀錄」全端應用。
- 開發期使用 Antigravity Ports 私人預覽；正式服務使用 Cloudflare Access 與具名 Tunnel。

## 六章課程地圖

| 章節 | 主題 | 學習成果 |
| :--- | :--- | :--- |
| 01 | 晶創雲雲平台基礎設施與 VM 建立 | 建立 VM，完成 Console、浮動 IP／跳板機與 SSH 安全群組準備 |
| 02 | Antigravity Remote SSH、自然語言維運與 Ports | 受控檢查與更新系統，安裝必要工具並預覽遠端 localhost |
| 03 | TAIWAN AI RAP 與 LiteLLM Gateway | 建立 `nchc-chat`、`meeting-stt`、`meeting-llm` 等模型別名 |
| 04 | Virtual Key、多租戶權限與流量治理 | 為不同團隊與會議系統配置獨立權限、限額及撤銷流程 |
| 05 | Prompt 協作建立 AI 會議轉錄與紀錄系統 | 完成錄音上傳、STT、逐字稿修訂、SSE 會議紀錄與 GitHub 交付 |
| 06 | Cloudflare Tunnel 與正式部署 | 使用 Production Build、Cloudflare Access 與 Tunnel 安全發布 |

另提供 [AI 協作提示詞模板庫](docs/guide/prompt_recipes.md)，協助把背景、目標、技術限制、安全限制、驗收條件與停損點組成可審閱的 Prompt。

## 最終架構

```text
[使用者]
    │ HTTPS
    ▼
[Cloudflare Access]
    │ 身分驗證與存取政策
    ▼
[Cloudflare Tunnel]
    │
    ▼
[Next.js 會議系統]
    │ 最小權限 LiteLLM Virtual Key
    ├── meeting-stt → TAIWAN AI RAP STT
    └── meeting-llm → RAP／其他已授權 LLM
              │
              ▼
     [LiteLLM Gateway＋PostgreSQL 治理資料]
```

會議應用本身不保存錄音、逐字稿或歷史紀錄；PostgreSQL 用於 LiteLLM 的 Virtual Key、團隊、限額與使用量治理。其他模型供應商只在學員確實取得授權時加入，並非完成核心課程的必要條件。

## Repository 結構

```text
.
├── docs/
│   ├── index.md                  # 課程網站首頁
│   ├── guide/                    # 課綱、六章教材與 Prompt 附錄
│   └── .vitepress/config.js      # VitePress 導覽與網站設定
├── .github/workflows/deploy.yml  # GitHub Pages 自動部署
├── package.json
└── README.md
```

## 本機預覽

需要 Node.js 20 或相容版本：

```bash
npm ci
npm run docs:dev
```

產生正式靜態網站：

```bash
npm run docs:build
```

Push 到 `main` 後，GitHub Actions 會建置 VitePress 並部署 GitHub Pages。

## 安全與授權原則

- 不要將 TAIWAN AI RAP API入口金鑰、LiteLLM Master Key、Virtual Key 或 Cloudflare Tunnel Token 提交到 Git。
- 上游供應商 Key 只交給 LiteLLM；Next.js 只持有最小權限 Virtual Key；瀏覽器不取得模型 API Key。
- LiteLLM 的集中管理與受控分發能力不代表取得 API 轉售、轉借或公開分享權利。
- 錄音、逐字稿與會議紀錄可能含有敏感資訊，不應提交到本 Repository 或完整寫入日誌。
- 平台介面、模型、版本、價格與限制可能更新，授課時請以各服務官方文件與實際帳號畫面為準。

## 名稱說明

**TAIWAN AI RAP** 是服務名稱；需要指稱程式介面時使用「TAIWAN AI RAP API」。本教材不使用「RAP API」作為服務名稱。
