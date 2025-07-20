# 🧠 MindDump AI Thought Organizer

> **Intelligent voice-to-text thought capture with AI categorization and automated routing**

MindDump is an advanced AI-powered application that captures your thoughts through voice or text input, intelligently categorizes them using Claude AI, logs everything in Google Sheets, and routes to external automation systems via webhooks.

## 🚀 Key Features

### 🎙️ Voice-to-Text Input
- **Browser-based speech recognition** for natural thought capture
- **Real-time transcription** with high accuracy
- **Seamless text submission** to AI processing pipeline

### 🤖 AI-Powered Categorization
- **Claude AI integration** for intelligent thought analysis
- **15-category classification system** covering all life aspects
- **Smart subcategory and priority assignment**
- **Context-aware content expansion**

### 📊 Centralized Logging
- **Google Sheets integration** for comprehensive data storage
- **Structured data format** with timestamps and metadata
- **Searchable historical record** of all thoughts and insights
- **Export capabilities** for further analysis

### 🔗 Automated Routing
- **Webhook-based automation** for downstream processing
- **Category-specific routing** to external systems
- **n8n workflow integration** ready
- **Flexible webhook configuration**

## 📂 Architecture Overview

```
MindDump App Flow:
Voice/Text Input → AI Analysis → Categorization → Google Sheets + Webhooks
     ↓                ↓              ↓                    ↓
  Browser API     Claude AI    15 Categories        External Systems
```

## 🗂️ 15-Category Classification System

MindDump intelligently routes your thoughts into these organized categories:

| Category | Icon | Description | Use Cases |
|----------|------|-------------|-----------|
| **Goal** | 🚀 | Personal/professional objectives | "Launch my podcast by Q2" |
| **Habit** | 📈 | Routine building & tracking | "Meditate 10 minutes daily" |
| **Project Idea** | 💡 | Apps, tools, business concepts | "Chrome extension for expense tracking" |
| **Task** | 🛠️ | Actionable to-dos | "Call dentist to schedule appointment" |
| **Reminder** | 📅 | Time-based scheduling needs | "Mom's birthday next Tuesday" |
| **Note** | 📓 | General information capture | "Recipe for grandmother's cookies" |
| **Insight** | 🧠 | Personal realizations | "I'm more productive in the morning" |
| **Learning** | 📚 | Study topics & research | "Learn about quantum computing" |
| **Career** | 🧑‍💼 | Professional development | "Apply for senior developer roles" |
| **Metric** | 📊 | Self-tracking data | "Slept 7.5 hours, felt energized" |
| **Idea** | 🧠 | Creative thoughts | "What if cars could fly?" |
| **System** | 🧩 | Workflows & frameworks | "Morning routine optimization" |
| **Automation** | 🔁 | Bot & automation concepts | "Auto-sort emails by priority" |
| **Person** | 💬 | People & relationship notes | "John mentioned startup idea" |
| **Sensitive** | 🔒 | Private, non-routable content | "Personal diary entries" |

## 🔧 Technical Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives

### AI & Processing
- **Claude AI** - Advanced thought analysis and categorization
- **Browser Speech Recognition API** - Voice-to-text conversion
- **Anthropic API** - Direct Claude integration

### Data & Storage
- **Supabase** - Authentication and user management
- **Google Sheets API** - Centralized data logging
- **SQLite** - Local session storage

### Automation
- **Webhook System** - External integrations
- **n8n Ready** - Workflow automation platform support
- **REST API** - Programmatic access

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 18+
npm or yarn
Google Cloud Console access
Anthropic API key
Supabase project
```

### Installation
```bash
# Clone repository
git clone https://github.com/coreybello/crizzelwebsite.git
cd crizzelwebsite/apps/minddumpapp

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Environment Configuration
```env
# AI Configuration
ANTHROPIC_API_KEY=your_claude_api_key

# Authentication
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Sheets Integration
GOOGLE_SHEETS_API_KEY=your_google_api_key
GOOGLE_SHEETS_ID=your_sheet_id

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret
```

