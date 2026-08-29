# 晶創雲 AI 應用實戰：Antigravity、LiteLLM Gateway 與全端 Chatbot

## 課程定位

本課程以國研院晶創雲（AI-Cloud）為實作環境，帶領學員建立一台雲端 VM，透過 **Antigravity Remote SSH** 連線，使用自然語言協助檢查環境、安裝軟體、設定服務與驗證成果。

完成基礎環境後，學員會部署 **LiteLLM Proxy**，將國網及其他已取得授權的模型 API 統一為 OpenAI-compatible 介面，再請 AI 協助建立一個 **Next.js 全端 Chatbot**。開發期間使用 Antigravity 的 **Ports** 功能預覽遠端 `localhost` 服務；正式提供服務時，再使用 **Cloudflare Tunnel** 與服務常駐機制發布。

> 本課程教的是「受治理的 API Gateway」，不是共用、轉售或轉借供應商帳號。所有上游 API 都必須符合帳號、專案及供應商的授權範圍。

## 適合對象

- 想認識晶創雲 VM 與網路環境的開發者或研究人員
- 想用 AI 輔助完成 Linux 操作與應用開發的初學者
- 想統一管理多個模型 API 的平台或應用開發人員
- 具備基本終端機概念，但不要求先熟悉 React、Next.js 或 LiteLLM

## 課前準備

- 可登入晶創雲，並已加入具備可用配額的專案
- 可在個人電腦安裝 Antigravity IDE
- 具備 iService／TAIWAN AI RAP 使用資格、可用計畫，以及由 Lightweight Portal 建立的 API入口金鑰
- 若要練習多供應商路由：另備至少一組經授權的模型 API Endpoint、模型名稱與 API Key
- 若要完成正式發布：可使用 Cloudflare Zero Trust，並有可管理的網域

## 完成後能做到什麼

1. 建立並安全登入晶創雲 VM。
2. 使用 Antigravity Remote SSH 與自然語言協助完成受控的系統操作。
3. 使用 Antigravity Ports 預覽遠端 VM 上的 `localhost` 開發服務。
4. 透過 LiteLLM 建立統一的模型 API Gateway。
5. 為應用程式建立獨立金鑰、模型權限、流量限制與使用紀錄。
6. 以需求提示詞引導 AI 建立 Next.js 全端 Chatbot，而不是單純複製完整程式碼。
7. 以 Prompt 完成 GitHub CLI 網頁授權、Secret 檢查與受控的版本交付。
8. 使用 Cloudflare Tunnel 將正式服務安全發布到網際網路。

## 課程章節

| 章節 | 主題 | 主要成果 |
| :--- | :--- | :--- |
| [第 1 章](/guide/01_aicloud_infrastructure_setup) | 晶創雲基礎設施與 VM 建立 | VM 進入 `active`，並能從 Console 登入 |
| [第 2 章](/guide/02_ssh_proxyjump_and_dev_env) | Antigravity Remote SSH、自然語言維運與 Ports 預覽 | 遠端工作區可操作，能安全預覽測試服務 |
| [第 3 章](/guide/03_litellm_gateway) | LiteLLM 多模型 API Gateway | 以統一 Endpoint 呼叫國網及其他授權模型 |
| [第 4 章](/guide/04_litellm_api_governance) | API 金鑰、權限、流量與服務治理 | 為 Chatbot 建立最小權限的專用憑證 |
| [第 5 章](/guide/05_nextjs_chatbot_with_ai) | 用 AI 協作建立 Next.js 全端 Chatbot | 完成串流 Chatbot，並以人工確認的 Prompt 流程交付到 GitHub |
| [第 6 章](/guide/06_cloudflare_deployment) | Cloudflare Tunnel 與正式部署 | 以 HTTPS 網域持續提供受保護的 Chatbot |

### 課程附錄

- [AI 協作提示詞模板庫](/guide/prompt_recipes)：把背景、目標、限制、驗收與停損點組合成可重複使用的 Prompt Recipe。

## 最終架構

```text
開發階段
────────
[學員瀏覽器]
      ▲
      │ Antigravity Ports（私人預覽）
      │
[Antigravity Remote SSH]
      │
      ▼
[晶創雲 VM]
├── Next.js Chatbot        127.0.0.1:3000
└── LiteLLM Proxy          127.0.0.1:4000
          ├── 國網模型 API
          └── 其他已授權模型 API

正式服務
────────
[外部使用者]
      │ HTTPS
      ▼
[Cloudflare Access / Tunnel]
      │
      ▼
[Next.js 正式服務 :3000]
      │ 伺服器端專用 Virtual Key
      ▼
[LiteLLM :4000（不直接公開）]
      ├── 國網模型 API
      └── 其他已授權模型 API
```

## 貫穿全課程的 AI 協作原則

每次請 Antigravity 操作 VM 或專案時，都依循以下流程：

```text
先檢查 → 提出計畫 → 人工確認 → 分步執行 → 驗證結果 → 整理紀錄
```

建議通用提示詞：

> 請先檢查目前狀態並提出計畫，不要立即修改。列出預計使用的指令、影響範圍、風險與驗證方式；等我確認後再逐步執行。遇到 sudo、刪除資料、修改防火牆、公開服務或顯示敏感資訊時，必須停下來再次詢問。

## 安全底線

- API Key 不貼入對話、不寫入程式碼、不提交 Git。
- RAP API入口金鑰依計畫個別管理；不要與 Portal 的使用者金鑰或 LiteLLM Virtual Key 混用。
- 瀏覽器只呼叫 Chatbot 後端，不直接取得 LiteLLM 或上游供應商金鑰。
- 開發服務透過 Antigravity Ports 預覽，不開放晶創雲的 3000、4000 等連接埠。
- Cloudflare Tunnel 是網路入口，不取代登入、API 授權、流量限制與稽核。
- 課程結束後停止或刪除不再使用的計費資源，並撤銷臨時金鑰。

TAIWAN AI RAP 的申請畫面、模型與參數可能更新，開課時請以 [RAP API Guide](https://rap.genai.nchc.org.tw/doc?section=api-guide) 與 Lightweight Portal 當下資訊為準。
