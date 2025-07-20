# 📡 MindDump API Reference

> **Complete API documentation for MindDump AI Thought Organizer**

This reference covers all endpoints, request/response formats, authentication, and integration patterns for the MindDump API.

## 🚀 Base Configuration

### API Base URL
```
Production: https://your-minddump-app.vercel.app/api
Development: http://localhost:3000/api
```

### Authentication
All API requests require authentication using Supabase JWT tokens.

```javascript
// Include in request headers
{
  "Authorization": "Bearer <supabase-jwt-token>",
  "Content-Type": "application/json"
}
```

### Rate Limits
- **General endpoints**: 60 requests per minute
- **AI categorization**: 30 requests per minute
- **Webhook testing**: 10 requests per minute

## 🧠 Core Endpoints

### Capture Thought
Processes voice or text input through AI categorization pipeline.

```http
POST /api/capture
```

#### Request Body
```typescript
interface CaptureRequest {
  input: string;                    // The raw thought/text input
  method: 'voice' | 'text';        // Input method
  sessionId?: string;              // Optional session identifier
  expand?: boolean;                // Request AI content expansion (default: true)
  priority?: 'high' | 'medium' | 'low'; // Manual priority override
}
```

#### Example Request
```json
{
  "input": "I need to start exercising more regularly, maybe 30 minutes a day",
  "method": "voice",
  "sessionId": "session_123",
  "expand": true
}
```

#### Response
```typescript
interface CaptureResponse {
  success: boolean;
  data: {
    id: string;                    // Unique entry ID
    category: string;              // AI-assigned category
    subcategory?: string;          // AI-assigned subcategory
    priority: string;              // AI-assigned priority
    expandedText?: string;         // AI-enhanced content
    timestamp: string;             // ISO 8601 timestamp
    webhook_delivered: boolean;    // Webhook delivery status
  };
  processing_time: number;         // Response time in milliseconds
}
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "id": "entry_abc123",
    "category": "Habit",
    "subcategory": "Health & Fitness",
    "priority": "medium",
    "expandedText": "Establish a consistent daily exercise routine of 30 minutes, focusing on cardiovascular health and strength building. Consider scheduling specific times and choosing activities you enjoy to maintain consistency.",
    "timestamp": "2025-07-20T14:32:00.000Z",
    "webhook_delivered": true
  },
  "processing_time": 1250
}
```

#### Error Responses
```json
// Invalid input
{
  "success": false,
  "error": "INVALID_INPUT",
  "message": "Input text is required and must not be empty",
  "code": 400
}

// AI service error
{
  "success": false,
  "error": "AI_SERVICE_ERROR",
  "message": "Failed to categorize input. Please try again.",
  "code": 503
}

// Rate limit exceeded
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please wait before trying again.",
  "code": 429
}
```

### Get Categories
Retrieves the complete list of available categories and their metadata.

```http
GET /api/categories
```

#### Response
```typescript
interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

interface Category {
  id: string;                      // Category identifier
  name: string;                    // Display name
  icon: string;                    // Emoji icon
  description: string;             // Category description
  examples: string[];              // Example inputs
  webhook_url?: string;            // Associated webhook URL
  subcategories?: string[];        // Available subcategories
}
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "goal",
      "name": "Goal",
      "icon": "🚀",
      "description": "Personal or professional objectives",
      "examples": [
        "I want to launch my podcast by Q2",
        "Learn Spanish fluently this year",
        "Save $10,000 for vacation"
      ],
      "webhook_url": "https://your-automation.com/goals",
      "subcategories": ["Personal", "Professional", "Financial", "Health"]
    },
    {
      "id": "habit",
      "name": "Habit",
      "icon": "📈",
      "description": "New routines or behavioral tracking",
      "examples": [
        "Meditate 10 minutes daily",
        "Drink 8 glasses of water",
        "Read for 30 minutes before bed"
      ],
      "webhook_url": "https://your-automation.com/habits",
      "subcategories": ["Health", "Productivity", "Learning", "Wellness"]
    }
    // ... additional categories
  ]
}
```

### Export Data
Exports user's captured thoughts in various formats.

