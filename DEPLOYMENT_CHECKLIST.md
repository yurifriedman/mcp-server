# ✅ Deployment Checklist

## Step 1: Verify gcloud Installation

### On Windows PowerShell (Recommended)

**Open a NEW PowerShell window** and run:

```powershell
gcloud --version
```

**Expected output**:
```
Google Cloud SDK 458.0.0
bq 2.0.101
core 2024.01.12
```

If you see "command not found":
1. Close ALL terminal windows
2. Open a **NEW** PowerShell or Command Prompt
3. Try again

**Or manually add to PATH**:
```powershell
# Find gcloud installation (usually here):
$env:Path += ";C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"

# Test
gcloud --version
```

---

## Step 2: Initialize and Authenticate

### Login to Google Cloud

```bash
gcloud auth login
```

This will open a browser. Sign in with your Google account.

### Check Current Configuration

```bash
gcloud config list
```

---

## Step 3: Set Up Your Project

### Option A: Use Existing Project

```bash
# List your projects
gcloud projects list

# Set active project
gcloud config set project YOUR_PROJECT_ID
```

### Option B: Create New Project

```bash
# Create project (use a unique ID)
gcloud projects create gmail-mcp-yuri-2024 --name="Gmail MCP Server"

# Set as active
gcloud config set project gmail-mcp-yuri-2024

# Link billing (REQUIRED for Cloud Run)
gcloud billing accounts list
gcloud billing projects link gmail-mcp-yuri-2024 \
  --billing-account=YOUR_BILLING_ACCOUNT_ID
```

**Note**: You need billing enabled, but you'll likely stay in the free tier ($0).

---

## Step 4: Enable Required APIs

```bash
gcloud services enable run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

Wait for completion (~1-2 minutes).

---

## Step 5: Set Default Region

```bash
gcloud config set run/region us-central1
```

Or choose another region:
- `us-east1` (South Carolina)
- `europe-west1` (Belgium)
- `asia-northeast1` (Tokyo)

---

## Step 6: Verify Your OAuth Files

```bash
cd C:\Users\yurif\.claude\mcp-servers\specs\gmail

# Check files exist
ls client_secret_*.json
ls token.json
```

Both should be present. If `token.json` is missing:
```bash
npm run auth
```

---

## Step 7: Get Your Project ID

```bash
gcloud config get-value project
```

**Save this!** You'll use it in the next steps.

---

## Step 8: Setup Secrets in Secret Manager

**Using PowerShell**:

```powershell
# Set your project ID
$PROJECT_ID = "your-project-id-here"

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Find client secret file
$clientSecret = (Get-ChildItem -Filter "client_secret_*.json").Name

# Create secrets
gcloud secrets create gmail-client-secret --data-file=$clientSecret
gcloud secrets create gmail-oauth-token --data-file=token.json

# Get project number for permissions
$projectNumber = (gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding gmail-client-secret `
  --member="serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding gmail-oauth-token `
  --member="serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"
```

**Verify secrets created**:
```bash
gcloud secrets list
```

---

## Step 9: Build Docker Container

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/gmail-mcp-server
```

**Replace YOUR_PROJECT_ID** with your actual project ID.

This takes 2-5 minutes. You'll see build progress.

---

## Step 10: Deploy to Cloud Run

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

**When asked**: "Allow unauthenticated invocations?" → Type **y**

**Save the Service URL** from the output!

---

## Step 11: Test Your Deployment

### Test 1: Health Check

```bash
curl https://YOUR-SERVICE-URL/health
```

**Expected**:
```json
{
  "status": "healthy",
  "service": "gmail-mcp-server",
  "tools": 17
}
```

### Test 2: Server Info

```bash
curl https://YOUR-SERVICE-URL/
```

### Test 3: View Logs

```bash
gcloud run logs read gmail-mcp-server --limit=20
```

Look for:
```
🌐 Starting in CLOUD mode (HTTP/SSE transport)...
🔐 Loading credentials from Secret Manager...
Server running on port 8080
```

---

## ✅ Success Criteria

- [ ] gcloud CLI working (`gcloud --version`)
- [ ] Authenticated (`gcloud auth list` shows account)
- [ ] Project created/selected
- [ ] Billing enabled
- [ ] APIs enabled
- [ ] Secrets created and accessible
- [ ] Container built successfully
- [ ] Cloud Run service deployed
- [ ] Health check returns 200 OK
- [ ] Logs show successful startup

---

## 🚨 Troubleshooting

### Issue: "gcloud command not found" (after installation)

**Fix**: Close ALL terminals and open a NEW one. Or run:
```powershell
# PowerShell - add to PATH temporarily
$env:Path += ";C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"
```

### Issue: "Billing account required"

**Fix**:
1. Go to: https://console.cloud.google.com/billing
2. Enable billing (credit card required, but free tier covers most usage)
3. Link billing account to project

### Issue: "API not enabled"

**Fix**:
```bash
gcloud services enable SERVICE_NAME
```

### Issue: "Permission denied" on secrets

**Fix**: Re-run the IAM policy binding commands from Step 8

### Issue: "Container failed to start"

**Fix**: Check logs:
```bash
gcloud run logs read gmail-mcp-server --limit=100
```

Common causes:
- Missing environment variable (ensure GCP_PROJECT_ID is set)
- Secret access denied (re-run Step 8)
- OAuth token expired (run `npm run auth` and update secret)

---

## 🎯 Quick Commands Reference

```bash
# View service details
gcloud run services describe gmail-mcp-server --region us-central1

# View logs (last 50 lines)
gcloud run logs read gmail-mcp-server --limit=50

# Tail logs (real-time)
gcloud run logs tail gmail-mcp-server

# Update service (after code changes)
gcloud builds submit --tag gcr.io/PROJECT_ID/gmail-mcp-server
gcloud run deploy gmail-mcp-server --image gcr.io/PROJECT_ID/gmail-mcp-server

# Delete service
gcloud run services delete gmail-mcp-server --region us-central1

# List all services
gcloud run services list
```

---

## 📊 Monitor Your Service

**Cloud Console**:
1. Visit: https://console.cloud.google.com/run
2. Click `gmail-mcp-server`
3. View metrics, logs, and settings

**CLI**:
```bash
# Service status
gcloud run services describe gmail-mcp-server

# Recent deployments
gcloud run revisions list --service gmail-mcp-server

# View metrics
# (Use Cloud Console for visual metrics)
```

---

## 🔒 Secure Your Deployment (After Testing)

```bash
# Restrict access
gcloud run services update gmail-mcp-server \
  --no-allow-unauthenticated \
  --region us-central1

# Grant access to specific users
gcloud run services add-iam-policy-binding gmail-mcp-server \
  --member='user:YOUR-EMAIL@gmail.com' \
  --role='roles/run.invoker' \
  --region us-central1

# Test with authentication
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://YOUR-SERVICE-URL/health
```

---

## Next Steps After Deployment

1. ✅ Test all 17 tools via MCP client
2. ✅ Set up authentication (above)
3. ✅ Monitor usage and costs
4. ✅ Set up budget alerts
5. ✅ Configure custom domain (optional)
6. ✅ Set up CI/CD for automatic deployments

---

**Ready to deploy? Follow the steps above in order!** 🚀
