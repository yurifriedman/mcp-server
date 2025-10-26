# Deploying Gmail/Calendar MCP Server to Google Cloud

This guide explains how to deploy your MCP server from localhost to Google Cloud Platform (GCP).

## Current Architecture vs Cloud Architecture

### **Current Setup (Localhost)**
- **Transport**: stdio (stdin/stdout)
- **Usage**: Parent process communication only
- **Authentication**: Local `token.json` file
- **Client**: Direct process spawning

### **Cloud Setup (Required Changes)**
- **Transport**: HTTP with Server-Sent Events (SSE)
- **Usage**: Network-accessible API
- **Authentication**: Google Cloud Secret Manager
- **Client**: HTTP requests to cloud endpoint

---

## Deployment Options on Google Cloud

### **Option 1: Cloud Run (Recommended)**
**Best for**: Serverless, auto-scaling, pay-per-use

**Pros**:
- Fully managed (no server maintenance)
- Auto-scales to zero (cost-effective)
- Built-in HTTPS
- Easy deployment from container
- Integrates with Google Cloud services

**Cons**:
- Cold start latency
- Requires containerization

**Cost**: ~$0 for low usage (generous free tier)

---

### **Option 2: App Engine**
**Best for**: Managed platform without containers

**Pros**:
- Fully managed PaaS
- Auto-scaling
- No Docker knowledge needed
- Integrated monitoring

**Cons**:
- Less flexible than Cloud Run
- Higher minimum cost

**Cost**: Starts at ~$50/month

---

### **Option 3: Compute Engine (VM)**
**Best for**: Full control, traditional hosting

**Pros**:
- Complete control
- Can use stdio transport with SSH tunneling
- Persistent connections

**Cons**:
- Manual server management
- Always running (higher cost)
- No auto-scaling

**Cost**: ~$24/month (f1-micro instance)

---

### **Option 4: Google Kubernetes Engine (GKE)**
**Best for**: Enterprise, complex microservices

**Pros**:
- Production-grade orchestration
- Advanced scaling
- High availability

**Cons**:
- Most complex setup
- Highest cost
- Overkill for single MCP server

**Cost**: ~$100+/month

---

## Recommended Approach: Cloud Run

Cloud Run is the best choice for your MCP server because it's:
- **Cost-effective**: Scales to zero when not in use
- **Simple**: Easy deployment workflow
- **Managed**: No server maintenance
- **Secure**: Built-in authentication options

---

## Step-by-Step Deployment to Cloud Run

### **Phase 1: Modify MCP Server for HTTP Transport**

Your current server uses `stdio` transport which only works for local processes. We need to change it to HTTP/SSE transport.

#### Required Changes:

1. **Update `src/index.ts`** - Replace stdio transport with HTTP:

```typescript
// OLD (current):
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// ...
const transport = new StdioServerTransport();

// NEW (cloud):
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 8080;

app.post('/mcp', async (req, res) => {
  const transport = new SSEServerTransport('/mcp', res);
  await server.connect(transport);
});

app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});
```

2. **Add Express dependency**:
```bash
npm install express
npm install --save-dev @types/express
```

---

### **Phase 2: Secure OAuth Credentials**

**Problem**: `token.json` and `client_secret_*.json` cannot be stored in containers.

**Solution**: Use Google Cloud Secret Manager

#### Steps:

1. **Enable Secret Manager API**:
```bash
gcloud services enable secretmanager.googleapis.com
```

2. **Store OAuth credentials as secrets**:
```bash
# Store client secret
gcloud secrets create gmail-client-secret \
  --data-file=client_secret_*.json

# Store OAuth token
gcloud secrets create gmail-oauth-token \
  --data-file=token.json
```

3. **Update `src/auth.ts`** to read from Secret Manager:

```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

async function getSecret(secretName: string): Promise<string> {
  const client = new SecretManagerServiceClient();
  const projectId = process.env.GCP_PROJECT_ID;
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  const [version] = await client.accessSecretVersion({ name });
  return version.payload?.data?.toString() || '';
}

async function getAuthClient(): Promise<OAuth2Client> {
  // Read from Secret Manager instead of local files
  const credentialsJson = await getSecret('gmail-client-secret');
  const tokenJson = await getSecret('gmail-oauth-token');

  const credentials = JSON.parse(credentialsJson);
  const token = JSON.parse(tokenJson);

  // ... rest of auth logic
}
```

4. **Add Secret Manager dependency**:
```bash
npm install @google-cloud/secret-manager
```

---

### **Phase 3: Create Dockerfile**

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "dist/index.js"]
```

Create `.dockerignore`:

```
node_modules
dist
*.log
.git
.env
token.json
client_secret_*.json
```

---

### **Phase 4: Deploy to Cloud Run**

1. **Set up Google Cloud Project**:
```bash
# Login to GCP
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

2. **Build and push container**:
```bash
# Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/gmail-mcp-server

# Or use Docker directly:
docker build -t gcr.io/YOUR_PROJECT_ID/gmail-mcp-server .
docker push gcr.io/YOUR_PROJECT_ID/gmail-mcp-server
```

