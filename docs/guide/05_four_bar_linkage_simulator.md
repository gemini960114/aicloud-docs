# 第 5 章：從生活看機械：互動式四連桿模擬器與 AI 輔助開發

本章帶領學員運用 AI 協作開發（Prompt Engineering），從零打造一個直觀、流暢且具備教學意義的 **React 互動式四連桿機械運動學模擬器**。

更重要的是，我們貫徹**「在現有互動軟體上注入 AI 智能（AI-Augmented Software）」**的核心理念：當學生在畫布上拉錯參數導致連桿卡死時，系統不是拋出生硬的錯誤碼，而是能直接調用**第 3、4 章架設的 LiteLLM 模型網關與專用 Virtual Key**，進行白話幾何死點診斷，並提供**「✨ 一鍵套用修復」**讓連桿瞬間復活！

---

## 🎯 一、 課程設計與教學目標

- **課程名稱**：動手玩機構 —— 互動式四連桿機械運動學與 AI 雲端實戰
- **適合受眾**：大一新生、通識課程、高中科普、跨領域對 STEM / AI 感興趣之學生
- **核心教學目標**：
  1. **建立物理直覺**：不從生硬公式切入，透過「汽車雨刷、柴比雪夫、蒸汽機」等生活實例，直觀理解旋轉如何轉換為往復與直線運動。
  2. **AI 協作素養 (Prompt Engineering)**：學習如何透過「4 輪階梯式對話」，引導 AI 從需求發想 ➔ 架構規劃 ➔ 程式開發 ➔ 容器封裝。
  3. **AI 智能賦能 (AI-Augmented UX)**：整合第 3、4 章建立的 LiteLLM 模型閘道，為 Web 應用注入「單次情境診斷卡片」與「一鍵修復」，體驗現代 AI 賦能軟體的強大回饋感。
  4. **現代雲端體驗**：透過 Docker 容器化封裝於 Linux VM 主機上運行（Port 8090），為下一章 Cloudflare 手機連線做好準備。

---

## 💬 二、 4 輪完整對話提示詞 (Prompt Suite)

學員可直接在 Antigravity 對話框或終端機中，依序複製以下 4 輪提示詞與 AI 進行協作：

### 🔹 第 1 輪：概念發想與需求規劃（含 AI 智能模組規格）

```markdown
我想用 React 做一個適合非工程系學生學習的「四連桿機械互動模擬器 (Four-Bar Linkage Simulator)」。
核心需求包含：
1. 乾淨漂亮的 HTML5 Canvas 畫布，支援 60 FPS 連桿動態旋轉與滑鼠/觸控拖曳節點。
2. 參數控制器：4 根連桿長度滑桿（L1 曲柄、L2 機架、L3 連桿、L4 搖桿）。
3. 智能賦能模組規格：當桿長無法閉合或卡死（Dead Point）時，畫布需顯示警示，並預留一個「AI 智慧機構診斷端點 (/api/diagnose)」，能將當前桿長傳給後端 LiteLLM Gateway 分析幾何原因。
請先幫我寫一份簡單好懂的技術規劃 Markdown 文件，說明座標系、連桿數學定義與前後端架構，先不要直接寫程式碼。
```

> **教學重點**：先約束 AI 產出「軟體架構規格書」與「物理坐標定義」，並及早規劃後端 AI 診斷 API 的資料格式。

---

### 🔹 第 2 輪：融入 6 大生活經典範例庫與 AI 導師 Prompt

```markdown
規劃很棒！為了讓學生能快速理解機械在生活中的應用，請幫我在規劃中加入：
1. 「6 大生活經典機械範例庫」：
   - 🚗 汽車雨刷機構 (Crank-Rocker)：將旋轉轉為左右擺動
   - 🚂 柴比雪夫直線連桿 (Chebyshev)：不用尺畫出平滑直線
   - ⚡ 瓦特蒸汽機導引 (Watt's Linkage)：工業革命經典直線導引
   - 🏗️ 鶴嘴起重機/輸送連桿 (Hoeken)：水平定距物料推移
   - 🔄 雙曲柄急回機構 (Drag-Link)：旋轉變速與快速返回
   - 📐 平行四邊形連桿 (Parallelogram)：繪圖儀與等速同步
2. 「AI 導師系統提示詞 (System Prompt)」設計：
   - 針對切換範例時，能以繁體中文 100 字白話解說生活應用。
   - 針對連桿卡死時，能依據格拉索夫準則（Grashof's Rule）指出哪根桿過長/過短，並給出推薦修復數值。
請將上述內容整合，產出最終版的詳細實作計畫書 four_bar_linkage_plan.md。
```

---

### 🔹 第 3 輪：全端編程（Canvas 物理引擎 + LiteLLM 智慧診斷卡片 + Docker）

