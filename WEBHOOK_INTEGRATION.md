# 🔗 Webhook Integration Setup Guide

## Overview

MindDump's webhook system routes categorized thoughts to external automation platforms like n8n, Zapier, Make.com, or custom endpoints. This guide covers complete webhook integration setup.

## 🎯 How Webhook Routing Works

1. **Thought Capture** - User enters thought via voice or text
2. **AI Categorization** - Claude AI assigns one of 15 categories
3. **Central Logging** - Thought logged to master Google Sheet
4. **Webhook Routing** - POST request sent to category-specific endpoint
5. **External Processing** - Your automation handles the webhook payload

## 🛠️ Environment Setup

### Required Environment Variables

```bash
# Enable webhook system
WEBHOOKS_ENABLED=true
WEBHOOK_AUTH_TOKEN=your_secure_auth_token

# Category-specific webhook URLs (customize as needed)
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

### Generate Secure Auth Token

```bash
# Generate a secure webhook auth token
openssl rand -base64 32

# Example result: 
# kJ8mN2pQ5rS7tU9vW1xY3zA6bC8dE0fG2hI4jK6lM8nO0p
```

## 📋 Webhook Payload Structure

Every webhook receives a standardized JSON payload:

```json
{
  "input": "I want to build a mobile app for habit tracking",
  "category": "ProjectIdea",
  "subcategory": "Mobile App",
  "priority": "Medium",
  "timestamp": "2025-07-20T18:30:00Z",
  "expanded": "A comprehensive mobile application designed to help users track daily habits, set goals, and visualize progress over time. The app should include features for habit creation, reminder notifications, progress tracking, and motivational elements.",
  "analysis": {
    "title": "Habit Tracking Mobile App",
    "summary": "A mobile application for tracking daily habits and goals",
    "actions": [
      "Research existing habit tracking applications",
      "Define core features and user experience",
      "Choose appropriate technology stack",
      "Create wireframes and user interface designs",
      "Plan development timeline and milestones"
    ],
    "urgency": "medium",
    "sentiment": "positive",
    "techStack": ["React Native", "Node.js", "PostgreSQL", "Firebase"],
    "features": [
      "Habit creation and customization",
      "Daily tracking interface",
      "Progress visualization charts",
      "Reminder notifications",
      "Goal setting and achievement tracking"
    ]
  },
  "metadata": {
    "thought_id": "thought_1642771200_abc123def",
    "user_id": "anonymous",
    "processing_time_ms": 1250,
    "integration_status": {
      "google_sheets": "success",
      "webhook_attempts": 1
    }
  }
}
```

## 🔒 Security Headers

All webhook requests include security headers:

```http
POST /your-webhook-endpoint
Content-Type: application/json
Authorization: Bearer your_webhook_auth_token
X-MindDump-Category: ProjectIdea
X-MindDump-Timestamp: 1642771200
X-MindDump-Signature: sha256=hash_of_payload
User-Agent: MindDump-Webhook/1.0
```

## 🚀 Integration Platforms

### n8n Workflow Integration

1. **Create n8n Workflow**
   - Start with Webhook Trigger node
   - Set HTTP Method: POST
   - Authentication: Header Auth
   - Header Name: Authorization
   - Header Value: Bearer your_webhook_auth_token

2. **Example n8n Workflow for ProjectIdea**
   ```
   Webhook Trigger
   ↓
   Function Node (Extract data)
   ↓
   Notion Node (Create project page)
   ↓
   Slack Node (Notify team)
   ↓
   GitHub Node (Create repository - optional)
   ```

3. **n8n Function Node Example**
   ```javascript
   // Extract key data from MindDump webhook
   const payload = $json;
   
   return {
     title: payload.analysis.title,
     description: payload.expanded,
     category: payload.category,
     priority: payload.priority,
     actions: payload.analysis.actions,
     techStack: payload.analysis.techStack,
     originalThought: payload.input,
     timestamp: payload.timestamp
   };
   ```

### Zapier Integration

1. **Create Zapier Webhook**
   - Trigger: Webhook by Zapier
   - Choose "Catch Hook"
   - Copy webhook URL to MindDump environment variable

2. **Example Zapier Flow for Task Category**
   ```
   Webhook Trigger (MindDump)
   ↓
   Filter (Only process "Task" category)
   ↓
   Todoist (Create new task)
   ↓
   Google Calendar (Schedule if has deadline)
   ```

3. **Zapier Data Mapping**
   ```
   Todoist Task:
   - Content: {{expanded}}
   - Priority: {{priority}}
   - Due Date: {{analysis.deadline}} (if present)
   - Project: MindDump Tasks
   - Labels: {{category}}, {{subcategory}}
   ```

### Make.com (Integromat) Integration

1. **Create Make Scenario**
   - Add Custom Webhook module
   - Set to listen for JSON
   - Add authentication if needed

2. **Example Make Scenario for Learning Category**
   ```
   Webhook → Filter → Notion → Slack
   ```

3. **Make Filter Condition**
   ```
   Field: category
   Operator: Equal to
   Value: Learning
   ```

### Custom Endpoint Integration

```python
# Python Flask example webhook receiver
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)

