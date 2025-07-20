# 🧠 MindDump - AI-Powered Thought Organization & Automation

Transform your scattered thoughts into organized, actionable insights using Claude AI and intelligent automation routing. MindDump captures thoughts via voice or text, categorizes them using 15 specialized categories, logs everything to Google Sheets, and routes thoughts to external automation systems.

**Part of the Crizzel Multi-App Ecosystem**  
Repository: [coreybello/crizzelwebsite](https://github.com/coreybello/crizzelwebsite)  
Location: `apps/minddumpapp/`

## ✨ Core Features

### 🎤 **Voice-to-Text Input**
- Browser-based speech recognition
- Real-time transcription
- Cross-platform compatibility
- Natural language processing

### 🤖 **AI-Powered 15-Category System**
- **Goal** - Personal & professional objectives
- **Habit** - Routines & behavioral tracking  
- **ProjectIdea** - Apps, tools & business concepts
- **Task** - Simple, actionable to-dos
- **Reminder** - Time-based notes & scheduling
- **Note** - General information & references
- **Insight** - Personal realizations & reflections
- **Learning** - Study topics & research leads
- **Career** - Job goals & professional development
- **Metric** - Self-tracking data & measurements
- **Idea** - Creative thoughts & brainstorming
- **System** - Frameworks, workflows & organization
- **Automation** - Specific automations & bots
- **Person** - People notes & relationship management
- **Sensitive** - Private, non-routable entries

### 📊 **Centralized Logging & Analytics**
- Master Google Sheets integration
- Real-time thought pattern analysis
- Category distribution insights
- Productivity metrics tracking
- Export capabilities for deeper analysis

### 🔗 **Webhook Automation Routing**
- Category-specific webhook endpoints
- n8n, Zapier, Make.com integration
- Custom automation workflows
- Secure authentication tokens
- Non-blocking background processing

### 🚀 **Intelligent Project Management**
- Auto-generated project documentation
- GitHub repository creation
- Tech stack recommendations
- Feature breakdown analysis
- Project-specific Google Sheets

### 🔐 **Enterprise-Grade Security**
- Supabase authentication with GitHub OAuth
- Row-level security (RLS) policies
- Input sanitization and validation
- Rate limiting and abuse prevention
- Sensitive category privacy protection

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Anthropic API key (Claude)
- GitHub account and personal access token (optional, for repo creation)

### 1. Development Setup

**From project root:**
```bash
# Install all dependencies
npm run install-all

# Start MindDump in development
npm run dev:minddump

# Build MindDump for production
npm run build:minddump
```

**From app directory:**
```bash
cd apps/minddumpapp
npm install
npm run dev
```

### 2. Environment Setup

Create `.env.local` in `apps/minddumpapp/` with these variables:

#### **Required - Core Functionality**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Claude AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key

# Authentication Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_32_character_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

#### **Optional - Google Sheets Integration**
```bash
# Google Sheets API (for centralized logging)
GOOGLE_SHEETS_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_MASTER_ID=your_master_spreadsheet_id
```

#### **Optional - Webhook Automation**
```bash
# Webhook Configuration
WEBHOOKS_ENABLED=true
WEBHOOK_AUTH_TOKEN=your_secure_auth_token

# Category-specific webhook URLs
WEBHOOK_GOAL=https://webhook.site/placeholder-goal
WEBHOOK_PROJECTIDEA=https://webhook.site/placeholder-project
WEBHOOK_TASK=https://webhook.site/placeholder-task
# ... additional webhook URLs for each category
```

**📋 For complete environment setup:** See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)

### 2. Database Setup

1. Run the schema in your Supabase SQL editor:
   ```sql
   -- See supabase/schema.sql for complete setup
   ```

2. Enable GitHub OAuth in Supabase:
   - Go to Authentication > Providers
   - Enable GitHub provider
   - Add your GitHub OAuth app credentials

### 3. Run the Application

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to start using MindDump!

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Supabase PostgreSQL
- **AI**: Claude 3.5 Sonnet via Anthropic API
- **Auth**: Supabase Auth with GitHub OAuth
- **Deployment**: Vercel (recommended)

### Core Components

- **MindDumpInput**: Voice-enabled text input with categorization
- **Dashboard**: Analytics and thought management interface
- **AI Processing**: Claude integration for thought analysis
- **GitHub Integration**: Automated repository creation for projects

## 🔄 How It Works

1. **Capture**: Input thoughts naturally via voice or text
2. **Analyze**: Claude AI processes and assigns one of 15 specialized categories
3. **Log**: All thoughts automatically logged to master Google Sheet
4. **Route**: Category-specific webhooks trigger external automation workflows
5. **Enhance**: Project ideas get dedicated sheets, GitHub repos, and documentation
6. **Track**: Real-time analytics and insights on thought patterns
7. **Automate**: External systems (n8n, Zapier, etc.) process thoughts for actions

