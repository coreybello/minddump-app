-- Migration Script: Upgrade to v2.0 Categorization System
-- Safely migrates existing data to new 15-category system
-- Author: Data Schema Architect (Swarm Agent)
-- Date: 2025-07-20

-- ============================================================================
-- MIGRATION SAFETY CHECKS
-- ============================================================================

DO $$
BEGIN
    -- Check if we're running on the right database
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'thoughts' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'thoughts table not found. Please ensure you are running this on the correct database.';
    END IF;
    
    RAISE NOTICE 'Starting migration to v2.0 categorization system...';
    RAISE NOTICE 'Timestamp: %', now();
END $$;

-- ============================================================================
-- BACKUP EXISTING DATA
-- ============================================================================

-- Create backup tables before migration
CREATE TABLE IF NOT EXISTS public.thoughts_backup_pre_v2 AS 
SELECT * FROM public.thoughts;

CREATE TABLE IF NOT EXISTS public.projects_backup_pre_v2 AS 
SELECT * FROM public.projects;

CREATE TABLE IF NOT EXISTS public.todos_backup_pre_v2 AS 
SELECT * FROM public.todos;

-- Log the backup
DO $$
DECLARE
    thought_count INTEGER;
    project_count INTEGER;
    todo_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO thought_count FROM public.thoughts_backup_pre_v2;
    SELECT COUNT(*) INTO project_count FROM public.projects_backup_pre_v2;
    SELECT COUNT(*) INTO todo_count FROM public.todos_backup_pre_v2;
    
    RAISE NOTICE 'Backup completed:';
    RAISE NOTICE '  - Thoughts: % records', thought_count;
    RAISE NOTICE '  - Projects: % records', project_count;
    RAISE NOTICE '  - Todos: % records', todo_count;
END $$;

-- ============================================================================
-- CREATE NEW ENUM TYPES (SAFE ADDITIONS)
-- ============================================================================

-- Create new enum types that don't exist yet
DO $$
BEGIN
    -- Create sentiment_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sentiment_type') THEN
        CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative', 'mixed');
        RAISE NOTICE 'Created sentiment_type enum';
    END IF;
    
    -- Create urgency_level if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgency_level') THEN
        CREATE TYPE urgency_level AS ENUM ('none', 'low', 'medium', 'high', 'critical');
        RAISE NOTICE 'Created urgency_level enum';
    END IF;
    
    -- Create enhanced priority_level if it doesn't exist with all values
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'priority_level' AND e.enumlabel = 'urgent') THEN
        -- Add new values to existing priority_level enum
        ALTER TYPE priority_level ADD VALUE IF NOT EXISTS 'critical';
        ALTER TYPE priority_level ADD VALUE IF NOT EXISTS 'urgent';
        RAISE NOTICE 'Enhanced priority_level enum with critical and urgent';
    END IF;
END $$;

-- ============================================================================
-- STEP 1: ADD NEW COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add new columns to thoughts table
DO $$
BEGIN
    -- Add category column (will replace type eventually)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thoughts' AND column_name = 'category') THEN
        ALTER TABLE public.thoughts ADD COLUMN category TEXT;
        RAISE NOTICE 'Added category column to thoughts table';
    END IF;
    
    -- Add subcategory column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thoughts' AND column_name = 'subcategory') THEN
        ALTER TABLE public.thoughts ADD COLUMN subcategory TEXT CHECK (length(subcategory) <= 100);
        RAISE NOTICE 'Added subcategory column to thoughts table';
    END IF;
    
    -- Add priority column (separate from existing priority in todos)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thoughts' AND column_name = 'priority') THEN
        ALTER TABLE public.thoughts ADD COLUMN priority priority_level DEFAULT 'medium'::priority_level;
        RAISE NOTICE 'Added priority column to thoughts table';
    END IF;
    
    -- Add title column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thoughts' AND column_name = 'title') THEN
        ALTER TABLE public.thoughts ADD COLUMN title TEXT CHECK (length(title) <= 200);
        RAISE NOTICE 'Added title column to thoughts table';
    END IF;
    
    -- Add summary column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thoughts' AND column_name = 'summary') THEN
        ALTER TABLE public.thoughts ADD COLUMN summary TEXT CHECK (length(summary) <= 1000);
        RAISE NOTICE 'Added summary column to thoughts table';
    END IF;
    
    -- Add urgency column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thoughts' AND column_name = 'urgency') THEN
        ALTER TABLE public.thoughts ADD COLUMN urgency urgency_level DEFAULT 'none'::urgency_level;
        RAISE NOTICE 'Added urgency column to thoughts table';
    END IF;
    
    -- Add sentiment column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thoughts' AND column_name = 'sentiment') THEN
        ALTER TABLE public.thoughts ADD COLUMN sentiment sentiment_type DEFAULT 'neutral'::sentiment_type;
        RAISE NOTICE 'Added sentiment column to thoughts table';
    END IF;
