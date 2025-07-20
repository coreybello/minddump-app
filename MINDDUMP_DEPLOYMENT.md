# 🚀 MindDump Deployment Guide

> **Complete deployment instructions for MindDump AI Thought Organizer**

This guide covers deploying MindDump as a standalone application to various platforms, with focus on production-ready configurations.

## 🎯 Deployment Overview

MindDump can be deployed to multiple platforms:
- **Vercel** (Recommended) - Seamless Next.js deployment
- **Netlify** - JAMstack deployment
- **Docker** - Containerized deployment
- **AWS/GCP/Azure** - Cloud provider deployment

## 🚀 Quick Deploy to Vercel (Recommended)

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/coreybello/crizzelwebsite&project-name=minddump-app&repository-name=minddump-app&root-directory=apps/minddumpapp)

### Manual Vercel Deployment

1. **Prepare Repository**
```bash
# Clone the repository
git clone https://github.com/coreybello/crizzelwebsite.git
cd crizzelwebsite

# Navigate to MindDump app
cd apps/minddumpapp
```

2. **Install Vercel CLI**
```bash
npm install -g vercel
vercel login
```

3. **Configure Deployment**
```bash
# Initialize Vercel project
vercel

# Follow prompts:
# Project name: minddump-app
# Framework: Next.js
# Root directory: apps/minddumpapp
# Build command: npm run build
# Output directory: .next
```

4. **Set Environment Variables**
```bash
# Set via Vercel CLI
vercel env add ANTHROPIC_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GOOGLE_SHEETS_API_KEY
vercel env add GOOGLE_SHEETS_ID
vercel env add WEBHOOK_SECRET

# Or via Vercel Dashboard:
# https://vercel.com/dashboard → Project → Settings → Environment Variables
```

5. **Deploy**
```bash
# Deploy to production
vercel --prod

# Your app will be available at:
# https://minddump-app.vercel.app
```

## 🔧 Environment Configuration

### Required Environment Variables
```env
# AI Configuration
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Sheets Integration
GOOGLE_SHEETS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_SHEETS_ID=1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Webhook Security
WEBHOOK_SECRET=your-secure-webhook-secret-key

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX
```

### Optional Environment Variables
```env
# Custom Webhook Base URL
NEXT_PUBLIC_WEBHOOK_BASE_URL=https://your-domain.com/webhooks

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60

# Session Configuration
SESSION_TIMEOUT_MINUTES=30

# Development Mode
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

## 📊 Google Sheets Setup

### 1. Create Google Sheets API Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create new project or select existing

2. **Enable Google Sheets API**
   ```bash
   # Navigate to APIs & Services → Library
   # Search for "Google Sheets API"
   # Click "Enable"
   ```

3. **Create API Key**
   ```bash
   # APIs & Services → Credentials
   # Click "Create Credentials" → API Key
   # Copy the generated API key
   ```

4. **Restrict API Key (Security)**
   ```bash
   # Click on API key → Restrictions
   # API restrictions → Restrict key
   # Select "Google Sheets API"
   # Application restrictions → HTTP referrers
   # Add your domain: https://your-app-domain.com/*
   ```

### 2. Create MindDump Google Sheet

1. **Create New Sheet**
   ```bash
   # Go to: https://sheets.google.com/
   # Click "Create" → "Blank spreadsheet"
   # Name it: "MindDump Thoughts"
   ```

2. **Setup Column Headers**
   ```
   A1: Timestamp
   B1: Raw Input
   C1: Category
   D1: Subcategory
   E1: Priority
   F1: Expanded Text
   G1: User ID
   H1: Session ID
   ```

3. **Make Sheet Public (Read-Only)**
   ```bash
   # Click "Share" button
   # Change to "Anyone with the link"
   # Set permission to "Viewer"
   # Copy the sheet ID from URL
   ```

4. **Configure Sheet ID**
   ```bash
   # From URL: https://docs.google.com/spreadsheets/d/SHEET_ID/edit
   # Copy the SHEET_ID part
   # Add to environment variables
   ```

## 🔑 Supabase Configuration

### 1. Create Supabase Project

1. **Sign up at Supabase**
   - Visit: https://supabase.com/
   - Create new organization and project

2. **Get Project Credentials**
   ```bash
   # Project Settings → API
   # Copy "Project URL" and "anon/public key"
   ```

### 2. Configure Authentication

1. **Enable GitHub OAuth**
   ```sql
   -- In Supabase SQL Editor
   -- GitHub OAuth is enabled by default
   -- Configure in Authentication → Providers → GitHub
   ```

2. **Set OAuth Redirect URLs**
   ```bash
   # Authentication → URL Configuration
   # Site URL: https://your-app-domain.com
   # Redirect URLs: https://your-app-domain.com/auth/callback
   ```

3. **Create User Profile Table**
   ```sql
   -- Run in Supabase SQL Editor
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
     email TEXT,
     full_name TEXT,
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable RLS
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- Policy for users to read their own profile
   CREATE POLICY "Users can read own profile" ON profiles
     FOR SELECT USING (auth.uid() = id);

   -- Policy for users to update their own profile
   CREATE POLICY "Users can update own profile" ON profiles
     FOR UPDATE USING (auth.uid() = id);
   ```

## 🔗 Webhook Configuration

### 1. Default Development Webhooks
```typescript
// Use webhook.site for testing
const testWebhooks = {
  Goal: "https://webhook.site/your-unique-id-goal",
  Habit: "https://webhook.site/your-unique-id-habit",
  ProjectIdea: "https://webhook.site/your-unique-id-project",
  // ... etc for all 15 categories
}
```

### 2. Production Webhook Setup

#### n8n Integration
```bash
# Install n8n
npm install -g n8n

