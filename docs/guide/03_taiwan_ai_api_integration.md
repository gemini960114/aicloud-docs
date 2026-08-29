# 第 03 章：大腦串接 — Taiwan AI RAP API 雲端模型篇

在[第 02 章](file:///home/ubuntu/aicloud_agent_course/02_ssh_proxyjump_and_dev_env.md)中，我們已經配置好極速的 `uv` 與 Python 3.12 環境。  
在本章中，我們將學習如何將晶創雲的 CPU VM 作為中繼樞紐，串接 **Taiwan AI 平台（或 OpenAI 相容標準協定）的大型語言模型**，並使用 **FastAPI** 實現安全的 Token 管理、Tool Calling 格式解析與即時 **Server-Sent Events (SSE) 打字機串流**！

---

## 🧠 一、 Taiwan AI API 架構與安全原則

在全端與 Agent 系統中，**嚴禁將 API Key 暴露給前端瀏覽器**！  
所有呼叫必須由 FastAPI 後端作為中繼伺服器（Proxy & Gateway）：

```
[ 前端 React 瀏覽器 ] ──(呼叫自建 API /api/chat)──► [ 晶創雲 FastAPI 後端 (uv) ]
                                                            │
                                                            │ (讀取 .env 中的金鑰，安全呼叫)
                                                            ▼
                                                [ Taiwan AI RAP 雲端平台 ]
```

---

## 🛠️ 二、 初始化 FastAPI 後端專案 (使用 `uv`)

在 VM 終端機執行以下指令建立後端專案：

```bash
# 1. 建立專案目錄
mkdir -p ~/aicloud-agent-app/backend && cd ~/aicloud-agent-app/backend

# 2. 初始化 uv 專案並安裝依賴
uv init --name backend
uv add fastapi uvicorn[standard] httpx pydantic-settings psutil python-dotenv
```

---

## 🔐 三、 環境變數配置 (`.env`)

在 `~/aicloud-agent-app/backend/.env` 建立金鑰設定檔：

```env
# Taiwan AI RAP 平台金鑰 (或任何 OpenAI 相容服務金鑰)
TAIWAN_AI_API_KEY=your_taiwan_ai_api_key_here
TAIWAN_AI_BASE_URL=https://api-taiwanai.nchc.org.tw/v1
DEFAULT_MODEL=taiwan-llm-70b-chat
```

---

## 💻 四、 核心程式碼實作：FastAPI 串流中繼服務 (`main.py`)

在 `~/aicloud-agent-app/backend/main.py` 寫入以下程式碼：

```python
import os
import json
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Cloud Gateway API", version="1.0.0")

# 設定跨域請求 (允許 React 前端 5173 呼叫)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("TAIWAN_AI_API_KEY", "")
BASE_URL = os.getenv("TAIWAN_AI_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.getenv("DEFAULT_MODEL", "gpt-4o")

class ChatRequest(BaseModel):
    prompt: str
    system_prompt: str = "你是一個專業、親切的繁體中文 AI 智慧助手。"
    temperature: float = 0.7

async def stream_taiwan_ai(prompt: str, system_prompt: str, temperature: float):
    """向 Taiwan AI 平台請求並以 SSE 格式即時串流回傳給前端"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": temperature,
        "stream": True # 開啟串流
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            async with client.stream("POST", f"{BASE_URL}/chat/completions", headers=headers, json=payload) as response:
                if response.status_code != 200:
                    yield f"data: {json.dumps({'error': f'API Error: {response.status_code}'})}\n\n"
                    return

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            yield "data: [DONE]\n\n"
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk["choices"][0]["delta"].get("content", "")
                            if delta:
                                yield f"data: {json.dumps({'text': delta})}\n\n"
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        stream_taiwan_ai(request.prompt, request.system_prompt, request.temperature),
        media_type="text/event-stream"
    )

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Taiwan AI Cloud Gateway"}
```

---

## 🚀 五、 啟動與測試

在 `backend` 目錄下執行：

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

在終端機測試 SSE 串流：
```bash
curl -N -X POST http://localhost:8000/api/chat/stream \
     -H "Content-Type: application/json" \
     -d '{"prompt": "請用繁體中文介紹國研院晶創雲"}'
```
👉 終端機將即時以 **打字機效果** 逐字輸出 AI 回覆！

---

## 🎯 本章學習總結
- 掌握 API Token 伺服器端環境變數隔離原則。
- 理解大模型 `stream: true` 串流推論協定。
- 使用 FastAPI `StreamingResponse` 實作標準 Server-Sent Events (SSE)。

👉 **下一章預告**：在[第 04 章](file:///home/ubuntu/aicloud_agent_course/04_ai_agent_runtime_engine.md)中，我們將迎來課程最重磅的核心實戰 —— **打造自研 AI Agent Runtime 智能體執行引擎**，讓 AI 不只能聊天，還能自主在 VM 上執行 Bash 與 Python 工具！
