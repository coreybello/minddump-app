# 🛠️ MindDump Troubleshooting Guide

## Quick Diagnostic Checklist

Before diving into specific issues, run through this quick checklist:

- [ ] **Service Status**: Visit `/api/health` endpoint to check all services
- [ ] **Environment Variables**: Verify all required env vars are set
- [ ] **Network Connectivity**: Ensure stable internet connection
- [ ] **Browser Compatibility**: Use Chrome/Edge for best compatibility
- [ ] **HTTPS**: Confirm you're using HTTPS (required for voice input)

## 🚨 Common Issues & Solutions

### 1. Authentication Problems

#### Issue: "Authentication failed" or unable to sign in

**Symptoms:**
- GitHub OAuth redirect fails
- "Invalid credentials" error
- Stuck on login page

**Solutions:**

1. **Check GitHub OAuth Configuration**
   ```bash
   # Verify these match exactly in GitHub OAuth app:
   Homepage URL: https://your-domain.com/minddump
   Callback URL: https://your-domain.com/minddump/auth/callback
   ```

2. **Verify Environment Variables**
   ```bash
   # Required auth variables
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   NEXTAUTH_URL=https://your-domain.com/minddump
   NEXTAUTH_SECRET=your_32_char_secret
   ```

3. **Supabase Auth Settings**
   - Go to Supabase → Authentication → URL Configuration
   - Site URL: `https://your-domain.com/minddump`
   - Redirect URLs: `https://your-domain.com/minddump/auth/callback`

4. **Clear Browser Data**
   ```bash
   # Clear cookies and localStorage for your domain
   # Browser DevTools → Application → Storage → Clear
   ```

**Test Fix:**
```bash
# Test OAuth flow
curl -I https://your-domain.com/minddump/auth/signin

# Should redirect to GitHub OAuth
```

---

### 2. AI Processing Issues

#### Issue: "Failed to analyze thought" or Claude API errors

**Symptoms:**
- Thoughts not being categorized
- API timeout errors
- 503 Service Unavailable

**Solutions:**

1. **Verify Claude API Key**
   ```bash
   # Test API key validity
   curl -X POST https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "content-type: application/json" \
     -d '{"model": "claude-3-sonnet-20240229", "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}]}'
   ```

