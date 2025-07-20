# 🚀 MindDump App - Deployment Guide

## Overview

MindDump is an AI-powered thought organizer that uses a 15-category system to route thoughts to external automation workflows. This guide covers complete deployment setup.

## 📋 Prerequisites

- **Vercel Account** (recommended hosting)
- **Supabase Account** (authentication & database)
- **Anthropic API Key** (Claude AI processing)
- **Google Cloud Account** (Sheets API for logging)
- **GitHub Account** (OAuth authentication)
- **Domain** (optional, for custom URL)

## 🛠️ Environment Variables

Create `.env.local` in `apps/minddumpapp/` with these variables:

### Required - Core Functionality
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic Claude AI
ANTHROPIC_API_KEY=your_anthropic_api_key

# Application URLs
NEXTAUTH_URL=https://your-domain.com/minddump
NEXTAUTH_SECRET=your_32_character_secret
```

### Required - Authentication
```bash
# GitHub OAuth (for user authentication)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_pat
```

### Required - Google Sheets Integration
```bash
# Google Sheets API (for centralized logging)
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_MASTER_ID=your_master_spreadsheet_id
```

### Optional - Webhook Integration
```bash
# Webhook Configuration (for external automation)
WEBHOOKS_ENABLED=true
WEBHOOK_AUTH_TOKEN=your_webhook_auth_token

# Category-specific webhook URLs (use webhook.site for testing)
WEBHOOK_GOAL=https://webhook.site/placeholder-goal
WEBHOOK_HABIT=https://webhook.site/placeholder-habit
WEBHOOK_PROJECTIDEA=https://webhook.site/placeholder-project
WEBHOOK_TASK=https://webhook.site/placeholder-task
WEBHOOK_REMINDER=https://webhook.site/placeholder-reminder
WEBHOOK_NOTE=https://webhook.site/placeholder-note
WEBHOOK_INSIGHT=https://webhook.site/placeholder-insight
WEBHOOK_LEARNING=https://webhook.site/placeholder-learning
WEBHOOK_CAREER=https://webhook.site/placeholder-career
WEBHOOK_METRIC=https://webhook.site/placeholder-metric
WEBHOOK_IDEA=https://webhook.site/placeholder-idea
WEBHOOK_SYSTEM=https://webhook.site/placeholder-system
WEBHOOK_AUTOMATION=https://webhook.site/placeholder-automation
WEBHOOK_PERSON=https://webhook.site/placeholder-person
WEBHOOK_SENSITIVE=https://webhook.site/placeholder-sensitive
```

## 🏗️ Step-by-Step Deployment

### 1. Supabase Setup (5 minutes)

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project: `minddump-production`
   - Note the project URL and API keys

2. **Setup Database**
   ```sql
   -- Run in Supabase SQL Editor
   -- Copy content from apps/minddumpapp/supabase/schema.sql
   ```

3. **Configure Authentication**
   - Go to Authentication → Providers
   - Enable GitHub provider
   - Add your GitHub OAuth app credentials
   - Set Site URL: `https://your-domain.com/minddump`
   - Add Redirect URL: `https://your-domain.com/minddump/auth/callback`

### 2. Google Sheets Setup (10 minutes)

1. **Create Google Cloud Project**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create new project: `minddump-sheets`

2. **Enable Sheets API**
   - Go to APIs & Services → Library
   - Search "Google Sheets API" → Enable

3. **Create Service Account**
   - Go to APIs & Services → Credentials
   - Create Service Account: `minddump-sheets-service`
   - Generate JSON key → Download file

4. **Create Master Spreadsheet**
   - Create new Google Sheet: "MindDump Master Log"
   - Share with service account email (Editor access)
   - Copy spreadsheet ID from URL
   - Add to `GOOGLE_SHEETS_MASTER_ID` environment variable

5. **Extract Credentials**
   ```bash
   # From downloaded JSON file:
   GOOGLE_SHEETS_CLIENT_EMAIL = client_email field
   GOOGLE_SHEETS_PRIVATE_KEY = private_key field (keep \n characters)
   ```

### 3. GitHub OAuth Setup (5 minutes)

1. **Create OAuth App**
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - New OAuth App:
     - Application name: `MindDump App`
     - Homepage URL: `https://your-domain.com`
     - Authorization callback URL: `https://your-domain.com/minddump/auth/callback`

