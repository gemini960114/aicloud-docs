# 國研院晶創雲 (AI-CLOUD) 實戰課程：自研 AI Agent Runtime 與全端雲端部署

## 📌 課程簡介
本課程以**國研院晶創雲 (AI-CLOUD, ai-cloud.iic.nchc.org.tw)** 為實作基礎，帶領學員從最底層的雲端基礎設施（網路、安全群組、CPU VM 實例、鑰匙對）出發，逐步構建個人的雲端開發環境，並親手使用 **Python (FastAPI + uv) + React (Vite)** 打造一套完整的 **自研輕量級 AI Agent Runtime（智能體執行環境）**，串接 **Taiwan AI 平台算力**，最後透過 **Cloudflare Tunnel (方案 A)** 實現零開 Port、免公網 IP 的專屬 HTTPS 服務發布！

---

## 🗺️ 完整章節目錄與學習地圖

| 章節編號 | 文件名稱 | 核心主題 |
| :--- | :--- | :--- |
| **第 01 章** | [01_aicloud_infrastructure_setup.md](file:///home/ubuntu/aicloud_agent_course/01_aicloud_infrastructure_setup.md) | **晶創雲 (AI-CLOUD) 平台基礎設施與 VM 建立篇**（鑰匙對、虛擬網路、安全群組、CPU VM、虛擬磁碟） |
| **第 02 章** | [02_ssh_proxyjump_and_dev_env.md](file:///home/ubuntu/aicloud_agent_course/02_ssh_proxyjump_and_dev_env.md) | **開發連線與極速環境篇**（本機 SSH ProxyJump 穿透直連 + uv + Node.js + Docker 初始化） |
| **第 03 章** | [03_taiwan_ai_api_integration.md](file:///home/ubuntu/aicloud_agent_course/03_taiwan_ai_api_integration.md) | **大腦串接：Taiwan AI RAP API 雲端模型篇**（Token 管理、Tool Calling 語法、SSE 串流打字機機制） |
| **第 04 章** | [04_ai_agent_runtime_engine.md](file:///home/ubuntu/aicloud_agent_course/04_ai_agent_runtime_engine.md) | **核心實戰：自研輕量級 AI Agent Runtime 引擎篇**（ReAct 規劃迴圈、Linux Bash/Python 工具箱、FastAPI SSE 調度） |
| **第 05 章** | [05_react_agent_dashboard.md](file:///home/ubuntu/aicloud_agent_course/05_react_agent_dashboard.md) | **前端展現：React 現代化 Agent 觀測台與監控篇**（深色玻璃擬態 UI、AI 思考鏈視覺化、CPU/RAM 負載卡片） |
| **第 06 章** | [06_cloudflare_tunnel_and_systemd.md](file:///home/ubuntu/aicloud_agent_course/06_cloudflare_tunnel_and_systemd.md) | **穿透發布與 24/7 維運篇 (方案 A)**（Cloudflare Tunnel 零開 Port 發布 `*.biobank.org.tw` + Systemd 常駐） |

---

## 🎯 最終專案實作架構

```
[ 個人筆電 / VS Code ] ──(SSH ProxyJump 一鍵直連)──► [ 晶創雲 CPU VM (10.0.0.x / 192.168.x.x) ]
                                                                 │
                                                                 ▼
                                                  ┌─────────────────────────────┐
                                                  │ 🤖 自研 AI Agent Runtime    │
                                                  │    (FastAPI + uv)           │
                                                  │ ├── ReAct 思考與決策迴圈    │
                                                  │ ├── Linux Bash Executor     │
                                                  │ └── Python Sandbox Tool     │
                                                  └──────┬───────────────┬──────┘
                                                         │               │
                                   (1. 串流推播 SSE/WS)  │               │ (2. 模型推論)
                                                         ▼               ▼
                                            [ React 現代觀測台 ]   [ Taiwan AI RAP API ]
                                                         │
                                                         ▼
                                            [ Cloudflare Tunnel 方案 A ] ──► 專屬 HTTPS
```