2. **Check API Quota/Billing**
   - Visit [Anthropic Console](https://console.anthropic.com)
   - Verify billing is set up
   - Check usage limits

3. **Verify Environment Variable**
   ```bash
   # In Vercel dashboard or locally
   echo $ANTHROPIC_API_KEY
   # Should start with 'sk-ant-api...'
   ```

4. **Alternative: Use Subscription Mode**
   ```bash
   # Enable Claude subscription mode
   CLAUDE_SUBSCRIPTION_MODE=true
   ```

**Test Fix:**
```bash
# Test with simple thought
curl -X POST https://your-domain.com/minddump/api/thoughts \
  -H "Content-Type: application/json" \
  -d '{"text": "Test thought"}'
```

---

### 3. Voice Input Not Working

#### Issue: Microphone not working or voice recognition fails

**Symptoms:**
- Microphone button disabled
- "Permission denied" error
- Voice not being transcribed

**Solutions:**

1. **Check Browser Permissions**
   - Click lock icon in address bar
   - Ensure microphone is allowed
   - Refresh page after granting permission

2. **HTTPS Requirement**
   ```bash
   # Voice input requires HTTPS
   # Verify your site uses HTTPS, not HTTP
   https://your-domain.com/minddump  # ✅ Correct
   http://your-domain.com/minddump   # ❌ Won't work
   ```

3. **Browser Compatibility**
   - **Recommended**: Chrome, Edge, Safari
   - **Not supported**: Firefox (limited support)
   - **Mobile**: iOS Safari, Chrome Android

4. **Test Microphone Access**
   ```javascript
   // Browser console test
   navigator.mediaDevices.getUserMedia({ audio: true })
     .then(stream => console.log('Microphone access granted'))
     .catch(error => console.error('Microphone error:', error));
   ```

5. **Check System Microphone**
   - Test microphone in other applications
   - Verify microphone is not muted/disabled
   - Try different microphone if available

**Test Fix:**
- Click microphone button
- Should see red recording indicator
- Speak and verify transcription appears

---

### 4. Google Sheets Integration Failing

#### Issue: Thoughts not logging to master spreadsheet

**Symptoms:**
- "Google Sheets permission error"
- Master sheet not updating
- Integration status showing failure

**Solutions:**

1. **Verify Service Account Setup**
   ```bash
   # Check environment variables
   GOOGLE_SHEETS_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   GOOGLE_SHEETS_MASTER_ID=your_spreadsheet_id
   ```

2. **Check Sheet Permissions**
   - Share spreadsheet with service account email
   - Grant "Editor" access
   - Verify spreadsheet ID is correct

3. **Validate Private Key Format**
   ```bash
   # Private key should include \n characters
   # Correct format:
   "-----BEGIN PRIVATE KEY-----\nMIIE...rest_of_key...\n-----END PRIVATE KEY-----\n"
   ```

4. **Test Google Sheets API**
   ```python
   # Python test script
   from google.oauth2 import service_account
   from googleapiclient.discovery import build
   
   credentials = service_account.Credentials.from_service_account_file(
       'path/to/service-account.json'
   )
   service = build('sheets', 'v4', credentials=credentials)
   
   # Test read access
   result = service.spreadsheets().get(
       spreadsheetId='your_sheet_id'
   ).execute()
   print('Sheet accessible:', result['properties']['title'])
   ```

5. **Enable Google Sheets API**
   - Go to Google Cloud Console
   - APIs & Services → Library
   - Search "Google Sheets API" → Enable

**Test Fix:**
```bash
# Submit test thought and check sheet
curl -X POST https://your-domain.com/minddump/api/thoughts \
  -H "Content-Type: application/json" \
  -d '{"text": "Test Google Sheets integration"}'

# Check master spreadsheet for new entry
```

---

### 5. Webhook Integration Issues

#### Issue: Webhooks not being sent or received

**Symptoms:**
- External automations not triggering
- Webhook status showing failures
- No requests received at webhook endpoints

**Solutions:**

1. **Verify Webhook Configuration**
   ```bash
   # Check webhook settings
   WEBHOOKS_ENABLED=true
   WEBHOOK_AUTH_TOKEN=your_secure_token
   WEBHOOK_PROJECTIDEA=https://your-endpoint.com/project
   ```

2. **Test with webhook.site**
   ```bash
   # Use webhook.site for testing
   WEBHOOK_TASK=https://webhook.site/your-unique-id
   
   # Submit test thought
   curl -X POST https://your-domain.com/minddump/api/thoughts \
     -H "Content-Type: application/json" \
     -d '{"text": "Buy groceries tomorrow", "category": "Task"}'
   
   # Check webhook.site for received request
   ```

3. **Verify Endpoint Accessibility**
   ```bash
   # Test your webhook endpoint
   curl -X POST https://your-webhook-endpoint.com/test \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_webhook_auth_token" \
     -d '{"test": "payload"}'
   ```

4. **Check Webhook Logs**
   ```bash
   # Check MindDump logs for webhook errors
   # In Vercel: Functions → View logs
   # Look for webhook processing errors
   ```

**Test Fix:**
- Use webhook.site for testing
- Verify webhook URL is publicly accessible
- Check authentication token matches

---

### 6. Database Connection Issues

#### Issue: Supabase connection errors

**Symptoms:**
- "Database connection failed"
- 500 Internal Server Error
- Data not saving

**Solutions:**

1. **Verify Supabase Credentials**
   ```bash
   # Check environment variables
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

2. **Test Database Connection**
   ```javascript
   // Test connection
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   )
   
   // Test query
   const { data, error } = await supabase.from('thoughts').select('count')
   console.log('Connection test:', error ? 'Failed' : 'Success')
   ```

3. **Check Row Level Security (RLS)**
   ```sql
   -- In Supabase SQL Editor
   -- Verify RLS policies exist
   SELECT * FROM pg_policies WHERE tablename = 'thoughts';
   
   -- Disable RLS temporarily for testing
   ALTER TABLE thoughts DISABLE ROW LEVEL SECURITY;
   ```

4. **Verify Database Schema**
   ```sql
   -- Check if tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

**Test Fix:**
```bash
# Test with simple database operation
curl -X GET https://your-domain.com/minddump/api/health
# Should show "database": "connected"
```

---

### 7. Performance Issues

#### Issue: Slow response times or timeouts

**Symptoms:**
- Long loading times
- Request timeouts
- UI becomes unresponsive

**Solutions:**

