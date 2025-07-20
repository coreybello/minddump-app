# 📊 Analytics & Insights Documentation - MindDump

## Overview

MindDump provides comprehensive analytics to help users understand their thinking patterns, productivity trends, and mental state over time. The analytics system tracks 15 different thought categories, sentiment patterns, priority distributions, and generates actionable insights for personal development and productivity optimization.

## Analytics Architecture

### Core Analytics Components
- **Category Analytics** - Track distribution across 15 thought categories
- **Sentiment Analysis** - Monitor emotional patterns over time
- **Priority & Urgency Tracking** - Understand task prioritization habits
- **Productivity Metrics** - Measure thought-to-action conversion rates
- **Trend Analysis** - Identify patterns and changes over time
- **Real-time Insights** - Generate actionable recommendations

### Data Sources
```
📊 Analytics Data Flow
├── 💭 Individual Thoughts (raw data)
├── 🏷️ AI Categorization (Claude processing)
├── 📈 Aggregated Metrics (database analytics)
├── 🧠 Pattern Recognition (trend analysis)
└── 💡 Actionable Insights (recommendations)
```

## Analytics Database Schema

### Category Analytics Table

```sql
CREATE TABLE public.category_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Category identification
    category thought_type NOT NULL,
    subcategory TEXT,
    
    -- Basic metrics
    total_thoughts INTEGER DEFAULT 0,
    avg_word_count DECIMAL(10,2),
    
    -- Distribution analytics
    sentiment_distribution JSONB DEFAULT '{}'::jsonb,
    priority_distribution JSONB DEFAULT '{}'::jsonb,
    urgency_distribution JSONB DEFAULT '{}'::jsonb,
    
    -- Time-based metrics
    thoughts_this_week INTEGER DEFAULT 0,
    thoughts_this_month INTEGER DEFAULT 0,
    avg_thoughts_per_day DECIMAL(10,2) DEFAULT 0,
    
    -- Calculated insights
    engagement_score DECIMAL(10,2) DEFAULT 0,
    productivity_score DECIMAL(10,2) DEFAULT 0,
    
    -- Timestamps
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_category_analytics UNIQUE(user_id, category, subcategory)
);
```

### Analytics Views

```sql
-- Real-time insights view
CREATE OR REPLACE VIEW public.category_insights AS
SELECT 
    ca.user_id,
    ca.category,
    ca.subcategory,
    ca.total_thoughts,
    ca.avg_word_count,
    ca.thoughts_this_week,
    ca.thoughts_this_month,
    ca.avg_thoughts_per_day,
    ca.sentiment_distribution,
    ca.priority_distribution,
    ca.urgency_distribution,
    ca.last_calculated,
    
    -- Calculate weekly trend
    CASE 
        WHEN ca.thoughts_this_week > (ca.thoughts_this_month - ca.thoughts_this_week) / 3.0 
        THEN 'increasing'
        WHEN ca.thoughts_this_week < (ca.thoughts_this_month - ca.thoughts_this_week) / 3.0 
        THEN 'decreasing'
        ELSE 'stable'
    END as weekly_trend,
    
    -- Calculate engagement score
    CASE 
        WHEN ca.avg_word_count IS NOT NULL AND ca.avg_thoughts_per_day > 0 THEN
            (ca.avg_word_count / 100.0) * ca.avg_thoughts_per_day
        ELSE 0
    END as engagement_score
    
FROM public.category_analytics ca
WHERE ca.total_thoughts > 0
ORDER BY ca.total_thoughts DESC;

-- Productivity dashboard view
CREATE OR REPLACE VIEW public.productivity_dashboard AS
SELECT 
    t.user_id,
    date_trunc('day', t.created_at) as day,
    COUNT(*) as total_thoughts,
    COUNT(*) FILTER (WHERE t.category = 'task') as tasks_created,
    COUNT(*) FILTER (WHERE t.category = 'goal') as goals_set,
    COUNT(*) FILTER (WHERE t.category = 'habit') as habits_tracked,
    COUNT(*) FILTER (WHERE t.category = 'insight') as insights_captured,
    COUNT(*) FILTER (WHERE t.sentiment = 'positive') as positive_thoughts,
    COUNT(*) FILTER (WHERE t.sentiment = 'negative') as negative_thoughts,
    AVG(char_length(t.raw_text)) as avg_thought_length,
    
    -- Task completion rate
    COALESCE(
        (SELECT COUNT(*) FROM public.todos WHERE user_id = t.user_id 
         AND DATE(created_at) = DATE(t.created_at) AND completed = true)::decimal /
        NULLIF((SELECT COUNT(*) FROM public.todos WHERE user_id = t.user_id 
                AND DATE(created_at) = DATE(t.created_at)), 0),
        0
    ) as task_completion_rate
    
FROM public.thoughts t
GROUP BY t.user_id, date_trunc('day', t.created_at)
ORDER BY day DESC;
```

