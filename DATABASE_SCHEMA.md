# 🗄️ Database Schema Documentation - MindDump

## Overview

MindDump uses **Supabase PostgreSQL** with advanced schema design, Row Level Security (RLS), and comprehensive analytics. This document provides complete database schema documentation, including tables, relationships, indexes, security policies, and migration strategies.

## Schema Architecture

### Core Design Principles
- **Row Level Security (RLS)** on all user-facing tables
- **Automatic timestamp tracking** with triggers
- **JSONB storage** for flexible metadata
- **Comprehensive indexing** for performance
- **Analytics-first design** for insights tracking

### Database Overview
```
📊 MindDump Database Schema
├── 🔐 Authentication (Supabase Auth)
├── 💭 Thoughts Management
├── 🚀 Project Tracking  
├── ✅ Task Management
├── 📈 Analytics & Insights
└── 🔧 Utility Functions
```

## Core Tables

### 1. thoughts
The central table storing all user thoughts with enhanced categorization.

```sql
CREATE TABLE public.thoughts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Core content
    raw_text TEXT NOT NULL,
    expanded_text TEXT,
    
    -- Enhanced categorization (v2.0)
    category thought_type NOT NULL,
    subcategory TEXT,
    priority priority_level DEFAULT 'medium'::priority_level,
    urgency urgency_level DEFAULT 'none'::urgency_level,
    sentiment sentiment_type DEFAULT 'neutral'::sentiment_type,
    
    -- Metadata
    title TEXT,
    summary TEXT,
    auto_title TEXT, -- AI-generated title when custom title is null
    auto_summary TEXT, -- AI-generated summary when custom summary is null
    
    -- Action items and processing
    actions JSONB DEFAULT '[]'::jsonb,
    
    -- Legacy support (maintained for backward compatibility)
    type thought_type, -- Maps to category for legacy code
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT thoughts_raw_text_length CHECK (char_length(raw_text) >= 1),
    CONSTRAINT thoughts_raw_text_max_length CHECK (char_length(raw_text) <= 50000),
    CONSTRAINT thoughts_category_not_null CHECK (category IS NOT NULL)
);
```

**Key Features:**
- **Enhanced categorization** with 15-category system
- **Flexible metadata** using JSONB for actions
- **AI-generated fields** for auto-title and auto-summary
- **Text length validation** preventing empty or excessive content
- **Legacy compatibility** maintaining the original type field

### 2. projects
Enhanced project tracking with urgency and better metadata.

```sql
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    thought_id UUID REFERENCES public.thoughts(id) ON DELETE CASCADE NOT NULL,
    
    -- Project details
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    readme TEXT,
    overview TEXT,
    
    -- External integrations
    sheets_url TEXT,
    github_url TEXT,
    
    -- Categorization and priority
    category TEXT DEFAULT 'general',
    urgency urgency_level DEFAULT 'none'::urgency_level, -- New in v2.0
    
    -- Technical details
    tech_stack JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT projects_title_length CHECK (char_length(title) >= 1),
    CONSTRAINT projects_summary_length CHECK (char_length(summary) >= 1),
    CONSTRAINT unique_thought_project UNIQUE(thought_id)
);
```

### 3. todos
Enhanced task management with categorization and urgency tracking.

```sql
CREATE TABLE public.todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Task details
    task TEXT NOT NULL,
    priority priority_level DEFAULT 'medium'::priority_level,
    urgency urgency_level DEFAULT 'none'::urgency_level, -- New in v2.0
    category thought_type, -- New in v2.0
    
    -- Relationships
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    thought_id UUID REFERENCES public.thoughts(id) ON DELETE CASCADE,
    
    -- Scheduling
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT todos_task_length CHECK (char_length(task) >= 1),
    CONSTRAINT todos_completion_logic CHECK (
        (completed = false AND completed_at IS NULL) OR 
        (completed = true AND completed_at IS NOT NULL)
    )
);
```