### Development
```bash
# Start development server
npm run dev

# Open in browser
http://localhost:3000
```

## 📊 Data Structure

### Google Sheets Schema
```typescript
interface MindDumpEntry {
  timestamp: string        // ISO 8601 format
  rawInput: string        // Original voice/text input
  category: string        // AI-assigned category
  subcategory?: string    // Optional subcategory
  priority?: string       // High/Medium/Low
  expandedText?: string   // AI-enhanced content
  userId: string          // User identifier
  sessionId: string       // Capture session ID
}
```

### Webhook Payload
```json
{
  "input": "I want to build a Chrome extension for tracking expenses",
  "category": "Project Idea",
  "subcategory": "Web App",
  "priority": "Medium",
  "timestamp": "2025-07-20T14:32:00Z",
  "expanded": "Build a Chrome extension that allows manual and automatic expense categorization from bank exports, with receipt scanning and budget tracking features.",
  "userId": "user_abc123",
  "sessionId": "session_xyz789"
}
```

## 🔗 Webhook Configuration

### Default Webhook URLs
```typescript
const WEBHOOKS = {
  Goal: "https://webhook.site/placeholder-goal",
  Habit: "https://webhook.site/placeholder-habit",
  ProjectIdea: "https://webhook.site/placeholder-project",
  Task: "https://webhook.site/placeholder-task",
  Reminder: "https://webhook.site/placeholder-reminder",
  Note: "https://webhook.site/placeholder-note",
  Insight: "https://webhook.site/placeholder-insight",
  Learning: "https://webhook.site/placeholder-learning",
  Career: "https://webhook.site/placeholder-career",
  Metric: "https://webhook.site/placeholder-metric",
  Idea: "https://webhook.site/placeholder-idea",
  System: "https://webhook.site/placeholder-system",
  Automation: "https://webhook.site/placeholder-automation",
  Person: "https://webhook.site/placeholder-person",
  Sensitive: "https://webhook.site/placeholder-sensitive"
}
```

### Custom Webhook Setup
1. **Replace placeholder URLs** with your actual endpoints
2. **Configure authentication** headers in webhook settings
3. **Test webhook delivery** using the built-in testing tools
4. **Monitor webhook logs** for successful delivery

## 🎯 Use Cases

### Personal Productivity
- **Daily journaling** with automatic categorization
- **Goal tracking** with progress insights
- **Habit formation** with automated reminders
- **Task management** integration with productivity tools

### Professional Development
- **Meeting notes** with action item extraction
- **Learning path** documentation and tracking
- **Career planning** with milestone tracking
- **Project ideation** with feasibility analysis

### Creative Workflows
- **Idea capture** during inspiration moments
- **Story development** with character and plot tracking
- **Research organization** with source management
- **Creative project** planning and execution

### Business Intelligence
- **Customer feedback** categorization and analysis
- **Market research** insight organization
- **Strategic planning** with goal alignment
- **Team communication** pattern analysis

## 🔐 Security & Privacy

### Data Protection
- **End-to-end encryption** for sensitive categories
- **Local-first approach** with optional cloud sync
- **Granular privacy controls** per category
- **GDPR compliance** with data export/deletion

### Authentication
- **GitHub OAuth** via Supabase Auth
- **Multi-factor authentication** support
- **Session management** with automatic logout
- **API key rotation** for enhanced security

### Webhook Security
- **HMAC signature verification** for webhook authenticity
- **Rate limiting** to prevent abuse
- **IP allowlisting** for trusted sources
- **Encrypted payload transmission**

## 📈 Analytics & Insights

### Built-in Analytics
- **Thought pattern analysis** over time
- **Category distribution** visualizations
- **Productivity correlation** tracking
- **Goal achievement** metrics

### Export Capabilities
- **CSV export** for data analysis
- **JSON API** for custom integrations
- **Backup generation** for data portability
- **Analytics dashboard** with key metrics

## 🚀 Deployment

### Production Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
npm run deploy