## Analytics API

### Category Analytics Endpoint

```typescript
// GET /api/analytics/categories
export async function getCategoryAnalytics(userId: string): Promise<CategoryAnalytics[]> {
  const { data, error } = await supabase
    .from('category_insights')
    .select('*')
    .eq('user_id', userId)
    .order('total_thoughts', { ascending: false })

  if (error) throw new Error(`Failed to fetch category analytics: ${error.message}`)
  return data || []
}

// Example response
const categoryAnalytics = [
  {
    user_id: "user-123",
    category: "Task",
    subcategory: null,
    total_thoughts: 45,
    avg_word_count: 12.5,
    thoughts_this_week: 8,
    thoughts_this_month: 18,
    avg_thoughts_per_day: 1.2,
    sentiment_distribution: {
      "positive": 15,
      "neutral": 25,
      "negative": 5
    },
    priority_distribution: {
      "low": 10,
      "medium": 25,
      "high": 10
    },
    urgency_distribution: {
      "none": 20,
      "low": 15,
      "medium": 8,
      "high": 2
    },
    weekly_trend: "increasing",
    engagement_score: 15.0
  }
]
```

### Productivity Metrics Endpoint

```typescript
// GET /api/analytics/productivity
export async function getProductivityMetrics(
  userId: string, 
  timeframe: '7d' | '30d' | '90d' = '30d'
): Promise<ProductivityMetrics> {
  const { data, error } = await supabase
    .from('productivity_dashboard')
    .select('*')
    .eq('user_id', userId)
    .gte('day', getDateRange(timeframe))
    .order('day', { ascending: false })

  if (error) throw new Error(`Failed to fetch productivity metrics: ${error.message}`)
  
  return calculateProductivityMetrics(data || [])
}

interface ProductivityMetrics {
  totalThoughts: number
  dailyAverage: number
  mostProductiveDay: string
  categoryBreakdown: Record<string, number>
  sentimentTrend: 'improving' | 'declining' | 'stable'
  taskCompletionRate: number
  insightFrequency: number
  goalProgressRate: number
}
```

### Sentiment Analysis Endpoint

```typescript
// GET /api/analytics/sentiment
export async function getSentimentAnalysis(
  userId: string,
  timeframe: '7d' | '30d' | '90d' = '30d'
): Promise<SentimentAnalysis> {
  const { data, error } = await supabase
    .from('thoughts')
    .select('sentiment, created_at, category')
    .eq('user_id', userId)
    .gte('created_at', getDateRange(timeframe))
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch sentiment data: ${error.message}`)
  
  return analyzeSentimentTrends(data || [])
}

