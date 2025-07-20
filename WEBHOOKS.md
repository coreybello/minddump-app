# 🔗 Webhook Integration Documentation - MindDump

## Overview

MindDump's webhook system provides powerful automation capabilities by routing categorized thoughts to external platforms like n8n, Zapier, Make.com, and custom endpoints. Each of the 15 thought categories can be configured with specific webhook URLs for targeted automation workflows.

## Webhook Architecture

### Core Components
- **Category-based routing** - Each thought category has its own webhook endpoint
- **Secure payload signing** - HMAC-SHA256 authentication for webhook security
- **Non-blocking processing** - Webhook failures don't interrupt the main workflow
- **Retry logic** - Exponential backoff for failed webhook deliveries
- **Rate limiting** - Built-in protection against abuse

### Security Features
- **HMAC signature validation** for payload authenticity
- **Timestamp validation** to prevent replay attacks
- **Request rate limiting** (20 webhooks/minute per category)
- **Input sanitization** for all payload data
- **Sensitive category protection** - never routed to external systems

## Webhook Configuration

### Environment Variables

```bash
# Webhook System Control
WEBHOOKS_ENABLED=true
WEBHOOK_AUTH_TOKEN=your_secure_auth_token_32_chars
WEBHOOK_SECRET=your_32_character_webhook_secret

# Category-specific webhook URLs
WEBHOOK_GOAL=https://hooks.zapier.com/hooks/catch/your-goal-endpoint
WEBHOOK_HABIT=https://hooks.zapier.com/hooks/catch/your-habit-endpoint
WEBHOOK_PROJECTIDEA=https://n8n.your-domain.com/webhook/project-ideas
WEBHOOK_TASK=https://hooks.zapier.com/hooks/catch/your-task-endpoint
WEBHOOK_REMINDER=https://hooks.zapier.com/hooks/catch/your-reminder-endpoint
WEBHOOK_NOTE=https://hooks.zapier.com/hooks/catch/your-note-endpoint
WEBHOOK_INSIGHT=https://hooks.zapier.com/hooks/catch/your-insight-endpoint
WEBHOOK_LEARNING=https://hooks.zapier.com/hooks/catch/your-learning-endpoint
WEBHOOK_CAREER=https://hooks.zapier.com/hooks/catch/your-career-endpoint
WEBHOOK_METRIC=https://hooks.zapier.com/hooks/catch/your-metric-endpoint
WEBHOOK_IDEA=https://hooks.zapier.com/hooks/catch/your-idea-endpoint
WEBHOOK_SYSTEM=https://hooks.zapier.com/hooks/catch/your-system-endpoint
WEBHOOK_AUTOMATION=https://hooks.zapier.com/hooks/catch/your-automation-endpoint
WEBHOOK_PERSON=https://hooks.zapier.com/hooks/catch/your-person-endpoint

# Note: WEBHOOK_SENSITIVE is not included for privacy protection
```

### Webhook URL Mapping

```typescript
// Internal webhook configuration
const WEBHOOKS: Record<string, string> = {
  Goal: process.env.WEBHOOK_GOAL || "https://webhook.site/placeholder-goal",
  Habit: process.env.WEBHOOK_HABIT || "https://webhook.site/placeholder-habit",
  ProjectIdea: process.env.WEBHOOK_PROJECTIDEA || "https://webhook.site/placeholder-project",
  Task: process.env.WEBHOOK_TASK || "https://webhook.site/placeholder-task",
  Reminder: process.env.WEBHOOK_REMINDER || "https://webhook.site/placeholder-reminder",
  Note: process.env.WEBHOOK_NOTE || "https://webhook.site/placeholder-note",
  Insight: process.env.WEBHOOK_INSIGHT || "https://webhook.site/placeholder-insight",
  Learning: process.env.WEBHOOK_LEARNING || "https://webhook.site/placeholder-learning",
  Career: process.env.WEBHOOK_CAREER || "https://webhook.site/placeholder-career",
  Metric: process.env.WEBHOOK_METRIC || "https://webhook.site/placeholder-metric",
  Idea: process.env.WEBHOOK_IDEA || "https://webhook.site/placeholder-idea",
  System: process.env.WEBHOOK_SYSTEM || "https://webhook.site/placeholder-system",
  Automation: process.env.WEBHOOK_AUTOMATION || "https://webhook.site/placeholder-automation",
  Person: process.env.WEBHOOK_PERSON || "https://webhook.site/placeholder-person"
  // Sensitive category is explicitly excluded for privacy
}
```

## Webhook Payload Structure

### Standard Payload Format

