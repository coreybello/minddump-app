-- Enhanced Database Schema v2.0 for MindDump App with 15-Category System
-- Adds comprehensive categorization with new thought types and metadata fields
-- Author: Data Schema Architect (Swarm Agent)
-- Date: 2025-07-20

-- ============================================================================
-- EXTENSIONS AND SETUP
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For efficient composite indexes

-- ============================================================================
-- NEW ENHANCED TYPES FOR 15-CATEGORY SYSTEM
-- ============================================================================

-- Drop existing thought_type enum and recreate with new categories
DROP TYPE IF EXISTS thought_type CASCADE;
CREATE TYPE thought_type AS ENUM (
    'goal',         -- Personal and professional goals
    'habit',        -- Habit tracking and formation
    'projectidea',  -- Project ideas and concepts
    'task',         -- Actionable tasks and todos
    'reminder',     -- Time-based reminders
    'note',         -- General notes and observations
    'insight',      -- Key insights and learnings
    'learning',     -- Educational content and progress
    'career',       -- Career-related thoughts
    'metric',       -- Measurements and KPIs
    'idea',         -- Creative and innovative ideas
    'system',       -- System designs and processes
    'automation',   -- Automation opportunities
    'person',       -- People and relationship notes
    'sensitive',    -- Private/sensitive information
    'uncategorized' -- Default fallback category
);

-- Enhanced priority levels with urgency
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical', 'urgent');

-- Sentiment analysis enum
CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative', 'mixed');

-- Urgency levels for time-sensitive content
CREATE TYPE urgency_level AS ENUM ('none', 'low', 'medium', 'high', 'critical');

-- Project status
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived');

-- Todo status
CREATE TYPE todo_status AS ENUM ('pending', 'in_progress', 'blocked', 'completed', 'cancelled');

-- ============================================================================
-- ENHANCED THOUGHTS TABLE WITH NEW CATEGORIZATION FIELDS
-- ============================================================================

-- Drop existing table if upgrading
DROP TABLE IF EXISTS public.thoughts CASCADE;

-- Create enhanced thoughts table with new categorization fields
CREATE TABLE public.thoughts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Core content
    raw_text TEXT NOT NULL CHECK (length(raw_text) >= 1 AND length(raw_text) <= 50000),
    expanded_text TEXT CHECK (length(expanded_text) <= 100000),
    
    -- NEW: Enhanced categorization fields
    category thought_type NOT NULL DEFAULT 'uncategorized',
    subcategory TEXT CHECK (length(subcategory) <= 100),
    priority priority_level DEFAULT 'medium'::priority_level,
    title TEXT CHECK (length(title) <= 200),
    summary TEXT CHECK (length(summary) <= 1000),
    urgency urgency_level DEFAULT 'none'::urgency_level,
    sentiment sentiment_type DEFAULT 'neutral'::sentiment_type,
    
    -- Legacy type field for backward compatibility (maps to category)
    type thought_type GENERATED ALWAYS AS (category) STORED,
    
    -- Existing fields
    actions JSONB DEFAULT '[]'::jsonb CHECK (jsonb_typeof(actions) = 'array'),
    tags TEXT[] DEFAULT '{}' CHECK (array_length(tags, 1) <= 50),
    word_count INTEGER GENERATED ALWAYS AS (array_length(string_to_array(raw_text, ' '), 1)) STORED,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Enhanced search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(raw_text, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(expanded_text, '')), 'D') ||
        setweight(to_tsvector('english', coalesce(subcategory, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
    ) STORED,
    
    -- Auto-generate title if not provided
    auto_title TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN title IS NOT NULL THEN title
            WHEN length(raw_text) <= 50 THEN raw_text
            ELSE left(raw_text, 47) || '...'
        END
    ) STORED,
    
    -- Auto-generate summary if not provided
    auto_summary TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN summary IS NOT NULL THEN summary
            WHEN length(raw_text) <= 200 THEN raw_text
            ELSE left(raw_text, 197) || '...'
        END
    ) STORED
);

-- ============================================================================
-- ENHANCED PROJECTS TABLE WITH NEW METADATA
-- ============================================================================