# Start n8n
n8n start

# Create workflow:
# 1. Webhook trigger node
# 2. Category-based routing
# 3. Action nodes (email, Slack, etc.)
```

#### Zapier Integration
```bash
# Create Zap:
# 1. Trigger: Webhook by Zapier
# 2. Filter: Category equals "Goal"
# 3. Action: Create Trello card, Send email, etc.
```

#### Custom Webhook Endpoints
```typescript
// Example Express.js webhook receiver
app.post('/webhook/minddump/:category', (req, res) => {
  const { category } = req.params;
  const { input, priority, timestamp } = req.body;
  
  // Verify webhook signature
  const signature = req.headers['x-webhook-signature'];
  if (!verifySignature(signature, req.body)) {
    return res.status(401).send('Unauthorized');
  }
  
  // Process based on category
  switch (category) {
    case 'Goal':
      await createTodoistTask(input, priority);
      break;
    case 'Habit':
      await addToHabitTracker(input);
      break;
    // ... handle other categories
  }
  
  res.status(200).send('OK');
});
```

## 🐳 Docker Deployment

### 1. Create Dockerfile
```dockerfile
# Create apps/minddumpapp/Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 2. Docker Compose for Development
```yaml
# docker-compose.yml
version: '3.8'
services:
  minddump:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - GOOGLE_SHEETS_API_KEY=${GOOGLE_SHEETS_API_KEY}
      - GOOGLE_SHEETS_ID=${GOOGLE_SHEETS_ID}
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
    volumes:
      - .env.local:/app/.env.local:ro
```

### 3. Deploy with Docker
```bash
# Build image
docker build -t minddump-app .

# Run container
docker run -p 3000:3000 --env-file .env.local minddump-app

# Or use docker-compose
docker-compose up -d
```

## ☁️ Cloud Provider Deployment

### AWS Deployment

#### Using AWS Amplify
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Configure hosting
amplify add hosting

# Deploy
amplify publish
```

#### Using AWS App Runner
```bash
# Create apprunner.yaml
version: 1.0
runtime: nodejs18
build:
  commands:
    build:
      - npm install
      - npm run build
run:
  runtime-version: 18
  command: npm start
  network:
    port: 3000
    env: PORT
  env:
    - name: NODE_ENV
      value: production
```

### GCP Deployment

#### Using Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/minddump-app
gcloud run deploy --image gcr.io/PROJECT_ID/minddump-app --platform managed
```

### Azure Deployment

#### Using Azure Static Web Apps
```bash
# Install Azure CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy --app-location="apps/minddumpapp" --output-location=".next"
```

## 🔒 Security Configuration

### 1. HTTPS Setup
```bash
# Vercel automatically provides HTTPS
# For custom domains, configure SSL certificate

# Manual SSL with Let's Encrypt
certbot --nginx -d your-domain.com
```

