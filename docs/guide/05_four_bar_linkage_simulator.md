# 第 5 章：從生活看機械：互動式四連桿模擬器與 AI 輔助開發

本章帶領學員運用 AI 協作開發（Prompt Engineering），從零打造一個直觀、流暢且具備教學意義的 **React 互動式四連桿機械運動學模擬器**，並透過 Docker 容器化封裝於 Linux VM 主機上運行（Port 8090）。

---

## 🎯 一、 課程設計與教學目標

- **課程名稱**：動手玩機構 —— 互動式四連桿機械運動學與 AI 雲端實戰
- **適合受眾**：大一新生、通識課程、高中科普、跨領域對 STEM / AI 感興趣之學生
- **核心教學目標**：
  1. **建立物理直覺**：不從生硬公式切入，透過「汽車雨刷、蒸汽機」等生活實例，直觀理解旋轉如何轉換為往復與直線運動。
  2. **AI 協作素養 (Prompt Engineering)**：學習如何透過「4 輪階梯式對話」，引導 AI 從需求發想 ➔ 架構規劃 ➔ 程式開發 ➔ 容器封裝。
  3. **現代雲端體驗**：了解 Docker 容器化概念，並為後續透過 Cloudflare Tunnel 在手機上即時操作自己打造的機械模擬器做好準備。

---

## 💬 二、 4 輪完整對話提示詞 (Prompt Suite)

學員可直接在 Antigravity 對話框或終端機中，依序複製以下 4 輪提示詞與 AI 進行協作：

### 🔹 第 1 輪：概念發想與需求規劃

```markdown
我想用 React 做一個適合非工程系學生學習的「四連桿機械互動模擬器 (Four-Bar Linkage Simulator)」。
需要一個乾淨漂亮的 HTML5 Canvas 畫布，能看到連桿動態旋轉與滑鼠拖曳節點互動，介面要直覺好懂。
請先幫我寫一份簡單好懂的技術規劃 Markdown 文件，說明座標系、連桿定義與介面架構，先不要直接寫程式碼。
```

> **教學重點**：先約束 AI 產出「軟體架構規格書」與「物理坐標定義」，避免 AI 一次噴出難以維護的大量程式碼。

---

### 🔹 第 2 輪：融入 6 大生活經典範例庫

```markdown
規劃很棒！為了讓學生能快速理解機械在生活中的應用，請幫我在規劃中加入「6 大生活經典機械範例庫」：
1. 🚗 汽車雨刷機構 (Crank-Rocker)：將旋轉轉為左右擺動
2. 🚂 柴比雪夫直線連桿 (Chebyshev)：不用尺畫出平滑直線
3. ⚡ 瓦特蒸汽機導引 (Watt's Linkage)：工業革命經典直線導引
4. 🏗️ 鶴嘴起重機/輸送連桿 (Hoeken)：水平定距物料推移
5. 🔄 雙曲柄急回機構 (Drag-Link)：旋轉變速與快速返回
6. 📐 平行四邊形連桿 (Parallelogram)：繪圖儀與等速同步
請將上述內容整合，產出最終版的詳細實作計畫書 four_bar_linkage_plan.md。
```

> **教學重點**：引導學生將生活常見的生活機械結構抽象化為物理模型，並整理為標準開發計畫書。

---

### 🔹 第 3 輪：全端編程與 Docker 容器封裝

```markdown
請依照 four_bar_linkage_plan.md 規劃，使用 React + Vite + Tailwind CSS + Lucide Icons + HTML5 Canvas 編寫完整的四連桿模擬器程式碼。
實作需包含：
- 60 FPS 平滑運動畫布，支援滑鼠/觸控拖曳節點 A
- 耦合點 P 自訂延伸與發光運動軌跡 (Coupler Curve Tracer)
- 6 大經典機械一鍵切換預設庫
寫完後請建立 Dockerfile 與 nginx.conf，將專案打包成 Docker 容器並在 Port 8090 啟動服務。
```

> **教學重點**：生成現代前端單頁應用（SPA），並使用 Multi-stage Build Dockerfile 搭配 Nginx 輕量映像進行容器化封裝。

---

### 🔹 第 4 輪：本機容器驗收與發布準備

