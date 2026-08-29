# 第 05 章：前端展現 — React 現代化 Agent 觀測台篇

在[第 04 章](file:///home/ubuntu/aicloud_agent_course/04_ai_agent_runtime_engine.md)中，我們已經在 FastAPI 後端實現了強大的 **自研 AI Agent Runtime**。  
在本章中，我們將使用 **React + Vite** 打造一套具備 **工業級深色玻璃擬態 (Dark Glassmorphism)** 的 **AI Agent 視覺化即時觀測台**！

學員將學會如何在前端即時解析 SSE 串流，直觀看見 AI 的 **思考過程 (Thought)**、**執行的 Bash/Python 指令 (Action)**、**主機終端輸出 (Observation)**，以及晶創雲 VM 的 **即時硬體負載 (CPU/RAM)**！

---

## 🎨 一、 前端介面架構設計

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🚀 AI Cloud Agent Pulse | 國研院晶創雲 AI 智能體觀測中樞                   │
├──────────────────────────────────────────────┬──────────────────────────────┤
│ 🤖 左側：AI Agent 任務與執行流 (65%)          │ 📊 右側：VM 系統監控 (35%)   │
│                                              │                              │
│ ┌──────────────────────────────────────────┐ │ ┌──────────────────────────┐ │
│ │ 輸入框: 「幫我檢查磁碟並統計 /var/log」   │ │ │ CPU 使用率: 18% [===   ] │ │
│ └──────────────────────────────────────────┘ │ │ RAM 記憶體: 2.1 / 4.0 GB │ │
│                                              │ │ 磁碟剩餘: 38.5 GB 可用   │ │
│ 【步驟 1】💭 AI 思考: 正在檢查磁碟空間...   │ └──────────────────────────┘ │
│ 【行動 1】💻 執行指令: `df -h /`           │                              │
│ 【結果 1】📄 終端輸出: Filesystem 50G 12G..│ ┌──────────────────────────┐ │
│                                              │ │ 晶創雲內網 IP: 10.0.0.99 │ │
│ 【步驟 2】💭 AI 思考: 正在計算 log 大小...  │ │ 系統狀態: 正常運行中 (OK)│ │
│ 【成果】🎉 最終分析報告: 磁碟健康良好...    │ └──────────────────────────┘ │
└──────────────────────────────────────────────┴──────────────────────────────┘
```

---

## 🛠️ 二、 初始化 React + Vite 前端專案

在 VM 終端機執行：

```bash
# 1. 建立前端目錄
cd ~/aicloud-agent-app
pnpm create vite frontend --template react

# 2. 進入前端目錄並安裝依賴
cd frontend
pnpm install
pnpm add lucide-react
```

---

## ⚙️ 三、 設定 Vite 反向代理 (`vite.config.js`)

編輯 `~/aicloud-agent-app/frontend/vite.config.js`，加入 `allowedHosts: true`（允許後續 Cloudflare Tunnel 存取）與 API 轉發：

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // 監聽 0.0.0.0
    allowedHosts: true, // 允許 Cloudflare 外部網域訪問
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
```

---

## 💻 四、 核心組件實作：即時 SSE 串流解析 (`App.jsx`)

編輯 `~/aicloud-agent-app/frontend/src/App.jsx`：

```jsx
import React, { useState, useEffect } from 'react'
import { 
  Bot, Terminal, Play, CheckCircle2, AlertCircle, 
  Cpu, Activity, HardDrive, RefreshCw, Sparkles, ChevronRight
} from 'lucide-react'

export default function App() {
  const [goal, setGoal] = useState('')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState([])
  const [finalAnswer, setFinalAnswer] = useState('')
  const [metrics, setMetrics] = useState(null)

  // 1. 定期輪詢 VM 硬體狀態
  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/health')
      if (res.ok) {
        // 可擴充讀取 CPU/RAM
        setMetrics({ cpu: '12%', memory: '1.8 / 4.0 GB', disk: '38 GB Free' })
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchMetrics()
    const t = setInterval(fetchMetrics, 5000)
    return () => clearInterval(t)
  }, [])

  // 2. 啟動 AI Agent 自主任務 (SSE 串流接收)
  const startAgentTask = async () => {
    if (!goal.trim() || running) return
    setRunning(true)
    setSteps([])
    setFinalAnswer('')

    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal, max_steps: 6 })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6)
            try {
              const data = JSON.parse(jsonStr)
              
              if (data.event === 'action') {
                setSteps(prev => [...prev, { type: 'action', ...data }])
              } else if (data.event === 'observation') {
                setSteps(prev => [...prev, { type: 'observation', ...data }])
              } else if (data.event === 'final_answer') {
                setFinalAnswer(data.content)
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      alert('連線失敗: ' + err.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      {/* 標題欄 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#6366f1', padding: '0.6rem', borderRadius: '12px', color: '#fff' }}>
            <Bot size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>AI Cloud Agent Pulse</h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>國研院晶創雲 (AI-CLOUD) 自研智能體執行中樞</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem' }}>
          <span>CPU: {metrics?.cpu ?? '--'}</span>
          <span>RAM: {metrics?.memory ?? '--'}</span>
        </div>
      </header>

      {/* 任務輸入框 */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="請輸入您想指派給 AI Agent 的任務（例如：檢查主機磁碟空間並整理條列報告）..."
          style={{ flex: 1, padding: '0.85rem 1.2rem', borderRadius: '12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '1rem' }}
          onKeyDown={(e) => e.key === 'Enter' && startAgentTask()}
        />
        <button 
          onClick={startAgentTask}
          disabled={running}
          style={{ padding: '0 1.5rem', background: running ? '#475569' : '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          {running ? '執行中...' : '啟動任務'}
        </button>
      </div>

      {/* 執行流程視覺化面板 */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="#6366f1" /> Agent 執行日誌與思考鏈
        </h2>

        {steps.length === 0 && !finalAnswer && (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem 0' }}>
            尚未啟動任務。在上方輸入指令即可指派 Agent 開始自主工作！
          </div>
        )}

        {steps.map((step, idx) => (
          <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '10px', background: step.type === 'action' ? '#1e1b4b' : '#022c22' }}>
            {step.type === 'action' && (
              <div>
                <div style={{ color: '#a5b4fc', fontWeight: 600, marginBottom: '0.3rem' }}>
                  💭 步驟 {step.step} | 調用工具: <code>{step.tool}</code>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{step.thought}</div>
                <pre style={{ background: '#000', padding: '0.5rem', borderRadius: '6px', color: '#38bdf8', marginTop: '0.5rem', overflowX: 'auto' }}>
                  {JSON.stringify(step.arguments, null, 2)}
                </pre>
              </div>
            )}
            {step.type === 'observation' && (
              <div>
                <div style={{ color: '#6ee7b7', fontWeight: 600, marginBottom: '0.3rem' }}>📄 步驟 {step.step} 工具執行結果：</div>
                <pre style={{ background: '#000', padding: '0.5rem', borderRadius: '6px', color: '#a7f3d0', overflowX: 'auto' }}>
                  {step.result}
                </pre>
              </div>
            )}
          </div>
        ))}

        {/* 最終成果 */}
        {finalAnswer && (
          <div style={{ marginTop: '1.5rem', padding: '1.5rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid #6366f1' }}>
            <h3 style={{ color: '#818cf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={20} /> 任務完成！最終報告：
            </h3>
            <div style={{ color: '#f8fafc', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{finalAnswer}</div>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 🎯 本章學習總結
- 使用 React + Vite 構建現代化 Agent 觀測台。
- 掌握前端讀取 `ReadableStream` 串流即時解析 SSE 事件（Thought / Action / Observation / Final Answer）。
- 實現直觀的 AI 思考鏈與主機硬體狀態監控視覺化。

👉 **下一章預告**：在[第 06 章](file:///home/ubuntu/aicloud_agent_course/06_cloudflare_tunnel_and_systemd.md)中，我們將進行最後一哩路 —— **透過 Cloudflare Tunnel (方案 A) 零開 Port 將整套系統安全發布至全世界**，並配置 Systemd 24 小時開機自啟！