```typescript
interface WebhookPayload {
  input: string              // Original user input
  category: string           // Thought category
  subcategory?: string       // Optional subcategory
  priority?: string          // Priority level (low/medium/high)
  urgency?: string          // Urgency level
  sentiment?: string        // Sentiment analysis result
  timestamp: string         // ISO timestamp
  expanded?: string         // AI-enhanced version of the thought
  signature?: string        // HMAC signature for verification
  nonce?: string           // Unique nonce for replay protection
}
```

### Enhanced Project Payload

For **ProjectIdea** category, additional metadata is included:

```typescript
interface ProjectWebhookPayload extends WebhookPayload {
  category: "ProjectIdea"
  techStack?: string[]      // Recommended technologies
  features?: string[]       // Extracted features
  github?: {
    repoName: string
    visibility: "private" | "public"
  }
  markdown?: {
    readme: string
    projectOverview: string
  }
}
```

### Example Payloads

#### Task Category Webhook
```json
{
  "input": "Buy groceries after work today",
  "category": "Task",
  "subcategory": "shopping",
  "priority": "medium",
  "urgency": "high",
  "sentiment": "neutral",
  "timestamp": "2025-07-20T20:15:30.123Z",
  "expanded": "Purchase groceries from the local supermarket after finishing work today. This includes essential items for the week ahead.",
  "signature": "sha256=a1b2c3d4e5f6...",
  "nonce": "unique-request-id-12345"
}
```

#### Goal Category Webhook
```json
{
  "input": "I want to lose 20 pounds this year",
  "category": "Goal",
  "subcategory": "health",
  "priority": "high",
  "urgency": "low",
  "sentiment": "positive",
  "timestamp": "2025-07-20T20:15:30.123Z",
  "expanded": "Set a weight loss goal of 20 pounds to be achieved within the current year. This involves developing a sustainable diet and exercise plan with measurable milestones.",
  "signature": "sha256=a1b2c3d4e5f6...",
  "nonce": "unique-request-id-12346"
}
```

#### ProjectIdea Category Webhook
```json
{
  "input": "Build a React Native app for habit tracking",
  "category": "ProjectIdea",
  "subcategory": "mobile-app",
  "priority": "high",
  "urgency": "medium",
  "sentiment": "positive",
  "timestamp": "2025-07-20T20:15:30.123Z",
  "expanded": "Develop a cross-platform mobile application using React Native for tracking daily habits and building consistent routines...",
  "techStack": ["React Native", "Node.js", "PostgreSQL", "Redux"],
  "features": [
    "Habit creation and customization",
    "Daily check-in reminders",
    "Progress visualization",
    "Streak tracking",
    "Social sharing"
  ],
  "github": {
    "repoName": "habit-tracker-app",
    "visibility": "private"
  },
  "markdown": {
    "readme": "# Habit Tracker App\n\nA React Native application for tracking daily habits...",
    "projectOverview": "## Project Overview\n\nThis mobile app helps users build consistent habits..."
  },
  "signature": "sha256=a1b2c3d4e5f6...",
  "nonce": "unique-request-id-12347"
}
```

## Security Implementation

### HMAC Signature Generation

```typescript
import crypto from 'crypto'

function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

// Usage in webhook payload
const payloadString = JSON.stringify(payload)
const signature = `sha256=${generateSignature(payloadString, WEBHOOK_SECRET)}`
```

### Webhook Verification (Receiving End)

```typescript
// Verify webhook signature on your endpoint
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = `sha256=${generateSignature(payload, secret)}`
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Express.js webhook endpoint example
app.post('/webhook/minddump', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-minddump-signature'] as string
  const payload = req.body.toString()
  
  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature')
  }
  
  const data = JSON.parse(payload)
  // Process webhook data
  console.log('Received thought:', data.category, data.input)
  
  res.status(200).send('OK')
})
```

### Rate Limiting & Security

```typescript
// Built-in rate limiting
class WebhookRateLimiter {
  private requests = new Map<string, number[]>()
  
  isAllowed(clientId: string): boolean {
    const now = Date.now()
    const clientRequests = this.requests.get(clientId) || []
    
    // Remove requests older than 1 minute
    const recentRequests = clientRequests.filter(time => now - time < 60000)
    
    // Allow max 20 requests per minute per category
    if (recentRequests.length >= 20) {
      return false
    }
    
    recentRequests.push(now)
    this.requests.set(clientId, recentRequests)
    return true
  }
}
```

## Automation Platform Integration

### Zapier Integration

