# Installing Google Cloud CLI

## For Windows

### Option 1: Using the Installer (Recommended)

1. **Download the installer**:
   - Visit: https://cloud.google.com/sdk/docs/install
   - Download the Windows installer (GoogleCloudSDKInstaller.exe)

2. **Run the installer**:
   - Double-click the downloaded file
   - Follow the installation wizard
   - Check "Run gcloud init" when prompted

3. **Verify installation**:
   ```bash
   gcloud --version
   ```

### Option 2: Using PowerShell

Open PowerShell as Administrator and run:

```powershell
# Download the installer
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")

# Run the installer
& $env:Temp\GoogleCloudSDKInstaller.exe
```

### Option 3: Using Chocolatey (if installed)

```bash
choco install gcloudsdk
```

---

## After Installation

### 1. Initialize gcloud

```bash
gcloud init
```

This will:
- Ask you to log in with your Google account
- Let you select or create a Google Cloud project
- Set default region/zone

### 2. Authenticate

```bash
gcloud auth login
```

### 3. Set your project

```bash
# List available projects
gcloud projects list

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

### 4. Enable required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

---

## Quick Setup Commands (After gcloud is installed)

```bash
# Login
gcloud auth login

# Set project (replace with your project ID)
gcloud config set project YOUR_PROJECT_ID

# Set default region
gcloud config set run/region us-central1

# Enable APIs
gcloud services enable run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

# Verify setup
gcloud config list
```

---

## Create a New Project (if needed)

```bash
# Create project
gcloud projects create YOUR-PROJECT-ID --name="Gmail MCP Server"

# Set as default
gcloud config set project YOUR-PROJECT-ID

# Link billing account (required for Cloud Run)
gcloud billing projects link YOUR-PROJECT-ID --billing-account=BILLING_ACCOUNT_ID
```

To find your billing account ID:
```bash
gcloud billing accounts list
```

---

## Troubleshooting

### Issue: "gcloud: command not found" after installation

**Solution**: Restart your terminal or add to PATH manually:

1. Find gcloud installation directory (usually):
   ```
   C:\Users\YourUsername\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin
   ```

2. Add to PATH:
   - Search "Environment Variables" in Windows
   - Edit PATH variable
   - Add the gcloud bin directory

### Issue: "Project not set"

**Solution**:
```bash
gcloud config set project YOUR_PROJECT_ID
```

### Issue: "API not enabled"

**Solution**:
```bash
gcloud services enable REQUIRED_API
```

---

## Next Steps After Installation

Once gcloud is installed and configured, return to deployment:

```bash
# 1. Setup secrets
./setup-secrets.sh YOUR_PROJECT_ID

# 2. Deploy to Cloud Run
./deploy.sh YOUR_PROJECT_ID us-central1
```

---

## Alternative: Use Google Cloud Console (Web UI)

If you prefer not to use CLI, you can deploy through the web interface:

1. **Visit**: https://console.cloud.google.com/run
2. **Create Service** → **Deploy from source code**
3. **Connect GitHub repo** or upload code
4. **Configure** settings (region, memory, etc.)
5. **Deploy**

But using CLI is much faster! 🚀
