# 🔧 MindDump Troubleshooting Guide

> **Comprehensive troubleshooting guide for MindDump AI Thought Organizer**

This guide covers common issues, debugging techniques, and solutions for deployment, development, and integration problems.

## 🚨 Quick Issue Resolution

### Most Common Issues

| Issue | Quick Fix | Full Solution |
|-------|-----------|---------------|
| **Voice input not working** | Check browser permissions | [Voice Input Issues](#voice-input-issues) |
| **AI categorization failing** | Verify API key | [AI Service Issues](#ai-service-issues) |
| **Google Sheets not updating** | Check sheet permissions | [Google Sheets Issues](#google-sheets-issues) |
| **Webhooks not firing** | Test webhook URL | [Webhook Issues](#webhook-issues) |
| **Build failing** | Clear cache & reinstall | [Build Issues](#build-and-deployment-issues) |
| **Authentication errors** | Check Supabase config | [Authentication Issues](#authentication-issues) |

## 🎙️ Voice Input Issues

### Problem: Microphone Access Denied
**Symptoms**: Voice input button doesn't work, no microphone access

**Diagnostic Steps**:
```javascript
// Check browser permissions in console
navigator.permissions.query({name: 'microphone'}).then(function(result) {
  console.log('Microphone permission:', result.state);
});
```

**Solutions**:
1. **Browser Settings**:
   ```
   Chrome: Settings → Privacy & Security → Site Settings → Microphone
   Firefox: Settings → Privacy & Security → Permissions → Microphone
   Safari: Safari → Preferences → Websites → Microphone
   ```

2. **HTTPS Requirement**:
   ```
   ❌ http://localhost:3000  (won't work in production browsers)
   ✅ https://localhost:3000 (works)
   ✅ https://your-domain.com (works)
   ```

3. **Code Fix for Development**:
   ```javascript
   // Add to next.config.js for local HTTPS
   module.exports = {
     experimental: {
       https: true,
     },
   };
   ```

### Problem: Speech Recognition Not Available
**Symptoms**: "Speech recognition not supported" error

**Diagnostic Check**:
```javascript
// Check browser compatibility
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  console.log('Speech recognition supported');
} else {
  console.log('Speech recognition NOT supported');
}
```

**Solutions**:
1. **Browser Compatibility**:
   ```
   ✅ Chrome/Chromium: Full support
   ✅ Edge: Full support  
   ⚠️ Firefox: Limited support
   ⚠️ Safari: Partial support
   ❌ Internet Explorer: Not supported
   ```

2. **Fallback Implementation**:
   ```typescript
   // Implement fallback for unsupported browsers
   const useFallbackInput = !('webkitSpeechRecognition' in window);
   if (useFallbackInput) {
     // Show text input instead
     setInputMethod('text');
   }
   ```

### Problem: Poor Voice Recognition Accuracy
**Symptoms**: Transcription contains many errors

**Solutions**:
1. **Audio Quality**:
   - Use external microphone for better quality
   - Reduce background noise
   - Speak clearly and at normal pace

2. **Language Settings**:
   ```javascript
   recognition.lang = 'en-US'; // Set correct language
   recognition.continuous = false; // For better accuracy
   ```

3. **Post-Processing**:
   ```typescript
   // Add spell-check API integration
   const correctedText = await spellCheck(transcript);
   ```

## 🤖 AI Service Issues

### Problem: Anthropic API Key Invalid
**Symptoms**: "Authentication failed" or "Invalid API key" errors

**Diagnostic Steps**:
```bash
# Test API key directly
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     https://api.anthropic.com/v1/messages

# Check environment variable
echo $ANTHROPIC_API_KEY
```

**Solutions**:
1. **Verify API Key Format**:
   ```
   ✅ Correct: sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ❌ Wrong: api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **Environment Variable Setup**:
   ```bash
   # .env.local
   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
   
   # Verify in Next.js
   console.log('API Key loaded:', !!process.env.ANTHROPIC_API_KEY);
   ```

3. **API Key Permissions**:
   - Ensure key has message creation permissions
   - Check usage limits haven't been exceeded
   - Verify billing is active

### Problem: AI Categorization Inconsistent
**Symptoms**: Thoughts categorized incorrectly or inconsistently

**Diagnostic Logging**:
```typescript
// Add detailed logging to AI service
console.log('Input:', userInput);
console.log('AI Response:', aiResponse);
console.log('Extracted Category:', category);
console.log('Confidence Score:', confidence);
```

**Solutions**:
1. **Improve Prompt Engineering**:
   ```typescript
   const improvedPrompt = `
   Categorize this thought with high accuracy:
   
   Categories: ${categories.join(', ')}
   
   Consider:
   - Intent and context
   - Action vs. reflection
   - Time sensitivity
   
   Thought: "${input}"
   
   Respond with JSON: {"category": "...", "confidence": 0.95}
   `;
   ```

2. **Add Validation Logic**:
   ```typescript
   function validateCategory(category: string): boolean {
     const validCategories = [
       'Goal', 'Habit', 'ProjectIdea', 'Task', 'Reminder',
       'Note', 'Insight', 'Learning', 'Career', 'Metric',
       'Idea', 'System', 'Automation', 'Person', 'Sensitive'
     ];
     return validCategories.includes(category);
   }
   ```

### Problem: AI Response Timeout
**Symptoms**: Requests timeout after 30+ seconds

**Solutions**:
1. **Increase Timeout**:
   ```typescript
   const response = await fetch('/api/categorize', {
     method: 'POST',
     body: JSON.stringify(data),
     signal: AbortSignal.timeout(60000), // 60 second timeout
   });
   ```

2. **Implement Retry Logic**:
   ```typescript
   async function categorizeWithRetry(input: string, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await categorize(input);
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
       }
     }
   }
   ```

## 📊 Google Sheets Issues

### Problem: Sheets API Permission Denied
**Symptoms**: "403 Forbidden" or "Insufficient permissions" errors

**Diagnostic Steps**:
```bash
# Test API key
curl "https://sheets.googleapis.com/v4/spreadsheets/$GOOGLE_SHEETS_ID?key=$GOOGLE_SHEETS_API_KEY"
```

**Solutions**:
1. **API Key Configuration**:
   ```
   Google Cloud Console → APIs & Services → Credentials
   → Select API Key → API restrictions
   → Select "Google Sheets API"
   ```

2. **Sheet Permissions**:
   ```
   ✅ Share sheet with "Anyone with the link can view"
   ✅ Ensure sheet ID is correct
   ✅ Verify API key has Sheets API enabled
   ```

3. **Test Sheet Access**:
   ```javascript
   // Test in browser console
   fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`)
     .then(r => r.json())
     .then(console.log);
   ```

### Problem: Data Not Appearing in Sheet
**Symptoms**: API calls succeed but no data in spreadsheet

**Diagnostic Steps**:
```typescript
// Add logging to sheet writing function
console.log('Writing to sheet:', {
  sheetId: GOOGLE_SHEETS_ID,
  range: 'Sheet1!A:H',
  values: rowData
});
```

**Solutions**:
1. **Check Sheet Structure**:
   ```
   Required columns (A-H):
   A: Timestamp    E: Priority
   B: Raw Input    F: Expanded Text  
   C: Category     G: User ID
   D: Subcategory  H: Session ID
   ```

2. **Verify Range Notation**:
   ```javascript
   // Correct range formats
   'Sheet1!A:H'      // All rows, columns A-H
   'Sheet1!A1:H1000' // First 1000 rows
   'A:H'             // First sheet, all rows
   ```

3. **Append vs Update**:
   ```typescript
   // Use append for new rows
   const response = await fetch(
     `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append`,
     {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         valueInputOption: 'RAW',
         values: [rowData]
       })
     }
   );
   ```

### Problem: Rate Limit Exceeded
**Symptoms**: "429 Too Many Requests" errors

**Solutions**:
1. **Implement Rate Limiting**:
   ```typescript
   class SheetsRateLimiter {
     private queue: Array<() => Promise<any>> = [];
     private processing = false;
     
     async add<T>(operation: () => Promise<T>): Promise<T> {
       return new Promise((resolve, reject) => {
         this.queue.push(async () => {
           try {
             const result = await operation();
             resolve(result);
           } catch (error) {
             reject(error);
           }
         });
         this.process();
       });
     }
     
     private async process() {
       if (this.processing || this.queue.length === 0) return;
       this.processing = true;
       
       while (this.queue.length > 0) {
         const operation = this.queue.shift()!;
         await operation();
         await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
       }
       
       this.processing = false;
     }
   }
   ```

2. **Batch Operations**:
   ```typescript
   // Batch multiple writes
   const batchData = thoughts.map(thought => [
     thought.timestamp,
     thought.input,
     thought.category,
     // ... other fields
   ]);
   
   await sheets.values.append({
     spreadsheetId: sheetId,
     range: 'A:H',
     valueInputOption: 'RAW',
     resource: { values: batchData }
   });
   ```

## 🔗 Webhook Issues

### Problem: Webhooks Not Firing
**Symptoms**: No POST requests received at webhook URLs

**Diagnostic Steps**:
```typescript
// Add webhook debugging
console.log('Webhook config:', webhookConfig);
console.log('Sending to:', webhookUrl);
console.log('Payload:', payload);

// Test webhook manually
curl -X POST https://your-webhook-url.com/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Solutions**:
1. **Verify Webhook URLs**:
   ```typescript
   // Check URL format
   const isValidUrl = (url: string) => {
     try {
       new URL(url);
       return url.startsWith('http://') || url.startsWith('https://');
     } catch {
       return false;
     }
   };
   ```

2. **Check Network Connectivity**:
   ```bash
   # Test from deployment environment
   curl -I https://your-webhook-url.com
   
   # Check for DNS issues
   nslookup your-webhook-domain.com
   ```

3. **Implement Webhook Testing**:
   ```typescript
   async function testWebhook(url: string) {
     try {
       const response = await fetch(url, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
       });
       return {
         success: response.ok,
         status: response.status,
         statusText: response.statusText
       };
     } catch (error) {
       return { success: false, error: error.message };
     }
   }
   ```

### Problem: Webhook Signature Verification Failing
**Symptoms**: Webhook endpoints rejecting requests due to invalid signatures

**Solution**:
```typescript
// Correct signature generation
import crypto from 'crypto';

function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

// Receiving end verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

### Problem: Webhook Delivery Timeouts
**Symptoms**: Webhook requests timing out

**Solutions**:
1. **Increase Timeout**:
   ```typescript
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
   
   try {
     const response = await fetch(webhookUrl, {
       method: 'POST',
       signal: controller.signal,
       headers: headers,
       body: payload
     });
   } finally {
     clearTimeout(timeoutId);
   }
   ```

2. **Implement Retry Logic**:
   ```typescript
   async function deliverWebhookWithRetry(
     url: string,
     payload: object,
     maxRetries = 3
   ) {
     const delays = [1000, 2000, 4000]; // Exponential backoff
     
     for (let attempt = 0; attempt <= maxRetries; attempt++) {
       try {
         const response = await deliverWebhook(url, payload);
         if (response.ok) return response;
         
         if (attempt < maxRetries) {
           await new Promise(resolve => 
             setTimeout(resolve, delays[attempt] || 5000)
           );
         }
       } catch (error) {
         if (attempt === maxRetries) throw error;
       }
     }
   }
   ```

## 🔐 Authentication Issues

### Problem: Supabase Authentication Failing
**Symptoms**: "Invalid credentials" or redirect loops

**Diagnostic Steps**:
```javascript
// Check Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test connection
supabase.auth.getSession().then(console.log);
```

**Solutions**:
1. **Verify Environment Variables**:
   ```bash
   # Check if variables are loaded
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
   console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
   ```

2. **Check Supabase Configuration**:
   ```
   Supabase Dashboard → Authentication → Settings
   ✅ Site URL: https://your-domain.com
   ✅ Redirect URLs: https://your-domain.com/auth/callback
   ```

3. **OAuth Provider Setup**:
   ```
   Supabase Dashboard → Authentication → Providers → GitHub
   ✅ GitHub OAuth enabled
   ✅ Client ID and Secret configured
   ✅ Authorization callback URL: https://your-supabase-project.supabase.co/auth/v1/callback
   ```

### Problem: Session Not Persisting
**Symptoms**: Users logged out on page refresh

**Solutions**:
1. **Check Session Storage**:
   ```typescript
   // Verify session persistence
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Current session:', session);
   
   // Listen for auth changes
   supabase.auth.onAuthStateChange((event, session) => {
     console.log('Auth event:', event, session);
   });
   ```

2. **Middleware Configuration**:
   ```typescript
   // middleware.ts
   import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
   import { NextResponse } from 'next/server';
   
   export async function middleware(req) {
     const res = NextResponse.next();
     const supabase = createMiddlewareClient({ req, res });
     
     // Refresh session if needed
     await supabase.auth.getSession();
     
     return res;
   }
   ```

## 🏗️ Build and Deployment Issues

### Problem: Build Failing with Module Not Found
**Symptoms**: TypeScript or module resolution errors during build

**Diagnostic Steps**:
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear caches
rm -rf .next
rm -rf node_modules
rm -f package-lock.json

# Reinstall dependencies
npm install
```

**Solutions**:
1. **TypeScript Path Resolution**:
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"],
         "@/components/*": ["./src/components/*"],
         "@/lib/*": ["./src/lib/*"]
       }
     }
   }
   ```

2. **Next.js Configuration**:
   ```javascript
   // next.config.js
   module.exports = {
     experimental: {
       typedRoutes: true,
     },
     transpilePackages: ['@supabase/auth-helpers-nextjs'],
   };
   ```

### Problem: Environment Variables Not Available in Build
**Symptoms**: `process.env.VARIABLE` is undefined in production

**Solutions**:
1. **Prefix Client Variables**:
   ```bash
   # Must start with NEXT_PUBLIC_ for client-side access
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   
   # Server-side only (no prefix needed)
   ANTHROPIC_API_KEY=...
   WEBHOOK_SECRET=...
   ```

2. **Deployment Platform Setup**:
   ```bash
   # Vercel
   vercel env add ANTHROPIC_API_KEY
   
   # Netlify
   netlify env:set ANTHROPIC_API_KEY your_key_value
   ```

### Problem: Memory or Timeout Issues During Build
**Symptoms**: Build process killed or times out

**Solutions**:
1. **Increase Memory Limit**:
   ```json
   // package.json
   {
     "scripts": {
       "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
     }
   }
   ```

2. **Optimize Bundle**:
   ```javascript
   // next.config.js
   module.exports = {
     experimental: {
       optimizeCss: true,
     },
     compiler: {
       removeConsole: process.env.NODE_ENV === 'production',
     },
   };
   ```

## 🔍 Debugging Tools and Techniques

### Development Debugging
```typescript
// Add to _app.tsx for development
if (process.env.NODE_ENV === 'development') {
  // Enable detailed logging
  console.log('Environment variables:', {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasSheetsKey: !!process.env.GOOGLE_SHEETS_API_KEY,
  });
}
```

### Production Monitoring
```typescript
// Error boundary for production
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log to monitoring service
    console.error('MindDump Error:', error, errorInfo);
    
    // Send to error tracking service
    if (typeof window !== 'undefined') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message, stack: error.stack })
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### Browser Console Debugging
```javascript
// Add to browser console for debugging
window.mindDumpDebug = {
  testVoiceRecognition: () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.onresult = (event) => {
        console.log('Speech result:', event.results[0][0].transcript);
      };
      recognition.start();
    }
  },
  
  testApiConnection: async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      console.log('API Health:', data);
    } catch (error) {
      console.error('API Error:', error);
    }
  },
  
  testWebhook: async (category) => {
    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      const data = await response.json();
      console.log('Webhook Test Result:', data);
    } catch (error) {
      console.error('Webhook Test Error:', error);
    }
  }
};
```

## 📞 Getting Additional Help

### Error Reporting
When reporting issues, include:

1. **Environment Information**:
   ```bash
   # System info
   node --version
   npm --version
   
   # Browser info (for client issues)
   navigator.userAgent
   
   # Next.js version
   npx next --version
   ```

2. **Error Details**:
   - Full error message and stack trace
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

3. **Configuration Check**:
   ```typescript
   // Safe config dump (no secrets)
   const debugInfo = {
     hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
     hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
     hasGoogleSheetsKey: !!process.env.GOOGLE_SHEETS_API_KEY,
     nodeEnv: process.env.NODE_ENV,
     nextVersion: process.env.npm_package_version,
   };
   ```

### Support Channels
- **GitHub Issues**: [Repository Issues](https://github.com/coreybello/crizzelwebsite/issues)
- **Documentation**: [Full Documentation](./MINDDUMP_README.md)
- **Deployment Guide**: [Deployment Instructions](./MINDDUMP_DEPLOYMENT.md)
- **API Reference**: [API Documentation](./MINDDUMP_API_REFERENCE.md)

### Professional Support
For complex issues or custom implementations:
- **Consulting Services**: Available for advanced troubleshooting
- **Custom Development**: Tailored solutions for specific requirements
- **Priority Support**: Dedicated assistance for production issues

---

**🔧 Most issues can be resolved with these debugging techniques and solutions. For persistent problems, don't hesitate to reach out for support.**

*This troubleshooting guide is regularly updated based on community feedback and common issues.*