-- Update projects table to use new priority and category fields
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    thought_id UUID REFERENCES public.thoughts(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
    summary TEXT NOT NULL CHECK (length(summary) >= 1 AND length(summary) <= 2000),
    description TEXT CHECK (length(description) <= 10000),
    readme TEXT CHECK (length(readme) <= 50000),
    overview TEXT CHECK (length(overview) <= 50000),
    
    -- URLs and external references
    sheets_url TEXT CHECK (sheets_url ~ '^https?://'),
    github_url TEXT CHECK (github_url ~ '^https://github\.com/'),
    demo_url TEXT CHECK (demo_url ~ '^https?://'),
    
    -- Enhanced project metadata using new enums
    status project_status DEFAULT 'planning'::project_status NOT NULL,
    category TEXT DEFAULT 'general' CHECK (length(category) <= 50),
    priority priority_level DEFAULT 'medium'::priority_level,
    urgency urgency_level DEFAULT 'none'::urgency_level,
    estimated_hours INTEGER CHECK (estimated_hours >= 0 AND estimated_hours <= 10000),
    actual_hours INTEGER DEFAULT 0 CHECK (actual_hours >= 0),
    
    -- Structured data with validation
    tech_stack JSONB DEFAULT '[]'::jsonb CHECK (
        jsonb_typeof(tech_stack) = 'array' AND 
        jsonb_array_length(tech_stack) <= 50
    ),
    features JSONB DEFAULT '[]'::jsonb CHECK (
        jsonb_typeof(features) = 'array' AND 
        jsonb_array_length(features) <= 100
    ),
    requirements JSONB DEFAULT '{}'::jsonb CHECK (jsonb_typeof(requirements) = 'object'),
    milestones JSONB DEFAULT '[]'::jsonb CHECK (jsonb_typeof(milestones) = 'array'),
    
    -- Dates
    start_date DATE,
    due_date DATE,
    completed_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_date_order CHECK (
        (start_date IS NULL OR due_date IS NULL OR start_date <= due_date) AND
        (completed_date IS NULL OR start_date IS NULL OR completed_date >= start_date)
    ),
    CONSTRAINT valid_hours CHECK (actual_hours <= estimated_hours * 2 OR estimated_hours IS NULL)
);

-- ============================================================================
-- ENHANCED TODOS TABLE WITH NEW CATEGORIZATION
-- ============================================================================

-- Enhanced todos table with new priority and urgency fields
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task TEXT NOT NULL CHECK (length(task) >= 1 AND length(task) <= 1000),
    description TEXT CHECK (length(description) <= 5000),
    
    -- Enhanced categorization
    priority priority_level DEFAULT 'medium'::priority_level,
    urgency urgency_level DEFAULT 'none'::urgency_level,
    status todo_status DEFAULT 'pending'::todo_status,
    category TEXT CHECK (length(category) <= 100),
    
    -- Relationships
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    thought_id UUID REFERENCES public.thoughts(id) ON DELETE CASCADE,
    parent_todo_id UUID REFERENCES public.todos(id) ON DELETE CASCADE,
    
    -- Time management
    due_date DATE,
    due_time TIME,
    estimated_minutes INTEGER CHECK (estimated_minutes > 0 AND estimated_minutes <= 10080), -- Max 1 week
    actual_minutes INTEGER DEFAULT 0 CHECK (actual_minutes >= 0),
    
    -- Progress tracking
    completed BOOLEAN DEFAULT false,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- Metadata
    tags TEXT[] DEFAULT '{}' CHECK (array_length(tags, 1) <= 20),
    notes TEXT CHECK (length(notes) <= 2000),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT completed_consistency CHECK (
        (completed = true AND completed_at IS NOT NULL AND completion_percentage = 100) OR
        (completed = false AND (completed_at IS NULL OR completion_percentage < 100))
    ),
    CONSTRAINT no_self_reference CHECK (id != parent_todo_id)
);

-- ============================================================================
-- CATEGORY MAPPING TABLE FOR ANALYTICS
-- ============================================================================

-- Create a mapping table for category analytics and insights
CREATE TABLE IF NOT EXISTS public.category_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category thought_type NOT NULL,
    subcategory TEXT,
    
    -- Analytics data
    total_thoughts INTEGER DEFAULT 0,
    avg_word_count DECIMAL,
    sentiment_distribution JSONB DEFAULT '{}'::jsonb,
    priority_distribution JSONB DEFAULT '{}'::jsonb,
    urgency_distribution JSONB DEFAULT '{}'::jsonb,
    
    -- Time-based metrics
    thoughts_this_week INTEGER DEFAULT 0,
    thoughts_this_month INTEGER DEFAULT 0,
    avg_thoughts_per_day DECIMAL DEFAULT 0,
    
    -- Last calculation timestamp
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Unique constraint per user and category combination
    UNIQUE(user_id, category, subcategory)
);

-- ============================================================================
-- ENHANCED PERFORMANCE INDEXES FOR NEW FIELDS
-- ============================================================================