#### Setup Steps
1. **Create Zapier Webhook**: Go to Zapier → Make a Zap → Webhooks by Zapier
2. **Configure Trigger**: Choose "Catch Hook" and copy the webhook URL
3. **Add to MindDump**: Set the URL as `WEBHOOK_TASK` (or appropriate category)
4. **Test Connection**: Create a task in MindDump to verify webhook delivery
5. **Build Automation**: Add action steps (create Todoist task, send Slack message, etc.)

#### Example Zapier Workflows

**Task Management Workflow**:
```
MindDump Task → Zapier Webhook → Todoist Create Task
```

**Goal Tracking Workflow**:
```
MindDump Goal → Zapier Webhook → Google Sheets Row → Slack Notification
```

**Project Idea Workflow**:
```
MindDump ProjectIdea → Zapier Webhook → Notion Database Entry → GitHub Issue
```

### n8n Integration

#### n8n Webhook Node Configuration
```json
{
  "nodes": [
    {
      "parameters": {
        "path": "minddump-webhook",
        "options": {
          "noResponseBody": true
        }
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.category }}",
              "operation": "equal",
              "value2": "ProjectIdea"
            }
          ]
        }
      },
      "name": "Filter Projects",
      "type": "n8n-nodes-base.if",
      "position": [450, 300]
    }
  ]
}
```

#### Example n8n Workflow for Project Ideas
```typescript
// n8n HTTP Request node for GitHub repo creation
{
  "method": "POST",
  "url": "https://api.github.com/user/repos",
  "headers": {
    "Authorization": "token {{ $env.GITHUB_TOKEN }}",
    "Content-Type": "application/json"
  },
  "body": {
    "name": "{{ $json.github.repoName }}",
    "description": "{{ $json.summary }}",
    "private": "{{ $json.github.visibility === 'private' }}",
    "auto_init": true
  }
}
```

### Make.com Integration

#### Webhook Module Setup
1. **Add Webhook Module**: Choose "Webhooks" → "Custom webhook"
2. **Copy Webhook URL**: Use as your MindDump webhook URL
3. **Set Data Structure**: Define the expected JSON structure
4. **Add Processing Modules**: Configure actions based on webhook data

#### Example Make.com Scenario
```
Webhook → Router → 
├── [If category = "Task"] → Asana Create Task
├── [If category = "Goal"] → Notion Database Entry  
└── [If category = "Learning"] → Airtable Record
```

### Custom Endpoint Integration

#### Express.js Webhook Handler
```typescript
import express from 'express'
import crypto from 'crypto'

const app = express()

// Middleware for webhook signature verification
const verifySignature = (req: any, res: any, next: any) => {
  const signature = req.headers['x-minddump-signature']
  const payload = JSON.stringify(req.body)
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex')}`

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: 'Invalid signature' })
  }
  next()
}

// Webhook endpoint
app.post('/webhooks/minddump', express.json(), verifySignature, async (req, res) => {
  const { category, input, expanded, priority, urgency } = req.body
  
  try {
    switch (category) {
      case 'Task':
        await processTask(input, priority, urgency)
        break
      case 'Goal':
        await processGoal(input, expanded)
        break
      case 'ProjectIdea':
        await processProject(req.body)
        break
      default:
        await processGeneric(req.body)
    }
    
    res.status(200).json({ status: 'processed' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ error: 'Processing failed' })
  }
})

async function processTask(input: string, priority: string, urgency: string) {
  // Create task in your task management system
  console.log(`Creating task: ${input} (${priority} priority, ${urgency} urgency)`)
}

async function processGoal(input: string, expanded: string) {
  // Track goal in your goal management system
  console.log(`Tracking goal: ${input}`)
}

async function processProject(projectData: any) {
  // Handle project creation with GitHub, documentation, etc.
  console.log(`Processing project: ${projectData.input}`)
  if (projectData.github) {
    // Create GitHub repository
    await createGitHubRepo(projectData.github, projectData.markdown)
  }
}
```

## Advanced Webhook Features

### Conditional Webhook Routing

```typescript
// Custom routing logic based on content analysis
export function shouldRouteToWebhook(
  thought: ThoughtAnalysis,
  userPreferences?: UserWebhookPreferences
): boolean {
  // Never route sensitive thoughts
  if (thought.category === 'Sensitive') {
    return false
  }
  
  // Check user preferences
  if (userPreferences?.disabledCategories?.includes(thought.category)) {
    return false
  }
  
  // Route high-priority items immediately
  if (thought.priority === 'high' || thought.urgency === 'high') {
    return true
  }
  
  // Batch low-priority items (custom logic)
  if (thought.priority === 'low' && !userPreferences?.immediateRouting) {
    return Math.random() > 0.5 // Route 50% immediately, batch the rest
  }
  
  return true
}
```

### Webhook Batching

```typescript
// Batch multiple thoughts for efficient processing
interface BatchWebhookPayload {
  thoughts: WebhookPayload[]
  timestamp: string
  batchId: string
  signature: string
}