```http
GET /api/export
```

#### Query Parameters
```typescript
interface ExportParams {
  format: 'json' | 'csv' | 'xlsx';     // Export format
  dateRange?: string;                   // Time range (e.g., "30d", "7d", "1y")
  startDate?: string;                   // ISO date string
  endDate?: string;                     // ISO date string
  categories?: string[];                // Filter by categories
  priority?: string[];                  // Filter by priority levels
  includeExpanded?: boolean;            // Include AI-expanded text
}
```

#### Example Request
```http
GET /api/export?format=csv&dateRange=30d&categories=Goal,Habit&includeExpanded=true
```

#### Response Headers
```http
Content-Type: application/json | text/csv | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="minddump-export-2025-07-20.csv"
```

#### JSON Response Format
```typescript
interface ExportResponse {
  success: boolean;
  data: {
    entries: ExportEntry[];
    metadata: {
      total_entries: number;
      date_range: string;
      generated_at: string;
      filters_applied: object;
    };
  };
}

interface ExportEntry {
  id: string;
  timestamp: string;
  raw_input: string;
  category: string;
  subcategory?: string;
  priority: string;
  expanded_text?: string;
  session_id?: string;
  user_id: string;
}
```

### User Analytics
Provides insights and analytics for user's thought patterns.

```http
GET /api/analytics
```

#### Query Parameters
```typescript
interface AnalyticsParams {
  timeframe: '7d' | '30d' | '90d' | '1y';  // Analysis timeframe
  metrics?: string[];                       // Specific metrics to include
}
```

#### Response
```typescript
interface AnalyticsResponse {
  success: boolean;
  data: {
    summary: {
      total_thoughts: number;
      unique_sessions: number;
      most_active_day: string;
      average_thoughts_per_day: number;
    };
    category_distribution: CategoryStats[];
    priority_distribution: PriorityStats[];
    time_patterns: TimePattern[];
    insights: string[];                     // AI-generated insights
  };
}

interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface TimePattern {
  hour: number;                            // 0-23
  count: number;
  category_breakdown: Record<string, number>;
}
```

## 🔗 Webhook Management

### Test Webhook
Sends a test payload to a specific category webhook.

```http
POST /api/webhooks/test
```

#### Request Body
```typescript
interface WebhookTestRequest {
  category: string;                        // Category to test
  custom_payload?: object;                 // Optional custom test data
}
```

#### Example Request
```json
{
  "category": "Goal",
  "custom_payload": {
    "input": "Test goal for webhook validation",
    "priority": "high"
  }
}
```

#### Response
```typescript
interface WebhookTestResponse {
  success: boolean;
  data: {
    webhook_url: string;
    status_code: number;
    response_time: number;
    payload_sent: object;
    response_headers: Record<string, string>;
  };
}
```

### Configure Webhooks
Updates webhook URLs for categories.

```http
PUT /api/webhooks/configure
```

#### Request Body
```typescript
interface WebhookConfigRequest {
  webhooks: WebhookConfig[];
}

interface WebhookConfig {
  category: string;                        // Category identifier
  url: string;                            // Webhook endpoint URL
  enabled: boolean;                       // Enable/disable webhook
  retry_attempts?: number;                // Retry attempts on failure (default: 3)
  timeout?: number;                       // Timeout in seconds (default: 10)
}
```

#### Example Request
```json
{
  "webhooks": [
    {
      "category": "Goal",
      "url": "https://n8n.your-domain.com/webhook/goals",
      "enabled": true,
      "retry_attempts": 3,
      "timeout": 15
    },
    {
      "category": "Habit",
      "url": "https://zapier.com/hooks/catch/12345/abcdef",
      "enabled": true
    }
  ]
}
```

### Webhook Status
Retrieves status and health information for all configured webhooks.

```http
GET /api/webhooks/status
```

#### Response
```typescript
interface WebhookStatusResponse {
  success: boolean;
  data: {
    webhooks: WebhookStatus[];
    last_health_check: string;
  };
}

interface WebhookStatus {
  category: string;
  url: string;
  enabled: boolean;
  last_triggered: string;
  success_rate: number;                   // Percentage of successful deliveries
  average_response_time: number;          // Average response time in ms
  last_error?: string;                    // Most recent error message
  health_status: 'healthy' | 'warning' | 'error';
}
```