### 4. category_analytics (New in v2.0)
Comprehensive analytics for tracking thought patterns and productivity insights.

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
    
    -- Timestamps
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_category_analytics UNIQUE(user_id, category, subcategory),
    CONSTRAINT positive_metrics CHECK (
        total_thoughts >= 0 AND 
        thoughts_this_week >= 0 AND 
        thoughts_this_month >= 0 AND
        avg_thoughts_per_day >= 0
    )
);
```

## Custom Types (Enums)

### Enhanced Type Definitions

```sql
-- Original thought types (maintained for compatibility)
CREATE TYPE thought_type AS ENUM (
    'idea', 'task', 'project', 'vent', 'reflection',
    -- New categories in v2.0
    'goal', 'habit', 'projectidea', 'reminder', 'note', 
    'insight', 'learning', 'career', 'metric', 'system', 
    'automation', 'person', 'sensitive', 'uncategorized'
);

-- Enhanced priority levels
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical', 'urgent');

-- New urgency levels
CREATE TYPE urgency_level AS ENUM ('none', 'low', 'medium', 'high', 'critical');

-- New sentiment types
CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative', 'mixed');
```

### Type Migration Strategy

```sql
-- Safe migration adding new enum values
ALTER TYPE thought_type ADD VALUE 'goal';
ALTER TYPE thought_type ADD VALUE 'habit';
ALTER TYPE thought_type ADD VALUE 'projectidea';
-- ... (see migration script for complete list)
```

## Indexes for Performance

### Primary Indexes

```sql
-- Core performance indexes
CREATE INDEX IF NOT EXISTS thoughts_user_id_idx ON public.thoughts(user_id);
CREATE INDEX IF NOT EXISTS thoughts_category_idx ON public.thoughts(category);
CREATE INDEX IF NOT EXISTS thoughts_created_at_idx ON public.thoughts(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS thoughts_user_category_idx ON public.thoughts(user_id, category);
CREATE INDEX IF NOT EXISTS thoughts_user_category_created_idx ON public.thoughts(user_id, category, created_at DESC);

-- Category and metadata indexes
CREATE INDEX IF NOT EXISTS thoughts_priority_idx ON public.thoughts(priority);
CREATE INDEX IF NOT EXISTS thoughts_urgency_idx ON public.thoughts(urgency);
CREATE INDEX IF NOT EXISTS thoughts_sentiment_idx ON public.thoughts(sentiment);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS thoughts_raw_text_search_idx ON public.thoughts 
    USING gin(to_tsvector('english', raw_text));
CREATE INDEX IF NOT EXISTS thoughts_expanded_text_search_idx ON public.thoughts 
    USING gin(to_tsvector('english', expanded_text));
```

### Project & Todo Indexes

```sql
-- Projects
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS projects_thought_id_idx ON public.projects(thought_id);
CREATE INDEX IF NOT EXISTS projects_category_idx ON public.projects(category);
CREATE INDEX IF NOT EXISTS projects_urgency_idx ON public.projects(urgency);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON public.projects(created_at DESC);

-- Todos
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS todos_project_id_idx ON public.todos(project_id);
CREATE INDEX IF NOT EXISTS todos_thought_id_idx ON public.todos(thought_id);
CREATE INDEX IF NOT EXISTS todos_completed_idx ON public.todos(completed);
CREATE INDEX IF NOT EXISTS todos_due_date_idx ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS todos_priority_idx ON public.todos(priority);
CREATE INDEX IF NOT EXISTS todos_urgency_idx ON public.todos(urgency);
CREATE INDEX IF NOT EXISTS todos_category_idx ON public.todos(category);

-- Analytics
CREATE INDEX IF NOT EXISTS analytics_user_category_idx ON public.category_analytics(user_id, category);
CREATE INDEX IF NOT EXISTS analytics_last_calculated_idx ON public.category_analytics(last_calculated);
```

## Row Level Security (RLS) Policies

### Comprehensive Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_analytics ENABLE ROW LEVEL SECURITY;

-- Thoughts policies
CREATE POLICY "Users can view their own thoughts" ON public.thoughts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thoughts" ON public.thoughts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thoughts" ON public.thoughts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thoughts" ON public.thoughts
    FOR DELETE USING (auth.uid() = user_id);

-- Projects policies (similar pattern)
CREATE POLICY "Users can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Todos policies
CREATE POLICY "Users can view their own todos" ON public.todos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos" ON public.todos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" ON public.todos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" ON public.todos
    FOR DELETE USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view their own analytics" ON public.category_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON public.category_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics" ON public.category_analytics
    FOR UPDATE USING (auth.uid() = user_id);
```

## Functions & Triggers

### Utility Functions

```sql
-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-categorization function
CREATE OR REPLACE FUNCTION public.auto_categorize_thought(thought_text TEXT)
RETURNS thought_type AS $$
DECLARE
    result thought_type := 'uncategorized';
BEGIN
    -- Simple keyword-based categorization as fallback
    thought_text := lower(thought_text);
    
    IF thought_text ~ '\b(goal|objective|aim|target)\b' THEN
        result := 'goal';
    ELSIF thought_text ~ '\b(habit|routine|daily|practice)\b' THEN
        result := 'habit';
    ELSIF thought_text ~ '\b(app|software|project|build|develop)\b' THEN
        result := 'projectidea';
    ELSIF thought_text ~ '\b(task|todo|do|need to|should)\b' THEN
        result := 'task';
    ELSIF thought_text ~ '\b(remind|remember|call|meeting)\b' THEN
        result := 'reminder';
    ELSIF thought_text ~ '\b(note|write down|remember)\b' THEN
        result := 'note';
    ELSIF thought_text ~ '\b(insight|realize|understand|learn)\b' THEN
        result := 'insight';
    ELSIF thought_text ~ '\b(learn|study|course|research)\b' THEN
        result := 'learning';
    ELSIF thought_text ~ '\b(career|job|work|professional)\b' THEN
        result := 'career';
    ELSIF thought_text ~ '\b(metric|track|measure|data)\b' THEN
        result := 'metric';
    ELSIF thought_text ~ '\b(idea|concept|brainstorm)\b' THEN
        result := 'idea';
    ELSIF thought_text ~ '\b(system|process|workflow|method)\b' THEN
        result := 'system';
    ELSIF thought_text ~ '\b(automate|automation|script|bot)\b' THEN
        result := 'automation';
    ELSIF thought_text ~ '\b(person|people|team|contact)\b' THEN
        result := 'person';
    ELSIF thought_text ~ '\b(private|sensitive|personal|confidential)\b' THEN
        result := 'sensitive';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Sentiment analysis function
CREATE OR REPLACE FUNCTION public.analyze_sentiment(thought_text TEXT)
RETURNS sentiment_type AS $$
DECLARE
    result sentiment_type := 'neutral';
    positive_words TEXT[] := ARRAY['good', 'great', 'excellent', 'happy', 'excited', 'love', 'amazing', 'wonderful', 'fantastic', 'awesome'];
    negative_words TEXT[] := ARRAY['bad', 'terrible', 'awful', 'hate', 'angry', 'sad', 'frustrated', 'annoyed', 'disappointed', 'worried'];
    positive_count INTEGER := 0;
    negative_count INTEGER := 0;
    word TEXT;
BEGIN
    thought_text := lower(thought_text);
    
    -- Count positive words
    FOREACH word IN ARRAY positive_words LOOP
        positive_count := positive_count + (SELECT count(*) FROM regexp_split_to_table(thought_text, '\s+') WHERE regexp_split_to_table = word);
    END LOOP;
    
    -- Count negative words
    FOREACH word IN ARRAY negative_words LOOP
        negative_count := negative_count + (SELECT count(*) FROM regexp_split_to_table(thought_text, '\s+') WHERE regexp_split_to_table = word);
    END LOOP;
    
    -- Determine sentiment
    IF positive_count > negative_count THEN
        result := 'positive';
    ELSIF negative_count > positive_count THEN
        result := 'negative';
    ELSIF positive_count > 0 AND negative_count > 0 THEN
        result := 'mixed';
    ELSE
        result := 'neutral';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update analytics function
CREATE OR REPLACE FUNCTION public.update_category_analytics(
    p_user_id UUID, 
    p_category thought_type,
    p_subcategory TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    analytics_record RECORD;
    current_week_start DATE;
    current_month_start DATE;
BEGIN
    current_week_start := date_trunc('week', CURRENT_DATE);
    current_month_start := date_trunc('month', CURRENT_DATE);
    
    -- Get or create analytics record
    SELECT * INTO analytics_record 
    FROM public.category_analytics 
    WHERE user_id = p_user_id 
      AND category = p_category 
      AND (subcategory = p_subcategory OR (subcategory IS NULL AND p_subcategory IS NULL));
    
    IF NOT FOUND THEN
        INSERT INTO public.category_analytics (
            user_id, category, subcategory, total_thoughts, 
            thoughts_this_week, thoughts_this_month, last_calculated
        ) VALUES (
            p_user_id, p_category, p_subcategory, 0, 0, 0, NOW()
        );
    END IF;
    
    -- Update analytics with current data
    WITH thought_stats AS (
        SELECT 
            COUNT(*) as total,
            AVG(char_length(raw_text)) as avg_length,
            COUNT(*) FILTER (WHERE created_at >= current_week_start) as week_count,
            COUNT(*) FILTER (WHERE created_at >= current_month_start) as month_count,
            jsonb_object_agg(
                COALESCE(sentiment::text, 'neutral'), 
                COUNT(*) FILTER (WHERE sentiment = sentiment)
            ) as sentiment_dist,
            jsonb_object_agg(
                COALESCE(priority::text, 'medium'), 
                COUNT(*) FILTER (WHERE priority = priority)
            ) as priority_dist,
            jsonb_object_agg(
                COALESCE(urgency::text, 'none'), 
                COUNT(*) FILTER (WHERE urgency = urgency)
            ) as urgency_dist
        FROM public.thoughts 
        WHERE user_id = p_user_id 
          AND category = p_category
          AND (subcategory = p_subcategory OR (subcategory IS NULL AND p_subcategory IS NULL))
    )
    UPDATE public.category_analytics 
    SET 
        total_thoughts = thought_stats.total,
        avg_word_count = thought_stats.avg_length,
        thoughts_this_week = thought_stats.week_count,
        thoughts_this_month = thought_stats.month_count,
        sentiment_distribution = thought_stats.sentiment_dist,
        priority_distribution = thought_stats.priority_dist,
        urgency_distribution = thought_stats.urgency_dist,
        avg_thoughts_per_day = CASE 
            WHEN thought_stats.total > 0 AND EXTRACT(days FROM (NOW() - (
                SELECT MIN(created_at) FROM public.thoughts 
                WHERE user_id = p_user_id AND category = p_category
            ))) > 0 THEN
                thought_stats.total::decimal / EXTRACT(days FROM (NOW() - (
                    SELECT MIN(created_at) FROM public.thoughts 
                    WHERE user_id = p_user_id AND category = p_category
                )))
            ELSE 0
        END,
        last_calculated = NOW(),
        updated_at = NOW()
    FROM thought_stats
    WHERE category_analytics.user_id = p_user_id 
      AND category_analytics.category = p_category
      AND (category_analytics.subcategory = p_subcategory OR (category_analytics.subcategory IS NULL AND p_subcategory IS NULL));
END;
$$ LANGUAGE plpgsql;
```

### Triggers

```sql
-- Update timestamp triggers
CREATE TRIGGER thoughts_updated_at
    BEFORE UPDATE ON public.thoughts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER todos_updated_at
    BEFORE UPDATE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER analytics_updated_at
    BEFORE UPDATE ON public.category_analytics
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-complete todo trigger
CREATE OR REPLACE FUNCTION public.handle_todo_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
        NEW.completed_at = NOW();
    ELSIF NEW.completed = FALSE AND OLD.completed = TRUE THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_completion_trigger
    BEFORE UPDATE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION public.handle_todo_completion();

-- Analytics update trigger
CREATE OR REPLACE FUNCTION public.trigger_update_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update analytics after thought insertion/update
    PERFORM public.update_category_analytics(NEW.user_id, NEW.category, NEW.subcategory);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER thoughts_analytics_trigger
    AFTER INSERT OR UPDATE ON public.thoughts
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_analytics();
```

## Views & Analytics

### Category Insights View

```sql
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
```

### Productivity Dashboard View

```sql
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

## Migration Scripts

### V2.0 Migration (Legacy to Enhanced Categories)

```sql
-- Safe migration script with backup
BEGIN;

-- 1. Create backup tables
CREATE TABLE public.thoughts_backup_pre_v2 AS SELECT * FROM public.thoughts;
CREATE TABLE public.projects_backup_pre_v2 AS SELECT * FROM public.projects;
CREATE TABLE public.todos_backup_pre_v2 AS SELECT * FROM public.todos;

-- 2. Add new enum values to thought_type
ALTER TYPE thought_type ADD VALUE 'goal';
ALTER TYPE thought_type ADD VALUE 'habit';
ALTER TYPE thought_type ADD VALUE 'projectidea';
ALTER TYPE thought_type ADD VALUE 'reminder';
ALTER TYPE thought_type ADD VALUE 'note';
ALTER TYPE thought_type ADD VALUE 'insight';
ALTER TYPE thought_type ADD VALUE 'learning';
ALTER TYPE thought_type ADD VALUE 'career';
ALTER TYPE thought_type ADD VALUE 'metric';
ALTER TYPE thought_type ADD VALUE 'system';
ALTER TYPE thought_type ADD VALUE 'automation';
ALTER TYPE thought_type ADD VALUE 'person';
ALTER TYPE thought_type ADD VALUE 'sensitive';
ALTER TYPE thought_type ADD VALUE 'uncategorized';

-- 3. Create new enum types
CREATE TYPE urgency_level AS ENUM ('none', 'low', 'medium', 'high', 'critical');
CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative', 'mixed');

-- 4. Add new columns to thoughts table
ALTER TABLE public.thoughts 
ADD COLUMN category thought_type,
ADD COLUMN subcategory TEXT,
ADD COLUMN urgency urgency_level DEFAULT 'none'::urgency_level,
ADD COLUMN sentiment sentiment_type DEFAULT 'neutral'::sentiment_type,
ADD COLUMN title TEXT,
ADD COLUMN summary TEXT,
ADD COLUMN auto_title TEXT,
ADD COLUMN auto_summary TEXT;

-- 5. Migrate existing data
UPDATE public.thoughts SET category = type WHERE category IS NULL;

-- Map legacy types to new categories
UPDATE public.thoughts SET category = 'projectidea' WHERE type = 'project';
UPDATE public.thoughts SET category = 'insight' WHERE type = 'vent';
UPDATE public.thoughts SET category = 'insight' WHERE type = 'reflection';

-- 6. Add new columns to projects table
ALTER TABLE public.projects 
ADD COLUMN urgency urgency_level DEFAULT 'none'::urgency_level;

-- 7. Add new columns to todos table
ALTER TABLE public.todos 
ADD COLUMN urgency urgency_level DEFAULT 'none'::urgency_level,
ADD COLUMN category thought_type,
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- 8. Create category_analytics table
-- (See table definition above)

-- 9. Add constraints
ALTER TABLE public.thoughts 
ADD CONSTRAINT thoughts_category_not_null CHECK (category IS NOT NULL);

-- 10. Create new indexes
-- (See index definitions above)

-- 11. Create new functions and triggers
-- (See function definitions above)

-- 12. Update RLS policies
-- (See RLS policy definitions above)

-- 13. Populate initial analytics
INSERT INTO public.category_analytics (user_id, category, total_thoughts, last_calculated)
SELECT 
    user_id, 
    category, 
    COUNT(*), 
    NOW()
FROM public.thoughts 
WHERE category IS NOT NULL
GROUP BY user_id, category;

-- Update analytics with detailed calculations
SELECT public.update_category_analytics(user_id, category) 
FROM (SELECT DISTINCT user_id, category FROM public.thoughts WHERE category IS NOT NULL) t;

COMMIT;
```

### Rollback Script

```sql
-- Emergency rollback if needed
BEGIN;

-- Restore from backup tables
DROP TABLE public.thoughts;
DROP TABLE public.projects; 
DROP TABLE public.todos;
DROP TABLE public.category_analytics;

ALTER TABLE public.thoughts_backup_pre_v2 RENAME TO thoughts;
ALTER TABLE public.projects_backup_pre_v2 RENAME TO projects;
ALTER TABLE public.todos_backup_pre_v2 RENAME TO todos;

-- Recreate original indexes and policies
-- (Original schema setup)

COMMIT;
```

## Performance Optimization

### Query Optimization Tips

```sql
-- Use composite indexes for filtering
-- Good: Uses thoughts_user_category_created_idx
SELECT * FROM thoughts 
WHERE user_id = $1 AND category = $2 
ORDER BY created_at DESC;

-- Good: Uses thoughts_raw_text_search_idx
SELECT * FROM thoughts 
WHERE user_id = $1 
  AND to_tsvector('english', raw_text) @@ plainto_tsquery('english', $2);

-- Avoid: Sequential scan
-- Bad: No index for priority alone
SELECT * FROM thoughts WHERE priority = 'high';

-- Good: Use composite index
SELECT * FROM thoughts 
WHERE user_id = $1 AND priority = 'high';
```

### Maintenance Queries

```sql
-- Update analytics for all users
SELECT public.update_category_analytics(user_id, category) 
FROM (SELECT DISTINCT user_id, category FROM public.thoughts) t;

-- Cleanup orphaned analytics
DELETE FROM public.category_analytics 
WHERE NOT EXISTS (
    SELECT 1 FROM public.thoughts 
    WHERE thoughts.user_id = category_analytics.user_id 
      AND thoughts.category = category_analytics.category
);

-- Analyze table statistics
ANALYZE public.thoughts;
ANALYZE public.category_analytics;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes 
WHERE tablename IN ('thoughts', 'projects', 'todos', 'category_analytics')
ORDER BY idx_scan DESC;
```

## TypeScript Integration

### Database Types

```typescript
// Generated from Supabase CLI
export interface Database {
  public: {
    Tables: {
      thoughts: {
        Row: {
          id: string
          user_id: string
          raw_text: string
          expanded_text: string | null
          category: Database['public']['Enums']['thought_type']
          subcategory: string | null
          priority: Database['public']['Enums']['priority_level']
          urgency: Database['public']['Enums']['urgency_level']
          sentiment: Database['public']['Enums']['sentiment_type']
          title: string | null
          summary: string | null
          auto_title: string | null
          auto_summary: string | null
          actions: Json
          type: Database['public']['Enums']['thought_type'] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          raw_text: string
          expanded_text?: string | null
          category: Database['public']['Enums']['thought_type']
          subcategory?: string | null
          priority?: Database['public']['Enums']['priority_level']
          urgency?: Database['public']['Enums']['urgency_level']
          sentiment?: Database['public']['Enums']['sentiment_type']
          title?: string | null
          summary?: string | null
          auto_title?: string | null
          auto_summary?: string | null
          actions?: Json
          type?: Database['public']['Enums']['thought_type'] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          raw_text?: string
          expanded_text?: string | null
          category?: Database['public']['Enums']['thought_type']
          subcategory?: string | null
          priority?: Database['public']['Enums']['priority_level']
          urgency?: Database['public']['Enums']['urgency_level']
          sentiment?: Database['public']['Enums']['sentiment_type']
          title?: string | null
          summary?: string | null
          auto_title?: string | null
          auto_summary?: string | null
          actions?: Json
          type?: Database['public']['Enums']['thought_type'] | null
          created_at?: string
          updated_at?: string
        }
      }
      // ... other tables
    }
    Enums: {
      thought_type: 'idea' | 'task' | 'project' | 'vent' | 'reflection' | 
                   'goal' | 'habit' | 'projectidea' | 'reminder' | 'note' | 
                   'insight' | 'learning' | 'career' | 'metric' | 'system' | 
                   'automation' | 'person' | 'sensitive' | 'uncategorized'
      priority_level: 'low' | 'medium' | 'high' | 'critical' | 'urgent'
      urgency_level: 'none' | 'low' | 'medium' | 'high' | 'critical'
      sentiment_type: 'positive' | 'neutral' | 'negative' | 'mixed'
    }
  }
}
```

### Usage Examples

```typescript
// Insert new thought with enhanced categorization
const { data, error } = await supabase
  .from('thoughts')
  .insert({
    user_id: userId,
    raw_text: "I need to build a task management app",
    category: 'projectidea',
    subcategory: 'mobile-app',
    priority: 'high',
    urgency: 'medium',
    sentiment: 'positive',
    title: "Task Management App Project"
  })
  .select()
  .single()

// Query with enhanced filtering
const { data } = await supabase
  .from('thoughts')
  .select(`
    id, raw_text, category, subcategory, priority, urgency, sentiment,
    title, summary, created_at,
    projects (id, title, github_url)
  `)
  .eq('user_id', userId)
  .eq('category', 'projectidea')
  .in('urgency', ['high', 'critical'])
  .order('created_at', { ascending: false })

// Get analytics data
const { data: analytics } = await supabase
  .from('category_insights')
  .select('*')
  .eq('user_id', userId)
  .order('total_thoughts', { ascending: false })
```

## Backup & Recovery

### Automated Backup Strategy

```sql
-- Daily backup script (run via cron)
pg_dump -h your-host -U your-user -d your-db \
  --schema=public --data-only \
  --table=thoughts --table=projects --table=todos --table=category_analytics \
  > /backups/minddump_$(date +%Y%m%d).sql

-- Weekly full backup
pg_dump -h your-host -U your-user -d your-db \
  --schema=public \
  > /backups/minddump_full_$(date +%Y%m%d).sql
```

### Point-in-Time Recovery

```sql
-- Restore specific table from backup
psql -h your-host -U your-user -d your-db \
  -c "DROP TABLE IF EXISTS thoughts_temp;"

psql -h your-host -U your-user -d your-db \
  < /backups/minddump_20250720.sql

-- Verify restore
SELECT COUNT(*) FROM thoughts;
SELECT MAX(created_at) FROM thoughts;
```

## Security Considerations

### Data Protection
- **RLS policies** prevent unauthorized access
- **Input validation** at database level
- **Encrypted connections** (SSL/TLS required)
- **Regular security audits** of access patterns

### Performance Security
- **Query timeouts** prevent long-running queries
- **Connection limits** prevent resource exhaustion
- **Index monitoring** for query optimization
- **Regular VACUUM** for table maintenance

### Compliance Features
- **Audit logs** via Supabase
- **Data export** capabilities for GDPR
- **Data anonymization** functions available
- **Retention policies** for data lifecycle management

---

**Author**: MindDump Documentarian  
**Date**: 2025-07-20  
**Version**: 2.0  
**Related Files**: 
- `supabase/schema.sql`
- `supabase/schema_v2_categorization.sql`
- `supabase/migration_to_v2_categorization.sql`
- `src/lib/supabase.ts`
- `src/lib/database-types.ts`