END $$;

-- Add urgency to projects table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'urgency') THEN
        ALTER TABLE public.projects ADD COLUMN urgency urgency_level DEFAULT 'none'::urgency_level;
        RAISE NOTICE 'Added urgency column to projects table';
    END IF;
END $$;

-- Add category and urgency to todos table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'category') THEN
        ALTER TABLE public.todos ADD COLUMN category TEXT CHECK (length(category) <= 100);
        RAISE NOTICE 'Added category column to todos table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'urgency') THEN
        ALTER TABLE public.todos ADD COLUMN urgency urgency_level DEFAULT 'none'::urgency_level;
        RAISE NOTICE 'Added urgency column to todos table';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE MAPPING FUNCTIONS FOR DATA MIGRATION
-- ============================================================================

-- Create function to map old thought types to new categories
CREATE OR REPLACE FUNCTION public.map_old_type_to_new_category(old_type TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE old_type
        WHEN 'idea' THEN 'idea'
        WHEN 'task' THEN 'task'
        WHEN 'project' THEN 'projectidea'
        WHEN 'vent' THEN 'note'
        WHEN 'reflection' THEN 'insight'
        WHEN 'note' THEN 'note'
        WHEN 'reminder' THEN 'reminder'
        ELSE 'uncategorized'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create enhanced auto-categorization function
CREATE OR REPLACE FUNCTION public.auto_categorize_thought_migration(thought_text TEXT, old_type TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
    lower_text TEXT;
BEGIN
    lower_text := lower(thought_text);
    
    -- First, try to use old type mapping if available
    IF old_type IS NOT NULL THEN
        result := public.map_old_type_to_new_category(old_type);
        -- If we got a specific mapping, use it unless we can be more specific
        IF result != 'uncategorized' AND result != 'note' THEN
            RETURN result;
        END IF;
    END IF;
    
    -- Enhanced categorization logic
    IF lower_text ~ '(goal|achieve|objective|target|aim|ambition|aspiration|accomplish)' THEN
        result := 'goal';
    ELSIF lower_text ~ '(habit|routine|daily|weekly|practice|consistently|regular)' THEN
        result := 'habit';
    ELSIF lower_text ~ '(todo|task|complete|finish|do|action|implement|work on)' THEN
        result := 'task';
    ELSIF lower_text ~ '(remind|remember|dont forget|schedule|appointment|deadline|calendar)' THEN
        result := 'reminder';
    ELSIF lower_text ~ '(learn|study|course|education|tutorial|knowledge|skill|training)' THEN
        result := 'learning';
    ELSIF lower_text ~ '(career|job|work|profession|interview|resume|salary|promotion)' THEN
        result := 'career';
    ELSIF lower_text ~ '(project|build|create|develop|app|website|system|software)' THEN
        result := 'projectidea';
    ELSIF lower_text ~ '(insight|realization|understanding|epiphany|discovery|learned)' THEN
        result := 'insight';
    ELSIF lower_text ~ '(system|process|workflow|methodology|framework|structure)' THEN
        result := 'system';
    ELSIF lower_text ~ '(automate|script|bot|automated|automation|automatic)' THEN
        result := 'automation';
    ELSIF lower_text ~ '(person|people|relationship|friend|colleague|contact|team)' THEN
        result := 'person';
    ELSIF lower_text ~ '(metric|kpi|measure|track|analytics|performance|data)' THEN
        result := 'metric';
    ELSIF lower_text ~ '(private|confidential|secret|personal|sensitive|password)' THEN
        result := 'sensitive';
    ELSIF lower_text ~ '(idea|concept|brainstorm|creative|innovation|invention|think)' THEN
        result := 'idea';
    ELSE
        result := 'note';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to analyze sentiment for migration
CREATE OR REPLACE FUNCTION public.analyze_sentiment_migration(thought_text TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
    lower_text TEXT;
    positive_score INTEGER := 0;
    negative_score INTEGER := 0;
BEGIN
    lower_text := lower(thought_text);
    
    -- Positive indicators
    IF lower_text ~ '(great|good|awesome|excellent|happy|excited|love|amazing|wonderful|fantastic|brilliant|perfect|success|achieve|accomplish|win|positive|optimistic|confident|motivated|inspired|grateful|thankful|blessed|joy|pleasure|satisfaction|proud|impressed)' THEN
        positive_score := positive_score + 1;
    END IF;
    
    -- Negative indicators  
    IF lower_text ~ '(bad|terrible|awful|hate|angry|frustrated|disappointed|worried|anxious|stressed|problem|issue|difficult|hard|struggle|fail|failure|negative|pessimistic|depressed|sad|upset|concerned|trouble|pain|hurt|annoying|irritating)' THEN
        negative_score := negative_score + 1;
    END IF;
    
    -- Determine sentiment
    IF positive_score > 0 AND negative_score > 0 THEN
        result := 'mixed';
    ELSIF positive_score > 0 THEN
        result := 'positive';
    ELSIF negative_score > 0 THEN
        result := 'negative';
    ELSE
        result := 'neutral';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine urgency for migration
CREATE OR REPLACE FUNCTION public.determine_urgency_migration(thought_text TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
    lower_text TEXT;
BEGIN
    lower_text := lower(thought_text);
    
    IF lower_text ~ '(urgent|asap|immediately|critical|emergency|now|today|right now)' THEN
        result := 'critical';
    ELSIF lower_text ~ '(soon|quick|fast|deadline|tomorrow|this week|urgent)' THEN
        result := 'high';
    ELSIF lower_text ~ '(next week|upcoming|planned|schedule|next month)' THEN
        result := 'medium';
    ELSIF lower_text ~ '(someday|eventually|future|maybe|consider|long term)' THEN
        result := 'low';
    ELSE
        result := 'none';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 3: MIGRATE EXISTING DATA
-- ============================================================================

-- Update thoughts with new categorization
DO $$
DECLARE
    update_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting migration of existing thoughts...';
    
    -- Migrate category based on old type and content analysis
    UPDATE public.thoughts 
    SET 
        category = public.auto_categorize_thought_migration(raw_text, type::text),
        sentiment = public.analyze_sentiment_migration(raw_text),
        urgency = public.determine_urgency_migration(raw_text),
        -- Auto-generate title from content
        title = CASE 
            WHEN length(raw_text) <= 50 THEN raw_text
            ELSE left(raw_text, 47) || '...'
        END,
        -- Auto-generate summary from content
        summary = CASE 
            WHEN length(raw_text) <= 200 THEN raw_text
            ELSE left(raw_text, 197) || '...'
        END
    WHERE category IS NULL;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % thoughts to new categorization system', update_count;
END $$;

-- Migrate projects urgency based on priority and content
DO $$
DECLARE
    update_count INTEGER;
BEGIN
    UPDATE public.projects 
    SET urgency = CASE priority
        WHEN 'critical' THEN 'critical'::urgency_level
        WHEN 'urgent' THEN 'high'::urgency_level  
        WHEN 'high' THEN 'medium'::urgency_level
        ELSE 'none'::urgency_level
    END
    WHERE urgency = 'none'::urgency_level OR urgency IS NULL;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Updated urgency for % projects', update_count;
END $$;

-- Migrate todos category and urgency
DO $$
DECLARE
    update_count INTEGER;
BEGIN
    -- Set todo category based on task content and priority
    UPDATE public.todos 
    SET 
        category = public.auto_categorize_thought_migration(task),
        urgency = CASE priority
            WHEN 'critical' THEN 'critical'::urgency_level
            WHEN 'urgent' THEN 'high'::urgency_level
            WHEN 'high' THEN 'medium'::urgency_level
            ELSE 'none'::urgency_level
        END
    WHERE category IS NULL OR urgency = 'none'::urgency_level OR urgency IS NULL;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Updated category and urgency for % todos', update_count;
END $$;

-- ============================================================================
-- STEP 4: CREATE NEW INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for new categorization fields
DO $$
BEGIN
    RAISE NOTICE 'Creating performance indexes for new categorization fields...';
    
    -- Thoughts indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_category_idx ON public.thoughts(category);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_subcategory_idx ON public.thoughts(subcategory) WHERE subcategory IS NOT NULL;
    CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_sentiment_idx ON public.thoughts(sentiment);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_urgency_idx ON public.thoughts(urgency);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_user_category_idx ON public.thoughts(user_id, category);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_category_priority_idx ON public.thoughts(category, priority);
    
    -- Projects indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_urgency_idx ON public.projects(urgency);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_priority_urgency_idx ON public.projects(priority, urgency);
    
    -- Todos indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_category_idx ON public.todos(category) WHERE category IS NOT NULL;
    CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_urgency_idx ON public.todos(urgency);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_priority_urgency_idx ON public.todos(priority, urgency);
    
    RAISE NOTICE 'Performance indexes created successfully';
END $$;

-- ============================================================================
-- STEP 5: CREATE CATEGORY ANALYTICS TABLE
-- ============================================================================

-- Create category analytics table
CREATE TABLE IF NOT EXISTS public.category_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
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

-- Create indexes for category analytics
CREATE INDEX IF NOT EXISTS category_analytics_user_category_idx ON public.category_analytics(user_id, category);
CREATE INDEX IF NOT EXISTS category_analytics_last_calculated_idx ON public.category_analytics(last_calculated);

-- Enable RLS on category analytics
ALTER TABLE public.category_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for category analytics
CREATE POLICY "category_analytics_select_policy" ON public.category_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "category_analytics_insert_policy" ON public.category_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "category_analytics_update_policy" ON public.category_analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_analytics TO authenticated;

-- ============================================================================
-- STEP 6: POPULATE INITIAL ANALYTICS DATA
-- ============================================================================

-- Populate initial category analytics for all users
DO $$
DECLARE
    user_record RECORD;
    category_record RECORD;
BEGIN
    RAISE NOTICE 'Populating initial category analytics...';
    
    -- For each user, calculate analytics for each category they have
    FOR user_record IN SELECT DISTINCT user_id FROM public.thoughts LOOP
        FOR category_record IN SELECT DISTINCT category FROM public.thoughts WHERE user_id = user_record.user_id LOOP
            -- Calculate and insert analytics
            INSERT INTO public.category_analytics (
                user_id, category, total_thoughts, avg_word_count,
                sentiment_distribution, priority_distribution, urgency_distribution,
                thoughts_this_week, thoughts_this_month, avg_thoughts_per_day
            )
            SELECT 
                user_record.user_id,
                category_record.category,
                COUNT(*) as total_thoughts,
                AVG(word_count) as avg_word_count,
                jsonb_object_agg(sentiment, sentiment_count) as sentiment_distribution,
                jsonb_object_agg(priority, priority_count) as priority_distribution,
                jsonb_object_agg(urgency, urgency_count) as urgency_distribution,
                COUNT(*) FILTER (WHERE created_at >= current_date - interval '7 days') as thoughts_this_week,
                COUNT(*) FILTER (WHERE created_at >= current_date - interval '30 days') as thoughts_this_month,
                CASE 
                    WHEN MIN(created_at) IS NOT NULL THEN 
                        COUNT(*)::DECIMAL / GREATEST(EXTRACT(days FROM (current_date - MIN(created_at::date))), 1)
                    ELSE 0 
                END as avg_thoughts_per_day
            FROM (
                SELECT 
                    word_count, sentiment, priority, urgency, created_at,
                    COUNT(*) OVER (PARTITION BY sentiment) as sentiment_count,
                    COUNT(*) OVER (PARTITION BY priority) as priority_count,
                    COUNT(*) OVER (PARTITION BY urgency) as urgency_count
                FROM public.thoughts 
                WHERE user_id = user_record.user_id AND category = category_record.category
            ) t
            ON CONFLICT (user_id, category, subcategory) DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Initial category analytics populated successfully';
END $$;

-- ============================================================================
-- STEP 7: CREATE CONVENIENCE VIEWS
-- ============================================================================

-- Create category insights view
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
-- STEP 8: UPDATE EXISTING FUNCTIONS
-- ============================================================================

-- Update existing triggers to work with new schema
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.map_old_type_to_new_category(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_categorize_thought_migration(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_sentiment_migration(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.determine_urgency_migration(TEXT) TO authenticated;

-- ============================================================================
-- STEP 9: VALIDATION AND CLEANUP
-- ============================================================================

-- Validate migration results
DO $$
DECLARE
    total_thoughts INTEGER;
    categorized_thoughts INTEGER;
    analytics_entries INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_thoughts FROM public.thoughts;
    SELECT COUNT(*) INTO categorized_thoughts FROM public.thoughts WHERE category IS NOT NULL;
    SELECT COUNT(*) INTO analytics_entries FROM public.category_analytics;
    
    RAISE NOTICE 'Migration validation:';
    RAISE NOTICE '  - Total thoughts: %', total_thoughts;
    RAISE NOTICE '  - Categorized thoughts: % (%.1f%%)', categorized_thoughts, (categorized_thoughts::DECIMAL / total_thoughts * 100);
    RAISE NOTICE '  - Analytics entries created: %', analytics_entries;
    
    IF categorized_thoughts < total_thoughts * 0.95 THEN
        RAISE WARNING 'Less than 95% of thoughts were categorized. Manual review may be needed.';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Migration to v2.0 categorization system completed successfully!';
    RAISE NOTICE 'Timestamp: %', now();
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'New features available:';
    RAISE NOTICE '  ✅ 15-category thought classification system';
    RAISE NOTICE '  ✅ Enhanced priority levels (low, medium, high, critical, urgent)';
    RAISE NOTICE '  ✅ Sentiment analysis (positive, neutral, negative, mixed)';
    RAISE NOTICE '  ✅ Urgency levels (none, low, medium, high, critical)';
    RAISE NOTICE '  ✅ Auto-generated titles and summaries';
    RAISE NOTICE '  ✅ Subcategory support for fine-grained classification';
    RAISE NOTICE '  ✅ Category analytics and insights tracking';
    RAISE NOTICE '  ✅ Enhanced search capabilities';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Backup tables created:';
    RAISE NOTICE '  - public.thoughts_backup_pre_v2';
    RAISE NOTICE '  - public.projects_backup_pre_v2';
    RAISE NOTICE '  - public.todos_backup_pre_v2';
    RAISE NOTICE '=================================================================';
END $$;