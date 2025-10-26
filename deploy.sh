#!/bin/bash

# Deployment script for Gmail/Calendar MCP Server to Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e  # Exit on error

# Configuration
PROJECT_ID="${1:-your-project-id}"
REGION="${2:-us-central1}"
SERVICE_NAME="gmail-mcp-server"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "=========================================="
echo "Deploying MCP Server to Google Cloud Run"
echo "=========================================="
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo ""

# Step 1: Set GCP project
echo "📋 Setting GCP project..."
gcloud config set project "${PROJECT_ID}"

# Step 2: Enable required APIs
echo "🔌 Enabling required APIs..."
gcloud services enable run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

# Step 3: Build container
echo "🏗️  Building container image..."
gcloud builds submit --tag "${IMAGE_NAME}"

# Step 4: Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_NAME}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID}" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60s \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80

# Step 5: Get service URL
echo ""
echo "✅ Deployment complete!"
echo ""
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --platform managed \
  --region "${REGION}" \
  --format 'value(status.url)')

echo "=========================================="
echo "🎉 Your MCP Server is live!"
echo "=========================================="
echo "Service URL: ${SERVICE_URL}"
echo "Health Check: ${SERVICE_URL}/health"
echo "MCP Endpoint: ${SERVICE_URL}/mcp"
echo ""
echo "📊 View logs:"
echo "gcloud run logs read ${SERVICE_NAME} --region ${REGION}"
echo ""
echo "🔐 To restrict access (recommended):"
echo "gcloud run services update ${SERVICE_NAME} --no-allow-unauthenticated --region ${REGION}"
echo "=========================================="
