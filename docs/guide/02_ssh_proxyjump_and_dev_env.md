# 第 2 章：Antigravity Remote SSH、自然語言維運與 Ports 預覽

本章不是單純介紹一套 IDE，而是建立後續課程的共同工作方式：

```text
連上遠端 VM → 請 AI 檢查 → 審閱計畫 → 同意執行 → 驗證結果
```

完成本章後，學員應能在 Antigravity 開啟晶創雲遠端工作區、使用自然語言輔助安裝開發工具，並直接預覽遠端 VM 的 `localhost:3000` 或 `localhost:4000`，不必自行撰寫 SSH Forwarding 指令。

## 1. 先確認 SSH 路徑

晶創雲專案的 SSH 路徑可能有兩種，請以課程現場架構為準。

### 情境 A：VM 具有可連線位址

```ssh-config
Host aicloud-course
  HostName <VM 可連線位址>
  User ubuntu
  IdentityFile ~/.ssh/course-your-id.pem
  IdentitiesOnly yes
  ServerAliveInterval 30
  ServerAliveCountMax 3
```

### 情境 B：透過跳板機進入私有 VM

```ssh-config
Host aicloud-bastion
  HostName <跳板機位址>
  User ubuntu
  IdentityFile ~/.ssh/course-your-id.pem
  IdentitiesOnly yes

Host aicloud-course
  HostName <VM 私有 IP>
  User ubuntu
  IdentityFile ~/.ssh/course-your-id.pem
  IdentitiesOnly yes
  ProxyJump aicloud-bastion
  ServerAliveInterval 30
  ServerAliveCountMax 3
```

不要直接複製範例 IP、帳號或私鑰路徑。由講師依專案網路提供實際值。

先在個人電腦終端機驗證：

```bash
ssh aicloud-course
```

若失敗，先判斷錯誤類型：

- `Permission denied (publickey)`：帳號、私鑰或檔案權限問題。
- `Connection timed out`：路由、安全群組、跳板機或來源網段問題。
- Host key 警告：先確認 VM 是否重建及指紋是否合理，不要直接略過。

## 2. 使用 Antigravity Remote SSH

1. 在 Antigravity IDE 開啟命令面板。
2. 選擇 Remote SSH 連線功能。
3. 選擇 `aicloud-course`。
4. 開啟遠端目錄，例如 `~/aicloud-course`。
5. 確認整合式終端機執行在遠端 VM，而不是個人電腦。

可使用以下指令判斷目前位置：

```bash
hostname
whoami
pwd
uname -a
```

