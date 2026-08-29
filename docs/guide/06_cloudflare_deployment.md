# 第 6 章：Cloudflare Tunnel 與正式部署

Antigravity Ports 解決的是「學員如何查看遠端開發服務」；Cloudflare Tunnel 解決的是「外部使用者如何透過固定 HTTPS 網域持續使用正式服務」。

## 1. 開發預覽與正式發布

| 項目 | Antigravity Ports | Cloudflare Tunnel |
| :--- | :--- | :--- |
| 目的 | 個人開發、除錯與課堂驗證 | 正式或受控的外部服務 |
| 使用者 | 目前的開發者 | 經授權的外部使用者／應用 |
| 生命週期 | 依賴 Remote SSH／IDE 工作階段 | 由系統服務持續運行 |
| 網址 | 本機預覽位址 | 固定 HTTPS 網域 |
| 驗證 | 開發工具工作階段 | Cloudflare Access＋應用程式授權 |

不要把開發伺服器或 Antigravity Port 預覽當成正式部署。

## 2. 正式服務架構

```text
[外部使用者]
       │ HTTPS
       ▼
[Cloudflare Access]
       │ 身分驗證／存取政策
       ▼
[Cloudflare Tunnel]
       │
       ▼
[Next.js 會議系統 :3000]
       │ 會議系統 Virtual Key
       ▼
[LiteLLM :4000（內部）]
       │ Provider Keys
       ├── 國網模型 API
       └── 其他授權模型 API
```

預設只公開受 Cloudflare Access 保護的會議轉錄系統。LiteLLM、PostgreSQL、管理 UI 與上游 Key 都留在內部。

## 3. Production Build

正式環境不得使用 `npm run dev`。請 Antigravity 先規劃：

> 請檢查 Next.js 會議轉錄系統與 LiteLLM Gateway，提出正式部署計畫。Next.js 必須使用 production build，LiteLLM 與 PostgreSQL 不得直接公開，Secret 不可寫入映像或 Git。請比較 systemd 與 Docker Compose，選擇本專案較簡單且可重現的方式，列出健康檢查、重啟、日誌、備份與回復步驟，暫時不要執行。

本課程建議用 Docker Compose 管理應用服務，理由是 LiteLLM 與 PostgreSQL 本來就適合容器化，也可避免 NVM 安裝的 Node.js 路徑在 systemd 中不一致。

### 容器網路的重要差異

在 VM 主機上開發時，Next.js 可以呼叫 `http://127.0.0.1:4000`。但 Next.js 與 LiteLLM 都進入 Compose 後，容器內的 `localhost` 只代表該容器自己，應改用 Compose service name，例如 `http://litellm:4000`。

本課程的 Compose 部署應明確限制主機 Port 綁定；驗收設定等價於：

```text
127.0.0.1:3000 → Next.js
127.0.0.1:4000 → LiteLLM（若維運需要）
PostgreSQL         不發布主機 Port
```

例如 Next.js 的 Compose `ports` 應綁定 `127.0.0.1:3000:3000`，讓主機上的 `cloudflared` 可以連線，但外部網路不能直接存取 3000。若 `cloudflared` 也放入同一個 Compose 網路，則應改以 Next.js service name 連線，且可不發布主機 Port；兩種拓撲擇一並實測，不要混用。

## 4. 部署前驗收

先在 VM 內完成：

- Next.js Production Build 成功
- 容器健康檢查成功
- VM 重新啟動後服務自動恢復
- Next.js 能從容器網路呼叫 LiteLLM
- PostgreSQL 資料持久化
- 會議系統使用只允許 `meeting-stt` 與 `meeting-llm` 的 Virtual Key，不是 Master Key
- 服務只監聽必要的 localhost Port
- 日誌不含 Secret 或完整敏感 Prompt

可以先透過 Antigravity Ports 預覽 3000，確認 Production 版本無誤，再設定 Cloudflare。

## 5. 為什麼本課程不使用 Quick Tunnel

Quick Tunnel 會產生隨機的 `trycloudflare.com` 網址，適合短暫測試一般 HTTP 服務，但不是本課程的開發預覽或正式發布方案。

依 [Cloudflare Quick Tunnel 官方文件](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/)：

- 只供測試與開發使用。
- 同時進行中的請求有數量限制，超過時會回傳 429。
- 不支援 Server-Sent Events（SSE）。

本課程的會議紀錄需要 SSE 串流，且錄音檔上傳涉及較長請求，因此開發時使用 Antigravity Ports，正式發布使用具名 Cloudflare Tunnel，不執行 `cloudflared tunnel --url ...`。

## 6. 安裝與驗證 cloudflared

不要讓 AI 直接下載永遠指向 `latest` 的套件。先確認 VM 架構、現有版本、官方安裝來源與課程指定版本：

> 請確認 CPU 架構、作業系統與 cloudflared 現有版本，再依 Cloudflare 官方文件提出安裝或升級計畫。說明套件來源、版本、需要 sudo 的原因、將建立的 systemd 服務、驗證與回復方式，先不要下載或安裝。不得使用來源不明的套件，也不得在輸出中顯示 Tunnel Token。

安裝二進位檔後先驗證：

```bash
cloudflared --version
```

## 7. 建立具名 Cloudflare Tunnel

在 Cloudflare Zero Trust 建立具名 Tunnel，依後台顯示的當期指令安裝 `cloudflared` Connector。AI 操作到後台產生 Connector 指令時必須暫停，由學員親自在遠端終端機完成含 Token 的步驟。

Tunnel Token 不得放入 Prompt、Git、README、截圖、共用 Shell History 或 AI 執行日誌。若曾出現在不可信位置，先從 Cloudflare 後台輪替，再繼續部署。完成 Connector 安裝後，AI 只檢查版本、systemd 狀態與不含 Secret 的連線結果。

