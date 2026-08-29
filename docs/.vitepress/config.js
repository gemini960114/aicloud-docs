import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "晶創雲 AI Agent 實戰手冊",
  description: "國研院晶創雲 (AI-CLOUD) 自研 AI Agent Runtime 全端系統建置教學",
  base: '/aicloud-docs/',
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '首頁', link: '/' },
      { text: '課程大綱', link: '/guide/00_course_syllabus' },
      { text: '晶創雲後台', link: 'https://ai-cloud.iic.nchc.org.tw/' }
    ],
    sidebar: [
      {
        text: '📚 課程指南',
        items: [
          { text: '📌 課程總綱與學習地圖', link: '/guide/00_course_syllabus' },
          { text: '☁️ 第 01 章：晶創雲基礎設施與 VM 建立', link: '/guide/01_aicloud_infrastructure_setup' },
          { text: '🤖 第 02 章：遠端連線與 AI Agentic IDE 賦能', link: '/guide/02_ssh_proxyjump_and_dev_env' },
          { text: '🧠 第 03 章：大腦串接：Taiwan AI 雲端模型', link: '/guide/03_taiwan_ai_api_integration' },
          { text: '⚙️ 第 04 章：核心實戰：自研 AI Agent Runtime', link: '/guide/04_ai_agent_runtime_engine' },
          { text: '⚛️ 第 05 章：前端展現：React 現代觀測台', link: '/guide/05_react_agent_dashboard' },
          { text: '🔒 第 06 章：穿透發布與 24/7 維運 (方案 A)', link: '/guide/06_cloudflare_tunnel_and_systemd' }
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
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 BioBank & NCHC AI-CLOUD'
    }
  }
})
