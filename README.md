# 🧠 MindDump App - AI-Powered Thought Organizer

An intelligent thought organization system powered by AI that captures, categorizes, and routes your ideas through a 15-category classification system.

## ✨ Features

### 🎤 Voice-to-Text Input
- Browser-based speech recognition
- Real-time voice capture and transcription
- Hands-free thought capture

### 🤖 AI-Powered Categorization  
- 15 specialized thought categories
- Claude AI integration for intelligent classification
- Contextual understanding of thought patterns

### 📊 Centralized Logging
- Google Sheets integration for thought tracking
- Real-time data synchronization
- Comprehensive thought history

### 🔗 Webhook Routing
- External automation system integration
- Custom routing based on category
- Seamless workflow connections

### 📈 Analytics Dashboard
- Real-time category insights
- Thought pattern analysis
- Usage statistics and trends

### 🔐 Secure Authentication
- Supabase authentication system
- GitHub OAuth integration
- Secure user sessions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- Supabase account
- Anthropic API key
- Google Sheets API credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/coreybello/minddumpapp.git
cd minddumpapp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic AI (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google Sheets API
GOOGLE_SHEETS_PRIVATE_KEY=your_google_sheets_private_key
GOOGLE_SHEETS_CLIENT_EMAIL=your_google_sheets_client_email
GOOGLE_SHEETS_SHEET_ID=your_google_sheets_id

# Webhook Configuration
WEBHOOK_URL=your_webhook_endpoint

# GitHub OAuth (for Supabase)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## 🏗️ Project Structure

```
minddumpapp/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Main dashboard
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ui/               # UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── shared/           # Shared components
├── lib/                  # Utility libraries
│   ├── supabase/        # Supabase client
│   ├── anthropic/       # Claude AI integration
│   └── sheets/          # Google Sheets integration
├── types/               # TypeScript definitions
├── hooks/               # Custom React hooks
└── public/             # Static assets
```

## 🎯 The 15 Categories

MindDump organizes thoughts into these specialized categories:

1. **💡 Ideas & Innovation** - Creative concepts and brainstorms
2. **📋 Tasks & Todo** - Action items and to-do lists  
3. **🎯 Goals & Objectives** - Long-term and short-term goals
4. **📚 Learning & Education** - Knowledge and study notes
5. **💼 Work & Professional** - Career and work-related thoughts
6. **💰 Financial & Investment** - Money and investment ideas
7. **🏠 Personal & Lifestyle** - Personal life and lifestyle thoughts
8. **🤝 Relationships & Social** - Social connections and relationships
9. **🏃 Health & Fitness** - Wellness and fitness tracking
10. **🎨 Creative & Artistic** - Creative projects and artistic ideas
11. **🔧 Technical & Development** - Technology and development notes
12. **📈 Business & Strategy** - Business planning and strategy
13. **🌍 Travel & Adventure** - Travel plans and adventure ideas
14. **📖 Quotes & Inspiration** - Inspirational content and quotes
15. **🤔 Random & Miscellaneous** - Everything else

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking

# Utilities
npm run clean        # Clean build artifacts
npm run preview      # Build and preview locally
```

### API Endpoints

- `POST /api/thoughts` - Submit new thoughts
- `GET /api/thoughts` - Retrieve user thoughts
- `POST /api/categorize` - AI categorization endpoint
- `POST /api/webhooks` - Webhook routing
- `GET /api/analytics` - Thought analytics

## 📊 Analytics & Insights

The dashboard provides:
- **Category Distribution** - See which categories you use most
- **Thought Timeline** - Track your thinking patterns over time
- **Word Cloud** - Visual representation of common terms
- **Export Options** - Download your data in various formats

## 🔐 Security Features

- **Secure Authentication** - Supabase + GitHub OAuth
- **Data Encryption** - All sensitive data encrypted
- **Rate Limiting** - API protection against abuse
- **CORS Protection** - Secure cross-origin requests
- **Input Validation** - All inputs validated and sanitized

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy automatically on push

```bash
# Or deploy manually
npx vercel --prod
```

### Environment Setup for Production

Ensure all environment variables are set in your deployment platform:
- Supabase credentials
- Anthropic API key
- Google Sheets API credentials
- GitHub OAuth credentials

## 🔗 Integrations

### Google Sheets
All thoughts are automatically logged to a Google Sheets document for backup and analysis.

### Webhook System
Thoughts can be routed to external systems via webhooks based on category.

### Anthropic Claude
AI-powered categorization using Claude's advanced language understanding.

### Supabase
Complete authentication and data management solution.

## 📈 Performance

- **Optimized Bundle Size** - Code splitting and tree shaking
- **Caching Strategy** - Intelligent caching for better performance
- **Rate Limiting** - Prevents API abuse
- **Image Optimization** - Next.js automatic image optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: coreybello94@gmail.com
- **Issues**: [GitHub Issues](https://github.com/coreybello/minddumpapp/issues)
- **Documentation**: Available in the `/docs` directory

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics and insights
- [ ] Team collaboration features
- [ ] API rate limiting improvements
- [ ] Enhanced voice recognition
- [ ] Multi-language support

---

**Built with Next.js, Supabase, and Claude AI** 🧠  
**Powered by intelligent thought organization** 🚀