-- Drop existing indexes that might conflict
DROP INDEX IF EXISTS thoughts_type_idx;

-- Thoughts table indexes for new categorization fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_user_id_idx ON public.thoughts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_category_idx ON public.thoughts(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_subcategory_idx ON public.thoughts(subcategory) WHERE subcategory IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_priority_idx ON public.thoughts(priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_urgency_idx ON public.thoughts(urgency);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_sentiment_idx ON public.thoughts(sentiment);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_created_at_idx ON public.thoughts(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_updated_at_idx ON public.thoughts(updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_word_count_idx ON public.thoughts(word_count);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_search_idx ON public.thoughts USING GIN(search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_tags_idx ON public.thoughts USING GIN(tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_actions_idx ON public.thoughts USING GIN(actions);

-- Composite indexes for common filtering patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_user_category_idx ON public.thoughts(user_id, category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_user_priority_idx ON public.thoughts(user_id, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_user_urgency_idx ON public.thoughts(user_id, urgency);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_category_priority_idx ON public.thoughts(category, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_category_sentiment_idx ON public.thoughts(category, sentiment);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_user_category_created_idx ON public.thoughts(user_id, category, created_at DESC);

-- Projects indexes for new urgency field
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_urgency_idx ON public.projects(urgency);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_priority_urgency_idx ON public.projects(priority, urgency);

-- Todos indexes for new categorization
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_category_idx ON public.todos(category) WHERE category IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_urgency_idx ON public.todos(urgency);
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_priority_urgency_idx ON public.todos(priority, urgency);

-- Category analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS category_analytics_user_category_idx ON public.category_analytics(user_id, category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS category_analytics_last_calculated_idx ON public.category_analytics(last_calculated);

-- ============================================================================
-- ENHANCED FUNCTIONS FOR NEW CATEGORIZATION SYSTEM
-- ============================================================================

-- Function to auto-categorize thoughts based on content
CREATE OR REPLACE FUNCTION public.auto_categorize_thought(thought_text TEXT)
RETURNS thought_type AS $$
DECLARE
    result thought_type;
    lower_text TEXT;
BEGIN
    lower_text := lower(thought_text);
    
    -- Goal detection
    IF lower_text ~ '(goal|achieve|objective|target|aim|ambition|aspiration)' THEN
        result := 'goal';
    -- Task detection
    ELSIF lower_text ~ '(todo|task|complete|finish|do|action|implement)' THEN
        result := 'task';
    -- Reminder detection
    ELSIF lower_text ~ '(remind|remember|dont forget|schedule|appointment|deadline)' THEN
        result := 'reminder';
    -- Learning detection
    ELSIF lower_text ~ '(learn|study|course|education|tutorial|knowledge|skill)' THEN
        result := 'learning';
    -- Career detection
    ELSIF lower_text ~ '(career|job|work|profession|interview|resume|salary)' THEN
        result := 'career';
    -- Project idea detection
    ELSIF lower_text ~ '(project|build|create|develop|app|website|system)' THEN
        result := 'projectidea';
    -- Habit detection
    ELSIF lower_text ~ '(habit|routine|daily|weekly|practice|consistently)' THEN
        result := 'habit';
    -- Insight detection
    ELSIF lower_text ~ '(insight|realization|understanding|epiphany|discovery)' THEN
        result := 'insight';
    -- System detection
    ELSIF lower_text ~ '(system|process|workflow|methodology|framework)' THEN
        result := 'system';
    -- Automation detection
    ELSIF lower_text ~ '(automate|script|bot|automated|automation)' THEN
        result := 'automation';
    -- Person detection
    ELSIF lower_text ~ '(person|people|relationship|friend|colleague|contact)' THEN
        result := 'person';
    -- Metric detection
    ELSIF lower_text ~ '(metric|kpi|measure|track|analytics|performance)' THEN
        result := 'metric';
    -- Sensitive detection
    ELSIF lower_text ~ '(private|confidential|secret|personal|sensitive)' THEN
        result := 'sensitive';
    -- Idea detection (more general creative thoughts)
    ELSIF lower_text ~ '(idea|concept|brainstorm|creative|innovation|invention)' THEN
        result := 'idea';
    -- Default to note for general thoughts
    ELSE
        result := 'note';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to analyze sentiment
CREATE OR REPLACE FUNCTION public.analyze_sentiment(thought_text TEXT)
RETURNS sentiment_type AS $$
DECLARE
    result sentiment_type;
    lower_text TEXT;
    positive_words INTEGER := 0;
    negative_words INTEGER := 0;
BEGIN
    lower_text := lower(thought_text);
    
    -- Count positive indicators
    positive_words := (
        SELECT array_length(string_to_array(lower_text, ' '), 1) 
        WHERE lower_text ~ '(great|good|awesome|excellent|happy|excited|love|amazing|wonderful|fantastic|brilliant|perfect|success|achieve|accomplish|win|positive|optimistic|confident|motivated|inspired|grateful|thankful|blessed|joy|pleasure|satisfaction|proud|impressed)'
    );
    
    -- Count negative indicators
    negative_words := (
        SELECT array_length(string_to_array(lower_text, ' '), 1)
        WHERE lower_text ~ '(bad|terrible|awful|hate|angry|frustrated|disappointed|worried|anxious|stressed|problem|issue|difficult|hard|struggle|fail|failure|negative|pessimistic|depressed|sad|upset|concerned|trouble|pain|hurt|annoying|irritating)'
    );
    
    -- Determine sentiment
    IF positive_words > negative_words AND positive_words > 0 THEN
        result := 'positive';
    ELSIF negative_words > positive_words AND negative_words > 0 THEN
        result := 'negative';
    ELSIF positive_words > 0 AND negative_words > 0 THEN
        result := 'mixed';
    ELSE
        result := 'neutral';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine urgency level
CREATE OR REPLACE FUNCTION public.determine_urgency(thought_text TEXT)
RETURNS urgency_level AS $$
DECLARE
    result urgency_level;
    lower_text TEXT;
BEGIN
    lower_text := lower(thought_text);
    
    -- Critical urgency
    IF lower_text ~ '(urgent|asap|immediately|critical|emergency|now|today)' THEN
        result := 'critical';
    -- High urgency
    ELSIF lower_text ~ '(soon|quick|fast|deadline|tomorrow|this week)' THEN
        result := 'high';
    -- Medium urgency
    ELSIF lower_text ~ '(next week|upcoming|planned|schedule)' THEN
        result := 'medium';
    -- Low urgency
    ELSIF lower_text ~ '(someday|eventually|future|maybe|consider)' THEN
        result := 'low';
    -- Default to none
    ELSE
        result := 'none';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update category analytics
CREATE OR REPLACE FUNCTION public.update_category_analytics(target_user_id UUID, target_category thought_type)
RETURNS void AS $$
DECLARE
    thought_count INTEGER;
    avg_words DECIMAL;
    sentiment_data JSONB;
    priority_data JSONB;
    urgency_data JSONB;
    weekly_count INTEGER;
    monthly_count INTEGER;
    daily_avg DECIMAL;
BEGIN
    -- Calculate metrics for the category
    SELECT 
        COUNT(*),
        AVG(word_count),
        jsonb_object_agg(sentiment, sentiment_count),
        jsonb_object_agg(priority, priority_count),
        jsonb_object_agg(urgency, urgency_count),
        COUNT(*) FILTER (WHERE created_at >= current_date - interval '7 days'),
        COUNT(*) FILTER (WHERE created_at >= current_date - interval '30 days'),
        COUNT(*)::DECIMAL / GREATEST(EXTRACT(days FROM (current_date - MIN(created_at::date))), 1)
    INTO 
        thought_count, avg_words, sentiment_data, priority_data, urgency_data,
        weekly_count, monthly_count, daily_avg
    FROM (
        SELECT 
            word_count, sentiment, priority, urgency, created_at,
            COUNT(*) OVER (PARTITION BY sentiment) as sentiment_count,
            COUNT(*) OVER (PARTITION BY priority) as priority_count,
            COUNT(*) OVER (PARTITION BY urgency) as urgency_count
        FROM public.thoughts 
        WHERE user_id = target_user_id AND category = target_category
    ) t;
    
    -- Insert or update analytics
    INSERT INTO public.category_analytics (
        user_id, category, total_thoughts, avg_word_count,
        sentiment_distribution, priority_distribution, urgency_distribution,
        thoughts_this_week, thoughts_this_month, avg_thoughts_per_day,
        last_calculated
    ) VALUES (
        target_user_id, target_category, thought_count, avg_words,
        sentiment_data, priority_data, urgency_data,
        weekly_count, monthly_count, daily_avg,
        timezone('utc'::text, now())
    )
    ON CONFLICT (user_id, category, subcategory) 
    DO UPDATE SET
        total_thoughts = EXCLUDED.total_thoughts,
        avg_word_count = EXCLUDED.avg_word_count,
        sentiment_distribution = EXCLUDED.sentiment_distribution,
        priority_distribution = EXCLUDED.priority_distribution,
        urgency_distribution = EXCLUDED.urgency_distribution,
        thoughts_this_week = EXCLUDED.thoughts_this_week,
        thoughts_this_month = EXCLUDED.thoughts_this_month,
        avg_thoughts_per_day = EXCLUDED.avg_thoughts_per_day,
        last_calculated = EXCLUDED.last_calculated,
        updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENHANCED TRIGGERS FOR AUTO-CATEGORIZATION
-- ============================================================================

-- Trigger function for auto-categorization and analysis
CREATE OR REPLACE FUNCTION public.auto_analyze_thought()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-categorize if category is uncategorized and not manually set
    IF NEW.category = 'uncategorized' AND (TG_OP = 'INSERT' OR OLD.category = 'uncategorized') THEN
        NEW.category := public.auto_categorize_thought(NEW.raw_text);
    END IF;
    
    -- Auto-analyze sentiment if not manually set
    IF NEW.sentiment = 'neutral' AND (TG_OP = 'INSERT' OR OLD.sentiment = 'neutral') THEN
        NEW.sentiment := public.analyze_sentiment(NEW.raw_text);
    END IF;
    
    -- Auto-determine urgency if not manually set
    IF NEW.urgency = 'none' AND (TG_OP = 'INSERT' OR OLD.urgency = 'none') THEN
        NEW.urgency := public.determine_urgency(NEW.raw_text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the auto-analysis trigger
CREATE TRIGGER thoughts_auto_analyze
    BEFORE INSERT OR UPDATE ON public.thoughts
    FOR EACH ROW EXECUTE FUNCTION public.auto_analyze_thought();

-- Trigger to update category analytics after thought changes
CREATE OR REPLACE FUNCTION public.update_analytics_on_thought_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update analytics for the new category (on insert or category change)
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.category != OLD.category) THEN
        PERFORM public.update_category_analytics(NEW.user_id, NEW.category);
    END IF;
    
    -- Update analytics for the old category (on category change or delete)
    IF TG_OP = 'UPDATE' AND NEW.category != OLD.category THEN
        PERFORM public.update_category_analytics(OLD.user_id, OLD.category);
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.update_category_analytics(OLD.user_id, OLD.category);
    END IF;
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Create the analytics update trigger
CREATE TRIGGER thoughts_update_analytics
    AFTER INSERT OR UPDATE OR DELETE ON public.thoughts
    FOR EACH ROW EXECUTE FUNCTION public.update_analytics_on_thought_change();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES (UPDATED)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_analytics ENABLE ROW LEVEL SECURITY;

-- Thoughts policies (Enhanced)
CREATE POLICY "thoughts_select_policy" ON public.thoughts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "thoughts_insert_policy" ON public.thoughts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "thoughts_update_policy" ON public.thoughts
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "thoughts_delete_policy" ON public.thoughts
    FOR DELETE USING (auth.uid() = user_id);

-- Category analytics policies
CREATE POLICY "category_analytics_select_policy" ON public.category_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "category_analytics_insert_policy" ON public.category_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "category_analytics_update_policy" ON public.category_analytics
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PERMISSIONS AND GRANTS
-- ============================================================================

-- Grant permissions on new functions
GRANT EXECUTE ON FUNCTION public.auto_categorize_thought(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_sentiment(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.determine_urgency(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_category_analytics(UUID, thought_type) TO authenticated;

-- Grant permissions on new table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_analytics TO authenticated;

-- ============================================================================
-- INITIAL DATA AND VALIDATION
-- ============================================================================

-- Create view for easy category insights
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
    -- Calculate trend indicators
    CASE 
        WHEN ca.thoughts_this_week > ca.avg_thoughts_per_day * 7 THEN 'increasing'
        WHEN ca.thoughts_this_week < ca.avg_thoughts_per_day * 7 * 0.8 THEN 'decreasing'
        ELSE 'stable'
    END as weekly_trend
FROM public.category_analytics ca
WHERE ca.total_thoughts > 0
ORDER BY ca.user_id, ca.total_thoughts DESC;

-- Grant permissions on view
GRANT SELECT ON public.category_insights TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
    RAISE NOTICE 'Enhanced database schema v2.0 created successfully with 15-category system!';
    RAISE NOTICE 'New categories: Goal, Habit, ProjectIdea, Task, Reminder, Note, Insight, Learning, Career, Metric, Idea, System, Automation, Person, Sensitive, Uncategorized';
    RAISE NOTICE 'New fields: category, subcategory, priority, title, summary, urgency, sentiment';
    RAISE NOTICE 'Auto-categorization, sentiment analysis, and analytics tracking enabled!';
END $$;