Connector 安裝成 systemd 服務後再驗證：

```bash
sudo systemctl status cloudflared --no-pager
sudo journalctl -u cloudflared --since "10 minutes ago" --no-pager
```

`systemctl status` 與日誌用來判斷 Connector 是否啟動及連線，不把日誌中的識別資訊、Hostname 或其他敏感資料整段貼回 Prompt。只有在理解影響後才執行 `restart`。

先確認 Tunnel 顯示健康，再進入 Access 與 Published Application Route 設定；不要急著建立一個無驗證的公開網址。

Cloudflare Tunnel 由 VM 主動連出，因此通常不需要開放晶創雲 80、443 或 3000 Ingress；但 Egress、DNS 與專案網路政策仍需允許 Connector 連線。

## 8. 先設定 Access，再發布 Hostname

建立 Access Application 與最小允許政策，例如：

- 只允許指定組織網域
- 或只允許課程學員 Email
- 設定合理的 Session Duration
- 管理者與一般使用者分離
- 拒絕規則優先於寬鬆允許規則

接著才建立會議系統的 Published Application Route：

| 欄位 | 值 |
| :--- | :--- |
| Hostname | `meeting.<你的網域>` |
| Service | `http://127.0.0.1:3000` |
| 對外協定 | HTTPS |

將 Access 與 Hostname 視為同一個受控發布階段，儲存後立即用未登入瀏覽器測試應被阻擋，再登入測試首頁、錄音檔上傳、STT 與會議紀錄 SSE。Cloudflare 官方提醒，只有 Tunnel Route 而沒有 Access Application 時，網際網路使用者可能直接存取該 Hostname；請參考[具名 Tunnel 官方流程](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-remote-tunnel/)。

本課程版本沒有應用程式帳號與 Session，因此 Cloudflare Access 是正式入口的必要身分保護；Next.js 仍只持有最小權限 Virtual Key，LiteLLM 仍需 Rate Limit、模型白名單與日誌政策。

## 9. 不建議公開 LiteLLM API

主課程架構中，外部使用者只需要會議轉錄系統，不需直接呼叫 LiteLLM。

若未來確實要提供 `api.<你的網域>`，應視為另一項進階服務，至少加入：

- 獨立 Cloudflare Access Service Token 或其他機器驗證
- 每個應用程式獨立 Virtual Key
- 模型白名單
- RPM／TPM／預算
- Request size 與 Timeout 限制
- Key 輪替與撤銷
- 管理 API／UI 與推論 API 分離
- 事件監控與異常用量告警

不允許把 LiteLLM Master Key 提供給外部應用。

## 10. 請 Antigravity 協助部署與驗證

> 請依已確認的正式部署計畫執行。每次只變更一個服務，先備份可回復的設定並顯示不含 Secret 的差異。到 Cloudflare Connector Token 步驟時停止，由我親自在終端機完成。其餘完成後驗證 Compose 狀態、健康檢查、localhost 存取、cloudflared 服務、Access 未登入阻擋、登入後完成錄音檔上傳、STT 與會議紀錄串流，以及 VM 重啟後自動恢復。不得使用 Quick Tunnel，不得輸出 Tunnel Token、API Key、Cookie 或資料庫密碼。

## 11. 故障定位順序

```text
瀏覽器
  ↓
Cloudflare Access
  ↓
Tunnel／cloudflared
  ↓
Next.js
  ↓
LiteLLM
  ↓
上游 Provider
```

每次只確認相鄰兩層：

1. VM 內能否直接開啟 Next.js？
2. Next.js 能否分別呼叫 LiteLLM 的 `meeting-stt` 與 `meeting-llm`？
3. LiteLLM 能否分別呼叫 STT 與 LLM 上游？
4. Tunnel 是否連線？
5. Access 是否允許正確身分？
6. 公開網域是否能完成串流？

不要一遇到錯誤就刪除整個部署或開放所有 Port。

## 12. 上線後與課後清理

上線後至少檢查：

- Cloudflare 與應用程式存取紀錄
- LiteLLM 錯誤率、延遲及使用量
- 上游費用與配額
- 磁碟空間、容器狀態與 LiteLLM PostgreSQL 治理資料備份
- 金鑰到期與映像更新

課程結束若不再提供服務：

1. 撤銷會議系統 Virtual Key。
2. 停用 Cloudflare Public Hostname 與 Access Application。
3. 停止並移除不再使用的容器。
4. 備份後刪除不需要的磁碟與 VM。
5. 檢查晶創雲是否仍有計費資源。
6. 保存不含 Secret 的架構、設定範本與學習紀錄。

## 13. 全課程完成條件

- [ ] Antigravity Ports 可做私人開發預覽
- [ ] Next.js 使用 Production Build
- [ ] LiteLLM 與 PostgreSQL 未直接公開
- [ ] 沒有使用不支援 SSE 的 Quick Tunnel
- [ ] cloudflared 版本、systemd 狀態與近期日誌已驗證
- [ ] Tunnel Token 由學員親自處理，未進入 Prompt、Git 或截圖
- [ ] Cloudflare Tunnel 只指向必要服務
- [ ] Cloudflare Access 已驗證未登入與已登入情境
- [ ] VM 重啟後服務自動恢復
- [ ] 會議系統的錄音檔上傳、STT、串流、限流及錯誤處理正常
- [ ] 已完成金鑰撤銷與資源清理演練

至此，學員完成的是一套可延伸的 AI 應用基礎平台。未來可在同一個 LiteLLM Gateway 上增加 RAG、批次任務或獨立的進階 Agent 課程，而不必重新處理所有供應商金鑰與路由。
