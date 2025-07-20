# 🧠 MindDump - AI-Powered Thought Organization & Automation

**Transform your scattered thoughts into organized, actionable insights with Claude AI and intelligent automation routing.**

MindDump is an advanced AI-powered application that captures thoughts via voice or text, automatically categorizes them using a sophisticated 15-category system, logs everything to Google Sheets for centralized tracking, and routes thoughts to external automation systems through secure webhooks.

## ✨ Key Features Overview

### 🎤 **Advanced Voice-to-Text Input**
- **Browser-native speech recognition** using Web Speech API
- **Real-time transcription** with live feedback and interim results
- **Cross-platform compatibility** (desktop and mobile browsers)
- **Continuous listening mode** for hands-free operation
- **Privacy-focused** - all processing happens locally in your browser

### 🤖 **AI-Powered 15-Category Classification System**

Our intelligent categorization system automatically analyzes your thoughts and assigns them to one of 15 specialized categories:

| Category | Description | Example Use Cases |
|----------|-------------|-------------------|
| **Goal** | Personal & professional objectives | "I want to lose 20 pounds this year", "Launch my startup by Q3" |
| **Habit** | Routines & behavioral tracking | "Start meditating daily", "Track water intake" |
| **ProjectIdea** | Apps, tools & business concepts | "Build a task management app", "Start a YouTube channel" |
| **Task** | Simple, actionable to-dos | "Send email to client", "Buy groceries" |
| **Reminder** | Time-based notes & scheduling | "Call mom on Sunday", "Dentist appointment next week" |
| **Note** | General information & references | "Meeting notes", "Random observations" |
| **Insight** | Personal realizations & reflections | "I work better in the morning", "Need to improve communication" |
| **Learning** | Study topics & research leads | "Learn React hooks", "Research competitor pricing" |
| **Career** | Job goals & professional development | "Apply for senior role", "Network with industry leaders" |
| **Metric** | Self-tracking data & measurements | "Sleep: 7.5 hours", "Mood: 8/10 today" |
| **Idea** | Creative thoughts & brainstorming | "Blog post about productivity", "Gift idea for spouse" |
| **System** | Frameworks, workflows & organization | "Morning routine optimization", "Email management system" |
| **Automation** | Specific automations & bots | "Auto-backup photos", "Slack notification bot" |
| **Person** | People notes & relationship management | "John prefers email", "Follow up with Sarah about proposal" |
| **Sensitive** | Private, non-routable entries | Personal thoughts that stay private and aren't sent to external systems |

### 📊 **Centralized Logging & Advanced Analytics**
- **Master Google Sheets integration** - all thoughts logged to a central spreadsheet
- **Real-time thought pattern analysis** with category distribution insights
- **Productivity metrics tracking** including sentiment analysis and urgency assessment
- **Weekly/monthly trend analysis** to understand your thinking patterns
- **Export capabilities** for deeper analysis in external tools
- **Privacy controls** - sensitive thoughts are never shared externally

### 🔗 **Secure Webhook Automation Routing**
- **Category-specific webhook endpoints** for targeted automation workflows
- **n8n, Zapier, Make.com integration** with pre-built templates
- **Custom automation workflows** tailored to your specific needs
- **Secure authentication tokens** with signature validation
- **Non-blocking background processing** - webhook failures don't interrupt your workflow
- **Retry logic and error handling** for reliable delivery

### 🚀 **Intelligent Project Management**
For thoughts categorized as "ProjectIdea":
- **Auto-generated project documentation** with technical specifications
- **GitHub repository creation** with proper README and issue templates
- **Tech stack recommendations** based on project requirements
- **Feature breakdown analysis** with implementation roadmaps
- **Project-specific Google Sheets** for detailed tracking and collaboration

### 🔐 **Enterprise-Grade Security**
- **Supabase authentication** with GitHub OAuth integration
- **Row-level security (RLS) policies** ensuring users only see their own data
- **Input sanitization and validation** preventing XSS and injection attacks
- **Rate limiting and abuse prevention** (20 req/min for thoughts, 60 req/min general)
- **Secure webhook signatures** using HMAC authentication
- **Sensitive category privacy protection** - never routed to external systems

