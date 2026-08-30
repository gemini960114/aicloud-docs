# 第 5 章：用 Prompt 協作建立 AI 會議轉錄與紀錄系統

本章帶領學員使用自然語言 Prompt 搭配 Antigravity，以分階段、安全受控的節奏，從零實作一套完整的 **Next.js 全端 AI 會議轉錄與紀錄系統**。

系統包含兩大核心功能：
1. **語音轉錄（STT）**：上傳錄音檔案，透過後端代理呼叫 LiteLLM 的 `meeting-stt` 模型別名，取得逐字稿並允許使用者於介面人工編輯校對。
2. **會議紀錄生成（LLM 串流）**：將校對後的逐字稿送至後端，呼叫 LiteLLM 的 `meeting-llm` 模型別名，以 **SSE (Server-Sent Events)** 即時串流輸出結構化的 Markdown 會議摘要與待辦清單。

---

## 1. 系統資料流與安全邊界拓撲

```text
[使用者瀏覽器]
       │
       ├── 1. 錄音檔上傳 (multipart/form-data)
       │       ▼
       │   [Next.js Server: POST /api/transcribe]
       │       │ 伺服器端驗證檔案大小與格式，轉發音訊
       │       ▼
       │   [LiteLLM Gateway :4000 (meeting-stt)] ──▶ [國網 RAP STT 模型]
       │       │ 回傳辨識文字
       │       ▼
       │   [前端逐字稿編輯區 (人工校正修訂)]
       │
       └── 2. 送出校正逐字稿 (JSON Request)
               ▼
           [Next.js Server: POST /api/minutes]
               │ 伺服器端注入系統指令 (禁止捏造資訊)，轉發請求
               ▼
           [LiteLLM Gateway :4000 (meeting-llm)] ──▶ [國網 RAP LLM 模型]
               │ SSE 串流回傳 (text/event-stream)
               ▼
           [前端即時 Markdown 渲染 ➔ 匯出複製 / 下載 TXT / MD]
```

### 核心安全邊界原則
- **金鑰不落地**：瀏覽器端完全不接觸任何 API Key 或 LiteLLM Base URL；所有模型呼叫皆由 Next.js Server-side Route Handler 處理。
- **環境變數隔離**：`LITELLM_VIRTUAL_KEY` 僅能存於伺服器端 `.env.local`，嚴禁使用 `NEXT_PUBLIC_*` 前綴。
- **無狀態與隱私**：本應用不保存會議音訊與逐字稿於資料庫中，使用者關閉網頁即清除記憶體暫存。

---

## 2. 🤖 自然語言 Prompt 配方（可直接複製給 AI Agent）

在 Antigravity 終端機或 Chat 中，你可以依序複製以下 Prompt 讓 AI 分步驟建立系統：

### 模式 A：初始化 Next.js 專案與安全設定

```markdown
請在 ~/aicloud-course/meeting-app 目錄下初始化一個 Next.js 14+ (App Router, TypeScript, Tailwind CSS) 專案：

1. 建立 .env.example 與 .env.local（包含 LITELLM_BASE_URL=http://127.0.0.1:4000、LITELLM_VIRTUAL_KEY、STT_MODEL_ALIAS=meeting-stt、LLM_MODEL_ALIAS=meeting-llm）。
2. 在 .gitignore 中確保 .env.local、音訊暫存檔與 build 產物不被追蹤。
3. 建立伺服器端環境變數集中讀取模組（lib/env.ts），若缺少必要變數則安全報錯。
4. 建立首頁基礎骨架（app/page.tsx），包含專案標題、隱私聲明提醒與操作流程步驟卡片。
5. 執行 npm run build 驗收專案能正常編譯。
```

### 模式 B：實作音訊上傳與語音轉錄 API (`POST /api/transcribe`)

```markdown
請在 Next.js 中實作音訊轉錄 API 端點（app/api/transcribe/route.ts）：

1. 接收前端傳入的 multipart/form-data 錄音檔案（限制檔案小於 25MB，支援 mp3, wav, m4a, ogg, webm）。
2. 將音訊檔案封裝後，向 LITELLM_BASE_URL/v1/audio/transcriptions 發起 POST 請求：
   - 標頭加入 Authorization: Bearer <LITELLM_VIRTUAL_KEY>。
   - 參數指定 model: meeting-stt。
3. 嚴密處理異常：若 LiteLLM 回傳錯誤或連線逾時，遮蔽內部敏感資訊並回傳友善錯誤訊息。
4. 在前端頁面加入「音訊上傳與音檔預覽播放器」，上傳後呼叫此 API 並將辨識文字填入「可編輯逐字稿文字框」。
```