```markdown
請依照 four_bar_linkage_plan.md 規劃，使用 React + Vite + Tailwind CSS + Lucide Icons + Node.js 輕量後端編寫完整的四連桿模擬器專案：

實作重點包含：
1. 【前端物理引擎】HTML5 Canvas 60 FPS 平滑運動，支援滑鼠/觸控拖曳，耦合點 P 軌跡繪製 (Coupler Curve Tracer)。
2. 【6 大生活預設庫】點擊按鈕一鍵切換雨刷、柴比雪夫等機構，並附帶「💡 AI 說生活故事」按鈕。
3. 【AI 智能診斷卡片】
   - 當畫布檢測到卡死時，控制面板跳出醒目的「⚠️ 連桿卡死」卡片與「🤖 詢問 AI 導師：為什麼卡死了？」按鈕。
   - 點擊後向後端 POST /api/diagnose 發送當前桿長，後端帶上環境變數 LITELLM_VIRTUAL_KEY 向 http://127.0.0.1:4000/v1/chat/completions (model: tutor-llm) 請求幾何分析。
   - 卡片獲得 AI 白話回覆後，展示推薦尺寸，並提供「✨ 一鍵套用 AI 建議修復」按鈕，點擊後滑桿自動滑動到位，連桿立刻恢復運轉！
4. 建立 Dockerfile 與 nginx.conf，將專案打包成 Docker 容器並在 Port 8090 啟動服務。
```

> **教學亮點**：這正是「AI 智能賦能軟體」的精髓——從偵測異常 ➔ AI 診斷 ➔ 一鍵自動修復，創造極致的無痛學習體驗！

---

### 🔹 第 4 輪：本機容器驗收與發布準備

```markdown
請檢查目前在 Linux 主機運行的 Docker 容器狀態：
1. 驗證容器四連桿模擬器是否順利在本機 127.0.0.1:8090 正常監聽。
2. 透過 curl -I http://127.0.0.1:8090 檢查 HTTP 200 回應狀態碼。
3. 測試後端 API 端點是否能順利連通本機 127.0.0.1:4000 的 LiteLLM Gateway。
```

> [!IMPORTANT]
> **Cloudflare 安全公網發布保留至下一章教學**  
> 為了讓學員完整理解「快速展示通道（Quick Tunnel）」與「具名正式生產發布（Named Tunnel + Cloudflare Zero Trust Access）」的完整安全機制，**將模擬器發布到公網供手機連線的詳細步驟與命令，將於下一章 [第 6 章：Cloudflare Tunnel 與正式部署](/guide/06_cloudflare_deployment) 完整教學與實戰示範！**

---

## 🚗 三、 6 大生活機械範例教學重點解析 (Teaching Notes)

在課堂講解時，可配合模擬器重點引導學生觀察各機構的幾何尺寸與軌跡特徵：

| 編號 | 機構名稱 | 生活應用場景與科學原理 | 格拉索夫準則 (Grashof Rule) 特徵 |
| :--- | :--- | :--- | :--- |
| **01** | 🚗 **汽車雨刷 (Crank-Rocker)** | 馬達持續單向旋轉，如何透過短曲柄帶動長搖桿，形成擋風玻璃左右刷動？ | 最短桿為曲柄，可做 $360^\circ$ 連續旋轉；對側搖桿做角位移往復擺動。 |
| **02** | 🚂 **柴比雪夫近似直線機構** | 19世紀在沒有高精度銑床前，數學家如何僅靠連桿鉸鏈走出近乎完美的直線？ | 兩對稱交叉連桿的中點，在特定區間內走出極低誤差的直線軌跡。 |
| **03** | ⚡ **瓦特蒸汽機導航 (Watt)** | 瓦特蒸汽機活塞推桿的導向核心，連桿中點走出獨特的「8字形」直線段。 | 工業革命經典，解決活塞桿無法承受橫向側推力而漏氣損壞的問題。 |
| **04** | 🏗️ **鶴嘴起重機 / 輸送連桿** | 工廠自動化輸送帶如何利用連桿實現「水平前推 ➔ 快速抬起返回」？ | 耦合點走出「D 字形」軌跡，下緣貼平前推物料，上緣弧線抬起返回避讓。 |
| **05** | 🔄 **雙曲柄機構 (Drag-Link)** | 等速馬達輸入，如何輸出「慢速工作、快速返回」的急回特性？ | 最短桿為機架固定邊，兩側連桿皆可完整旋轉，但角速度隨角度非線性變化。 |
| **06** | 📐 **平行四邊形連桿** | 工地怪手挖斗、桌上型繪圖支架如何隨時保持水平不傾斜？ | 對邊桿長相等，連桿在任何運動角度下均保持嚴格平行姿態。 |

---

## 🧪 四、 學生動手探究實作任務 (Student Activities)