export async function sendBatchWebhook(
  thoughts: ThoughtAnalysis[],
  category: string
): Promise<void> {
  const webhookUrl = getWebhookUrl(category)
  if (!webhookUrl) return
  
  const batchPayload: BatchWebhookPayload = {
    thoughts: thoughts.map(createWebhookPayload),
    timestamp: new Date().toISOString(),
    batchId: generateUniqueId(),
    signature: '' // Generated after payload creation
  }
  
  const payloadString = JSON.stringify(batchPayload)
  batchPayload.signature = generateSignature(payloadString, WEBHOOK_SECRET)
  
  await sendSecureWebhook(webhookUrl, batchPayload)
}
```

### Webhook Analytics

```typescript
// Track webhook performance and success rates
interface WebhookAnalytics {
  category: string
  totalSent: number
  successful: number
  failed: number
  avgResponseTime: number
  lastSent: Date
  errorRate: number
}

export class WebhookAnalyticsTracker {
  private analytics = new Map<string, WebhookAnalytics>()
  
  recordSuccess(category: string, responseTime: number) {
    const stats = this.getOrCreateStats(category)
    stats.successful++
    stats.totalSent++
    stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2
    stats.lastSent = new Date()
    stats.errorRate = stats.failed / stats.totalSent
  }
  
  recordFailure(category: string) {
    const stats = this.getOrCreateStats(category)
    stats.failed++
    stats.totalSent++
    stats.errorRate = stats.failed / stats.totalSent
  }
  
  getStats(category: string): WebhookAnalytics | undefined {
    return this.analytics.get(category)
  }
  
  private getOrCreateStats(category: string): WebhookAnalytics {
    if (!this.analytics.has(category)) {
      this.analytics.set(category, {
        category,
        totalSent: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        lastSent: new Date(),
        errorRate: 0
      })
    }
    return this.analytics.get(category)!
  }
}
```

## Error Handling & Retry Logic

### Exponential Backoff Strategy

```typescript
export async function sendWebhookWithRetry(
  url: string,
  payload: WebhookPayload,
  maxRetries: number = 3
): Promise<{ success: boolean; error?: string }> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MindDump-Webhook/1.0',
          'X-MindDump-Signature': payload.signature || '',
        },
        body: JSON.stringify(payload),
        timeout: 15000 // 15 seconds
      })
      
      if (response.ok) {
        console.log(`✅ Webhook sent successfully to ${url}`)
        return { success: true }
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      lastError = error as Error
      console.warn(`Webhook attempt ${attempt} failed:`, error)
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  console.error(`❌ Webhook failed after ${maxRetries} attempts:`, lastError)
  return { success: false, error: lastError.message }
}
```

### Dead Letter Queue

```typescript
// Store failed webhooks for manual retry
interface FailedWebhook {
  id: string
  url: string
  payload: WebhookPayload
  attempts: number
  lastAttempt: Date
  error: string
}

export class WebhookDeadLetterQueue {
  private failedWebhooks: FailedWebhook[] = []
  
  addFailedWebhook(url: string, payload: WebhookPayload, error: string) {
    this.failedWebhooks.push({
      id: generateUniqueId(),
      url,
      payload,
      attempts: 1,
      lastAttempt: new Date(),
      error
    })
  }
  
  async retryFailedWebhooks(): Promise<void> {
    const toRetry = this.failedWebhooks.filter(
      webhook => webhook.attempts < 5 && 
      Date.now() - webhook.lastAttempt.getTime() > 300000 // 5 minutes
    )
    
    for (const webhook of toRetry) {
      const result = await sendWebhookWithRetry(webhook.url, webhook.payload, 1)
      
      if (result.success) {
        this.removeFailedWebhook(webhook.id)
      } else {
        webhook.attempts++
        webhook.lastAttempt = new Date()
        webhook.error = result.error || 'Unknown error'
      }
    }
  }
  
  private removeFailedWebhook(id: string) {
    this.failedWebhooks = this.failedWebhooks.filter(w => w.id !== id)
  }
}
```

## Testing & Debugging

### Webhook Testing Tools

#### 1. Using webhook.site
```bash
# Set temporary webhook URL for testing
export WEBHOOK_TASK=https://webhook.site/your-unique-url