## 🏗️ Technical Architecture

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, Framer Motion
- **UI Components**: shadcn/ui with custom cyberpunk theming
- **Backend**: Next.js API routes with comprehensive error handling
- **Database**: Supabase PostgreSQL with advanced schema design
- **AI Processing**: Anthropic Claude 3.5 Sonnet for intelligent analysis
- **Authentication**: Supabase Auth with GitHub OAuth
- **External Integrations**: Google Sheets API, secure webhook system
- **Deployment**: Vercel with optimized build configuration

### Core Components Architecture

#### **MindDumpInput Component**
- Voice-enabled text input with real-time feedback
- Category selection with visual indicators
- Cyberpunk-themed UI with smooth animations
- Keyboard shortcuts (Ctrl+Enter to submit)
- Character count and validation

#### **Dashboard Component**
- Real-time analytics and insights
- Thought management interface with filtering
- Category distribution visualization
- Recent activity feeds
- Performance metrics display

#### **AI Processing Pipeline**
- Claude 3.5 Sonnet integration for thought analysis
- Automatic categorization with confidence scoring
- Sentiment analysis and urgency assessment
- Action item extraction
- Expandable thought enhancement

#### **Webhook System**
- Secure routing based on thought categories
- Signature validation for webhook security
- Retry logic with exponential backoff
- Rate limiting and abuse prevention
- Comprehensive error logging

### Database Schema Design

```sql
-- Enhanced thoughts table with new categorization
CREATE TABLE thoughts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    raw_text TEXT NOT NULL,
    category thought_type NOT NULL,
    subcategory TEXT,
    priority priority_level DEFAULT 'medium',
    title TEXT,
    summary TEXT,
    urgency urgency_level DEFAULT 'none',
    sentiment sentiment_type DEFAULT 'neutral',
    expanded_text TEXT,
    actions JSONB DEFAULT '[]',
    auto_title TEXT, -- AI-generated title
    auto_summary TEXT, -- AI-generated summary
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project ideas with enhanced metadata
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    thought_id UUID REFERENCES thoughts(id),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    readme TEXT,
    overview TEXT,
    sheets_url TEXT,
    github_url TEXT,
    category TEXT DEFAULT 'general',
    tech_stack JSONB DEFAULT '[]',
    features JSONB DEFAULT '[]',
    urgency urgency_level DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics for tracking thought patterns
CREATE TABLE category_analytics (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    category thought_type NOT NULL,
    subcategory TEXT,
    total_thoughts INTEGER DEFAULT 0,
    avg_word_count DECIMAL,
    sentiment_distribution JSONB DEFAULT '{}',
    priority_distribution JSONB DEFAULT '{}',
    urgency_distribution JSONB DEFAULT '{}',
    thoughts_this_week INTEGER DEFAULT 0,
    thoughts_this_month INTEGER DEFAULT 0,
    avg_thoughts_per_day DECIMAL DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 How MindDump Works: Complete Workflow

### 1. **Thought Capture**
- User inputs thought via voice (Web Speech API) or text
- Real-time transcription provides immediate feedback
- Optional manual category selection or auto-detection

### 2. **AI Analysis & Classification**
```typescript
// Claude AI processes the thought
const analysis = await analyzeThought(userInput);
// Returns: category, subcategory, priority, urgency, sentiment, 
//          expandedThought, actionItems, title, summary
```

### 3. **Secure Storage**
- Thought saved to Supabase with RLS policies
- Metadata fields populated from AI analysis
- User-specific analytics updated in real-time

### 4. **Centralized Logging**
```typescript
// All thoughts logged to master Google Sheet
await logToMasterSheet({
    rawInput: thought.raw_text,
    category: thought.category,
    subcategory: thought.subcategory,
    priority: thought.priority,
    expandedText: thought.expanded_text,
    timestamp: new Date().toISOString()
});
```

### 5. **Automation Routing**
- Category-specific webhooks triggered (except for 'Sensitive' category)
- Secure payload with HMAC signature
- Non-blocking background processing
- Retry logic for failed deliveries

### 6. **Project Enhancement** (for ProjectIdea category)
- Dedicated Google Sheet created for project tracking
- GitHub repository setup with documentation
- Tech stack analysis and recommendations
- Feature breakdown and implementation roadmap

### 7. **Analytics & Insights**
- Real-time category distribution analysis
- Sentiment and urgency trend tracking
- Weekly/monthly pattern recognition
- Productivity insights and recommendations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Anthropic API key (Claude)
- Google Cloud project with Sheets API enabled
- GitHub account for OAuth (optional)

### Quick Setup (15 minutes)
```bash
# 1. Clone and install
git clone <repository-url>
cd apps/minddumpapp
npm install

