---
layout: home

hero:
  name: "晶創雲雲平台 AI 應用開發課程"
  text: "Antigravity × TAIWAN AI RAP × LiteLLM"
  tagline: 從 AI 輔助遠端維運、多模型 API Gateway 與權限治理，到 Chatbot 建置、GitHub 版本交付及 Cloudflare 安全發布
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
    details: 向不同團隊與 Chatbot 發放獨立 Virtual Key，分別限制模型、RPM、TPM、期限與預算，並追蹤使用紀錄。
    link: /guide/04_litellm_api_governance
    linkText: 設計存取治理
  - icon: 💬
    title: 第 5 章｜AI 協作 Chatbot 與 GitHub
    details: 以需求、限制與驗收 Prompt 建立串流 Chatbot，再經 Secret 檢查及人工確認完成 GitHub 版本交付。
    link: /guide/05_nextjs_chatbot_with_ai
    linkText: 建立與交付應用
  - icon: 🔒
    title: 第 6 章｜Cloudflare 安全發布
    details: 將開發預覽轉為可持續運作的正式服務，使用 Production Build、Cloudflare Access 與 Tunnel 對外發布。
    link: /guide/06_cloudflare_deployment
    linkText: 發布正式服務
---
