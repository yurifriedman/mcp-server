# Step-by-Step Deployment Walkthrough

This guide will walk you through deploying your Gmail/Calendar MCP server to Google Cloud Run.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Google Cloud account (free tier available)
- [ ] Billing enabled on your Google Cloud project (required for Cloud Run, but free tier covers most usage)
- [ ] OAuth credentials (`client_secret_*.json` file)
- [ ] OAuth token (`token.json` file from `npm run auth`)
- [ ] Google Cloud CLI installed (see `INSTALL_GCLOUD.md`)

---

## Phase 1: Install Google Cloud CLI

### Windows Installation

1. **Download the installer**:
   - Go to: https://cloud.google.com/sdk/docs/install
   - Download "GoogleCloudSDKInstaller.exe"

2. **Run the installer**:
   - Double-click the installer
   - Follow the wizard
   - ✅ Check "Run gcloud init" at the end

3. **Restart your terminal** (PowerShell or Git Bash)

4. **Verify installation**:
   ```bash
   gcloud --version
   ```

   Expected output:
   ```
   Google Cloud SDK 458.0.0
   bq 2.0.101
   core 2024.01.12
   gcloud-crc32c 1.0.0
   ```

---

## Phase 2: Initialize Google Cloud

### Step 1: Login to Google Cloud

```bash
gcloud auth login
```

This will:
- Open a browser window
- Ask you to select your Google account
- Grant permissions to gcloud CLI

### Step 2: List or Create a Project

**List existing projects**:
```bash
gcloud projects list
```

**Create a new project** (if needed):
```bash
gcloud projects create gmail-mcp-server-PROJECT_ID --name="Gmail MCP Server"
```

Replace `PROJECT_ID` with a unique ID (e.g., `gmail-mcp-2024-yuri`)

### Step 3: Set the Active Project

```bash
gcloud config set project YOUR_PROJECT_ID
```

### Step 4: Enable Billing

**Important**: Cloud Run requires billing to be enabled (but has a generous free tier).

1. Visit: https://console.cloud.google.com/billing
2. Link a billing account to your project
3. Or via CLI:
   ```bash
   # List billing accounts
   gcloud billing accounts list

   # Link to project
   gcloud billing projects link YOUR_PROJECT_ID \
     --billing-account=YOUR_BILLING_ACCOUNT_ID
   ```

### Step 5: Enable Required APIs

```bash
gcloud services enable run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  gmail.googleapis.com \
  calendar-json.googleapis.com
```

This takes 1-2 minutes. Wait for completion.

### Step 6: Set Default Region

```bash
gcloud config set run/region us-central1
```

Or choose your preferred region:
- `us-central1` (Iowa, USA)
- `us-east1` (South Carolina, USA)
- `europe-west1` (Belgium)
- `asia-northeast1` (Tokyo)

### Step 7: Verify Configuration

```bash
gcloud config list
```

Expected output:
```
[compute]
region = us-central1
zone = us-central1-a
[core]
account = your-email@gmail.com
disable_usage_reporting = False
project = your-project-id
```

---

## Phase 3: Setup OAuth Secrets in Secret Manager

### Step 1: Navigate to Your Project Directory

```bash
cd C:\Users\yurif\.claude\mcp-servers\specs\gmail
```

### Step 2: Verify Your OAuth Files Exist

```bash
# Check for client secret
ls client_secret_*.json

# Check for token
ls token.json
```

Both files should exist. If not:
- `client_secret_*.json`: Download from Google Cloud Console
- `token.json`: Run `npm run auth`

### Step 3: Run the Secret Setup Script

**On Windows (Git Bash or WSL)**:
```bash
bash setup-secrets.sh YOUR_PROJECT_ID
```

**On Windows (PowerShell)** - Manual steps:
```powershell
# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable Secret Manager
gcloud services enable secretmanager.googleapis.com

# Find your client secret file
$clientSecret = (Get-ChildItem -Filter "client_secret_*.json").Name

# Create gmail-client-secret
gcloud secrets create gmail-client-secret --data-file=$clientSecret

# Create gmail-oauth-token
gcloud secrets create gmail-oauth-token --data-file=token.json

# Get project number
$projectNumber = (gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Grant access to secrets
gcloud secrets add-iam-policy-binding gmail-client-secret `
  --member="serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding gmail-oauth-token `
  --member="serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"