@app.route('/webhook/mindump/<category>', methods=['POST'])
def handle_mindump_webhook(category):
    # Verify webhook authentication
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid authorization'}), 401
    
    token = auth_header[7:]  # Remove 'Bearer ' prefix
    if token != 'your_webhook_auth_token':
        return jsonify({'error': 'Invalid token'}), 401
    
    # Process webhook payload
    payload = request.json
    
    # Route based on category
    if category == 'ProjectIdea':
        return handle_project_idea(payload)
    elif category == 'Task':
        return handle_task(payload)
    elif category == 'Learning':
        return handle_learning(payload)
    else:
        return jsonify({'message': 'Category not configured'}), 200

def handle_project_idea(payload):
    # Create project in your system
    project_data = {
        'title': payload['analysis']['title'],
        'description': payload['expanded'],
        'tech_stack': payload['analysis'].get('techStack', []),
        'actions': payload['analysis']['actions'],
        'priority': payload['priority']
    }
    
    # Your project creation logic here
    # create_project(project_data)
    
    return jsonify({'status': 'project_created', 'message': 'Project idea processed successfully'})

def handle_task(payload):
    # Add task to your task management system
    task_data = {
        'title': payload['analysis']['title'],
        'description': payload['expanded'],
        'priority': payload['priority'],
        'actions': payload['analysis']['actions']
    }
    
    # Your task creation logic here
    # create_task(task_data)
    
    return jsonify({'status': 'task_created', 'message': 'Task processed successfully'})

if __name__ == '__main__':
    app.run(debug=True)
```

## 🧪 Testing Webhooks

### Using webhook.site for Testing

1. **Go to webhook.site**
   - Visit [webhook.site](https://webhook.site)
   - Copy your unique URL
   - Use as webhook URL in MindDump environment

2. **Test Webhook Flow**
   ```bash
   # Set test webhook URL
   WEBHOOK_PROJECTIDEA=https://webhook.site/your-unique-id
   
   # Submit test thought
   curl -X POST https://your-domain.com/minddump/api/thoughts \
     -H "Content-Type: application/json" \
     -d '{"text": "Build a recipe sharing app", "category": "ProjectIdea"}'
   
   # Check webhook.site for received payload
   ```

3. **Verify Payload Structure**
   - Check that all required fields are present
   - Verify category matches expected value
   - Confirm timestamp format
   - Test authentication headers

### Manual Webhook Testing

```bash
# Test webhook endpoint directly
curl -X POST https://your-webhook-endpoint.com/category/ProjectIdea \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_webhook_auth_token" \
  -H "X-MindDump-Category: ProjectIdea" \
  -d '{
    "input": "Test project idea",
    "category": "ProjectIdea",
    "subcategory": "Web App",
    "priority": "Medium",
    "timestamp": "2025-07-20T18:30:00Z",
    "expanded": "Detailed analysis of the test project idea",
    "analysis": {
      "title": "Test Project",
      "summary": "A test project for webhook integration",
      "actions": ["Action 1", "Action 2"],
      "urgency": "medium",
      "sentiment": "positive"
    }
  }'
```

## 📊 Webhook Monitoring

### Built-in Monitoring

MindDump includes webhook monitoring features:

```javascript
// Check webhook status via API
fetch('/api/webhook/status')
  .then(response => response.json())
  .then(data => {
    console.log('Webhook health:', data);
    // {
    //   "enabled": true,
    //   "total_sent": 1250,
    //   "success_rate": 0.98,
    //   "last_success": "2025-07-20T18:30:00Z",
    //   "failed_categories": [],
    //   "average_response_time_ms": 245
    // }
  });
```

### External Monitoring

Set up monitoring for your webhook endpoints:

1. **Uptime monitoring** - Monitor endpoint availability
2. **Response time tracking** - Ensure fast processing
3. **Error rate monitoring** - Track failed webhook deliveries
4. **Authentication monitoring** - Verify token validity

## 🔧 Advanced Configuration

### Conditional Webhook Routing

```bash
# Environment variables for conditional routing
WEBHOOK_PROJECTIDEA_CONDITION="priority:high"
WEBHOOK_TASK_CONDITION="urgency:high|medium"
WEBHOOK_LEARNING_CONDITION="subcategory:programming"
```

### Custom Headers

```bash
# Add custom headers to webhook requests
WEBHOOK_CUSTOM_HEADERS='{"X-Source": "MindDump", "X-Version": "1.0"}'
```

### Retry Configuration

```bash
# Webhook retry settings
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY_MS=1000
WEBHOOK_TIMEOUT_MS=5000
```

### Webhook Filtering

```javascript
// Filter webhooks based on content
const shouldSendWebhook = (payload) => {
  // Don't send sensitive thoughts
  if (payload.category === 'Sensitive') {
    return false;
  }
  
  // Only send high-priority project ideas
  if (payload.category === 'ProjectIdea' && payload.priority !== 'high') {
    return false;
  }
  
  return true;
};
```

## 🚨 Troubleshooting

### Common Webhook Issues

**Webhook not receiving requests:**
```bash
# Check if webhooks are enabled
curl https://your-domain.com/minddump/api/health
# Look for "webhooks": "enabled" in response

