---
layout: home

hero:
  name: "晶創雲 AI 應用開發課程"
  text: "從模型治理、全端開發到行動維運"
  tagline: "以國網晶創雲為核心，學習建置多模型 API 閘道、Next.js 語音轉錄串流、Cloudflare 安全發布與 Telegram 定時巡檢"
  actions:
    - theme: brand
      text: 查看課程地圖
      link: /guide/00_course_syllabus
    - theme: alt
      text: 晶創雲雲平台使用手冊
      link: https://docs.central.iic.nchc.org.tw/user-panel/

features:
  - icon: ☁️
    title: 第 1 章｜晶創雲雲平台與 VM
    details: 依官方手冊建立雲端 VM、鑰匙對與最小網路規則，先完成可登入、可驗收的基礎環境。
    link: /guide/01_aicloud_infrastructure_setup
    linkText: 開始建立 VM
  - icon: 🛰️
    title: 第 2 章｜Antigravity 遠端協作
    details: 透過 Remote SSH 操作 VM，以自然語言協助環境盤點、安裝與驗證，並用 Ports 預覽遠端 localhost。
    link: /guide/02_ssh_proxyjump_and_dev_env
    linkText: 設定遠端開發
  - icon: 🔀
    title: 第 3 章｜TAIWAN AI RAP 與 LiteLLM
    details: 先驗證 TAIWAN AI RAP API，再以 LiteLLM 將國網、OpenAI、Anthropic Claude 等已授權上游統一為模型別名與單一 Gateway。
    link: /guide/03_litellm_gateway
    linkText: 建立模型 Gateway
  - icon: 🛡️
    title: 第 4 章｜Virtual Key 與流量治理
    details: 向不同團隊與會議系統發放獨立 Virtual Key，分別限制 STT／LLM 模型、RPM、TPM、期限與預算。
    link: /guide/04_litellm_api_governance
    linkText: 設計存取治理
  - icon: 🎙️
    title: 第 5 章｜AI 會議轉錄與紀錄
    details: 以分階段 Prompt 建立錄音檔上傳、STT、逐字稿修訂與串流會議紀錄，再安全交付到 GitHub。
    link: /guide/05_ai_meeting_transcription
    linkText: 建立會議系統
  - icon: 🔒
    title: 第 6 章｜Cloudflare 安全發布
    details: 將會議系統轉為可持續運作的正式服務，以 Cloudflare Access 保護沒有內建帳號的應用，再透過 Tunnel 發布。
    link: /guide/06_cloudflare_deployment
    linkText: 發布正式服務
  - icon: 🤖
    title: 第 7 章｜Telegram × AGY 行動維運
    details: 部署 Telegram 輕量橋接器，結合主機級定時排程與 AGY CLI，實現手機端 24 小時伺服器巡檢與遙控維運。
    link: /guide/07_telegram_vm_bridge
    linkText: 探索行動維運
---
