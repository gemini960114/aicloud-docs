# 第 04 章：核心實戰 — 自研輕量級 AI Agent Runtime 引擎篇

在[第 03 章](file:///home/ubuntu/aicloud_agent_course/03_taiwan_ai_api_integration.md)中，我們已經實現了基本的 LLM 對話串流。  
但真正的 **AI Agent（智能體）** 與一般聊天機器人的本質差異在於：  
👉 **Agent 能夠「自主規劃 (Planning)」、「調用工具 (Tool Calling)」、「在主機上執行代碼 (Code Execution)」，並根據結果「自我修正」**！

在本章中，我們將親手用純 Python + FastAPI 打造一套 **自研輕量級 AI Agent Runtime（智能體執行引擎）**！

---

## 🏗️ 一、 Agent Runtime 的核心架構：ReAct 迴圈

我們的 Agent Runtime 將實作業界最經典且強大的 **ReAct (Reason + Act)** 架構：

```
                              ┌────────────────────────┐
                              │ 使用者任務 (Task Goal) │
                              └───────────┬────────────┘
                                          ▼
                         ┌─────────────────────────────────┐
                         │   1. Thought: 思考當前狀態與下一步   │
                         └────────────────┬────────────────┘
                                          ▼
                         ┌─────────────────────────────────┐
                         │   2. Action: 決定調用哪個工具       │
                         │      (例如 run_bash / run_python) │
                         └────────────────┬────────────────┘
                                          ▼
                         ┌─────────────────────────────────┐
                         │   3. Execution: 在 VM 實際執行工具 │
                         └────────────────┬────────────────┘
                                          ▼
                         ┌─────────────────────────────────┐
                         │   4. Observation: 獲取執行輸出結果 │
                         └────────────────┬────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │ 任務是否已完成？                             │
                   ├────────────────────────┬────────────────────┤
                   ▼ (否: 帶著結果繼續思考)   ▼ (是: 輸出最終成果)  
             [ 回到步驟 1 ]              [ Final Answer 完成 ]
```

---

## 🛠️ 二、 工具註冊系統 (Tool Registry & Execution)

在 `~/aicloud-agent-app/backend/agent_tools.py` 建立工具箱模組：

```python
import subprocess
import sys
import psutil
import json

# 1. 定義提供給大模型的標準 OpenAI / Taiwan AI Tool Schema
AGENT_TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "run_bash",
            "description": "在晶創雲 Linux VM 上執行 Bash 終端機指令（例如查看檔案、檢查服務、管理行程等）",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "要執行的 Linux 指令"}
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_python_code",
            "description": "在主機上動態執行 Python 腳本（用於資料處理、科學計算、統計分析等）",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "要執行的完整 Python 程式碼"}
                },
                "required": ["code"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_system_metrics",
            "description": "讀取當前 Linux VM 的 CPU 使用率、記憶體與硬碟空間狀態",
            "parameters": {"type": "object", "properties": {}},
        },
    }
]

# 2. 實際執行工具的 Python 實作
def tool_run_bash(command: str) -> str:
    """安全執行 Bash 指令並捕獲 stdout / stderr"""
    try:
        res = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=45
        )
        output = res.stdout if res.returncode == 0 else f"[Exit Code {res.returncode}] Error:\n{res.stderr}"
        return output.strip() if output.strip() else "(指令執行成功，無文字輸出)"
    except subprocess.TimeoutExpired:
        return "[Error] 指令執行超時 (超過 45 秒)"
    except Exception as e:
        return f"[Execution Error]: {str(e)}"

def tool_run_python(code: str) -> str:
    """在獨立 Python 子行程中執行程式碼"""
    try:
        res = subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True,
            text=True,
            timeout=45
        )
        output = res.stdout if res.returncode == 0 else f"Python Traceback:\n{res.stderr}"
        return output.strip() if output.strip() else "(Python 代碼執行完畢，無 print 輸出)"
    except Exception as e:
        return f"[Python Execution Error]: {str(e)}"

def tool_get_system_metrics() -> str:
    """獲取硬體負載"""
    cpu = psutil.cpu_percent(interval=0.5)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    return json.dumps({
        "cpu_percent": f"{cpu}%",
        "memory_used_gb": f"{round(mem.used/(1024**3), 2)} / {round(mem.total/(1024**3), 2)} GB ({mem.percent}%)",
        "disk_free_gb": f"{round(disk.free/(1024**3), 2)} GB free ({disk.percent}% used)"
    }, ensure_ascii=False)

# 工具分派路由字典
TOOL_DISPATCHER = {
    "run_bash": lambda args: tool_run_bash(args.get("command", "")),
    "run_python_code": lambda args: tool_run_python(args.get("code", "")),
    "get_system_metrics": lambda args: tool_get_system_metrics(),
}
```

---

## ⚙️ 三、 核心調度引擎：實作 ReAct 迴圈與 SSE 即時推播 (`agent_runtime.py`)

在 `~/aicloud-agent-app/backend/agent_runtime.py` 實作核心執行引擎：

```python
import os
import json
import httpx
from typing import AsyncGenerator
from agent_tools import AGENT_TOOLS_SCHEMA, TOOL_DISPATCHER

API_KEY = os.getenv("TAIWAN_AI_API_KEY", "")
BASE_URL = os.getenv("TAIWAN_AI_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.getenv("DEFAULT_MODEL", "gpt-4o")

SYSTEM_PROMPT = """你是一個運行在國研院晶創雲 (AI-CLOUD) Linux VM 上的自主 AI Agent。
你可以使用 run_bash、run_python_code、get_system_metrics 等工具自主完成使用者的任務。
請以繁體中文思考，並遵循以下規範：
1. 若需要確認環境或查詢資料，請主動調用工具。
2. 每次調用工具後，請仔細閱讀 Observation 結果，再決定下一步。
3. 當任務徹底完成後，直接輸出詳細的繁體中文總結報告。
"""

async def run_agent_workflow(user_goal: str, max_steps: int = 6) -> AsyncGenerator[str, None]:
    """
    AI Agent 核心調度迴圈 (ReAct Loop)
    透過 SSE 即時向前端推播 Thought, Action, Observation, Final Answer
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_goal}
    ]

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    # 1. 推播任務開始事件
    yield f"data: {json.dumps({'event': 'start', 'goal': user_goal})}\n\n"

    async with httpx.AsyncClient(timeout=90.0) as client:
        for step in range(1, max_steps + 1):
            payload = {
                "model": MODEL_NAME,
                "messages": messages,
                "tools": AGENT_TOOLS_SCHEMA,
                "tool_choice": "auto",
                "temperature": 0.2
            }

            try:
                # 請求大模型決策
                res = await client.post(f"{BASE_URL}/chat/completions", headers=headers, json=payload)
                res_data = res.json()
                choice = res_data["choices"][0]["message"]
            except Exception as e:
                yield f"data: {json.dumps({'event': 'error', 'message': f'LLM API Error: {str(e)}'})}\n\n"
                return

            # A. 若 AI 決定調用工具 (Action)
            if choice.get("tool_calls"):
                tool_call = choice["tool_calls"][0]
                func_name = tool_call["function"]["name"]
                raw_args = tool_call["function"].get("arguments", "{}")
                
                try:
                    args = json.loads(raw_args)
                except:
                    args = {}

                # 推播思考與行動給前端
                yield f"data: {json.dumps({
                    'event': 'action',
                    'step': step,
                    'tool': func_name,
                    'arguments': args,
                    'thought': choice.get('content') or f'正在執行第 {step} 步操作...'
                })}\n\n"

                # 實際執行對應的工具
                handler = TOOL_DISPATCHER.get(func_name)
                observation = handler(args) if handler else f"[Error] 未知工具: {func_name}"

                # 推播執行結果給前端
                yield f"data: {json.dumps({
                    'event': 'observation',
                    'step': step,
                    'tool': func_name,
                    'result': observation
                })}\n\n"

                # 將本輪決策與工具輸出追加到對話歷史中，讓 AI 繼續思考下一步
                messages.append(choice)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "content": observation
                })

            else:
                # B. AI 判斷任務已達成，產出最終結果 (Final Answer)
                final_content = choice.get("content", "任務已完成。")
                yield f"data: {json.dumps({
                    'event': 'final_answer',
                    'step': step,
                    'content': final_content
                })}\n\n"
                break
        else:
            yield f"data: {json.dumps({'event': 'timeout', 'message': '已達到最大執行步驟上限 (6 步)'})}\n\n"
```

---

## 🌐 四、 註冊至 FastAPI 主路由 (`main.py`)

在 `~/aicloud-agent-app/backend/main.py` 中引入並新增端點：

```python
from agent_runtime import run_agent_workflow

class AgentTaskRequest(BaseModel):
    goal: str
    max_steps: int = 6

@app.post("/api/agent/run")
async def execute_agent_task(request: AgentTaskRequest):
    """啟動 AI Agent 自主任務執行 (SSE 即時串流)"""
    return StreamingResponse(
        run_agent_workflow(request.goal, request.max_steps),
        media_type="text/event-stream"
    )
```

---

## 🎯 本章學習總結
- 深刻理解 AI Agent 與 LLM Chat 的本質區別。
- 親手實作 ReAct 智能體調度迴圈（Thought ➔ Action ➔ Observation）。
- 建立安全隔離的 Linux Bash、Python 程式碼執行器工具箱。
- 透過 FastAPI SSE 將 Agent 的每一步思考與終端機輸出即時串流給前台。

👉 **下一章預告**：在[第 05 章](file:///home/ubuntu/aicloud_agent_course/05_react_agent_dashboard.md)中，我們將使用 **React + Vite** 打造極致精緻的深色玻璃擬態 **Agent 視覺化觀測台**，讓您親眼看著 AI 一步步打指令與即時回報！
