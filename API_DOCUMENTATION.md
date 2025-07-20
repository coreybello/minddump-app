# 🔌 MindDump API Documentation

## Overview

The MindDump API provides endpoints for thought processing, categorization, and integration management. All endpoints use JSON for request/response bodies and include comprehensive error handling.

## Base URL

```
Production: https://your-domain.com/minddump/api
Development: http://localhost:3000/api
```

## Authentication

API endpoints are secured and require proper authentication:

```bash
# Include authentication headers
Authorization: Bearer <your-session-token>
Content-Type: application/json
```

## Rate Limiting

- **Thoughts API**: 20 requests per minute per IP
- **General endpoints**: 60 requests per minute per IP
- **Webhook testing**: 10 requests per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1640995200
```

## 📝 Core Endpoints

### POST /api/thoughts

Process and categorize a new thought using AI analysis.

#### Request Body

```json
{
  "text": "I want to build a mobile app for habit tracking",
  "category": "auto-detect",  // Optional: override auto-detection
  "analysis": null            // Optional: provide pre-analyzed data
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | The thought content (1-50,000 characters) |
| `category` | string | No | Override auto-detection with specific category |
| `analysis` | object | No | Pre-analyzed thought data |

#### Valid Categories

```
Goal, Habit, ProjectIdea, Task, Reminder, Note, Insight, Learning, 
Career, Metric, Idea, System, Automation, Person, Sensitive, Uncategorized
```

#### Success Response (200)

```json
{
  "success": true,
  "thought": {
    "id": "thought_1642771200_abc123def",
    "raw_text": "I want to build a mobile app for habit tracking",
    "category": "ProjectIdea",
    "subcategory": "Mobile App",
    "priority": "medium",
    "title": "Habit Tracking Mobile App",
    "summary": "A mobile application designed to help users track daily habits",
    "expanded_text": "Detailed analysis of the habit tracking app concept...",
    "actions": [
      "Research existing habit tracking apps",
      "Define core features and user stories",
      "Choose technology stack (React Native vs Flutter)"
    ],
    "urgency": "medium",
    "sentiment": "positive",
    "created_at": "2022-01-21T12:00:00Z"
  },
  "project": {
    "id": "project_1642771200_xyz789",
    "thought_id": "thought_1642771200_abc123def",
    "title": "Habit Tracking Mobile App",
    "summary": "A mobile application designed to help users track daily habits",
    "readme": "# Habit Tracking App\n\n## Overview\n...",
    "overview": "Detailed project overview content...",
    "sheets_url": "https://docs.google.com/spreadsheets/d/...",
    "category": "ProjectIdea",
    "subcategory": "Mobile App",
    "priority": "medium",
    "tech_stack": ["React Native", "Node.js", "PostgreSQL"],
    "features": [
      "Habit creation and tracking",
      "Progress visualization",
      "Reminder notifications"
    ],
    "created_at": "2022-01-21T12:00:00Z"
  },
  "analysis": {
    "category": "ProjectIdea",
    "subcategory": "Mobile App",
    "priority": "medium",
    "type": "project",
    "title": "Habit Tracking Mobile App",
    "summary": "A mobile application designed to help users track daily habits",
    "urgency": "medium",
    "sentiment": "positive"
  },
  "integrations": {
    "masterSheet": {
      "success": true,
      "error": null
    },
    "webhook": {
      "success": true,
      "error": null
    },
    "projectSheet": {
      "success": true,
      "url": "https://docs.google.com/spreadsheets/d/..."
    }
  },
  "sheetsUrl": "https://docs.google.com/spreadsheets/d/...",
  "actionsCreated": 3,
  "timestamp": "2022-01-21T12:00:00Z",
  "categorization": {
    "system": "enhanced_15_category",
    "availableCategories": ["Goal", "Habit", "ProjectIdea", ...]
  }
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [
      "Text field is required",
      "Text must be between 1 and 50,000 characters"
    ]
  }
}
```

**503 Service Unavailable**
```json
{
  "error": "Claude API not configured",
  "code": "SERVICE_UNAVAILABLE"
}
```

### GET /api/thoughts

Retrieve stored thoughts with pagination and filtering.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Number of thoughts to return (max 100) |
| `offset` | integer | 0 | Number of thoughts to skip |
| `category` | string | - | Filter by specific category |
| `start_date` | string | - | Filter thoughts after date (ISO 8601) |
| `end_date` | string | - | Filter thoughts before date (ISO 8601) |

#### Example Request

```bash
GET /api/thoughts?limit=10&category=ProjectIdea&start_date=2022-01-01T00:00:00Z
```

#### Success Response (200)

```json
{
  "thoughts": [
    {
      "id": "thought_1642771200_abc123def",
      "raw_text": "I want to build a mobile app for habit tracking",
      "category": "ProjectIdea",
      "title": "Habit Tracking Mobile App",
      "created_at": "2022-01-21T12:00:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1,
    "hasMore": false
  },
  "timestamp": "2022-01-21T12:00:00Z"
}
```

## 🔍 Utility Endpoints

### GET /api/health

Check API health and service status.

#### Success Response (200)

```json
{
  "status": "healthy",
  "timestamp": "2022-01-21T12:00:00Z",
  "services": {
    "database": "connected",
    "claude_api": "available",
    "google_sheets": "configured",
    "webhooks": "enabled"
  },
  "version": "1.0.0"
}
```

### GET /api/docs

Get API documentation in OpenAPI format.

#### Success Response (200)

Returns OpenAPI 3.0 specification for the API.

### POST /api/security/validate

Validate and sanitize input data before processing.

#### Request Body

```json
{
  "text": "Sample text to validate",
  "type": "thought"
}
```

#### Success Response (200)

```json
{
  "valid": true,
  "sanitized_text": "Sample text to validate",
  "issues": [],
  "recommendations": []
}
```

### POST /api/webhook

Test webhook connectivity and payload delivery.

#### Request Body

```json
{
  "category": "ProjectIdea",
  "test_payload": {
    "input": "Test webhook integration",
    "category": "ProjectIdea",
    "timestamp": "2022-01-21T12:00:00Z"
  }
}
```

#### Success Response (200)

```json
{
  "success": true,
  "webhook_url": "https://webhook.site/placeholder-project",
  "response_status": 200,
  "response_time_ms": 245,
  "timestamp": "2022-01-21T12:00:00Z"
}
```

## 🔗 Integration Endpoints

### Google Sheets Integration

The API automatically logs all thoughts to a master Google Sheet when properly configured.

#### Master Sheet Structure

| Column | Description |
|--------|-------------|
| Timestamp | When the thought was processed |
| Raw Input | Original thought text |
| Category | AI-assigned category |
| Subcategory | Additional classification |
| Priority | Urgency level (Low/Medium/High) |
| Expanded Text | AI-enhanced version |
| Integration Status | Success/failure of automation routing |

### Webhook Integration

Thoughts are automatically routed to category-specific webhooks for external automation.

#### Webhook Payload Structure

```json
{
  "input": "Original thought text",
  "category": "ProjectIdea",
  "subcategory": "Mobile App",
  "priority": "Medium",
  "timestamp": "2022-01-21T12:00:00Z",
  "expanded": "AI-enhanced analysis",
  "analysis": {
    "title": "Generated title",
    "summary": "Brief summary",
    "actions": ["Action 1", "Action 2"],
    "urgency": "medium",
    "sentiment": "positive"
  },
  "metadata": {
    "thought_id": "thought_1642771200_abc123def",
    "user_id": "anonymous",
    "processing_time_ms": 1250
  }
}
```

#### Webhook Configuration

Set environment variables for category-specific webhooks:

```bash
WEBHOOKS_ENABLED=true
WEBHOOK_AUTH_TOKEN=your_webhook_auth_token

# Category-specific URLs
WEBHOOK_GOAL=https://your-automation-endpoint.com/goal
WEBHOOK_PROJECTIDEA=https://your-automation-endpoint.com/project
WEBHOOK_TASK=https://your-automation-endpoint.com/task
# ... other categories
```

## 🛡️ Security Features

### Input Validation

- **Text sanitization** - Removes potentially harmful content
- **Length limits** - Prevents oversized requests
- **Type checking** - Validates data types
- **SQL injection protection** - Parameterized queries

### Rate Limiting

- **Per-IP limits** - Prevents abuse
- **Sliding window** - Fair usage across time
- **Graceful degradation** - Warns before blocking

### Error Handling

- **Structured errors** - Consistent error format
- **No sensitive data leakage** - Safe error messages
- **Logging** - Comprehensive audit trail
- **Monitoring** - Real-time error tracking

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server issue |
| 503 | Service Unavailable - External service down |

## 🧪 Testing the API

### Using cURL

```bash
# Test thought processing
curl -X POST https://your-domain.com/minddump/api/thoughts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I need to learn TypeScript for my next project"
  }'

# Test with category override
curl -X POST https://your-domain.com/minddump/api/thoughts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Call the dentist tomorrow at 2 PM",
    "category": "Task"
  }'

# Retrieve thoughts
curl -X GET "https://your-domain.com/minddump/api/thoughts?limit=5&category=Learning"

# Check health
curl -X GET https://your-domain.com/minddump/api/health
```

### Using JavaScript/Fetch

```javascript
// Process a thought
const response = await fetch('/api/thoughts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Build a recipe sharing social media app',
    category: 'auto-detect'
  })
});

const result = await response.json();
console.log('Thought processed:', result);

// Retrieve thoughts
const thoughts = await fetch('/api/thoughts?limit=10&category=ProjectIdea');
const thoughtData = await thoughts.json();
console.log('Retrieved thoughts:', thoughtData.thoughts);
```

### Using Python/Requests

```python
import requests

# Process a thought
response = requests.post(
    'https://your-domain.com/minddump/api/thoughts',
    json={
        'text': 'Start a morning meditation practice',
        'category': 'Habit'
    }
)

result = response.json()
print('Thought processed:', result['thought']['category'])

# Retrieve thoughts
thoughts = requests.get(
    'https://your-domain.com/minddump/api/thoughts',
    params={'limit': 5, 'category': 'Habit'}
)

print('Retrieved thoughts:', len(thoughts.json()['thoughts']))
```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Core functionality
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
ANTHROPIC_API_KEY=your_claude_api_key

# Google Sheets integration
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email
GOOGLE_SHEETS_PRIVATE_KEY=your_private_key
GOOGLE_SHEETS_MASTER_ID=your_master_sheet_id

# Webhook configuration
WEBHOOKS_ENABLED=true
WEBHOOK_AUTH_TOKEN=your_auth_token

# Category webhook URLs
WEBHOOK_GOAL=https://your-endpoint.com/goal
WEBHOOK_HABIT=https://your-endpoint.com/habit
# ... additional webhook URLs
```

## 📈 Usage Analytics

The API provides built-in analytics for monitoring usage and performance:

- **Request volume** - Tracks API usage patterns
- **Processing time** - Monitors AI analysis performance
- **Integration health** - Webhook and sheet success rates
- **Error rates** - Failed requests and causes
- **Category distribution** - Most common thought types

Access analytics through the dashboard or export via API.

## 🆘 Troubleshooting

### Common API Issues

**429 Rate Limited**
- Wait for rate limit window to reset
- Implement exponential backoff in clients
- Contact support for higher limits

**503 Service Unavailable**
- Check service status at `/api/health`
- Verify environment variables are set
- Contact support if persistent

**400 Validation Error**
- Check request body format
- Ensure text is within length limits
- Verify category names are valid

### Getting Help

- **API Status**: Check `/api/health` endpoint
- **Documentation**: This guide and OpenAPI spec at `/api/docs`
- **Support**: Create GitHub issue with request details
- **Community**: Join discussions for API usage tips

---

**Ready to integrate with MindDump? Start with the `/api/health` endpoint!** 🚀

*For deployment help, see [DEPLOYMENT.md](./DEPLOYMENT.md)*