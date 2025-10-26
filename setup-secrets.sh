#!/bin/bash

# Setup Google Cloud Secret Manager for OAuth credentials
# Usage: ./setup-secrets.sh [PROJECT_ID]

set -e

PROJECT_ID="${1:-your-project-id}"
SERVICE_NAME="gmail-mcp-server"

echo "=========================================="
echo "Setting up Secret Manager for MCP Server"
echo "=========================================="
echo "Project: ${PROJECT_ID}"
echo ""

# Set project
gcloud config set project "${PROJECT_ID}"

# Enable Secret Manager API
echo "🔌 Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com

# Find client secret file
CLIENT_SECRET_FILE=$(ls client_secret_*.json 2>/dev/null | head -n 1)

if [ -z "$CLIENT_SECRET_FILE" ]; then
  echo "❌ Error: No client_secret_*.json file found!"
  echo "Please download OAuth credentials from Google Cloud Console"
  echo "https://console.cloud.google.com/apis/credentials"
  exit 1
fi

echo "📄 Found client secret: ${CLIENT_SECRET_FILE}"

# Check if token.json exists
if [ ! -f "token.json" ]; then
  echo "❌ Error: token.json not found!"
  echo "Please run 'npm run auth' to authenticate first"
  exit 1
fi

echo "📄 Found OAuth token: token.json"
echo ""

# Create secrets
echo "🔐 Creating secrets in Secret Manager..."

# Create client secret
echo "  Creating gmail-client-secret..."
if gcloud secrets describe gmail-client-secret >/dev/null 2>&1; then
  echo "  Secret already exists. Adding new version..."
  gcloud secrets versions add gmail-client-secret --data-file="${CLIENT_SECRET_FILE}"
else
  gcloud secrets create gmail-client-secret --data-file="${CLIENT_SECRET_FILE}"
fi

# Create OAuth token
echo "  Creating gmail-oauth-token..."
if gcloud secrets describe gmail-oauth-token >/dev/null 2>&1; then
  echo "  Secret already exists. Adding new version..."
  gcloud secrets versions add gmail-oauth-token --data-file=token.json
else
  gcloud secrets create gmail-oauth-token --data-file=token.json
fi

echo ""
echo "🔑 Granting Cloud Run access to secrets..."

# Get project number
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant access to client secret
gcloud secrets add-iam-policy-binding gmail-client-secret \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

# Grant access to OAuth token
gcloud secrets add-iam-policy-binding gmail-oauth-token \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

echo ""
echo "✅ Secret Manager setup complete!"
echo ""
echo "=========================================="
echo "Created Secrets:"
echo "  - gmail-client-secret"
echo "  - gmail-oauth-token"
echo ""
echo "Service Account:"
echo "  ${SERVICE_ACCOUNT}"
echo ""
echo "🔐 To update secrets in the future:"
echo "gcloud secrets versions add gmail-oauth-token --data-file=token.json"
echo "=========================================="
