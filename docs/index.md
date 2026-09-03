---
layout: home

hero:
  name: "晶創雲 AI 應用課程"
  text: "從模型治理、全端開發到行動維運"
  tagline: "以國網晶創雲為基礎，完整掌握模型閘道治理、AI 互動應用開發、零信任安全發布與手機端自主維運"
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
  - icon: ⚙️
    title: 第 5 章｜四連桿模擬器與 AI 開發
    details: 以 4 輪階梯式 Prompt 打造 React + Canvas 60 FPS 物理模擬器與 6 大生活機械預設庫，並以 Docker 封裝。
    link: /guide/05_four_bar_linkage_simulator
    linkText: 探索連桿模擬器
  - icon: 🔒
    title: 第 6 章｜Cloudflare 安全發布
    details: 免開防火牆端口，透過 Quick Tunnel 與具名 Zero Trust 將四連桿模擬器安全發布至公網，手機即時觸控體驗。
    link: /guide/06_cloudflare_deployment
    linkText: 發布正式服務
  - icon: 🤖
    title: 第 7 章｜HostSpark 行動 DevAIOps
    details: 在手機 Telegram 上隨身遙控 VM：從伺服器自動巡檢到手機下指令自動編程、啟動容器與公網發布！
    link: /guide/07_telegram_vm_bridge
    linkText: 探索行動維運
---