## 📊 Database Schema

```sql
-- Core tables: thoughts, projects, todos
-- Features: RLS policies, indexes, triggers
-- See supabase/schema.sql for details
```

## 🚀 Deployment

### Quick Deploy (15 minutes)
```bash
# 1. Fork repository
# 2. Deploy to Vercel with root directory: apps/minddumpapp
# 3. Add environment variables (see ENVIRONMENT_SETUP.md)
# 4. Configure external integrations
```

### Comprehensive Deployment
- **📚 Full Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **🔧 Environment Setup**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **🔗 Webhook Integration**: [WEBHOOK_INTEGRATION.md](./WEBHOOK_INTEGRATION.md)
- **🛠️ Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## 🔧 Configuration

### Supabase Setup

1. Create new Supabase project
2. Run schema from `supabase/schema.sql`
3. Enable GitHub OAuth provider
4. Copy keys to `.env.local`

### Claude API Setup

1. Get API key from Anthropic Console
2. Add to `ANTHROPIC_API_KEY` in environment

### GitHub Integration

1. Create GitHub OAuth App
2. Set Authorization callback URL: `https://crizzel.xyz/minddump/auth/callback`
3. Create Personal Access Token with `repo` scope
4. Add credentials to environment variables

## 🎯 Advanced Features

### AI Processing Pipeline
Claude 3.5 Sonnet provides:
- **15-category classification** with subcategories and priority levels
- **Intelligent expansion** of brief thoughts into detailed analyses
- **Action extraction** with specific, actionable steps
- **Tech stack recommendations** for project ideas
- **Feature breakdown** and implementation guidance
- **Sentiment analysis** and urgency assessment

### Automation Integration
**Webhook System:**
- Category-specific routing to external systems
- Support for n8n, Zapier, Make.com workflows
- Secure authentication with bearer tokens
- Non-blocking background processing
- Retry logic and error handling

**Google Sheets Integration:**
- Centralized logging of all thoughts
- Project-specific spreadsheets for ideas
- Real-time collaboration capabilities
- Export functionality for analysis

### Voice Input System
- **Browser-native** Web Speech API integration
- **Real-time transcription** with live feedback
- **Cross-platform support** (desktop and mobile)
- **Continuous listening** mode for hands-free operation
- **Privacy-focused** - processing happens locally

### GitHub Integration
For ProjectIdea category:
- **Auto-repository creation** with proper documentation
- **README generation** with project overview and tech stack
- **Issue templates** and project structure
- **Integration linking** back to MindDump records

## 🔒 Security & Privacy

### Security Features
- **Row Level Security (RLS)** on all database tables
- **Input sanitization** and validation for all user inputs
- **Rate limiting** (20 req/min for thoughts, 60 req/min for general)
- **HTTPS enforcement** for all communications
- **Secure headers** (XSS protection, content type validation)
- **Authentication tokens** with proper expiration

### Privacy Protection
- **Sensitive category** - never sent to external webhooks
- **Local voice processing** - speech recognition happens in browser
- **No user tracking** - we don't collect personal analytics
- **Data control** - export and delete your data anytime
- **Granular permissions** - choose which categories route externally

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.ai/code) using Claude Flow swarm coordination
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication powered by [Supabase](https://supabase.com/)
- AI processing by [Anthropic Claude](https://anthropic.com/)

## 📚 Documentation

### Setup & Deployment
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - Environment variables reference
- **[QUICK_START.md](../../QUICK_START.md)** - 15-minute setup guide

### Integration & Usage
- **[USER_GUIDE.md](./USER_GUIDE.md)** - Complete user guide with 15-category system
- **[WEBHOOK_INTEGRATION.md](./WEBHOOK_INTEGRATION.md)** - Webhook automation setup
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference

### Support & Troubleshooting
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - Community support and ideas

## 📞 Support

- **🐛 Bug Reports**: Create GitHub issue with details
- **💡 Feature Requests**: Use GitHub discussions
- **📖 Documentation**: Check guides above
- **🆘 Urgent Issues**: Create issue with "urgent" label

---

## 🎉 Ready to Get Started?

1. **📖 Read the [User Guide](./USER_GUIDE.md)** to understand the 15-category system
2. **🚀 Follow the [Deployment Guide](./DEPLOYMENT.md)** for complete setup
3. **🔗 Set up [Webhook Integration](./WEBHOOK_INTEGRATION.md)** for automation
4. **🎤 Start capturing thoughts** and watch the magic happen!

---

**Transform your scattered thoughts into organized, automated action. Start your MindDump journey today!** 🧠✨

*Built with Claude Flow swarm coordination • Powered by Claude AI • Secured by Supabase*