1. **Check API Response Times**
   ```bash
   # Test API performance
   curl -w "@curl-format.txt" -X POST https://your-domain.com/minddump/api/thoughts \
     -H "Content-Type: application/json" \
     -d '{"text": "Performance test"}'
   ```

2. **Monitor External Service Status**
   - Claude API status
   - Supabase status
   - Google Sheets API status
   - Your webhook endpoints

3. **Optimize Environment Variables**
   ```bash
   # Increase timeouts if needed
   VERCEL_FUNCTION_TIMEOUT=30s
   WEBHOOK_TIMEOUT_MS=10000
   ```

4. **Check Rate Limiting**
   ```bash
   # Verify you're not hitting rate limits
   # Look for 429 status codes in logs
   ```

**Test Fix:**
- Monitor response times
- Check service status pages
- Optimize timeout settings

---

## 🔍 Debugging Tools

### Browser Developer Tools

1. **Console Tab**
   ```javascript
   // Check for JavaScript errors
   // Monitor network requests
   // View API responses
   ```

2. **Network Tab**
   - Monitor API request/response times
   - Check for failed requests
   - Verify request headers and payloads

3. **Application Tab**
   - Check localStorage for cached data
   - Verify authentication tokens
   - Clear site data if needed

### API Testing

```bash
# Test health endpoint
curl https://your-domain.com/minddump/api/health

# Test thoughts API
curl -X POST https://your-domain.com/minddump/api/thoughts \
  -H "Content-Type: application/json" \
  -d '{"text": "Debug test thought"}'

# Test webhook endpoint
curl -X POST https://your-domain.com/minddump/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"category": "Task", "test_payload": {"test": true}}'
```

### Log Analysis

**Vercel Logs:**
1. Go to Vercel Dashboard
2. Select your project
3. Functions tab → View logs
4. Look for error messages and stack traces

**Supabase Logs:**
1. Go to Supabase Dashboard
2. Logs & Analytics
3. Filter by severity and time range

## 🚨 Emergency Recovery

### If Everything Is Broken

1. **Check Service Status**
   ```bash
   # Test basic connectivity
   curl -I https://your-domain.com/minddump
   
   # Check API health
   curl https://your-domain.com/minddump/api/health
   ```

2. **Verify Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Ensure all required variables are set
   - Redeploy if variables were added/changed

3. **Test with Minimal Configuration**
   ```bash
   # Disable optional features temporarily
   WEBHOOKS_ENABLED=false
   CLAUDE_SUBSCRIPTION_MODE=true
   
   # Test with basic thought processing
   ```

4. **Rollback to Working Version**
   - In Vercel Dashboard → Deployments
   - Find last working deployment
   - Click "..." → Promote to Production

### Contact Support

If issues persist:

1. **Gather Information**
   - Error messages and stack traces
   - Environment variable configuration (without secrets)
   - Steps to reproduce the issue
   - Browser/device information

2. **Create GitHub Issue**
   - Go to repository issues page
   - Use issue template
   - Include diagnostic information

3. **Check Documentation**
   - [Deployment Guide](./DEPLOYMENT.md)
   - [API Documentation](./API_DOCUMENTATION.md)
   - [User Guide](./USER_GUIDE.md)

## 📊 Health Monitoring

### Regular Health Checks

```bash
# Daily health check script
#!/bin/bash

echo "Testing MindDump health..."

# Test API health
health=$(curl -s https://your-domain.com/minddump/api/health)
echo "API Health: $health"

# Test thought processing
thought_test=$(curl -s -X POST https://your-domain.com/minddump/api/thoughts \
  -H "Content-Type: application/json" \
  -d '{"text": "Health check test"}')
echo "Thought Processing: $thought_test"

# Test webhook connectivity
webhook_test=$(curl -s -X POST https://your-domain.com/minddump/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"category": "Task", "test_payload": {}}')
echo "Webhook Test: $webhook_test"
```

### Set Up Monitoring Alerts

1. **Uptime Monitoring**: Use services like UptimeRobot
2. **Error Tracking**: Integrate Sentry or similar
3. **Performance Monitoring**: Use Vercel Analytics
4. **Custom Alerts**: Set up Slack/email notifications

---

**Still having issues? Don't hesitate to create a GitHub issue with detailed information!** 🆘

*For setup help, see [DEPLOYMENT.md](./DEPLOYMENT.md)*