# 2. Environment setup (see ENVIRONMENT_SETUP.md)
cp .env.local.example .env.local
# Edit .env.local with your API keys

# 3. Database setup
# Run SQL scripts in Supabase dashboard

# 4. Start development server
npm run dev
```

### Environment Variables
```bash
# Required - Core Functionality
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_32_character_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Optional - Google Sheets Integration
GOOGLE_SHEETS_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_MASTER_ID=your_master_spreadsheet_id

# Optional - Webhook Automation
WEBHOOKS_ENABLED=true
WEBHOOK_AUTH_TOKEN=your_secure_auth_token
WEBHOOK_SECRET=your_32_character_webhook_secret

# Category-specific webhook URLs
WEBHOOK_GOAL=https://your-automation-platform.com/webhook/goal
WEBHOOK_PROJECTIDEA=https://your-automation-platform.com/webhook/project
WEBHOOK_TASK=https://your-automation-platform.com/webhook/task
# ... (see WEBHOOK_INTEGRATION.md for complete list)
```

## 📚 Documentation Suite

### Setup & Deployment
- **[AI_INTEGRATION.md](./AI_INTEGRATION.md)** - Claude AI integration details
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Complete database schema documentation
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - Environment variables reference
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide

### Features & Usage
- **[VOICE_FEATURES.md](./VOICE_FEATURES.md)** - Voice-to-text implementation guide
- **[WEBHOOKS.md](./WEBHOOKS.md)** - Webhook routing system documentation
- **[ANALYTICS.md](./ANALYTICS.md)** - Analytics dashboard and insights
- **[USER_GUIDE.md](./USER_GUIDE.md)** - Complete user guide with 15-category system

### Support & Troubleshooting
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures and coverage

## 🔒 Security & Privacy

### Security Measures
- **Row Level Security (RLS)** on all database tables
- **Input sanitization** and validation for all user inputs
- **Rate limiting** (20 req/min for thoughts, 60 req/min general)
- **Secure webhook signatures** using HMAC-SHA256
- **HTTPS enforcement** for all communications
- **Content Security Policy** headers for XSS protection

### Privacy Protection
- **Sensitive category** thoughts are never sent to external webhooks
- **Local voice processing** - speech recognition happens in your browser
- **No user tracking** - we don't collect personal analytics or usage data
- **Data ownership** - export and delete your data anytime
- **Granular permissions** - control which categories route to external systems

## 🎯 Advanced Use Cases

### Personal Productivity System
- **Daily thought capture** with voice input for quick brain dumps
- **Automatic task extraction** from rambling thoughts
- **Goal tracking** with progress insights and analytics
- **Habit formation** support with streak tracking

### Creative Project Management
- **Idea collection** with automatic categorization and expansion
- **Project development** from concept to GitHub repository
- **Collaboration** through shared Google Sheets
- **Progress tracking** with visual analytics

### Business Intelligence
- **Team thought aggregation** for innovation tracking
- **Market research** notes organization and analysis
- **Customer feedback** categorization and routing
- **Competitive intelligence** gathering and structuring

### Integration with External Tools
- **Notion** - route thoughts to specific databases
- **Todoist** - automatic task creation from thoughts
- **Slack** - team notification for important insights
- **Zapier/n8n** - complex workflow automation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Update documentation for new features
- Follow the established code style and conventions

## 📞 Support & Community

- **🐛 Bug Reports**: [GitHub Issues](https://github.com/coreybello/crizzelwebsite/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/coreybello/crizzelwebsite/discussions)
- **📖 Documentation**: Complete guides in `/docs` folder
- **🆘 Urgent Issues**: Create issue with "urgent" label

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Built with [Claude Code](https://claude.ai/code)** using Claude Flow swarm coordination
- **UI components** from [shadcn/ui](https://ui.shadcn.com/)
- **Authentication** powered by [Supabase](https://supabase.com/)
- **AI processing** by [Anthropic Claude](https://anthropic.com/)
- **Voice recognition** using Web Speech API

---

**Transform your scattered thoughts into organized, automated action. Start your MindDump journey today!** 🧠✨

*Built with Claude Flow swarm coordination • Powered by Claude AI • Secured by Supabase • Designed for productivity*