## 🔍 Search and Filtering

### Search Thoughts
Searches through captured thoughts with various filters.

```http
GET /api/search
```

#### Query Parameters
```typescript
interface SearchParams {
  q?: string;                             // Search query
  category?: string[];                    // Filter by categories
  priority?: string[];                    // Filter by priority
  startDate?: string;                     // Start date filter
  endDate?: string;                       // End date filter
  limit?: number;                         // Results limit (default: 50, max: 200)
  offset?: number;                        // Pagination offset
  sort?: 'timestamp' | 'relevance';      // Sort order
  order?: 'asc' | 'desc';                // Sort direction
}
```

#### Example Request
```http
GET /api/search?q=exercise&category=Habit,Goal&priority=high&limit=20&sort=timestamp&order=desc
```

#### Response
```typescript
interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    total_count: number;
    has_more: boolean;
    search_metadata: {
      query: string;
      filters_applied: object;
      search_time: number;
    };
  };
}

interface SearchResult {
  id: string;
  timestamp: string;
  raw_input: string;
  category: string;
  subcategory?: string;
  priority: string;
  expanded_text?: string;
  relevance_score?: number;               // When sorted by relevance
  highlights?: string[];                  // Highlighted search terms
}
```

## 🔐 Authentication Endpoints

### Get User Profile
Retrieves the current user's profile information.

```http
GET /api/user/profile
```

#### Response
```typescript
interface UserProfileResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
    preferences: UserPreferences;
    usage_stats: UsageStats;
  };
}

interface UserPreferences {
  default_expand: boolean;                // Auto-expand thoughts by default
  webhook_notifications: boolean;        // Enable webhook success notifications
  ai_insights: boolean;                  // Enable AI-generated insights
  export_format: 'json' | 'csv' | 'xlsx'; // Preferred export format
}

interface UsageStats {
  total_thoughts: number;
  thoughts_this_month: number;
  favorite_category: string;
  account_age_days: number;
}
```

### Update User Preferences
Updates user preferences and settings.

```http
PUT /api/user/preferences
```

#### Request Body
```typescript
interface UpdatePreferencesRequest {
  preferences: Partial<UserPreferences>;
}
```

#### Example Request
```json
{
  "preferences": {
    "default_expand": false,
    "webhook_notifications": true,
    "export_format": "csv"
  }
}
```

## 📊 System Status

### Health Check
Provides system health and service status information.

```http
GET /api/health
```

#### Response
```typescript
interface HealthResponse {
  success: boolean;
  data: {
    status: 'healthy' | 'degraded' | 'down';
    timestamp: string;
    services: ServiceHealth[];
    version: string;
    uptime: number;                       // Uptime in seconds
  };
}

interface ServiceHealth {
  name: string;                          // Service name
  status: 'up' | 'down' | 'degraded';
  response_time?: number;                // Response time in ms
  last_checked: string;
  error?: string;                        // Error message if down
}
```

### System Metrics
Provides system performance and usage metrics (admin only).

```http
GET /api/admin/metrics
```

#### Response
```typescript
interface MetricsResponse {
  success: boolean;
  data: {
    requests: {
      total_today: number;
      total_this_month: number;
      average_response_time: number;
      error_rate: number;
    };
    ai_usage: {
      categorizations_today: number;
      categorizations_this_month: number;
      average_processing_time: number;
      accuracy_rate: number;
    };
    webhooks: {
      total_deliveries_today: number;
      success_rate: number;
      average_delivery_time: number;
    };
    users: {
      total_active_users: number;
      new_users_this_month: number;
      retention_rate: number;
    };
  };
}
```

## 🛠️ SDK and Integration

### JavaScript/TypeScript SDK

#### Installation
```bash
npm install @minddump/sdk
```