### 任務一：探索「死點」與體驗「AI 一鍵神修復」
- **實驗步驟**：在介面上任意拖拉改變連桿長度滑桿（例如把機架 $L_2$ 縮得極短），直到畫布出現「⚠️ 連桿卡死」紅色警告。
- **體驗 AI 賦能**：
  1. 點擊卡片上的 `[ 🤖 詢問 AI 導師：為什麼卡死了？ ]`。
  2. 閱讀 AI 依據格拉索夫準則給出的白話解釋。
  3. 點擊 `[ ✨ 一鍵套用 AI 建議修復 ]`，觀察滑桿如何自動滑動到位，連桿瞬間復活！

### 任務二：繪圖藝術家（Coupler Curve Tracer）
- **實驗步驟**：開啟畫布上的軌跡繪製開關（Tracer），微調連桿中點延伸點 $P$ 的距離與偏移角度。
- **觀察思考**：嘗試讓模擬器畫出「心形線」、「蝴蝶結形」或「水滴形」的連續閉合運動曲線，並使用螢幕截圖保存你的連桿藝術作品。

### 任務三：手機跨裝置連線（預備下一章）
- **體驗預告**：在下一章中，我們將使用 Cloudflare 免費公網穿透技術，將目前在 VM 運行的 Port 8090 連線發布成手機可掃描的 QR Code，讓學員親自在智慧型手機與平板上用手指旋轉曲柄，感受低延遲觸控的機構物理！

---

## 💻 五、 終端機實戰操作與後端 AI 端點實作

### Step 1：後端 AI 智慧診斷端點 (`server.js`)

在四連桿應用後端，透過輕量 Node.js 服務代理 LiteLLM 請求，確保**第 4 章發放的 Virtual Key 絕不外流至瀏覽器前端**：

```javascript
// server.js (輕量後端路由代理)
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());
app.use(express.static('dist')); // 提供 React 前端靜態檔案

const LITELLM_BASE = process.env.LITELLM_BASE_URL || 'http://127.0.0.1:4000';
const VIRTUAL_KEY = process.env.LITELLM_VIRTUAL_KEY; // 第 4 章產生的 fourbar-app-key

app.post('/api/diagnose', async (req, res) => {
  try {
    const { l1, l2, l3, l4 } = req.body;
    
    const prompt = `使用者正在操作四連桿機械模擬器。目前桿長為：曲柄 L1=${l1}, 機架 L2=${l2}, 連桿 L3=${l3}, 搖桿 L4=${l4}。
此時機構已卡死（無法閉合旋轉）。請以繁體中文、100字以內的通俗白話說明原因（指出哪根桿太長或太短），並在最後一行輸出嚴格 JSON 格式的建議尺寸，格式如：{"suggested": {"l1": 50, "l2": 150, "l3": 120, "l4": 100}}`;

    const response = await fetch(`${LITELLM_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VIRTUAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tutor-llm',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: 'AI 導師連線異常' });
  }
});

const PORT = 8090;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`四連桿 AI 模擬器服務運行於 http://127.0.0.1:${PORT}`);
});
```

---

### Step 2：建置 Docker 映像檔並啟動服務

```bash
cd ~/aicloud-course/four-bar-simulator

# 1. 讀取第 4 章產生的 Virtual Key (fourbar-app-key)
export FOURBAR_VIRTUAL_KEY="sk-fourbar-你的金鑰"

# 2. 建置 Docker 映像檔
docker build -t four-bar-simulator:v2 .

# 3. 啟動容器 (注入 LITELLM_VIRTUAL_KEY，綁定本機 127.0.0.1:8090)
docker run -d \
  --name four-bar-app \
  --restart always \
  -e LITELLM_BASE_URL="http://172.17.0.1:4000" \
  -e LITELLM_VIRTUAL_KEY="${FOURBAR_VIRTUAL_KEY}" \
  -p 127.0.0.1:8090:8090 \
  four-bar-simulator:v2

# 4. 本機測試回應
curl -I http://127.0.0.1:8090
```

---

## 🎯 六、 本章檢核清單與下一步

請確認完成以下驗收指標：

- [ ] **物理畫布流暢度**：畫布具備 60 FPS 平滑動態，支援滑鼠與觸控拖曳。
- [ ] **死點偵測與卡片觸發**：當連桿幾何無法閉合時，畫布主動跳出「⚠️ 連桿卡死」警示卡片。
- [ ] **AI 智慧診斷**：點擊按鈕後，能成功透過後端代理呼叫第 3 章的 LiteLLM Gateway (`tutor-llm`) 並傳回白話原因。
- [ ] **一鍵套用修復**：點擊建議修復後，滑桿數值自動更新，連桿立即恢復正常運動。
- [ ] **金鑰安全隔離**：瀏覽器端完全看不到任何 `sk-fourbar-...`，金鑰安全封裝於後端環境變數。

> [!TIP]
> **下一步**：前往 [第 6 章：Cloudflare Tunnel 與正式部署](/guide/06_cloudflare_deployment)，我們將示範如何使用 Cloudflare Tunnel，將剛剛在 Port 8090 運行的四連桿模擬器免開防火牆發布至公網，並在手機上即時操作！