# Verify webhook URL is accessible
curl -X POST https://your-webhook-url.com/test
```

**Authentication failures:**
```bash
# Verify auth token is set correctly
echo $WEBHOOK_AUTH_TOKEN

# Test with webhook.site first
WEBHOOK_PROJECTIDEA=https://webhook.site/your-test-id
```

**Payload not as expected:**
- Check MindDump logs for webhook processing errors
- Verify category name matches environment variable
- Test with minimal payload first

**High latency/timeouts:**
```bash
# Increase webhook timeout
WEBHOOK_TIMEOUT_MS=10000

# Check your endpoint response time
curl -w "@curl-format.txt" -X POST https://your-webhook-url.com
```

### Debugging Tools

1. **Webhook.site** - Test payload reception
2. **ngrok** - Test local development endpoints
3. **Postman** - Test webhook endpoints manually
4. **curl** - Command-line webhook testing

## 🔄 Best Practices

### Security Best Practices

1. **Use HTTPS** - Always use secure endpoints
2. **Validate auth tokens** - Check Authorization header
3. **Verify payload signatures** - Use X-MindDump-Signature
4. **Rate limiting** - Implement rate limits on your endpoints
5. **Log webhook attempts** - Monitor for security issues

### Performance Best Practices

1. **Fast responses** - Return 200 status quickly
2. **Async processing** - Handle heavy work asynchronously
3. **Idempotency** - Handle duplicate webhooks gracefully
4. **Timeouts** - Set reasonable timeout values
5. **Monitoring** - Track webhook performance metrics

### Integration Best Practices

1. **Start simple** - Begin with webhook.site testing
2. **Category-specific logic** - Handle each category appropriately
3. **Graceful failures** - Handle webhook failures without breaking
4. **Data validation** - Validate incoming webhook data
5. **Error reporting** - Log and monitor webhook errors

## 📈 Usage Examples

### Task Management Integration

```python
# Integrate with various task management tools
def handle_task_webhook(payload):
    task_data = {
        'title': payload['analysis']['title'],
        'description': payload['expanded'],
        'priority': payload['priority'],
        'due_date': extract_due_date(payload['input']),
        'tags': [payload['category'], payload.get('subcategory', '')]
    }
    
    # Route to different tools based on priority
    if payload['priority'] == 'high':
        create_asana_task(task_data)
        send_slack_notification(task_data)
    else:
        create_todoist_task(task_data)
```

### Knowledge Management Integration

```javascript
// Route learning thoughts to knowledge base
const handleLearningWebhook = (payload) => {
  const noteData = {
    title: payload.analysis.title,
    content: payload.expanded,
    category: 'Learning',
    subcategory: payload.subcategory,
    tags: extractTags(payload.input),
    source: 'MindDump Voice Capture',
    timestamp: payload.timestamp
  };
  
  // Create note in Obsidian/Notion
  createKnowledgeBaseEntry(noteData);
  
  // Add to learning queue
  addToLearningQueue(payload.analysis.actions);
};
```

### Project Management Integration

```python
# Create comprehensive project setup
def handle_project_idea_webhook(payload):
    project = {
        'name': payload['analysis']['title'],
        'description': payload['expanded'],
        'tech_stack': payload['analysis'].get('techStack', []),
        'features': payload['analysis'].get('features', []),
        'actions': payload['analysis']['actions'],
        'priority': payload['priority']
    }
    
    # Create in multiple systems
    github_repo = create_github_repo(project)
    notion_page = create_notion_project(project)
    linear_project = create_linear_project(project)
    
    # Link everything together
    link_project_resources(github_repo, notion_page, linear_project)
```

## 🎉 Success Metrics

Monitor these metrics to ensure webhook integration success:

- **Webhook delivery rate** - 95%+ delivery success
- **Response time** - <500ms average response time
- **Error rate** - <5% error rate
- **Processing time** - <2s end-to-end processing
- **Integration accuracy** - Correct category routing

---

**Ready to automate your thought processing? Start with webhook.site testing!** 🚀

*For general deployment help, see [DEPLOYMENT.md](./DEPLOYMENT.md)*