### 2. Security Headers
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 3. API Rate Limiting
```typescript
// lib/rateLimit.ts
import { LRUCache } from 'lru-cache';

const rateLimit = new LRUCache({
  max: 500,
  ttl: 60 * 1000, // 1 minute
});

export function checkRateLimit(ip: string): boolean {
  const tokenCount = rateLimit.get(ip) || 0;
  if (tokenCount >= 10) {
    return false; // Rate limited
  }
  rateLimit.set(ip, tokenCount + 1);
  return true;
}
```

## 📊 Monitoring & Analytics

### 1. Application Monitoring
```bash
# Vercel Analytics (automatic)
# Add to package.json:
"dependencies": {
  "@vercel/analytics": "^1.0.0"
}

# Add to app/layout.tsx:
import { Analytics } from '@vercel/analytics/react';
```

### 2. Error Tracking
```bash
# Sentry setup
npm install @sentry/nextjs

# sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### 3. Performance Monitoring
```typescript
// lib/performance.ts
export function trackPerformance(metric: string, value: number) {
  // Send to analytics service
  if (typeof window !== 'undefined') {
    gtag('event', metric, {
      value: value,
      custom_parameter: true,
    });
  }
}
```

## 🚀 CI/CD Pipeline

### GitHub Actions Deployment
```yaml
# .github/workflows/deploy-minddump.yml
name: Deploy MindDump

on:
  push:
    branches: [main]
    paths: ['apps/minddumpapp/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd apps/minddumpapp
          npm ci
      
      - name: Run tests
        run: |
          cd apps/minddumpapp
          npm test
      
      - name: Build application
        run: |
          cd apps/minddumpapp
          npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./apps/minddumpapp
```

## 🔧 Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
npm install

# Check Node.js version
node --version # Should be 18+
```

#### Environment Variable Issues
```bash
# Verify environment variables are set
printenv | grep -E "(ANTHROPIC|SUPABASE|GOOGLE)"

# Test API connections
curl -H "Authorization: Bearer $ANTHROPIC_API_KEY" \
  https://api.anthropic.com/v1/messages
```

#### Google Sheets Permission Errors
```bash
# Check sheet permissions
# 1. Ensure sheet is publicly readable
# 2. Verify API key restrictions
# 3. Check API quota limits
```

#### Webhook Delivery Failures
```bash
# Test webhook endpoints
curl -X POST https://your-webhook-url.com/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check webhook logs in deployment platform
```

### Performance Optimization

#### Bundle Size Optimization
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  bundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true',
  },
};
```

#### Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="MindDump Logo"
  width={200}
  height={100}
  priority // For above-the-fold images
/>
```

## 📋 Post-Deployment Checklist

### ✅ Verification Steps

- [ ] **Application loads** at deployment URL
- [ ] **Authentication works** with GitHub OAuth
- [ ] **Voice input functions** in different browsers
- [ ] **AI categorization** returns appropriate categories
- [ ] **Google Sheets logging** creates new rows
- [ ] **Webhook delivery** reaches configured endpoints
- [ ] **Mobile responsiveness** works on various devices
- [ ] **Error handling** displays appropriate messages
- [ ] **Performance metrics** meet acceptable thresholds
- [ ] **Security headers** are properly configured

### 🔧 Configuration Verification

- [ ] **Environment variables** are set correctly
- [ ] **API keys** have appropriate permissions
- [ ] **Webhook URLs** are reachable and responding
- [ ] **Rate limiting** is functioning properly
- [ ] **Error tracking** is capturing issues
- [ ] **Analytics** are collecting data
- [ ] **Backup procedures** are in place
- [ ] **Monitoring alerts** are configured

### 📊 Production Monitoring

- [ ] **Set up uptime monitoring** (e.g., UptimeRobot)
- [ ] **Configure performance alerts** for slow responses
- [ ] **Monitor API quota usage** for third-party services
- [ ] **Track user engagement** metrics
- [ ] **Monitor error rates** and response times
- [ ] **Set up automated backups** for critical data
- [ ] **Document incident response** procedures

---

**🎉 Congratulations! MindDump is now deployed and ready to transform thoughts into organized insights.**

*For support, visit the [GitHub repository](https://github.com/coreybello/crizzelwebsite) or contact the development team.*