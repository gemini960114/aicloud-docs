# 第 1 章：晶創雲雲平台基礎設施與 VM 建立

本章聚焦一個可驗收成果：**在晶創雲建立一台狀態為 `active` 的 Linux VM，完成鑰匙對設定與安全群組配置，並依網路拓撲採用「VM 浮動 IP 直連」或「跳板機＋私有 IP」，為後續章節的 Remote SSH 開發環境做好準備。**

---

## 1. 課前準備與配額檢查

在建立資源前，請先登入 [晶創雲使用者控制台](https://docs.central.iic.nchc.org.tw/user-panel/) 並確認：

- 已切換至正確的專案與區域。
- 專案尚有可用的 vCPU、記憶體、儲存空間（Volume）與浮動 IP（Floating IP）配額。
- 專案內已存在可連接對外網際網路的虛擬網路（Virtual Network）。
- 已確認課程指定的作業系統映像檔（Ubuntu LTS）、硬體規格與命名規則。
- **計費意識**：VM 處於 `active` 或已配置浮動 IP 時均持續計費，課後應確實清理。

---

## 2. 最小必要網路架構拓撲

本課程採用的網路架構有兩種路徑，均嚴格遵守「最小暴露面」安全原則：

```text
[學員電腦 / Antigravity]
       │
       ├── 【情境 A：直連】 SSH TCP 22 (僅限白名單 IP)
       │       ▼
       │   [晶創雲 VM 浮動 IP (Public IP)]
       │       │
       └── 【情境 B：跳板】 SSH TCP 22 
               ▼
           [跳板機 Bastion (浮動 IP)]
               │ SSH ProxyJump
               ▼
           [晶創雲 VM 私有 IP (Private IP)]
               │
               ▼
       [安全群組過濾層 (Security Group)]
       ├── Ingress: 僅開放 TCP 22 (SSH)
       └── Egress: 開放 DNS (53), HTTPS (443), NTP (123)
               │
               ▼
       [套件倉庫 / 國網 TAIWAN AI RAP API / 模型端點]
```

> [!IMPORTANT]
> **安全群組最小化**：後續章節的開發預覽由 Antigravity Ports 處理，正式發布由 Cloudflare Tunnel 處理，因此**絕對不需要在晶創雲安全群組開放 8090、3000、4000、8000、80 或 443 給公網**。

---

## 3. 🤖 自然語言 Prompt 配方（可直接複製給 AI Agent）

在 Antigravity 或本機終端機中，你可以直接複製以下 Prompt 請 AI 協助檢查與診斷：

### 模式 A：本機 SSH 私鑰權限修復 (Windows & macOS/Linux)

```markdown
請檢查我本機存放的晶創雲 SSH 私鑰檔案權限：
1. 私鑰路徑為：~/.ssh/course-key.pem（或指定絕對路徑）。
2. 如果是 Windows 系統，請使用 PowerShell 的 icacls 指令移除繼承權限，並僅保留當前使用者的讀取權限 (R)。
3. 如果是 Linux / macOS，請執行 chmod 600。
4. 驗證權限修改完成，確保後續 SSH 連線時不會出現 "UNPROTECTED PRIVATE KEY FILE!" 警告。
```

### 模式 B：VM 初次連線測試與 SSH 連線診斷

```markdown
請協助我診斷晶創雲 VM 的 SSH 連線狀態：
1. 目標主機 IP：<填入你的浮動 IP 或私有 IP>
2. 使用者帳號：ubuntu
3. 私鑰路徑：~/.ssh/course-key.pem
4. 請執行 ssh -i ~/.ssh/course-key.pem -o ConnectTimeout=5 ubuntu@<IP> "hostname && whoami && ip addr"
5. 若連線超時，請逐步檢查：(a) 浮動 IP 是否正確綁定 (b) 晶創雲安全群組 TCP 22 是否放行 (c) 本機連出外網是否正常。
```

### 模式 C：VM 基礎環境健康檢查與規格驗收

```markdown
請檢查剛建立完成的晶創雲 Ubuntu VM 系統環境：
1. 輸出 CPU 核心數、實體記憶體容量與可用空間（lscpu, free -h, df -h）。
2. 檢查網路外連能力，測試 DNS 解析與對外 HTTPS 連線（curl -I https://rap.genai.nchc.org.tw）。
3. 執行 sudo apt update 確保系統套件庫清單可正常更新。
4. 彙整系統規格摘要，確認符合課程最低需求。
```

---

## 4. 💻 終端機手動執行指令 (Manual Commands & Step-by-Step)

### Step 1：本機金鑰權限設定 (依作業系統)

晶創雲下載的私鑰 `.pem` 檔案必須嚴格限制讀取權限，否則 SSH 客戶端會拒絕連線。

#### 🔹 Windows 系統 (PowerShell 執行)
```powershell
# 1. 建立 .ssh 目錄 (若不存在)
New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" -Force

# 2. 將下載的 pem 檔案移動至 .ssh 目錄 (假設下載檔名為 course-key.pem)
Move-Item -Path "$env:USERPROFILE\Downloads\course-key.pem" -Destination "$env:USERPROFILE\.ssh\course-key.pem" -Force

# 3. 移除繼承權限並鎖定僅限當前使用者存取
$keyPath = "$env:USERPROFILE\.ssh\course-key.pem"
icacls.exe $keyPath /reset
icacls.exe $keyPath /inheritance:r
icacls.exe $keyPath /grant:r "$($env:USERNAME):(R)"

# 4. 驗證權限 (確認僅有目前使用者具備讀取權限)
icacls.exe $keyPath
```

#### 🔹 macOS / Linux 系統 (Bash / Zsh 執行)
```bash
# 1. 建立 .ssh 目錄並設定權限
mkdir -p ~/.ssh && chmod 700 ~/.ssh

# 2. 移動金鑰並設定權限為 600 (僅擁有者可讀寫)
mv ~/Downloads/course-key.pem ~/.ssh/course-key.pem
chmod 600 ~/.ssh/course-key.pem

# 3. 驗證權限
ls -la ~/.ssh/course-key.pem
```

---

### Step 2：晶創雲 VM 建立操作指南

從晶創雲控制台進入 **虛擬機器 ➔ 虛擬機器管理 ➔ 點擊「＋建立」**：

1. **基本設定**：
   - 名稱：`aicloud-你的學號`（例如 `aicloud-s101`）
   - 映像檔：選擇官方 **Ubuntu 22.04 LTS** 或 **Ubuntu 24.04 LTS**
2. **硬體規格**：
   - 依課程建議選擇合適的 Basic 規格（建議至少 2 vCPU / 4GB RAM 以上，以便運行 LiteLLM 與 Next.js）
   - 系統磁碟大小：建議至少 30 GB
3. **虛擬網路與安全群組**：
   - 選擇專案的內部虛擬網路
   - 安全群組套用預設規則 + 課程專用安全群組
4. **認證方式**：
   - 選擇「鑰匙對認證」➔ 選取剛建立的 Key Pair 名稱
5. **檢閱並建立**：
   - 確認設定無誤後點擊送出，等待虛擬機器狀態由 `building` 轉為 `active`。

---

### Step 3：配置浮動 IP 與安全群組 (直連情境)

如果採用個人電腦直接 SSH 連入 VM，需要為 VM 配置一個公開的浮動 IP：

1. **關聯浮動 IP**：
   - 進入該 VM 的詳細資訊頁面 ➔ 找到「虛擬網路資訊」列。
   - 點擊右側選單 ➔ 選擇「**配置浮動 IP**」➔ 點選「自動配置」或選擇閒置的浮動 IP 進行關聯。
2. **設定安全群組 Ingress 規則**：
   - 點選「編輯安全群組」➔ 進入安全群組規則設定。
   - 新增 Ingress 規則：
     - **協定**：TCP
     - **連接埠**：`22`
     - **來源 CIDR**：輸入講師指定的校園/辦公室網段，或你的當前公網 IP（可透過 `curl https://ifconfig.me` 查詢，格式如 `1.2.3.4/32`）。
     - ⚠️ **嚴禁填寫 `0.0.0.0/0`**，避免主機暴露於全球 SSH 暴力破解攻擊。

---

### Step 4：初次 SSH 手動連線與主機健康檢查

在終端機中測試初次 SSH 連線：

```bash
# 1. 執行初次連線 (將 <FLOATING_IP> 替換為你的浮動 IP)
ssh -i ~/.ssh/course-key.pem ubuntu@<FLOATING_IP>

# 首次連線會出現主機指紋提示，輸入 yes 確認：
# Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```

登入 VM 成功後，依序執行系統驗收指令：

```bash
# 2. 檢查主機身分與系統版本
hostname
whoami
cat /etc/os-release

# 3. 檢查硬體資源 (CPU、記憶體、磁碟)
lscpu | grep "Model name\|CPU(s):"
free -h
df -h /

# 4. 測試外網連線能力與 DNS 解析
ping -c 3 8.8.8.8
curl -I https://www.google.com

# 5. 更新系統套件庫清單
sudo apt update
```

---

## 5. 安全群組規則速查表

請依下表核對你的晶創雲安全群組配置：

| 方向 | 協定 | 連接埠 | 來源 / 目的 CIDR | 用途 | 狀態 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ingress (入站)** | TCP | `22` | 你的公網 IP 或跳板機網段 | 僅供管理員/學員進行 SSH 連線 | 必開 (受限) |
| **Ingress (入站)** | ANY | ALL | `0.0.0.0/0` | 全域開放 | ❌ **嚴格禁止** |
| **Ingress (入站)** | TCP | `8090`, `3000`, `4000`, `8000` | `0.0.0.0/0` | 應用服務埠號 | ❌ **禁止（使用 Tunnel 轉發）** |
| **Egress (出站)** | UDP | `53` | `0.0.0.0/0` | 系統 DNS 名稱解析 | ✅ 允許 |
| **Egress (出站)** | TCP | `80`, `443` | `0.0.0.0/0` | 下載套件、呼叫模型 API、Cloudflare Tunnel | ✅ 允許 |
| **Egress (出站)** | ANY | 預設 | `169.254.169.254/32` | 平台內部 Metadata 服務 | ✅ 預設保留 |

---

## 6. 課後清理與計費管理 SOP

為避免非預期的雲端資源費用，課程結束或不再使用時請依序釋放資源：

```bash
# 1. 若只是當天暫停使用：
#    可在晶創雲控制台將 VM 執行「關機 (Stop)」

# 2. 若課程已完全結束，不再需要此主機：
#    - 先將浮動 IP 與 VM 解除關聯並釋放 (Release Floating IP)
#    - 點選虛擬機器 ➔ 執行「刪除 (Delete)」
#    - 檢查「虛擬磁碟」確認未殘留孤立磁碟 (Orphan Volumes)
#    - 檢查「鑰匙對」視需要刪除
```

---

## 7. 🎯 本章完成檢核清單 (Checklist)

請確認以下項目均已完成，即可順利進入第 2 章：

- [ ] **金鑰安全**：已下載 `.pem` 私鑰，且本機權限已正確鎖定（Windows `icacls` / Linux `chmod 600`）。
- [ ] **VM 運行**：晶創雲虛擬機器狀態為 `active`，規格符合課程需求。
- [ ] **網路就緒**：已配置浮動 IP（或已記錄跳板機連線路徑），且 VM 能正常連通外網。
- [ ] **防火牆嚴格**：安全群組僅針對特定白名單開放 TCP 22，未開放任何非必要 Inbound 端口。
- [ ] **登入驗證**：已透過手動 SSH 成功登入 VM，完成 `sudo apt update` 與硬體資源檢查。

> [!TIP]
> 下一步：前往 [第 2 章：SSH ProxyJump 與遠端開發環境設定](/guide/02_ssh_proxyjump_and_dev_env)，使用 Antigravity IDE 進行無縫遠端開發！