# Configure domain
# Update environment variables
# Test webhook endpoints
```

### Docker Deployment
```bash
# Build Docker image
docker build -t minddump-app .

# Run container
docker run -p 3000:3000 minddump-app
```

### Environment-Specific Configuration
- **Development**: Local testing with mock webhooks
- **Staging**: Full integration testing with test data
- **Production**: Live webhooks with real automation systems

## 🛠️ Development Guide

### Code Organization
```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── ui/             # Basic UI components
│   ├── forms/          # Form components
│   └── features/       # Feature-specific components
├── lib/                # Utility libraries
│   ├── ai/             # Claude AI integration
│   ├── sheets/         # Google Sheets API
│   └── webhooks/       # Webhook handling
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
└── utils/              # Helper functions
```

### Adding New Categories
1. **Update category enum** in `src/types/categories.ts`
2. **Add webhook URL** in webhook configuration
3. **Update AI prompt** to recognize new category
4. **Add category icon** and description
5. **Test categorization** accuracy

### Custom AI Prompts
```typescript
// Customize AI categorization logic
const categoryPrompt = `
Analyze this thought and categorize it:
- Consider context and intent
- Assign appropriate priority level
- Suggest relevant subcategories
- Expand content if helpful

Categories: ${CATEGORIES.join(', ')}
Input: "${userInput}"
`;
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "AI Categorization"

# Coverage report
npm run test:coverage
```

### Integration Tests
```bash
# Test Google Sheets integration
npm run test:sheets

# Test webhook delivery
npm run test:webhooks

# Test AI categorization
npm run test:ai
```

### Manual Testing
- **Voice input accuracy** across different accents
- **AI categorization consistency** with edge cases
- **Webhook delivery reliability** under load
- **User interface responsiveness** on mobile devices

## 📚 API Documentation

### Core Endpoints
```typescript
// Capture thought
POST /api/capture
{
  "input": "string",
  "method": "voice" | "text"
}

// Get categories
GET /api/categories

// Webhook status
GET /api/webhooks/status

// Export data
GET /api/export?format=csv&dateRange=30d
```

### Webhook Management
```typescript
// Test webhook
POST /api/webhooks/test
{
  "category": "Goal",
  "sampleData": {...}
}

// Update webhook URL
PUT /api/webhooks/configure
{
  "category": "Goal",
  "url": "https://your-endpoint.com/goal"
}
```

## 🤝 Contributing

### Development Setup
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Install dependencies**: `npm install`
4. **Run tests**: `npm test`
5. **Create pull request**

### Contribution Guidelines
- **Follow TypeScript standards** with strict mode
- **Write comprehensive tests** for new features
- **Update documentation** for API changes
- **Follow conventional commit** messages
- **Test across browsers** for voice input compatibility

## 📝 Changelog

### v1.0.0 (Latest)
- ✅ Initial release with core functionality
- ✅ 15-category AI classification system
- ✅ Voice-to-text input with browser API
- ✅ Google Sheets integration
- ✅ Webhook routing system
- ✅ Supabase authentication
- ✅ Responsive design for all devices

### Upcoming Features
- 🔄 Advanced AI context awareness
- 🔄 Mobile app with offline support
- 🔄 Advanced analytics dashboard
- 🔄 Team collaboration features
- 🔄 API rate limiting and quotas
- 🔄 Advanced webhook retry logic

## 📞 Support

### Documentation
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions
- **[API Reference](./API_REFERENCE.md)** - Complete API documentation
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions

### Community
- **GitHub Issues** - Bug reports and feature requests
- **Discussion Forum** - Community support and ideas
- **Developer Chat** - Real-time development discussion

### Professional Support
- **Consulting Services** - Custom implementation assistance
- **Enterprise Features** - Advanced functionality for teams
- **Priority Support** - Dedicated technical assistance

---

**Transform your thoughts into organized, actionable insights with MindDump's intelligent AI categorization system.** 🧠✨

*Built with ❤️ by [Corey Bello](https://github.com/coreybello) using Claude AI and modern web technologies.*