> Antigravity 的產品介面可能更新。若名稱或位置不同，請以當期 IDE 畫面與[官方 Antigravity 文件](https://www.antigravity.google/docs/ide/overview/)為準。

### 驗收點 A

- Antigravity 顯示已連接遠端主機。
- 終端機的 `hostname` 與晶創雲 VM 相符。
- 能建立並開啟 `~/aicloud-course` 目錄。

## 3. 自然語言操作的正確節奏

第一次不要直接要求「幫我把所有東西裝好」。先讓 AI 蒐集事實：

> 請只做唯讀檢查：確認作業系統版本、CPU、記憶體、磁碟、目前使用者、網路連線，以及 Git、curl、Docker、Node.js、npm 是否已安裝。請整理成表格，不要安裝或修改任何內容，也不要輸出任何環境變數的值。

接著要求規劃：

> 根據檢查結果，提出安裝 Git、curl、Docker Engine、Docker Compose plugin、Node.js LTS 與 npm 的計畫。列出套件來源、將執行的指令、需要 sudo 的原因、可能影響及每一步驗證方式。暫時不要執行。

確認計畫後才授權：

> 我已審閱計畫。請一次只執行一個階段，每階段完成後驗證版本與服務狀態，再等待我確認下一階段。不要修改 SSH、安全群組、防火牆或公開任何 Port。

### AI 操作的停損點

遇到下列動作，學員必須先看懂再同意：

- 使用 `sudo`
- 修改 `/etc` 下的設定
- 加入 Docker 群組
- 刪除、覆寫或移動既有資料
- 顯示 `.env`、SSH key 或其他憑證
- 調整防火牆、監聽位址或公開服務
- 執行來源不明的遠端安裝腳本

## 4. 本課程需要的工具

後續章節需要：

- Git
- curl
- Docker Engine
- Docker Compose plugin
- Node.js LTS
- npm

版本不應寫死在教材中。由 AI 查詢已安裝版本，並依官方支援方式安裝當期 LTS 或課程指定版本。

安裝後至少驗證：

```bash
git --version
curl --version
docker --version
docker compose version
node --version
npm --version
sudo systemctl is-active docker
```

若將使用者加入 Docker 群組，要說明該群組具有接近 root 的主機控制能力，並重新登入使群組生效。

## 5. 建立安全的課程工作目錄

```text
~/aicloud-course/
├── gateway/       # LiteLLM 設定與部署
├── chatbot/       # Next.js 全端 Chatbot
└── notes/         # 學習紀錄與非敏感檢查結果
```

請 Antigravity 協助建立專案時，先要求它產生：

- `.gitignore`
- `.env.example`，只放變數名稱與假值
- `README.md`
- 啟動、停止、測試與清理方式

真正的 `.env` 與金鑰不得加入 Git。

## 6. 使用 Antigravity Ports 預覽遠端 localhost

當遠端 VM 上的服務監聽 `localhost:3000` 或 `localhost:4000` 時，Antigravity Remote SSH 可以透過 **Ports** 功能讓學員在個人瀏覽器查看。

課堂示範流程：

1. 在遠端終端機啟動測試服務。
2. 打開 Antigravity 的 Ports 面板。
3. 確認偵測到遠端 Port；必要時手動加入 Port 編號。
4. 選擇在瀏覽器開啟。
5. 確認頁面來自遠端 VM，而非個人電腦的同名服務。

因此主課程不需要手動執行：

```bash
# 僅作為原理解釋，不是本課程主流程
ssh -L 3000:localhost:3000 aicloud-course
```

也不需要在晶創雲安全群組開放 3000 或 4000。

### Remote Port 預覽不是正式部署

Antigravity Ports 適合個人開發與課堂驗證，但不應視為對外服務：

- 依賴目前的 Remote SSH／IDE 工作階段。
- 不是固定的公開網址。
- 沒有取代正式登入、授權、監控與程序常駐。
- 不適合讓外部使用者長期存取。

正式發布會在第 6 章使用 Cloudflare Tunnel。

## 7. 練習：請 AI 建立一次性測試服務

不要提供完整程式碼，改用需求提示詞：

> 請在遠端 VM 建立一個最小、一次性的 HTTP 測試服務，只監聽 127.0.0.1:3000，頁面顯示 hostname 與目前時間。先提出方法，不要安裝新框架。啟動後請用 curl 從 VM 內驗證，再告訴我如何透過 Antigravity Ports 開啟。測試結束後協助停止服務並確認 Port 已釋放。

這個練習的目的不是網頁開發，而是確認學員理解：

```text
遠端 localhost → Antigravity Ports → 個人瀏覽器
```

## 8. 本章完成條件

- [ ] Antigravity Remote SSH 連線成功
- [ ] 能辨認終端機正在操作遠端 VM
- [ ] AI 已先檢查、再規劃、經確認後才安裝
- [ ] Git、Docker、Node.js 與 npm 驗證成功
- [ ] 能透過 Antigravity Ports 預覽遠端 localhost
- [ ] 沒有為開發服務新增公開 Ingress 規則

下一章將在 [LiteLLM 多模型 API Gateway](/guide/03_litellm_gateway) 中統一國網與其他授權模型的呼叫方式。