interface SentimentAnalysis {
  overall: {
    positive: number
    neutral: number
    negative: number
    mixed: number
  }
  byCategory: Record<string, {
    positive: number
    neutral: number
    negative: number
    mixed: number
  }>
  trend: 'improving' | 'declining' | 'stable'
  dailyBreakdown: Array<{
    date: string
    positive: number
    neutral: number
    negative: number
    mixed: number
  }>
}
```

## Dashboard Components

### Analytics Dashboard Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, LineChart, PieChart, TrendingUp, Brain, Target } from 'lucide-react'

interface AnalyticsDashboardProps {
  userId: string
  timeframe?: '7d' | '30d' | '90d'
}

export default function AnalyticsDashboard({ userId, timeframe = '30d' }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<CategoryAnalytics[]>([])
  const [productivity, setProductivity] = useState<ProductivityMetrics | null>(null)
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [categoryData, productivityData, sentimentData] = await Promise.all([
          getCategoryAnalytics(userId),
          getProductivityMetrics(userId, timeframe),
          getSentimentAnalysis(userId, timeframe)
        ])
        
        setAnalytics(categoryData)
        setProductivity(productivityData)
        setSentiment(sentimentData)
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [userId, timeframe])

  if (loading) {
    return <div className="animate-pulse">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Thoughts"
          value={productivity?.totalThoughts || 0}
          icon={<Brain className="h-4 w-4" />}
          trend={analytics.find(a => a.weekly_trend === 'increasing') ? 'up' : 'stable'}
        />
        <MetricCard
          title="Daily Average"
          value={productivity?.dailyAverage || 0}
          icon={<TrendingUp className="h-4 w-4" />}
          format="decimal"
        />
        <MetricCard
          title="Task Completion"
          value={productivity?.taskCompletionRate || 0}
          icon={<Target className="h-4 w-4" />}
          format="percentage"
        />
        <MetricCard
          title="Sentiment Score"
          value={calculateSentimentScore(sentiment)}
          icon={<BarChart className="h-4 w-4" />}
          format="percentage"
        />
      </div>

      {/* Category Distribution */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-neon-cyan font-mono">Category Distribution</CardTitle>
          <CardDescription>Your thinking patterns across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryDistributionChart data={analytics} />
        </CardContent>
      </Card>

      {/* Sentiment Trends */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-neon-cyan font-mono">Sentiment Analysis</CardTitle>
          <CardDescription>Emotional patterns in your thoughts over time</CardDescription>
        </CardHeader>
        <CardContent>
          <SentimentTrendChart data={sentiment?.dailyBreakdown || []} />
        </CardContent>
      </Card>

      {/* Productivity Insights */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-neon-cyan font-mono">Productivity Insights</CardTitle>
          <CardDescription>Actionable insights from your thought patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductivityInsights analytics={analytics} productivity={productivity} />
        </CardContent>
      </Card>
    </div>
  )
}
```

### Metric Card Component

