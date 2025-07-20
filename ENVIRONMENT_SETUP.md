# 🔧 Environment Variables Setup Guide

## Overview

This guide provides comprehensive setup instructions for all environment variables required by the MindDump application, including explanations and security best practices.

## 📋 Complete Environment Variables List

### Core Application Variables

#### `NEXT_PUBLIC_SUPABASE_URL` *(Required)*
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
```
- **Purpose**: Supabase project URL for database and authentication
- **How to get**: Supabase Dashboard → Settings → API → Project URL
- **Example**: `https://abcdefghijklmnop.supabase.co`
- **Security**: Public (exposed to client)

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY` *(Required)*
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **Purpose**: Public key for client-side Supabase operations
- **How to get**: Supabase Dashboard → Settings → API → anon public key
- **Security**: Public (exposed to client, has limited permissions)

#### `SUPABASE_SERVICE_ROLE_KEY` *(Required)*
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **Purpose**: Server-side key for admin operations and RLS bypass
- **How to get**: Supabase Dashboard → Settings → API → service_role secret key
- **Security**: 🔒 **CRITICAL** - Keep secret, has full database access

#### `ANTHROPIC_API_KEY` *(Required)*
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```
- **Purpose**: Claude AI API access for thought analysis
- **How to get**: [Anthropic Console](https://console.anthropic.com) → API Keys
- **Security**: 🔒 **CRITICAL** - Keep secret, costs money if leaked

#### `NEXTAUTH_URL` *(Required)*
```bash
NEXTAUTH_URL=https://your-domain.com/minddump
```
- **Purpose**: Base URL for authentication callbacks
- **How to set**: Your deployed app URL + `/minddump`
- **Example**: `https://crizzel.xyz/minddump`
- **Security**: Public

#### `NEXTAUTH_SECRET` *(Required)*
```bash
NEXTAUTH_SECRET=your-32-character-random-string
```
- **Purpose**: JWT signing secret for session tokens
- **How to generate**: `openssl rand -base64 32`
- **Example**: `kJ8mN2pQ5rS7tU9vW1xY3zA6bC8dE0fG2hI4jK6lM8nO0p`
- **Security**: 🔒 **CRITICAL** - Keep secret, rotate periodically

### Authentication Variables

#### `GITHUB_CLIENT_ID` *(Required)*
```bash
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
```
- **Purpose**: GitHub OAuth application ID
- **How to get**: GitHub → Settings → Developer settings → OAuth Apps
- **Security**: Public (but don't share unnecessarily)

#### `GITHUB_CLIENT_SECRET` *(Required)*
```bash
GITHUB_CLIENT_SECRET=abcdef1234567890abcdef1234567890abcdef12
```
- **Purpose**: GitHub OAuth application secret
- **How to get**: GitHub OAuth app settings → Client secrets
- **Security**: 🔒 **CRITICAL** - Keep secret

#### `GITHUB_PERSONAL_ACCESS_TOKEN` *(Optional)*
```bash
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz1234567890
```
- **Purpose**: Enables automatic GitHub repository creation for projects
- **How to get**: GitHub → Settings → Developer settings → Personal access tokens
- **Scopes needed**: `repo` (for private repo creation)
- **Security**: 🔒 **CRITICAL** - Keep secret, has repo access

### Google Sheets Integration Variables

#### `GOOGLE_SHEETS_CLIENT_EMAIL` *(Optional but Recommended)*
```bash
GOOGLE_SHEETS_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com
```
- **Purpose**: Service account email for Google Sheets API access
- **How to get**: Google Cloud Console → Service Accounts → Create key
- **Security**: Semi-public (service account email)

#### `GOOGLE_SHEETS_PRIVATE_KEY` *(Optional but Recommended)*
```bash
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```
- **Purpose**: Service account private key for Google Sheets authentication
- **How to get**: Google Cloud Console → Service Account → Create key → JSON
- **Format**: Must include `\n` characters as shown
- **Security**: 🔒 **CRITICAL** - Keep secret, has Sheets access

#### `GOOGLE_SHEETS_MASTER_ID` *(Optional but Recommended)*
```bash
GOOGLE_SHEETS_MASTER_ID=1abcdefghijklmnopqrstuvwxyz1234567890
```
- **Purpose**: ID of master spreadsheet for centralized logging
- **How to get**: Create Google Sheet, copy ID from URL
- **URL format**: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
- **Security**: Semi-public (anyone with ID can access if shared)

### Webhook Integration Variables

#### `WEBHOOKS_ENABLED` *(Optional)*
```bash
WEBHOOKS_ENABLED=true
```
- **Purpose**: Enable/disable webhook system
- **Values**: `true` or `false`
- **Default**: `false`
- **Security**: Public configuration

#### `WEBHOOK_AUTH_TOKEN` *(Optional)*
```bash
WEBHOOK_AUTH_TOKEN=your-secure-webhook-token
```
- **Purpose**: Authentication token for webhook requests
- **How to generate**: `openssl rand -base64 32`
- **Security**: 🔒 **SECRET** - Share only with webhook endpoints

#### Category-Specific Webhook URLs *(Optional)*
```bash
# Goal tracking
WEBHOOK_GOAL=https://your-automation.com/webhook/goal

# Habit formation
WEBHOOK_HABIT=https://your-automation.com/webhook/habit

# Project management
WEBHOOK_PROJECTIDEA=https://your-automation.com/webhook/project

# Task management
WEBHOOK_TASK=https://your-automation.com/webhook/task

# Scheduling & reminders
WEBHOOK_REMINDER=https://your-automation.com/webhook/reminder

# Knowledge management
WEBHOOK_NOTE=https://your-automation.com/webhook/note
WEBHOOK_INSIGHT=https://your-automation.com/webhook/insight
WEBHOOK_LEARNING=https://your-automation.com/webhook/learning

# Professional development
WEBHOOK_CAREER=https://your-automation.com/webhook/career

# Analytics & tracking
WEBHOOK_METRIC=https://your-automation.com/webhook/metric

# Creative & brainstorming
WEBHOOK_IDEA=https://your-automation.com/webhook/idea

# Process & workflow
WEBHOOK_SYSTEM=https://your-automation.com/webhook/system
WEBHOOK_AUTOMATION=https://your-automation.com/webhook/automation

# Relationship management
WEBHOOK_PERSON=https://your-automation.com/webhook/person

# Privacy (no webhook - stored locally only)
WEBHOOK_SENSITIVE=  # Leave empty or omit for privacy
```

### Performance & Optimization Variables

#### `VERCEL_FUNCTION_TIMEOUT` *(Optional)*
```bash
VERCEL_FUNCTION_TIMEOUT=30s
```
- **Purpose**: Maximum execution time for API functions
- **Default**: 10s (Hobby), 15s (Pro), 60s (Enterprise)
- **Recommended**: 30s for AI processing

#### `NEXT_TELEMETRY_DISABLED` *(Optional)*
```bash
NEXT_TELEMETRY_DISABLED=1
```
- **Purpose**: Disable Next.js telemetry data collection
- **Values**: `1` to disable
- **Privacy**: Recommended for production

#### `NODE_ENV` *(Automatic)*
```bash
NODE_ENV=production
```
- **Purpose**: Set by Vercel automatically
- **Values**: `development`, `production`
- **Note**: Don't set manually

## 🛠️ Setup Instructions by Platform

### Vercel Deployment

1. **Via Vercel Dashboard**
   ```bash
   # Go to: vercel.com/dashboard
   # Select project → Settings → Environment Variables
   # Add each variable with appropriate environment (Production/Preview/Development)
   ```

2. **Via Vercel CLI**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Add environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add ANTHROPIC_API_KEY production
   vercel env add NEXTAUTH_SECRET production
   # ... repeat for all variables

   # Pull environment variables for local development
   vercel env pull .env.local
   ```

3. **Bulk Import**
   ```bash
   # Create .env file with all variables
   # Then import via Vercel CLI
   vercel env add < .env.production
   ```

### Local Development

1. **Create `.env.local` file**
   ```bash
   # In apps/minddumpapp/.env.local
   
   # Copy all environment variables here
   # Use development/testing values
   NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
   ANTHROPIC_API_KEY=sk-ant-api03-your-dev-key
   NEXTAUTH_URL=http://localhost:3000
   # ... etc
   ```

2. **Git Ignore Setup**
   ```bash
   # Ensure .env.local is in .gitignore
   echo ".env.local" >> .gitignore
   ```

### Docker Deployment

```dockerfile
# In Dockerfile
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
# ... other variables
```

## 🔒 Security Best Practices

### Secret Management

1. **Use a Password Manager**
   ```bash
   # Store all secrets in 1Password, Bitwarden, etc.
   # Never store in plain text files
   ```

2. **Environment Separation**
   ```bash
   # Different keys for different environments
   ANTHROPIC_API_KEY_DEV=sk-ant-api03-dev-key
   ANTHROPIC_API_KEY_PROD=sk-ant-api03-prod-key
   ```

3. **Regular Rotation**
   ```bash
   # Rotate secrets every 3-6 months
   # Generate new NEXTAUTH_SECRET: openssl rand -base64 32
   # Generate new WEBHOOK_AUTH_TOKEN: openssl rand -base64 32
   ```

4. **Access Control**
   ```bash
   # Limit who has access to production secrets
   # Use role-based access in team settings
   ```

### Validation Script

```bash
#!/bin/bash
# validate-env.sh - Check required environment variables

required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "ANTHROPIC_API_KEY"
  "NEXTAUTH_URL"
  "NEXTAUTH_SECRET"
)

echo "Validating environment variables..."

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required variable: $var"
    exit 1
  else
    echo "✅ $var is set"
  fi
done

echo "✅ All required environment variables are set!"
```

## 🧪 Testing Environment Setup

### Health Check Script

```bash
#!/bin/bash
# test-env.sh - Test environment variable configuration

echo "Testing environment configuration..."

# Test Supabase connection
curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Supabase connection successful"
else
  echo "❌ Supabase connection failed"
fi

# Test Claude API
curl -s -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-sonnet-20240229", "max_tokens": 1, "messages": [{"role": "user", "content": "Hi"}]}' \
  https://api.anthropic.com/v1/messages > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Claude API connection successful"
else
  echo "❌ Claude API connection failed"
fi

# Test webhook endpoints (if configured)
if [ -n "$WEBHOOK_TASK" ] && [ "$WEBHOOKS_ENABLED" = "true" ]; then
  curl -s -X POST "$WEBHOOK_TASK" \
    -H "Authorization: Bearer $WEBHOOK_AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"test": true}' > /dev/null
  if [ $? -eq 0 ]; then
    echo "✅ Webhook endpoint accessible"
  else
    echo "❌ Webhook endpoint failed"
  fi
fi

echo "Environment test complete!"
```

## 🎯 Quick Setup Templates

### Minimal Setup (Core Features Only)
```bash
# Required for basic functionality
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
ANTHROPIC_API_KEY=sk-ant-api03-your-key
NEXTAUTH_URL=https://your-domain.com/minddump
NEXTAUTH_SECRET=$(openssl rand -base64 32)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Full Setup (All Features)
```bash
# Core
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
ANTHROPIC_API_KEY=sk-ant-api03-your-key
NEXTAUTH_URL=https://your-domain.com/minddump
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Authentication
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token

# Google Sheets
GOOGLE_SHEETS_CLIENT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_MASTER_ID=your_sheet_id

# Webhooks
WEBHOOKS_ENABLED=true
WEBHOOK_AUTH_TOKEN=$(openssl rand -base64 32)
WEBHOOK_PROJECTIDEA=https://your-automation.com/webhook/project
WEBHOOK_TASK=https://your-automation.com/webhook/task
# ... other webhook URLs
```

### Development Setup
```bash
# Development-specific settings
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXTAUTH_URL=http://localhost:3000
WEBHOOKS_ENABLED=false
VERCEL_FUNCTION_TIMEOUT=60s
NEXT_TELEMETRY_DISABLED=1
```

## 🆘 Troubleshooting

### Common Issues

**Environment variables not loading:**
```bash
# Check if .env.local exists and has correct format
ls -la .env.local
cat .env.local

# Verify no trailing spaces or quotes
# Variables should be: KEY=value (no quotes unless value contains spaces)
```

**Vercel deployment issues:**
```bash
# Check environment variables in Vercel dashboard
# Ensure they're set for correct environment (Production/Preview)
# Redeploy after adding new variables
```

**Local development not working:**
```bash
# Pull latest environment variables from Vercel
vercel env pull .env.local

# Restart development server
npm run dev
```

### Getting Help

- **Environment validation**: Use the validation script above
- **Health check**: Run the test script to verify connections
- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup
- **Support**: Create GitHub issue with environment setup questions

---

**Ready to configure your environment? Start with the minimal setup and expand as needed!** 🚀

*For deployment help, see [DEPLOYMENT.md](./DEPLOYMENT.md)*