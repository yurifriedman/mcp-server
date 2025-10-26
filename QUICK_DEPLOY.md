# Quick Deployment Guide

## TL;DR - Deploy to Google Cloud in 3 Steps

### Prerequisites
- Google Cloud account
- `gcloud` CLI installed
- OAuth credentials already authenticated locally

---

## Option A: Simple Deploy (5 minutes)

```bash
# 1. Setup secrets
./setup-secrets.sh YOUR_PROJECT_ID

# 2. Deploy
./deploy.sh YOUR_PROJECT_ID us-central1

# 3. Done! Your server is live at:
# https://gmail-mcp-server-xxxxx-uc.a.run.app
```

---

## Option B: Manual Deploy (if scripts don't work)

### Step 1: Setup Secrets
```bash
gcloud config set project YOUR_PROJECT_ID

gcloud services enable secretmanager.googleapis.com

gcloud secrets create gmail-client-secret \
  --data-file=client_secret_*.json

gcloud secrets create gmail-oauth-token \
  --data-file=token.json
```

### Step 2: Build & Deploy
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/gmail-mcp-server

gcloud run deploy gmail-mcp-server \
  --image gcr.io/YOUR_PROJECT_ID/gmail-mcp-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Step 3: Get URL
```bash
gcloud run services describe gmail-mcp-server \
  --region us-central1 \
  --format 'value(status.url)'
```

---

## Important Notes

### ⚠️ Current Limitation
Your MCP server currently uses **stdio transport** which only works locally. To deploy to cloud, you need to:

1. **Convert to HTTP transport** (see DEPLOYMENT_GUIDE.md Phase 1)
2. **OR** deploy to Compute Engine VM and access via SSH tunnel

### 🔐 Security Recommendation
After deployment, restrict access:

```bash
gcloud run services update gmail-mcp-server \
  --no-allow-unauthenticated \
  --region us-central1

# Grant access to your email
gcloud run services add-iam-policy-binding gmail-mcp-server \
  --member='user:your-email@gmail.com' \
  --role='roles/run.invoker' \
  --region us-central1
```

---

## Troubleshooting

### Issue: "Permission denied"
```bash
# Grant yourself permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:$(gcloud config get-value account)" \
  --role="roles/run.admin"
```

### Issue: "Container failed to start"
```bash
# Check logs
gcloud run logs read gmail-mcp-server --limit=50

# Common fix: Ensure PORT environment variable is used
```

### Issue: "Secret access denied"
```bash
# Grant Cloud Run service account access
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID \
  --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding gmail-oauth-token \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Cost Estimate

**Free Tier** (likely your usage):
- 2 million requests/month
- 360,000 GB-seconds/month
- **Cost: $0**

**After Free Tier**:
- ~100K requests/month: **$2-3/month**
- Always-on instance: **$10-15/month**

---

## Next Steps

1. Read **DEPLOYMENT_GUIDE.md** for complete details
2. Convert stdio transport to HTTP (required for cloud)
3. Test deployment
4. Set up monitoring and alerts
5. Configure authentication

---

## Need Help?

See full guide: `DEPLOYMENT_GUIDE.md`