```

### Step 4: Verify Secrets Were Created

```bash
gcloud secrets list
```

Expected output:
```
NAME                 CREATED              REPLICATION_POLICY  LOCATIONS
gmail-client-secret  2024-01-XX XX:XX:XX  automatic           -
gmail-oauth-token    2024-01-XX XX:XX:XX  automatic           -
```

---

## Phase 4: Build and Deploy to Cloud Run

### Step 1: Build the Docker Container

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/gmail-mcp-server
```

This will:
- Read your `Dockerfile`
- Build the container
- Push to Google Container Registry
- Takes 2-5 minutes

**Expected output**:
```
Creating temporary tarball archive...
Uploading tarball...
DONE
--------------------------------------------------------------------------------
ID                                    CREATE_TIME                DURATION  SOURCE  IMAGES  STATUS
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  2024-XX-XXTXX:XX:XX+00:00  2M30S     gs://  -       SUCCESS
```

### Step 2: Deploy to Cloud Run

```bash
gcloud run deploy gmail-mcp-server \
  --image gcr.io/YOUR_PROJECT_ID/gmail-mcp-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT_ID=YOUR_PROJECT_ID" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60s \
  --min-instances 0 \
  --max-instances 10
```

**Questions you'll be asked**:
- "Allow unauthenticated invocations?" → **y** (yes, for now - we'll secure it later)

**Expected output**:
```
Deploying container to Cloud Run service [gmail-mcp-server] in project [YOUR_PROJECT_ID] region [us-central1]
✓ Deploying new service... Done.
  ✓ Creating Revision...
  ✓ Routing traffic...
Done.
Service [gmail-mcp-server] revision [gmail-mcp-server-00001-xxx] has been deployed and is serving 100 percent of traffic.
Service URL: https://gmail-mcp-server-xxxxxxxxxxxxx-uc.a.run.app
```

### Step 3: Copy Your Service URL

The deployment will show your service URL like:
```
https://gmail-mcp-server-xxxxxxxxxxxxx-uc.a.run.app
```

**Save this URL!** You'll need it to access your server.

---

## Phase 5: Test Your Deployment

### Test 1: Health Check

```bash
curl https://YOUR-SERVICE-URL/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "service": "gmail-mcp-server",
  "version": "0.1.0",
  "timestamp": "2024-01-XX...",
  "tools": 17
}
```

### Test 2: Server Info

```bash
curl https://YOUR-SERVICE-URL/
```

**Expected response**:
```json
{
  "name": "Gmail MCP Server",
  "version": "0.1.0",
  "description": "MCP server providing Gmail and Calendar integration",
  "endpoints": {
    "health": "/health",
    "mcp": "/mcp (POST for SSE connection)"
  },
  "tools": 17,
  "capabilities": ["gmail", "calendar"]
}
```

### Test 3: View Logs

```bash
gcloud run logs read gmail-mcp-server --limit=50
```

You should see:
```
🌐 Starting in CLOUD mode (HTTP/SSE transport)...
🔐 Loading credentials from Secret Manager...
🔐 Loading OAuth token from Secret Manager...
Server running on port 8080
```

---

## Phase 6: Secure Your Deployment (Recommended)

### Step 1: Restrict Access

```bash
# Disable public access
gcloud run services update gmail-mcp-server \
  --no-allow-unauthenticated \
  --region us-central1

# Grant access to your email
gcloud run services add-iam-policy-binding gmail-mcp-server \
  --member='user:YOUR-EMAIL@gmail.com' \
  --role='roles/run.invoker' \
  --region us-central1
```

### Step 2: Test Authenticated Access

```bash
# Get auth token
gcloud auth print-identity-token

# Use token in request
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://YOUR-SERVICE-URL/health
```

---

## Phase 7: Monitor Your Deployment

### View Cloud Run Dashboard

1. Visit: https://console.cloud.google.com/run
2. Click on `gmail-mcp-server`
3. See:
   - Request count
   - Response times
   - Error rates
   - CPU/Memory usage

### View Logs in Real-Time

```bash
gcloud run logs tail gmail-mcp-server
```

### Set Up Alerts (Optional)

```bash
# Alert on error rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="MCP Server Errors" \
  --condition-threshold-value=0.05
```

---

## Troubleshooting

### Issue: "Build failed"

**Check**:
```bash
gcloud builds list --limit=5
```

**Common causes**:
- Missing Dockerfile
- Syntax errors in Dockerfile
- Missing dependencies in package.json

**Fix**: Review build logs
```bash
gcloud builds log BUILD_ID
```

### Issue: "Container failed to start"

**Check logs**:
```bash
gcloud run logs read gmail-mcp-server --limit=100
```

**Common causes**:
- Port mismatch (ensure using PORT env var)
- Secret Manager access denied
- Invalid OAuth credentials

**Fix for Secret Manager access**:
```bash
# Get project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID \
  --format="value(projectNumber)")

# Grant access
gcloud secrets add-iam-policy-binding gmail-oauth-token \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Issue: "OAuth token expired"

**Update token**:
```bash
# Re-authenticate locally
npm run auth

# Update secret
gcloud secrets versions add gmail-oauth-token --data-file=token.json
```

### Issue: "API not enabled"

**Enable missing APIs**:
```bash
gcloud services enable gmail.googleapis.com
gcloud services enable calendar-json.googleapis.com
```

---

## Cost Management

### View Current Usage

1. Visit: https://console.cloud.google.com/billing
2. Go to "Reports"
3. Filter by "Cloud Run"

### Set Budget Alerts

```bash
# Create $10/month budget with alerts
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="Cloud Run Budget" \
  --budget-amount=10USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### Optimize Costs

- **Scale to zero**: Already configured (min-instances=0)
- **Reduce memory**: Change to 256Mi if 512Mi is too much
- **Set max instances**: Already set to 10 (prevents runaway costs)

---

## Updating Your Deployment

### Update Code and Redeploy

```bash
# Make your code changes
# Build and deploy again
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/gmail-mcp-server

gcloud run deploy gmail-mcp-server \
  --image gcr.io/YOUR_PROJECT_ID/gmail-mcp-server \
  --platform managed \
  --region us-central1
```

### Update Secrets

```bash
# Update OAuth token
gcloud secrets versions add gmail-oauth-token --data-file=token.json
```

### Rollback to Previous Version

```bash
# List revisions
gcloud run revisions list --service gmail-mcp-server

# Rollback
gcloud run services update-traffic gmail-mcp-server \
  --to-revisions=REVISION_NAME=100
```

---

## Quick Command Reference

```bash
# View service details
gcloud run services describe gmail-mcp-server

# View logs
gcloud run logs read gmail-mcp-server --limit=50

# Tail logs
gcloud run logs tail gmail-mcp-server

# Update environment variable
gcloud run services update gmail-mcp-server \
  --set-env-vars KEY=VALUE

# Delete service
gcloud run services delete gmail-mcp-server

# List all Cloud Run services
gcloud run services list
```

---

## Success! 🎉

Your Gmail/Calendar MCP server is now:
- ✅ Deployed to Google Cloud Run
- ✅ Accessible via HTTPS from anywhere
- ✅ Using secure Secret Manager for credentials
- ✅ Auto-scaling based on demand
- ✅ Monitored and logged
- ✅ Production-ready!

**Your Service URL**: `https://gmail-mcp-server-xxxxx-uc.a.run.app`

**Test it**:
```bash
curl https://YOUR-SERVICE-URL/health
```

---

## Next Steps

1. **Integrate with your MCP client** using the service URL
2. **Set up authentication** for production use
3. **Configure custom domain** (optional)
4. **Set up CI/CD** for automatic deployments
5. **Monitor usage** and optimize costs

Enjoy your cloud-deployed MCP server! 🚀
