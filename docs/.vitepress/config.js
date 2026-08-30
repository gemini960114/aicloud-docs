import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "晶創雲雲平台 AI 應用開發課程",
  description: "使用 Antigravity、TAIWAN AI RAP、LiteLLM 與 Cloudflare，學習 AI 應用建置、治理、發布與 Telegram 行動維運",
  head: [
    ['link', { rel: 'icon', href: 'https://docs.central.iic.nchc.org.tw/user-panel/img/favicon.ico' }]
  ],
  base: '/aicloud-docs/',
  themeConfig: {
    nav: [
      { text: '首頁', link: '/' },
      { text: '課程大綱', link: '/guide/00_course_syllabus' },
      { text: '晶創雲雲平台後台', link: 'https://ai-cloud.iic.nchc.org.tw/' },
      { text: 'TAIWAN AI RAP API Guide', link: 'https://rap.genai.nchc.org.tw/doc?section=api-guide' }
    ],
    sidebar: [
      {
        text: '📚 課程指南',
        items: [
          { text: '📌 課程總綱與學習地圖', link: '/guide/00_course_syllabus' },
          { text: '☁️ 第 1 章：晶創雲雲平台 VM 建立', link: '/guide/01_aicloud_infrastructure_setup' },
          { text: '🛰️ 第 2 章：Antigravity Remote SSH 與 Ports', link: '/guide/02_ssh_proxyjump_and_dev_env' },
          { text: '🔀 第 3 章：TAIWAN AI RAP 與 LiteLLM Gateway', link: '/guide/03_litellm_gateway' },
          { text: '🛡️ 第 4 章：Virtual Key 與流量治理', link: '/guide/04_litellm_api_governance' },
          { text: '🎙️ 第 5 章：AI 會議轉錄與紀錄', link: '/guide/05_ai_meeting_transcription' },
          { text: '🔒 第 6 章：Cloudflare 正式部署', link: '/guide/06_cloudflare_deployment' },
          { text: '🤖 第 7 章：Telegram × AGY 行動維運', link: '/guide/07_telegram_vm_bridge' },
          { text: '🧩 附錄：AI 協作提示詞模板庫', link: '/guide/prompt_recipes' }
        ]
      }
    ],
    search: {
      provider: 'local'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/gemini960114/aicloud-docs' }
    ],
    footer: {
      message: '課程中的平台畫面、版本與價格請以各服務官方資訊為準。',
      copyright: 'Copyright © 2026 AI-Cloud Course'
    }
  }
})