```markdown
請檢查目前在 Linux 主機運行的 Docker 容器狀態：
1. 驗證容器四連桿模擬器是否順利在本機 127.0.0.1:8090 正常監聽。
2. 透過 curl -I http://127.0.0.1:8090 檢查 HTTP 200 回應狀態碼與 Nginx 標頭。
3. 若有埠號衝突或 Nginx 設定錯誤，請協助修復並重啟容器。
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

本章鼓勵非工程背景學生親自動手嘗試以下三個探究任務：

### 任務一：探索「死點與卡死」
- **實驗步驟**：在介面上任意拖拉改變連桿長度滑桿（$L_1, L_2, L_3, L_4$）。
- **觀察思考**：當桿長無法滿足三角形閉合條件（即某兩桿長度之和不足以跨越其餘距離）時，畫面是否會出現「連桿卡死（Dead Point）」或警告？體會為何真實機械設備的尺寸設計需經過嚴密計算。

### 任務二：繪圖藝術家（Coupler Curve）
- **實驗步驟**：開啟畫布上的軌跡繪製開關（Tracer），微調連桿中點延伸點 $P$ 的距離與偏移角度。
- **觀察思考**：嘗試讓模擬器畫出「心形線」、「蝴蝶結形」或「水滴形」的連續閉合運動曲線，並使用螢幕截圖保存你的連桿藝術作品。

### 任務三：手機跨裝置連線（預備下一章）
- **體驗預告**：在下一章中，我們將使用 Cloudflare 免費公網穿透技術，將目前在 VM 運行的 Port 8090 連線發布成手機可掃描的 QR Code，讓學員親自在智慧型手機與平板上用手指旋轉曲柄，感受低延遲觸控的機構物理！

---

## 💻 五、 終端機與 Docker 實戰操作指令 (Step-by-Step)

在遠端 Linux VM 上，AI 與學員協作完成程式碼後，可手動執行以下指令驗收服務：

### Step 1：專案目錄結構

```text
~/aicloud-course/four-bar-simulator/
├── Dockerfile
├── nginx.conf
├── package.json
├── vite.config.ts
├── src/
│   ├── App.tsx             # 主應用程式介面
│   ├── components/
│   │   ├── Canvas.tsx      # HTML5 Canvas 物理渲染引擎 (60 FPS)
│   │   ├── Controls.tsx    # 桿長與參數滑桿控制器
│   │   └── Presets.tsx     # 6 大生活機械範例切換按鈕
│   └── physics/
│       └── fourBarMath.ts  # 連桿運動學閉合方程求根解算器
```

### Step 2：Dockerfile 與 Nginx 設定檢視

標準輕量多階段構建 `Dockerfile`：

```dockerfile
# 階段 1：編譯打包前端
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 階段 2：Nginx 靜態檔案伺服器
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

`nginx.conf` 設定：

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 3：建置映像檔與啟動容器

```bash
cd ~/aicloud-course/four-bar-simulator

# 1. 建置 Docker 映像檔
docker build -t four-bar-simulator:v1 .

# 2. 啟動容器並將本機 Port 8090 對映至容器 Port 80
docker run -d \
  --name four-bar-app \
  --restart always \
  -p 127.0.0.1:8090:80 \
  four-bar-simulator:v1

# 3. 檢查容器運行狀態
docker ps | grep four-bar-app

# 4. 本機測試回應
curl -I http://127.0.0.1:8090
```

---

## 🎯 六、 本章檢核清單與下一步

請確認完成以下驗收指標：

- [ ] **連桿幾何解算**：可正常切換 6 大生活機械範例，畫布連桿運動平滑流暢（60 FPS）。
- [ ] **互動性**：可透過滑鼠或觸控拖曳連桿節點，並能開啟 Coupler Curve 軌跡追蹤。
- [ ] **Docker 容器化**：`docker build` 與 `docker run` 執行成功，無記憶體洩漏。
- [ ] **本機端點驗證**：Linux VM 主機內 `127.0.0.1:8090` 順利傳回 Nginx 靜態檔案。

> [!TIP]
> **下一步**：前往 [第 6 章：Cloudflare Tunnel 與正式部署](/guide/06_cloudflare_deployment)，我們將示範如何使用 Cloudflare Tunnel，將剛剛在 Port 8090 運行的四連桿模擬器免開防火牆發布至公網，並在手機上即時操作！