# Create a test thought in MindDump
# Check webhook.site for received payload
```

#### 2. Local Testing with ngrok
```bash
# Install ngrok and expose local server
npm install -g ngrok
ngrok http 3001

# Use ngrok URL as webhook endpoint
export WEBHOOK_TASK=https://abc123.ngrok.io/webhook/task
```

#### 3. Manual Webhook Testing
```typescript
// Test webhook payload generation
import { createWebhookPayload, sendWebhook } from './webhooks'

async function testWebhook() {
  const payload = createWebhookPayload(
    "Test webhook delivery",
    "Task",
    "This is a test expanded thought",
    "high",
    "test-category"
  )
  
  console.log('Generated payload:', JSON.stringify(payload, null, 2))
  
  const result = await sendWebhook('https://webhook.site/test', payload)
  console.log('Webhook result:', result)
}

testWebhook()
```

### Debugging Common Issues

#### 1. Webhook Not Receiving Data
```typescript
// Debug webhook configuration
export function debugWebhookConfig(): void {
  console.log('Webhook Configuration Debug:')
  console.log('Webhooks enabled:', process.env.WEBHOOKS_ENABLED)
  console.log('Auth token configured:', !!process.env.WEBHOOK_AUTH_TOKEN)
  console.log('Secret configured:', !!process.env.WEBHOOK_SECRET)
  
  Object.entries(WEBHOOKS).forEach(([category, url]) => {
    console.log(`${category}: ${url.includes('placeholder') ? '❌ Placeholder' : '✅ Configured'}`)
  })
}
```

#### 2. Signature Verification Issues
```typescript
// Test signature generation and verification
function testSignatureVerification() {
  const payload = { test: 'data' }
  const secret = 'test-secret'
  const payloadString = JSON.stringify(payload)
  
  const signature = generateSignature(payloadString, secret)
  console.log('Generated signature:', signature)
  
  const isValid = verifySignatureOnReceiver(payloadString, `sha256=${signature}`, secret)
  console.log('Signature valid:', isValid)
}
```

## Production Deployment

### Security Checklist
- [ ] **Strong webhook secret** (32+ characters, randomly generated)
- [ ] **HTTPS endpoints only** for all webhook URLs
- [ ] **Signature verification** implemented on receiving endpoints
- [ ] **Rate limiting** configured appropriately
- [ ] **Input validation** on all webhook handlers
- [ ] **Error handling** with proper logging
- [ ] **No placeholder URLs** in production

### Monitoring & Alerting
```typescript
// Production monitoring setup
export function setupWebhookMonitoring() {
  setInterval(async () => {
    const stats = webhookAnalytics.getAllStats()
    
    stats.forEach(stat => {
      if (stat.errorRate > 0.1) { // 10% error rate threshold
        console.error(`High error rate for ${stat.category}: ${stat.errorRate * 100}%`)
        // Send alert to monitoring system
      }
      
      if (Date.now() - stat.lastSent.getTime() > 3600000) { // 1 hour since last webhook
        console.warn(`No webhooks sent for ${stat.category} in over 1 hour`)
      }
    })
  }, 300000) // Check every 5 minutes
}
```

### Performance Optimization
```typescript
// Webhook performance optimization
const webhookQueue = new Queue('webhook-processing', {
  redis: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

webhookQueue.process('send-webhook', async (job) => {
  const { url, payload } = job.data
  return await sendWebhookWithRetry(url, payload)
})

// Queue webhook instead of sending immediately
export async function queueWebhook(url: string, payload: WebhookPayload) {
  await webhookQueue.add('send-webhook', { url, payload })
}
```

## Best Practices

### Development
1. **Use webhook.site** for initial testing and debugging
2. **Implement signature verification** on all webhook receivers
3. **Handle failures gracefully** with proper error messages
4. **Log webhook attempts** for debugging and monitoring
5. **Use environment variables** for all webhook URLs

### Production
1. **Use HTTPS endpoints** exclusively for security
2. **Implement retry logic** with exponential backoff
3. **Monitor webhook success rates** and response times
4. **Set up alerting** for webhook failures
5. **Regular security audits** of webhook configurations

### Integration
1. **Document webhook payloads** for external developers
2. **Provide test endpoints** for integration validation
3. **Version your webhook APIs** for backward compatibility
4. **Implement webhook verification** on both ends
5. **Use batching** for high-volume scenarios

---

**Author**: MindDump Documentarian  
**Date**: 2025-07-20  
**Version**: 2.0  
**Related Files**: 
- `src/lib/webhooks.ts`
- `src/lib/webhook-security.ts`
- `src/lib/webhooks-optimized.ts`
- `WEBHOOK_INTEGRATION.md`