### 模式 C：實作會議紀錄 SSE 串流 API (`POST /api/minutes`)

```markdown
請在 Next.js 中實作會議摘要 SSE 串流 API 端點（app/api/minutes/route.ts）：

1. 接收前端送來的 JSON（{ transcript: string }），驗證逐字稿不可為空。
2. 設定伺服器端 System Prompt：要求模型將逐字稿整理為結構化會議紀錄（包含【會議摘要】、【重點摘要】、【決議事項】、【待辦事項表格：事項/負責人/期限】與【待確認事項】），嚴格禁止捏造逐字稿中未提及的人名、日期或結論。
3. 向 LITELLM_BASE_URL/v1/chat/completions 發起 POST 請求，指定 model: meeting-llm 與 stream: true。
4. 將 LiteLLM 的 SSE 串流以 TransformStream 轉發給瀏覽器，回應標頭設為 text/event-stream 與 Cache-Control: no-cache。
5. 前端頁面使用 Fetch API + ReadableStream 即時接收文字流，動態渲染 Markdown 內容，並提供「停止生成」按鈕。
```

### 模式 D：前端 UI 整合、匯出功能與響應式優化

```markdown
請優化會議轉錄系統的前端介面（app/page.tsx）：

1. 提供三步驟清晰視覺流程：【1. 上傳錄音】➔【2. 人工核對逐字稿】➔【3. 產生與匯出會議紀錄】。
2. 支援「複製逐字稿」、「複製會議紀錄」按鈕（點擊後顯示已複製提示）。
3. 支援「下載 Markdown (.md)」與「下載純文字 (.txt)」功能。
4. 加入錄音與音訊隱私授權提醒標籤。
5. 確保在手機與電腦版面皆能流暢操作，並通過 npm run build 驗收。
```

---

## 3. 💻 終端機手動執行指令 (Manual Commands & Step-by-Step)

### Step 1：初始化 Next.js 專案

在遠端 VM 的 `~/aicloud-course` 目錄下建立專案：

```bash
cd ~/aicloud-course

# 1. 建立 Next.js 專案 (非互動式指令)
npx create-next-app@latest meeting-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --use-npm

cd meeting-app

# 2. 安裝額外工具 (Lucide 圖示與 Markdown 渲染)
npm install lucide-react react-markdown
```

---

### Step 2：建立環境變數配置 (`.env.local`)

建立未納入 Git 的伺服器端設定：

```bash
# 1. 讀取上一章產生的 Virtual Key (或手動填入)
cat <<EOF > .env.local
LITELLM_BASE_URL=http://127.0.0.1:4000
LITELLM_VIRTUAL_KEY=${MEETING_VIRTUAL_KEY:-sk-your-virtual-key}
STT_MODEL_ALIAS=meeting-stt
LLM_MODEL_ALIAS=meeting-llm
MAX_UPLOAD_BYTES=26214400
EOF

# 2. 建立公開範本檔
cat <<'EOF' > .env.example
LITELLM_BASE_URL=http://127.0.0.1:4000
LITELLM_VIRTUAL_KEY=replace-with-your-virtual-key
STT_MODEL_ALIAS=meeting-stt
LLM_MODEL_ALIAS=meeting-llm
MAX_UPLOAD_BYTES=26214400
EOF

chmod 600 .env.local
```

---

### Step 3：核心 API Route 實作架構

