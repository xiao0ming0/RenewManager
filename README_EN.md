# 🕒 RenewManager - Service Lifecycle Manager

**[English]** | [中文](./README.md)

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)
![Vue.js](https://img.shields.io/badge/Frontend-Vue3%20%2B%20ElementPlus-42b883?logo=vue.js)
![License](https://img.shields.io/badge/License-MIT-blue)

> 📌 **Notice**: This project is modified from [RenewHelper](https://github.com/ieax/renewhelper). Thanks to the original author for the open-source contribution.

**RenewManager** is a full-stack service lifecycle reminder and management tool based on **Cloudflare Workers**. It is designed to manage periodic subscriptions, domain renewals, server expirations, and more. It requires no server (Serverless), incurs zero hosting costs, and features a stunning Mecha-style UI, a powerful Lunar/Solar calendar core, multi-channel notifications, and iCal schedule synchronization. **v1.3.5+ now supports both Worker and Docker deployments.**

<div align="center">
  <img src="./assets/mainUI_darkEN_shot.png" alt="RenewManager 界面预览" width="800">
  <img src="./assets/mainUI_lightCN_shot.png" alt="RenewManager 界面预览" width="800"> 
</div>

## ✨ Key Features

- **⚡️ Serverless Architecture**: Runs entirely on Cloudflare Workers using KV storage. No VPS required, and the free tier is usually sufficient for personal use. v1.3.5+ now also supports standalone Docker deployment.
- **📅 Smart Cycle Management**:
  - Supports both **Solar (Gregorian)** and **Lunar** calendar cycles. Built-in high-precision Lunar algorithm (1900-2100).
  - Perfect for handling monthly/yearly subscriptions (Solar) or birthdays/traditional festivals (Lunar).
  - Supports automatic calculation based on Day, Month, or Year intervals.
  - Two modes: "Cycle Subscription" (Repeating) and "Expiration Reset" (Manual extension).
- **🔔 Multi-Channel Notifications**:
  - Built-in support for **Telegram, Bark, PushPlus, NotifyX, Resend (Email), Webhook, and WeChat Work**.
  - Customizable advance notice days and daily push times.
- **🤖 Automation**:
  - **Auto-Renew**: Automatically updates the next due date upon expiration.
  - **Auto-Disable**: Automatically marks services as disabled if they are overdue for too long.
  - **Cron Triggers**: Supports daily scheduled checks via Cloudflare Cron Triggers.
- **📆 ICS Calendar Subscription**: Generates standard `.ics` subscription links. Seamlessly integrates with iOS Calendar, Google Calendar, or Outlook, supporting timezone-aware precise reminders synchronized to your phone.
- **🛡️ Secure & Reliable**:
  - JWT authentication with automatic high-strength key generation.
  - Hybrid rate-limiting strategy (Memory + KV) to prevent brute-force attacks.
  - Data is stored only in your private Cloudflare KV.
  - Sensitive operations (Delete, Reset) require secondary confirmation.
- **🎨 Modern UI**:
  - Single-file frontend built with Vue 3 + Element Plus.
  - Dark/Light mode support.
  - Fully responsive design for mobile and desktop.
  - Bilingual interface (English/Chinese).
  - Data Import/Export for backup.

---

## 🚀 Deployment Guide

### Method 1: One-Click Deployment (Recommended)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/xinling123/renewmanager)

1.  Click the button above.
2.  Authorize Cloudflare to access your GitHub account (to Fork the repository).
3.  Follow the instructions to complete the deployment. Cloudflare will automatically create the Worker and KV Namespace for you.
4.  **IMPORTANT**: After deployment, go to Cloudflare Dashboard -> Workers & Pages -> Your Project -> **Settings** -> **Variables**.
    - Add Environment Variable: `AUTH_PASSWORD`. Set the value to your desired login password (default is `admin`).
    - Bind KV Namespace: Ensure the variable name is `RENEW_KV` (Do not change this name!).

### Method 2: Manual Deployment (Web Dashboard)

If you don't use GitHub, you can deploy directly via the Cloudflare Dashboard.

#### Step 1: Create a KV Namespace

1.  Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2.  Go to **Workers & Pages** -> **KV** from the left menu.
3.  Click **Create a namespace**.
4.  Enter the name: `RENEW_KV` or any name you prefer (Uppercase recommended), then click **Add**.

#### Step 2: Create a Worker Service

1.  Go back to **Workers & Pages** -> **Overview**.
2.  Click **Create application** -> **Create Worker**.
3.  Name your worker (e.g., `renewmanager`) and click **Deploy**.
4.  Once deployed, click **Edit code** to open the editor.

#### Step 3: Paste Code

1.  In the file list on the left, select `worker.js`.
2.  **Select All and Delete** the default code.
3.  Copy and paste the complete code from `_worker.js` provided in this project.
4.  Click **Deploy** on the top right to save.

#### Step 4: Bind KV Database (Crucial)

1.  Click the arrow in the top left to return to the Worker details page.
2.  Go to **Settings** -> **Variables**.
3.  Scroll down to **KV Namespace Bindings**.
4.  Click **Add binding**:
    - **Variable name**: Must be `RENEW_KV` (Do not change this!).
    - **KV Namespace**: Select the namespace you created in Step 1.
5.  Click **Save and deploy**.

#### Step 5: Set Login Password

1.  Still on the **Variables** page, scroll up to **Environment Variables**.
2.  Click **Add variable**:
    - **Variable name**: `AUTH_PASSWORD`
    - **Value**: Enter your desired password (default is `admin` if left unset).
3.  Click **Save and deploy**.

#### Step 6: Set Cron Trigger

To enable auto-renewal and notifications, **you must set a Cron Trigger.**

1.  Click the **Triggers** tab at the top.
2.  Scroll down to **Cron Triggers**.
3.  Click **Add Cron Trigger**.
4.  **Cron schedule**: Enter `0,30 * * * *` exactly (This means check every 30 minutes. Do not change this logic!).
5.  Click **Add Trigger**.

### Method 3: Deploy via GitHub Actions (Recommended)
This method is ideal for users who prioritize **privacy** and want **automatic updates**. It eliminates the need to authorize third-party applications, keeping all your credentials securely stored within your own GitHub repository.

1. **Fork the Repository**: Click the **Fork** button in the top-right corner of this page to copy the project to your own GitHub account.
2. **Prepare Cloudflare Credentials**:
   - **Account ID**: Find this on the right side of the Cloudflare Workers dashboard overview.
   - **API Token**: Go to [My Profile](https://dash.cloudflare.com/profile/api-tokens) -> API Tokens -> Create Token -> Use the **Edit Cloudflare Workers** template -> Generate and copy the token.

3. **Create KV Namespace**:
   - Create a new KV namespace (e.g., `RENEW_KV`) in the Cloudflare dashboard.
   - Copy the **ID** of this new KV.

4. **Configure GitHub Secrets**:
  - Go to your forked repository -> **Settings** -> **Secrets and variables** -> **Actions**.
  - Click **New repository secret** and add the following 4 secrets:
    - `CF_API_TOKEN`: Paste your Cloudflare API Token.
    - `CF_ACCOUNT_ID`: Paste your Cloudflare Account ID.
    - `CF_KV_ID`: Paste your copied KV ID (Actions will automatically inject this).
    - `AUTH_PASSWORD`: Enter your desired login password (Once set, it will not be overwritten even when syncing code).

5. **Enable and Deploy**:
   - Navigate to the **Actions** tab and click the green button **I understand my workflows...** to enable them.
   - Select **Deploy to Cloudflare Workers** from the sidebar, then click **Run workflow** to trigger the initial deployment manually.
   - **Updates**: Whenever a new version is released, simply click **Sync Fork** on your GitHub repository page. GitHub Actions will automatically deploy the latest code (including new features) to your Worker while preserving your password settings.

### Method 4: Docker Deployment

RenewManager can be easily deployed using Docker. This method simulates the Cloudflare Workers environment locally using Miniflare, ensuring your data remains private and self-hosted.

#### Prerequisites

  * Docker Engine installed
  * Docker Compose installed

#### Quick Start

1.  Create a directory for RenewManager (e.g., `renewmanager`).
2.  Create a file named `docker-compose.yml` inside that directory with the following content:

```yaml
services:
  renewmanager:
    # Official Image
    image: xiao0ming0/renewmanager:latest
    container_name: renewmanager
    restart: unless-stopped
    ports:
      - "9787:9787" # Map container port 9787 to host port 9787
    volumes:
      # Data persistence: Maps host's ./data folder to container's data storage
      - ./data:/data
    environment:
      # --- Configuration ---
      
      # 1. Login Password (Required)
      - AUTH_PASSWORD=MySecretPassword
      
      # 2. Cron Schedule (Important!)
      # Recommendation: Run every 30 minutes to match the frontend settings.DO NOT CHANGE！！！
      # Syntax: "0,30 * * * *" means trigger at minute 0 and minute 30 of every hour.
      - CRON_SCHEDULE=0,30 * * * *
      
      # 3. Timezone
      # Sets the container timezone. This affects when the Cron triggers.
      - TZ=Asia/Shanghai
```

3.  Start the container:

    ```bash
    docker compose up -d
    ```

4.  Access the dashboard at: `http://your-server-ip:9787`. To access RenewManager securely over the internet with a domain (e.g., `https://renew.example.com`), you should set up a Reverse Proxy.

<details>
<summary><strong>🔒 Advanced: HTTPS & Domain Setup (Caddy)</strong></summary>

#### 1. Modify `docker-compose.yml`

Update your `docker-compose.yml` to include the Caddy service and link it to RenewManager.

```yaml
services:
  renewmanager:
    image: xiao0ming0/renewmanager:latest
    container_name: renewmanager
    restart: unless-stopped
    # No need to map ports to host, just expose to Caddy
    expose:
      - "9787"
    volumes:
      - ./data:/data
    environment:
      - AUTH_PASSWORD=admin
      - CRON_SCHEDULE=0,30 * * * *
      - TZ=Asia/Shanghai

  caddy:
    image: caddy:alpine
    container_name: caddy-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - renewmanager

volumes:
  caddy_data:
  caddy_config:
````

#### 2\. Create `Caddyfile`

Create a file named `Caddyfile` (no extension) in the same directory:

```caddy
# Replace with your actual domain
your-domain.com {
    encode gzip
    reverse_proxy renewmanager:9787
}
```

#### 3\. Run

```bash
docker compose up -d
```

Your service will be available at `https://your-domain.com`.
</details>

#### 💾 Data Management

  * **Location**: All data (subscriptions, settings, logs) is stored in the `./data` directory in the same folder as your `docker-compose.yml`.
  * **Backup**: Simply backup the `./data` folder.
  * **Migration**: Copy the `./data` folder to a new server to restore your data.

#### 🔄 Updating

To update to the latest version:

```bash
# 1. Pull the latest image
docker compose pull

# 2. Recreate the container
docker compose up -d
```

### 🎉 Deployment Complete!

---

## ⚙️ Configuration

After deployment, visit your Worker URL or custom domain (e.g., `https://renewmanager.your-name.workers.dev`).

1.  **First Login**: Unlock using the `AUTH_PASSWORD` you set (default `admin`).
2.  **System Settings**: Click the **SETTINGS** button in the top right corner.
    - **Timezone**: Critical! Select your local timezone (e.g., `Asia/Shanghai` or `America/New_York`). This determines the accuracy of reminders and calendar events.
    - **Master Notification Switch**: Enable to configure specific notification channels.

<div align="center">
  <img src="./assets/configUIhelp_darkEN_shot.png" alt="RenewManager 界面预览" width="800">
</div>

### 📢 Notification Channels

Configure these in "Settings" -> "Notifications":

| Channel            | Parameter Description                                                       | How to Obtain/Configure                                                                                                                                                                                                                                  |
| :----------------- | :-------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Telegram**       | **Token**: Bot Token<br>**Chat ID**: Your User ID or Group ID               | 1. Create a bot via [@BotFather](https://t.me/BotFather) to get the Token. Add `@userinfobot` to get your UserID。<br>2. Or visit `https://api.telegram.org/bot<YourToken>/getUpdates` in your browser.<br>3. Send a message to your bot.<br>4. Refresh the URL above to find your Chat ID.         |
| **Bark** (iOS)     | **Server**: Server URL<br>**Device Key**: Key                               | 1. Download the Bark App from the App Store.<br>2. Copy the Server URL and Key displayed in the App.                                                                                                                                                     |
| **PushPlus**       | **Token**: User Token                                                       | 1. Visit [PushPlus Official Site](https://www.pushplus.plus/).<br>2. Login via WeChat to get your Token.                                                                                                                                                 |
| **NotifyX**        | **API Key**: Key                                                            | 1. Visit [NotifyX Official Site](https://www.notifyx.cn/).<br>2. Login to get your API Key.                                                                                                                                                              |
| **Resend** (Email) | **API Key**: Resend Key<br>**From**: Sender Email<br>**To**: Receiver Email | 1. Register at [Resend](https://resend.com/).<br>2. Bind a domain and get an API Key.<br>3. `From` must be a verified domain email (e.g., `alert@yourdomain.com`). If you don't have one, use `onboarding@resend.dev` and send to your registered email. |
| **WeChat Work**    | **CorpID**: Corp ID<br>**Secret**: App Secret<br>**AgentID**: App ID<br>**ToUser**: Recipient | 1. Login to [WeChat Work Admin](https://work.weixin.qq.com/).<br>2. Get CorpID from "My Enterprise".<br>3. Create an app to get AgentID and Secret.<br>4. ToUser is the recipient ID (e.g., `@all` for everyone).                                        |
| **Webhook**        | **URL**: POST URL                                                           | For custom development. The system sends a POST request: `{ "title": "...", "content": "..." }`. [Webhook Configuration Guide](./webhook_guide_en.md)                                                                                                                                                        |

---

## 🛠 Usage

### Adding a Service

- **Name**: Service name (e.g., "Netflix 4K", "Google Voice - 8888").
- **Tags**: For categorization (e.g., `Media`, `Server`, `Domain`, `PhoneNumber`). Supports multiple tags.
- **Renewal Amount**: Record the renewal cost, supports CNY, USD, and EUR currencies.
- **Purchase Information**:
  - **Purchase URL**: Link to the service purchase page (clickable).
  - **Purchase Account**: Account used to login to the purchase platform.
  - **Purchase Password**: Corresponding login password (securely stored).
- **Mode**:
  - 📅 **Cycle Subscription**: For items that expire every fixed cycle (e.g., 1 Month / 1 Year). Good for monthly subs, VPS renewals.
  - ⏳ **Expiration Reset**: For items that need manual/auto handling upon expiration to extend validity. Good for eSIM validity extension (e.g., extend 180 days on top-up).
- **Lunar Cycle**: Enable this for calculations based on the Lunar calendar (Birthdays, traditional events).
- **Automation Policy**:
  - **Auto-Renew**: Automatically extends the next due date by one cycle upon expiration.
  - **Auto-Disable**: Automatically marks the service as disabled if it remains overdue for a specified number of days.

### Viewing Details

Click the view button in the "Details" column of the service list to see all information about that service, including:
- Service status, type, cycle, and other basic information
- Creation date, last renewal date
- Renewal amount, purchase URL, account and password (if provided)
- Tag categories

<div align="center">
  <img src="./assets/AddUI_darkEN_shot.png" alt="RenewManager 界面预览" width="600">
</div>

### Viewing Logs

Click the **LOGS** button on the main interface to view history of automation tasks, push results, and operation audits.

### ICS Calendar Subscription

Find the **Calendar Subscription** section in "Settings".

1.  Copy the subscription link.
2.  **iOS**: Settings -> Mail -> Accounts -> Add Account -> Other -> Add Subscribed Calendar.
3.  **Google Calendar**: Add calendar -> From URL.
4.  **Outlook**: Add Calendar -> Subscribe from web.
5.  **Note**: The link contains a security token. Do not share it. If leaked, click "Reset Token".

---

## ⚠️ Notes

1.  **Data Security**: All data is stored in your Cloudflare KV. It is recommended to manually export JSON backups regularly.
2.  **Free Tier Limits**: (This limitation does not apply to Docker deployment.)
    - Cloudflare Workers Free Tier is limited to 100,000 requests per day.
    - KV writes are limited to 1,000 per day.

---

## 🤝 Contribution & Support

If you find bugs or have feature suggestions, feel free to submit an Issue or Pull Request.

### 💖 Donation

If RenewManager helps you, consider buying the author a coffee ☕️. Your support keeps the updates coming!

**Crypto** - International

| Crypto | Network | Address (Click to Copy) |
| :--- | :--- | :--- |
| **USDT** | **BSC (BEP20)** / Polygon / ETH | `0x0de4d19673cbdf954cfb83c0a48abb5ce8f6bf58` |

> ⚠️ Warning：Support USDT on BSC (BEP20), ETH or Polygon networks (Low fees).，DO NOT USE TRC20 ！！！

**Aifadian** - CN Users

[![爱发电](https://img.shields.io/badge/爱发电-Afdian-946ce6?style=for-the-badge&logo=github&logoColor=white)](https://afdian.com/a/lostfree)

---

**License**: MIT
Copyright (c) 2025 LOSTFREE
