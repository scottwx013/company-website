#!/bin/bash
# Deploy to Vercel using API

PROJECT_NAME="fuliyun-$(date +%s)"
API_URL="https://api.vercel.com"

echo "Deploying $PROJECT_NAME..."

# Create deployment
curl -X POST "$API_URL/v13/deployments" \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "name": "$PROJECT_NAME",
  "files": [],
  "target": "production"
}
EOF