#### 🎙️ 1. STT 轉錄端點 (`app/api/transcribe/route.ts`)
```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "未上傳音訊檔案" }, { status: 400 });
    }

    const liteLLMBase = process.env.LITELLM_BASE_URL || "http://127.0.0.1:4000";
    const virtualKey = process.env.LITELLM_VIRTUAL_KEY;
    const modelAlias = process.env.STT_MODEL_ALIAS || "meeting-stt";

    const upstreamFormData = new FormData();
    upstreamFormData.append("file", file);
    upstreamFormData.append("model", modelAlias);

    const response = await fetch(`${liteLLMBase}/v1/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${virtualKey}`,
      },
      body: upstreamFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `轉錄失敗: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "伺服器內部錯誤" }, { status: 500 });
  }
}
```

#### 📝 2. 會議紀錄 SSE 串流端點 (`app/api/minutes/route.ts`)
```typescript
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript || transcript.trim() === "") {
      return new Response("逐字稿內容不得為空", { status: 400 });
    }

    const liteLLMBase = process.env.LITELLM_BASE_URL || "http://127.0.0.1:4000";
    const virtualKey = process.env.LITELLM_VIRTUAL_KEY;
    const modelAlias = process.env.LLM_MODEL_ALIAS || "meeting-llm";

    const systemPrompt = `你是一位專業的會議記錄秘書。請根據使用者提供的會議逐字稿，整理出一份結構嚴謹、重點清晰的繁體中文會議紀錄。
規範：
1. 嚴格基於逐字稿事實，嚴禁捏造未提及的人名、日期、決議或結論。若資訊不足，請填寫「未提及」或「待確認」。
2. 輸出格式包含：
# 會議紀錄
## 一、會議核心摘要
## 二、重點討論事項
## 三、決議事項
## 四、待辦行動清單
| 待辦項目 | 負責人 | 預計完成時間 |
| :--- | :--- | :--- |
## 五、待確認與風險事項`;

    const upstreamResponse = await fetch(`${liteLLMBase}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${virtualKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelAlias,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `以下為會議逐字稿：\n\n${transcript}` },
        ],
        stream: true,
      }),
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return new Response("上游 LLM 服務回應異常", { status: 502 });
    }

    // 回傳 SSE 串流給前端
    return new Response(upstreamResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(error.message || "內部處理錯誤", { status: 500 });
  }
}
```

---

### Step 4：啟動開發伺服器與 Ports 預覽

```bash
# 啟動 Next.js 開發伺服器 (綁定 3000)
npm run dev -- --port 3000
```

1. 打開 Antigravity **Ports** 面板。
2. 點擊 **3000** 埠號旁的地球圖示，在個人電腦瀏覽器中開啟 `http://localhost:3000`。
3. 測試錄音檔上傳、逐字稿編輯與會議摘要 SSE 串流生成。

---

## 4. 分層測試與除錯驗收清單

| 測試階段 | 驗證操作 | 預期正確訊號 | 常見失敗原因 |
| :--- | :--- | :--- | :--- |
| **STT 上傳測試** | 上傳課堂短音檔（.mp3/.wav） | 2~5 秒內取得文字逐字稿 | 檔案超過 25MB、音訊編碼不支援、Virtual Key 缺少 `meeting-stt` 權限 |
| **逐字稿編輯** | 手動修改文字框內容並按下清除 | 文字框即時響應輸入與更新 | React State 綁定錯誤 |
| **LLM 串流測試** | 點擊「產生會議紀錄」 | 文字如打字機般逐字輸出 | 串流被 Proxy Buffer 阻擋、缺少 `text/event-stream` 標頭 |
| **中止測試** | 串流輸出過程中點擊「停止」 | 輸出立即停止，終止後續 Token 消耗 | 未正確呼叫 `AbortController.abort()` |
| **匯出測試** | 點擊「下載 Markdown」 | 瀏覽器觸發 `.md` 檔案下載 | 前端 Blob 物件 URL 產生失敗 |

---

## 5. 🎯 本章完成檢核清單 (Checklist)

請確認以下功能均已通過測試：

- [ ] **安全邊界**：Next.js 前後端同源，前端代碼無任何 `NEXT_PUBLIC_*` 機密金鑰。
- [ ] **STT 功能**：可上傳音訊檔案並成功獲得文字逐字稿。
- [ ] **人工校正**：逐字稿文字框可自由編輯、複製與清空。
- [ ] **SSE 串流**：會議摘要生成具備流暢的打字機串流效果，並能隨時手動中止。
- [ ] **格式規範**：會議紀錄符合結構化規範，未無中生有捏造人名與日期。
- [ ] **檔案匯出**：可下載 `.md` 與 `.txt` 檔案至個人電腦。
- [ ] **編譯驗收**：執行 `npm run build` 打包成功，無 TypeScript 與 ESLint 錯誤。

> [!TIP]
> 下一步：前往 [第 6 章：Cloudflare Tunnel 與正式部署](/guide/06_cloudflare_deployment)，將這套會議系統透過 Cloudflare Zero Trust 安全發布至公網自訂網域！