3. **Deploy to Cloud Run**:
```bash
gcloud run deploy gmail-mcp-server \
  --image gcr.io/YOUR_PROJECT_ID/gmail-mcp-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GCP_PROJECT_ID=YOUR_PROJECT_ID \
  --memory 512Mi \
  --timeout 60s \
  --max-instances 10
```

4. **Get your service URL**:
```bash
gcloud run services describe gmail-mcp-server \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

You'll get a URL like: `https://gmail-mcp-server-xxxxx-uc.a.run.app`

---

### **Phase 5: Connect Clients to Cloud MCP Server**

#### HTTP Client Example:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const transport = new SSEClientTransport(
  new URL('https://gmail-mcp-server-xxxxx-uc.a.run.app/mcp')
);

const client = new Client({
  name: 'gmail-client',
  version: '1.0.0',
}, {
  capabilities: {}
});

await client.connect(transport);

// Use the tools
const result = await client.callTool({
  name: 'calendar_get_today_events',
  arguments: {}
});

console.log(result);
```

---

## Security Considerations

### **1. Authentication**

Protect your MCP server with authentication:

```bash
# Deploy with authentication required
gcloud run deploy gmail-mcp-server \
  --no-allow-unauthenticated

# Grant access to specific users
gcloud run services add-iam-policy-binding gmail-mcp-server \
  --member='user:your-email@gmail.com' \
  --role='roles/run.invoker'
```

### **2. API Keys**

Add API key authentication:

```typescript
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### **3. CORS Configuration**

If accessing from web browsers:

```typescript
import cors from 'cors';

app.use(cors({
  origin: 'https://your-frontend.com',
  credentials: true
}));
```

---

## Monitoring & Logging

### **View Logs**:
```bash
gcloud run logs read gmail-mcp-server --limit=50
```

### **Monitor Metrics**:
- Go to Cloud Console → Cloud Run → gmail-mcp-server
- View: Request count, latency, CPU/memory usage, errors

### **Set up Alerts**:
```bash
# Alert on error rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="MCP Server Error Rate" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s
```

---

## Cost Optimization

### **Cloud Run Pricing**:
- **Free tier**: 2 million requests/month, 360,000 GB-seconds/month
- **After free tier**: $0.00002400 per request, $0.00000250 per GB-second

### **Estimated Monthly Cost** (for moderate usage):
- 100,000 requests/month: **~$2-3**
- Always-on small instance: **~$10-15**
- Secret Manager: **~$0.06** per secret per month

### **Cost Reduction Tips**:
1. Set `--min-instances=0` to scale to zero
2. Use `--memory=512Mi` (minimum needed)
3. Optimize cold start time (keep container small)
4. Use request caching where possible

---

## Troubleshooting

### **Issue: Container fails to start**
```bash
# Check logs
gcloud run logs read gmail-mcp-server --limit=100

# Common causes:
# - Port mismatch (must use PORT env var)
# - Missing dependencies
# - OAuth credential errors
```

### **Issue: Secret Manager access denied**
```bash
# Grant Cloud Run service account access to secrets
gcloud secrets add-iam-policy-binding gmail-oauth-token \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### **Issue: OAuth token expired**
- Update token in Secret Manager:
```bash
gcloud secrets versions add gmail-oauth-token --data-file=token.json
```

---

## Alternative: Compute Engine Deployment

If you prefer to keep stdio transport and avoid code changes:

### **Steps**:

1. **Create VM**:
```bash
gcloud compute instances create mcp-server-vm \
  --machine-type=e2-micro \
  --zone=us-central1-a \
  --image-family=debian-11 \
  --image-project=debian-cloud
```

2. **SSH and setup**:
```bash
gcloud compute ssh mcp-server-vm

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your code
git clone YOUR_REPO
cd gmail-mcp-server
npm install
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name mcp-server
pm2 startup
pm2 save
```

3. **Access via SSH tunnel**:
```bash
# On your local machine
gcloud compute ssh mcp-server-vm -- -L 8080:localhost:8080

# Now your MCP server is accessible at localhost:8080
```

---

## Summary & Recommendations

### **For Your Use Case**, I recommend:

1. **Start with Cloud Run**:
   - Easiest deployment
   - Most cost-effective
   - Production-ready with minimal effort

2. **Security Setup**:
   - Store credentials in Secret Manager
   - Use IAM authentication (no public access)
   - Enable Cloud Armor for DDoS protection

3. **Development Workflow**:
   - Keep localhost version for development
   - Deploy to Cloud Run for production
   - Use CI/CD (Cloud Build) for automatic deployments

### **Migration Checklist**:
- [ ] Modify transport from stdio to HTTP/SSE
- [ ] Add express server
- [ ] Move credentials to Secret Manager
- [ ] Create Dockerfile
- [ ] Test locally with Docker
- [ ] Deploy to Cloud Run
- [ ] Configure authentication
- [ ] Test all 17 tools (Gmail + Calendar)
- [ ] Set up monitoring/alerts
- [ ] Document client connection

---

## Next Steps

Would you like me to:
1. **Implement the HTTP transport changes** to make the server cloud-ready?
2. **Create the Dockerfile and deployment scripts**?
3. **Set up a different deployment option** (App Engine, Compute Engine)?
4. **Create automated CI/CD pipeline** for deployments?

Let me know which approach you'd like to pursue!