2. **Create Personal Access Token**
   - Go to Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` scope (for project creation)

### 4. Vercel Deployment (10 minutes)

1. **Deploy to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Set **Root Directory**: `apps/minddumpapp`
   - Add all environment variables from above

2. **Configure Custom Domain** (Optional)
   - Go to Project Settings → Domains
   - Add your domain: `your-domain.com`
   - Configure DNS records as instructed

3. **Setup Path Routing** (If using subdomain)
   ```json
   // vercel.json in repository root
   {
     "rewrites": [
       {
         "source": "/minddump/(.*)",
         "destination": "https://your-minddump-vercel-url/$1"
       }
     ]
   }
   ```

## 🧪 Testing Deployment

### 1. Basic Functionality Test
```bash
# Visit your deployed URL
https://your-domain.com/minddump

# Test authentication
- Click "Sign in with GitHub"
- Should redirect to GitHub OAuth
- Should return to dashboard after auth

# Test thought processing
- Enter text: "I want to build a mobile app"
- Should categorize as "ProjectIdea"
- Should create Google Sheet entry
- Should trigger webhook (if configured)
```

### 2. API Endpoint Test
```bash
# Test thoughts API
curl -X POST https://your-domain.com/minddump/api/thoughts \
  -H "Content-Type: application/json" \
  -d '{"text": "Test thought for deployment"}'

# Should return:
{
  "success": true,
  "thought": {...},
  "analysis": {...},
  "integrations": {...}
}
```

### 3. Integration Tests
- **Google Sheets**: Check if entries appear in master spreadsheet
- **Webhooks**: Monitor webhook.site URLs for incoming requests
- **Authentication**: Test GitHub OAuth flow
- **AI Processing**: Verify Claude categorization

## 🚨 Troubleshooting

### Common Issues

**1. Supabase Connection Error**
```
Error: Invalid API key or URL
```
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches project
- Ensure RLS policies are enabled

**2. Claude AI Not Working**
```
Error: Failed to analyze thought
```
- Verify `ANTHROPIC_API_KEY` is valid
- Check Claude API quota/billing
- Test with simple thought first

**3. Google Sheets Permission Error**
```
Error: Insufficient permissions
```
- Verify service account email has Editor access to spreadsheet
- Check `GOOGLE_SHEETS_PRIVATE_KEY` format (keep \n characters)
- Ensure Sheets API is enabled in Google Cloud

**4. GitHub OAuth Issues**
```
Error: OAuth callback mismatch
```
- Verify callback URL matches exactly: `https://domain.com/minddump/auth/callback`
- Check GitHub OAuth app configuration
- Ensure `NEXTAUTH_URL` matches deployment URL

**5. Webhook Failures**
```
Warning: Webhook processing failed
```
- Check webhook URLs are accessible
- Verify `WEBHOOKS_ENABLED=true`
- Test with webhook.site URLs first

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Use strong `NEXTAUTH_SECRET` (32+ random characters)
- [ ] Rotate API keys regularly
- [ ] Enable Supabase RLS policies
- [ ] Set up CORS properly
- [ ] Use HTTPS everywhere
- [ ] Monitor rate limiting
- [ ] Regular security audits

### Environment Variable Security

```bash
# Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
WEBHOOK_AUTH_TOKEN=$(openssl rand -base64 32)

# Verify no secrets in git history
git log --all --grep="ANTHROPIC_API_KEY"
```

## 📊 Performance Optimization

### Recommended Settings

```bash
# Vercel deployment optimization
VERCEL_FUNCTION_TIMEOUT=30s
VERCEL_ANALYTICS_ENABLED=true

# App performance settings
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
```

### Monitoring

- Monitor Vercel Analytics for performance
- Track Claude API usage and costs
- Monitor Google Sheets API quotas
- Set up error tracking (Sentry recommended)

## 🔄 Maintenance

### Regular Tasks

1. **Weekly**: Check error logs and performance
2. **Monthly**: Rotate webhook auth tokens
3. **Quarterly**: Review and rotate API keys
4. **As needed**: Update dependencies and security patches

### Backup Strategy

- Supabase: Automatic backups enabled
- Google Sheets: Export monthly snapshots
- Environment variables: Store securely (1Password/Vault)
- Code: Git repository with proper branching

## 📞 Support

- **Documentation**: Check `/apps/minddumpapp/README.md`
- **API Docs**: Visit `/minddump/api/docs` endpoint
- **Issues**: Create GitHub issue with deployment details
- **Community**: Join discussions for feature requests

---

**Ready to capture and route your thoughts intelligently!** 🧠✨