#### Basic Usage
```typescript
import { MindDumpClient } from '@minddump/sdk';

const client = new MindDumpClient({
  apiUrl: 'https://your-minddump-app.vercel.app/api',
  token: 'your-jwt-token'
});

// Capture a thought
const result = await client.capture({
  input: "I should learn more about machine learning",
  method: "text",
  expand: true
});

// Get analytics
const analytics = await client.getAnalytics({ timeframe: '30d' });

// Search thoughts
const searchResults = await client.search({
  q: "machine learning",
  category: ["Learning"],
  limit: 10
});
```

#### Error Handling
```typescript
try {
  const result = await client.capture({
    input: "My important thought",
    method: "text"
  });
} catch (error) {
  if (error instanceof MindDumpAPIError) {
    console.error('API Error:', error.code, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Python SDK

#### Installation
```bash
pip install minddump-sdk
```

#### Basic Usage
```python
from minddump import MindDumpClient

client = MindDumpClient(
    api_url="https://your-minddump-app.vercel.app/api",
    token="your-jwt-token"
)

# Capture a thought
result = client.capture({
    "input": "I need to call the dentist tomorrow",
    "method": "text",
    "expand": True
})

# Export data
export_data = client.export({
    "format": "json",
    "dateRange": "30d"
})
```

## 📝 Webhook Payload Reference

### Standard Webhook Payload
All webhooks receive this standardized payload format:

```typescript
interface WebhookPayload {
  // Core data
  id: string;                            // Unique entry ID
  input: string;                         // Original user input
  category: string;                      // AI-assigned category
  subcategory?: string;                  // AI-assigned subcategory
  priority: string;                      // AI-assigned priority
  timestamp: string;                     // ISO 8601 timestamp
  
  // Enhanced content
  expanded_text?: string;                // AI-enhanced content
  
  // User context
  user_id: string;                       // User identifier
  session_id?: string;                   // Session identifier
  
  // Metadata
  processing_time: number;               // AI processing time in ms
  confidence_score: number;              // AI confidence (0-1)
  webhook_timestamp: string;             // Webhook delivery timestamp
  
  // Signature verification
  signature: string;                     // HMAC signature for verification
}
```

### Webhook Security
All webhooks include HMAC-SHA256 signatures for verification:

```typescript
// Verify webhook signature
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

### Category-Specific Enhancements
Some categories include additional context:

```typescript
// Goal category includes goal-specific fields
interface GoalWebhookPayload extends WebhookPayload {
  goal_type: 'short_term' | 'long_term';
  measurable: boolean;
  deadline?: string;
  success_criteria?: string[];
}

// Habit category includes habit-specific fields
interface HabitWebhookPayload extends WebhookPayload {
  frequency: 'daily' | 'weekly' | 'monthly';
  habit_type: 'positive' | 'negative';
  triggers?: string[];
  rewards?: string[];
}
```

## 🚨 Error Codes Reference

### HTTP Status Codes
- **200**: Success
- **201**: Created successfully
- **400**: Bad Request - Invalid input or parameters
- **401**: Unauthorized - Invalid or missing authentication
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server-side error
- **503**: Service Unavailable - External service failure

### Custom Error Codes
```typescript
enum MindDumpErrorCode {
  // Input validation
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_CATEGORY = 'INVALID_CATEGORY',
  
  // Authentication
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // AI Service
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_TIMEOUT = 'AI_TIMEOUT',
  AI_QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
  
  // External services
  SHEETS_API_ERROR = 'SHEETS_API_ERROR',
  WEBHOOK_DELIVERY_FAILED = 'WEBHOOK_DELIVERY_FAILED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // System
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

## 📈 API Versioning

### Current Version
- **Version**: v1
- **Deprecation Policy**: 6 months notice for breaking changes
- **Backward Compatibility**: Maintained for 1 year

### Version Header
```http
X-API-Version: v1
```

### Version-Specific Endpoints
```http
GET /api/v1/capture    # Explicit version
GET /api/capture       # Uses latest version (v1)
```

---

**🔗 Complete API integration guide for building powerful MindDump integrations and automations.**

*For additional support, examples, and updates, visit the [GitHub repository](https://github.com/coreybello/crizzelwebsite) or contact the development team.*