```typescript
interface MetricCardProps {
  title: string
  value: number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  format?: 'number' | 'percentage' | 'decimal'
}

function MetricCard({ title, value, icon, trend, format = 'number' }: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${(val * 100).toFixed(1)}%`
      case 'decimal':
        return val.toFixed(1)
      default:
        return val.toString()
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-400'
      case 'down': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <Card className="cyber-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-neon-cyan">{title}</CardTitle>
        <div className="text-neon-purple">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{formatValue(value)}</div>
        {trend && (
          <div className={`text-xs ${getTrendColor()}`}>
            {trend === 'up' && '↗'} {trend === 'down' && '↘'} {trend === 'stable' && '→'} 
            {trend} trend
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### Category Distribution Chart

```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface CategoryDistributionChartProps {
  data: CategoryAnalytics[]
}

function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  const chartData = data.map(item => ({
    name: item.category,
    value: item.total_thoughts,
    percentage: (item.total_thoughts / data.reduce((sum, d) => sum + d.total_thoughts, 0) * 100).toFixed(1)
  }))

  const COLORS = {
    'Task': '#FF6B6B',
    'Goal': '#4ECDC4', 
    'ProjectIdea': '#45B7D1',
    'Habit': '#96CEB4',
    'Note': '#DDA0DD',
    'Insight': '#98D8C8',
    'Learning': '#F7DC6F',
    'Career': '#85C1E9',
    'Idea': '#BB8FCE',
    'System': '#7DCEA0',
    'Automation': '#F1C40F',
    'Person': '#E74C3C',
    'Reminder': '#FFEAA7',
    'Metric': '#F8C471',
    'Sensitive': '#34495E'
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name}: ${percentage}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name) => [`${value} thoughts`, name]}
          contentStyle={{ 
            backgroundColor: '#1a1a2e', 
            border: '1px solid #00d4aa',
            borderRadius: '8px'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

### Sentiment Trend Chart

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SentimentTrendChartProps {
  data: Array<{
    date: string
    positive: number
    neutral: number
    negative: number
    mixed: number
  }>
}

function SentimentTrendChart({ data }: SentimentTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey="date" 
          stroke="#00d4aa"
          tick={{ fill: '#00d4aa' }}
        />
        <YAxis 
          stroke="#00d4aa"
          tick={{ fill: '#00d4aa' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1a1a2e', 
            border: '1px solid #00d4aa',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="positive" 
          stroke="#4ECDC4" 
          strokeWidth={2}
          name="Positive"
        />
        <Line 
          type="monotone" 
          dataKey="neutral" 
          stroke="#96CEB4" 
          strokeWidth={2}
          name="Neutral"
        />
        <Line 
          type="monotone" 
          dataKey="negative" 
          stroke="#FF6B6B" 
          strokeWidth={2}
          name="Negative"
        />
        <Line 
          type="monotone" 
          dataKey="mixed" 
          stroke="#DDA0DD" 
          strokeWidth={2}
          name="Mixed"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

## Advanced Analytics Features

### Productivity Insights Generator

```typescript
interface ProductivityInsight {
  type: 'strength' | 'improvement' | 'pattern' | 'recommendation'
  title: string
  description: string
  confidence: number
  actionable: boolean
  category?: string
}

export function generateProductivityInsights(
  analytics: CategoryAnalytics[],
  productivity: ProductivityMetrics
): ProductivityInsight[] {
  const insights: ProductivityInsight[] = []

  // Analyze category patterns
  const topCategory = analytics[0]
  if (topCategory && topCategory.total_thoughts > 10) {
    insights.push({
      type: 'pattern',
      title: `${topCategory.category} Thoughts Dominate`,
      description: `You've captured ${topCategory.total_thoughts} ${topCategory.category.toLowerCase()} thoughts, representing your primary focus area.`,
      confidence: 0.9,
      actionable: false,
      category: topCategory.category
    })
  }

  // Analyze sentiment patterns
  const sentimentAnalysis = analyzeCategorySentiment(analytics)
  if (sentimentAnalysis.negativeCategories.length > 0) {
    insights.push({
      type: 'improvement',
      title: 'Negative Sentiment in Specific Areas',
      description: `Consider addressing concerns in: ${sentimentAnalysis.negativeCategories.join(', ')}`,
      confidence: 0.8,
      actionable: true
    })
  }

  // Analyze productivity trends
  if (productivity.taskCompletionRate > 0.8) {
    insights.push({
      type: 'strength',
      title: 'Excellent Task Completion Rate',
      description: `Your ${(productivity.taskCompletionRate * 100).toFixed(1)}% completion rate shows strong execution skills.`,
      confidence: 0.9,
      actionable: false
    })
  } else if (productivity.taskCompletionRate < 0.5) {
    insights.push({
      type: 'recommendation',
      title: 'Improve Task Follow-Through',
      description: 'Consider breaking larger tasks into smaller, manageable steps to improve completion rates.',
      confidence: 0.8,
      actionable: true
    })
  }

  // Analyze goal setting patterns
  const goalAnalytics = analytics.find(a => a.category === 'Goal')
  if (goalAnalytics && goalAnalytics.avg_thoughts_per_day < 0.1) {
    insights.push({
      type: 'recommendation',
      title: 'Increase Goal Setting Frequency',
      description: 'Regular goal setting can improve focus and achievement. Consider weekly goal review sessions.',
      confidence: 0.7,
      actionable: true,
      category: 'Goal'
    })
  }

  // Analyze learning patterns
  const learningAnalytics = analytics.find(a => a.category === 'Learning')
  if (learningAnalytics && learningAnalytics.weekly_trend === 'increasing') {
    insights.push({
      type: 'strength',
      title: 'Growing Learning Focus',
      description: 'Your learning thoughts have increased recently, showing a growth mindset.',
      confidence: 0.85,
      actionable: false,
      category: 'Learning'
    })
  }

  return insights.sort((a, b) => b.confidence - a.confidence)
}
```

### Weekly Summary Generator

```typescript
export async function generateWeeklySummary(userId: string): Promise<WeeklySummary> {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)

  const [thoughts, analytics, productivity] = await Promise.all([
    getThoughtsInRange(userId, weekStart, new Date()),
    getCategoryAnalytics(userId),
    getProductivityMetrics(userId, '7d')
  ])

  return {
    period: `${weekStart.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
    totalThoughts: thoughts.length,
    categorySummary: generateCategorySummary(thoughts),
    sentimentSummary: generateSentimentSummary(thoughts),
    keyInsights: generateProductivityInsights(analytics, productivity),
    recommendations: generateWeeklyRecommendations(thoughts, analytics),
    nextWeekFocus: suggestNextWeekFocus(analytics, productivity)
  }
}

interface WeeklySummary {
  period: string
  totalThoughts: number
  categorySummary: {
    topCategories: string[]
    emergingPatterns: string[]
    decliningSareas: string[]
  }
  sentimentSummary: {
    overallTrend: 'positive' | 'negative' | 'neutral'
    positiveHighlights: string[]
    concernAreas: string[]
  }
  keyInsights: ProductivityInsight[]
  recommendations: string[]
  nextWeekFocus: string[]
}
```

### Habit Tracking Analytics

```typescript
export function analyzeHabitPatterns(habitThoughts: Thought[]): HabitAnalysis {
  const habitsByName = new Map<string, Thought[]>()
  
  // Group habits by extracted habit name
  habitThoughts.forEach(thought => {
    const habitName = extractHabitName(thought.raw_text)
    if (habitName) {
      if (!habitsByName.has(habitName)) {
        habitsByName.set(habitName, [])
      }
      habitsByName.get(habitName)!.push(thought)
    }
  })

  const habitAnalysis: HabitAnalysis = {
    totalHabits: habitsByName.size,
    habits: []
  }

  habitsByName.forEach((thoughts, habitName) => {
    const sortedThoughts = thoughts.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const streaks = calculateStreaks(sortedThoughts)
    const consistency = calculateConsistency(sortedThoughts)

    habitAnalysis.habits.push({
      name: habitName,
      totalEntries: thoughts.length,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      consistency: consistency,
      lastEntry: sortedThoughts[sortedThoughts.length - 1].created_at,
      trend: calculateHabitTrend(sortedThoughts),
      recommendations: generateHabitRecommendations(habitName, streaks, consistency)
    })
  })

  return habitAnalysis
}

interface HabitAnalysis {
  totalHabits: number
  habits: Array<{
    name: string
    totalEntries: number
    currentStreak: number
    longestStreak: number
    consistency: number // 0-1 score
    lastEntry: string
    trend: 'improving' | 'declining' | 'stable'
    recommendations: string[]
  }>
}
```

## Real-time Analytics Updates

### WebSocket Integration

```typescript
// Real-time analytics updates via WebSocket
export class AnalyticsWebSocket {
  private ws: WebSocket | null = null
  private userId: string
  private onUpdate: (analytics: Partial<CategoryAnalytics>) => void

  constructor(userId: string, onUpdate: (analytics: Partial<CategoryAnalytics>) => void) {
    this.userId = userId
    this.onUpdate = onUpdate
    this.connect()
  }

  private connect() {
    this.ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/analytics/${this.userId}`)
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'analytics_update') {
        this.onUpdate(data.analytics)
      }
    }

    this.ws.onclose = () => {
      // Reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Usage in React component
function useRealtimeAnalytics(userId: string) {
  const [analytics, setAnalytics] = useState<CategoryAnalytics[]>([])

  useEffect(() => {
    const wsAnalytics = new AnalyticsWebSocket(userId, (update) => {
      setAnalytics(prev => {
        // Update existing analytics or add new ones
        const updated = [...prev]
        const index = updated.findIndex(a => 
          a.category === update.category && a.subcategory === update.subcategory
        )
        
        if (index >= 0) {
          updated[index] = { ...updated[index], ...update }
        } else {
          updated.push(update as CategoryAnalytics)
        }
        
        return updated
      })
    })

    return () => wsAnalytics.disconnect()
  }, [userId])

  return analytics
}
```

### Progressive Analytics Loading

```typescript
// Load analytics progressively for better UX
export function useProgressiveAnalytics(userId: string) {
  const [analytics, setAnalytics] = useState<{
    categories: CategoryAnalytics[]
    productivity: ProductivityMetrics | null
    sentiment: SentimentAnalysis | null
    insights: ProductivityInsight[]
    loading: {
      categories: boolean
      productivity: boolean
      sentiment: boolean
      insights: boolean
    }
  }>({
    categories: [],
    productivity: null,
    sentiment: null,
    insights: [],
    loading: {
      categories: true,
      productivity: true,
      sentiment: true,
      insights: true
    }
  })

  useEffect(() => {
    // Load in order of importance for perceived performance
    async function loadAnalytics() {
      // 1. Load category analytics first (fastest)
      try {
        const categories = await getCategoryAnalytics(userId)
        setAnalytics(prev => ({
          ...prev,
          categories,
          loading: { ...prev.loading, categories: false }
        }))
      } catch (error) {
        console.error('Failed to load category analytics:', error)
      }

      // 2. Load productivity metrics
      try {
        const productivity = await getProductivityMetrics(userId, '30d')
        setAnalytics(prev => ({
          ...prev,
          productivity,
          loading: { ...prev.loading, productivity: false }
        }))
      } catch (error) {
        console.error('Failed to load productivity metrics:', error)
      }

      // 3. Load sentiment analysis
      try {
        const sentiment = await getSentimentAnalysis(userId, '30d')
        setAnalytics(prev => ({
          ...prev,
          sentiment,
          loading: { ...prev.loading, sentiment: false }
        }))
      } catch (error) {
        console.error('Failed to load sentiment analysis:', error)
      }

      // 4. Generate insights last (most expensive)
      try {
        const currentAnalytics = await getCategoryAnalytics(userId)
        const currentProductivity = await getProductivityMetrics(userId, '30d')
        const insights = generateProductivityInsights(currentAnalytics, currentProductivity)
        
        setAnalytics(prev => ({
          ...prev,
          insights,
          loading: { ...prev.loading, insights: false }
        }))
      } catch (error) {
        console.error('Failed to generate insights:', error)
      }
    }

    loadAnalytics()
  }, [userId])

  return analytics
}
```

## Export & Reporting

### CSV Export

```typescript
export function exportAnalyticsToCSV(analytics: CategoryAnalytics[]): string {
  const headers = [
    'Category',
    'Subcategory',
    'Total Thoughts',
    'Average Word Count',
    'Thoughts This Week',
    'Thoughts This Month',
    'Average Per Day',
    'Weekly Trend',
    'Engagement Score',
    'Positive Sentiment %',
    'Negative Sentiment %',
    'High Priority %',
    'High Urgency %'
  ]

  const rows = analytics.map(item => {
    const sentimentDist = item.sentiment_distribution || {}
    const priorityDist = item.priority_distribution || {}
    const urgencyDist = item.urgency_distribution || {}
    
    const totalSentiment = Object.values(sentimentDist).reduce((sum: number, val: any) => sum + (val || 0), 0)
    const totalPriority = Object.values(priorityDist).reduce((sum: number, val: any) => sum + (val || 0), 0)
    const totalUrgency = Object.values(urgencyDist).reduce((sum: number, val: any) => sum + (val || 0), 0)

    return [
      item.category,
      item.subcategory || '',
      item.total_thoughts,
      item.avg_word_count?.toFixed(1) || '0',
      item.thoughts_this_week,
      item.thoughts_this_month,
      item.avg_thoughts_per_day?.toFixed(2) || '0',
      item.weekly_trend || 'stable',
      item.engagement_score?.toFixed(1) || '0',
      totalSentiment > 0 ? ((sentimentDist.positive || 0) / totalSentiment * 100).toFixed(1) : '0',
      totalSentiment > 0 ? ((sentimentDist.negative || 0) / totalSentiment * 100).toFixed(1) : '0',
      totalPriority > 0 ? ((priorityDist.high || 0) / totalPriority * 100).toFixed(1) : '0',
      totalUrgency > 0 ? ((urgencyDist.high || 0) / totalUrgency * 100).toFixed(1) : '0'
    ]
  })

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return csvContent
}

// Export button component
function ExportAnalyticsButton({ analytics }: { analytics: CategoryAnalytics[] }) {
  const handleExport = () => {
    const csvContent = exportAnalyticsToCSV(analytics)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `minddump-analytics-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Button onClick={handleExport} variant="outline" className="cyber-button">
      <Download className="h-4 w-4 mr-2" />
      Export Analytics
    </Button>
  )
}
```

### PDF Report Generation

```typescript
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function generateAnalyticsReport(
  analytics: CategoryAnalytics[],
  productivity: ProductivityMetrics,
  insights: ProductivityInsight[]
): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height

  // Header
  doc.setFontSize(20)
  doc.setTextColor(0, 212, 170) // Neon cyan
  doc.text('MindDump Analytics Report', 20, 30)
  
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40)

  // Summary section
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Summary', 20, 60)
  
  const summaryData = [
    ['Total Thoughts', productivity.totalThoughts.toString()],
    ['Daily Average', productivity.dailyAverage.toFixed(1)],
    ['Task Completion Rate', `${(productivity.taskCompletionRate * 100).toFixed(1)}%`],
    ['Most Active Category', analytics[0]?.category || 'N/A'],
    ['Insights Generated', insights.length.toString()]
  ]

  doc.autoTable({
    startY: 70,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [0, 212, 170] }
  })

  // Category breakdown
  doc.setFontSize(16)
  doc.text('Category Breakdown', 20, doc.lastAutoTable.finalY + 20)

  const categoryData = analytics.slice(0, 10).map(item => [
    item.category,
    item.total_thoughts.toString(),
    item.avg_word_count?.toFixed(1) || '0',
    item.weekly_trend || 'stable'
  ])

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 30,
    head: [['Category', 'Total Thoughts', 'Avg Words', 'Trend']],
    body: categoryData,
    theme: 'striped',
    headStyles: { fillColor: [0, 212, 170] }
  })

  // Insights section
  if (insights.length > 0) {
    doc.addPage()
    doc.setFontSize(16)
    doc.text('Key Insights', 20, 30)

    let yPosition = 50
    insights.slice(0, 5).forEach((insight, index) => {
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text(`${index + 1}. ${insight.title}`, 20, yPosition)
      
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      const splitDescription = doc.splitTextToSize(insight.description, pageWidth - 40)
      doc.text(splitDescription, 20, yPosition + 8)
      
      yPosition += 8 + splitDescription.length * 4 + 10
    })
  }

  return doc
}

// Generate and download PDF report
function DownloadReportButton({ 
  analytics, 
  productivity, 
  insights 
}: { 
  analytics: CategoryAnalytics[]
  productivity: ProductivityMetrics
  insights: ProductivityInsight[]
}) {
  const handleDownload = () => {
    const doc = generateAnalyticsReport(analytics, productivity, insights)
    doc.save(`minddump-report-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <Button onClick={handleDownload} className="cyber-button">
      <FileDown className="h-4 w-4 mr-2" />
      Download Report
    </Button>
  )
}
```

## Best Practices

### Performance Optimization
1. **Cache analytics data** for frequently accessed metrics
2. **Use pagination** for large datasets
3. **Implement progressive loading** for better UX
4. **Debounce real-time updates** to prevent excessive re-renders
5. **Pre-calculate expensive metrics** during off-peak hours

### Data Privacy
1. **Anonymize exported data** when sharing
2. **Implement data retention policies** for analytics
3. **Provide granular export controls** for users
4. **Secure analytics API endpoints** with proper authentication
5. **Allow users to opt-out** of certain analytics tracking

### User Experience
1. **Show loading states** for all analytics components
2. **Provide tooltips** for complex metrics
3. **Use progressive disclosure** for detailed analytics
4. **Implement responsive design** for mobile analytics
5. **Offer customizable dashboards** for power users

---

**Author**: MindDump Documentarian  
**Date**: 2025-07-20  
**Version**: 2.0  
**Related Files**: 
- `apps/minddumpapp/src/components/Dashboard.tsx`
- `apps/minddumpapp/src/components/PerformanceDashboard.tsx`
- `supabase/schema_v2_categorization.sql`
- `apps/minddumpapp/src/lib/database-types.ts`