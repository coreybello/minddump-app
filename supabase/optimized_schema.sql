-- Optimized Database Schema for MindDump App
-- Performance-focused design with enhanced indexing and constraints
-- Author: Database Engineer (Swarm Agent)
-- Date: 2025-07-16

-- ============================================================================
-- EXTENSIONS AND SETUP
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For efficient composite indexes

-- ============================================================================
-- CUSTOM TYPES (Enhanced with validation)
-- ============================================================================

CREATE TYPE thought_type AS ENUM ('idea', 'task', 'project', 'vent', 'reflection', 'note', 'reminder');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical', 'urgent');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived');
CREATE TYPE todo_status AS ENUM ('pending', 'in_progress', 'blocked', 'completed', 'cancelled');

-- ============================================================================
-- PERFORMANCE CONFIGURATIONS
-- ============================================================================

-- Set optimal configurations for better performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

-- ============================================================================
-- OPTIMIZED TABLES WITH ENHANCED CONSTRAINTS
-- ============================================================================

-- Thoughts table with performance optimizations
CREATE TABLE IF NOT EXISTS public.thoughts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    raw_text TEXT NOT NULL CHECK (length(raw_text) >= 1 AND length(raw_text) <= 50000),
    type thought_type NOT NULL,
    expanded_text TEXT CHECK (length(expanded_text) <= 100000),
    actions JSONB DEFAULT '[]'::jsonb CHECK (jsonb_typeof(actions) = 'array'),
    tags TEXT[] DEFAULT '{}' CHECK (array_length(tags, 1) <= 50),
    word_count INTEGER GENERATED ALWAYS AS (array_length(string_to_array(raw_text, ' '), 1)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(raw_text, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(expanded_text, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
    ) STORED
);

-- Projects table with enhanced structure
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
    
    -- Project metadata
    status project_status DEFAULT 'planning'::project_status NOT NULL,
    category TEXT DEFAULT 'general' CHECK (length(category) <= 50),
    priority priority_level DEFAULT 'medium'::priority_level,
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

-- Enhanced todos table
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task TEXT NOT NULL CHECK (length(task) >= 1 AND length(task) <= 1000),
    description TEXT CHECK (length(description) <= 5000),
    priority priority_level DEFAULT 'medium'::priority_level,
    status todo_status DEFAULT 'pending'::todo_status,
    
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
-- AUDIT AND CHANGE TRACKING
-- ============================================================================

-- Audit log table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address INET,
    user_agent TEXT
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Thoughts table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_user_id_idx ON public.thoughts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_type_idx ON public.thoughts(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_created_at_idx ON public.thoughts(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_updated_at_idx ON public.thoughts(updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_word_count_idx ON public.thoughts(word_count);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_search_idx ON public.thoughts USING GIN(search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_tags_idx ON public.thoughts USING GIN(tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_actions_idx ON public.thoughts USING GIN(actions);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_user_type_created_idx ON public.thoughts(user_id, type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS thoughts_user_created_idx ON public.thoughts(user_id, created_at DESC);

-- Projects table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_thought_id_idx ON public.projects(thought_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_status_idx ON public.projects(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_category_idx ON public.projects(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_priority_idx ON public.projects(priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_created_at_idx ON public.projects(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_due_date_idx ON public.projects(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_tech_stack_idx ON public.projects USING GIN(tech_stack);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_features_idx ON public.projects USING GIN(features);

-- Composite indexes for projects
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_user_status_idx ON public.projects(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_user_priority_idx ON public.projects(user_id, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS projects_status_due_idx ON public.projects(status, due_date) WHERE due_date IS NOT NULL;

-- Todos table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_user_id_idx ON public.todos(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_project_id_idx ON public.todos(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_thought_id_idx ON public.todos(thought_id) WHERE thought_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_parent_todo_id_idx ON public.todos(parent_todo_id) WHERE parent_todo_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_completed_idx ON public.todos(completed);
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_status_idx ON public.todos(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_priority_idx ON public.todos(priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_due_date_idx ON public.todos(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_tags_idx ON public.todos USING GIN(tags);

-- Composite indexes for todos
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_user_status_idx ON public.todos(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_user_completed_idx ON public.todos(user_id, completed);
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_user_priority_idx ON public.todos(user_id, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_project_status_idx ON public.todos(project_id, status) WHERE project_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS todos_due_priority_idx ON public.todos(due_date, priority) WHERE due_date IS NOT NULL;

-- Audit log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_log_table_record_idx ON public.audit_log(table_name, record_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_log_changed_at_idx ON public.audit_log(changed_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_log_changed_by_idx ON public.audit_log(changed_by) WHERE changed_by IS NOT NULL;

-- ============================================================================
-- FUNCTIONS AND STORED PROCEDURES
-- ============================================================================

-- Enhanced updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (
        table_name, record_id, operation, old_values, new_values, changed_by
    ) VALUES (
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    
    RETURN CASE 
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Project completion percentage calculator
CREATE OR REPLACE FUNCTION public.calculate_project_completion(project_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_todos INTEGER;
    completed_todos INTEGER;
    completion_percentage INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = true)
    INTO total_todos, completed_todos
    FROM public.todos
    WHERE project_id = project_uuid;
    
    IF total_todos = 0 THEN
        RETURN 0;
    END IF;
    
    completion_percentage := ROUND((completed_todos::DECIMAL / total_todos::DECIMAL) * 100);
    RETURN completion_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Text search function with ranking
CREATE OR REPLACE FUNCTION public.search_thoughts(
    search_query TEXT,
    user_uuid UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    raw_text TEXT,
    type thought_type,
    expanded_text TEXT,
    rank REAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.raw_text,
        t.type,
        t.expanded_text,
        ts_rank(t.search_vector, plainto_tsquery('english', search_query)) as rank,
        t.created_at
    FROM public.thoughts t
    WHERE 
        (user_uuid IS NULL OR t.user_id = user_uuid) AND
        t.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC, t.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER thoughts_updated_at
    BEFORE UPDATE ON public.thoughts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER todos_updated_at
    BEFORE UPDATE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Audit triggers
CREATE TRIGGER thoughts_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.thoughts
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER projects_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER todos_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Auto-complete todo when completion_percentage reaches 100
CREATE OR REPLACE FUNCTION public.auto_complete_todo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completion_percentage = 100 AND NOT NEW.completed THEN
        NEW.completed = true;
        NEW.completed_at = timezone('utc'::text, now());
        NEW.status = 'completed'::todo_status;
    ELSIF NEW.completion_percentage < 100 AND NEW.completed THEN
        NEW.completed = false;
        NEW.completed_at = NULL;
        NEW.status = CASE 
            WHEN NEW.status = 'completed' THEN 'in_progress'::todo_status
            ELSE NEW.status
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_auto_complete
    BEFORE INSERT OR UPDATE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION public.auto_complete_todo();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

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

-- Projects policies (Enhanced)
CREATE POLICY "projects_select_policy" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_policy" ON public.projects
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.thoughts WHERE id = thought_id AND user_id = auth.uid())
    );

CREATE POLICY "projects_update_policy" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_delete_policy" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Todos policies (Enhanced)
CREATE POLICY "todos_select_policy" ON public.todos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "todos_insert_policy" ON public.todos
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        (project_id IS NULL OR EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())) AND
        (thought_id IS NULL OR EXISTS (SELECT 1 FROM public.thoughts WHERE id = thought_id AND user_id = auth.uid())) AND
        (parent_todo_id IS NULL OR EXISTS (SELECT 1 FROM public.todos WHERE id = parent_todo_id AND user_id = auth.uid()))
    );

CREATE POLICY "todos_update_policy" ON public.todos
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "todos_delete_policy" ON public.todos
    FOR DELETE USING (auth.uid() = user_id);

-- Audit log policies
CREATE POLICY "audit_log_select_policy" ON public.audit_log
    FOR SELECT USING (
        changed_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.thoughts WHERE id = record_id AND user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.projects WHERE id = record_id AND user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.todos WHERE id = record_id AND user_id = auth.uid()
        )
    );

-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

-- Project statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.project_stats AS
SELECT 
    p.user_id,
    p.status,
    p.category,
    p.priority,
    COUNT(*) as project_count,
    AVG(p.actual_hours) as avg_hours,
    AVG(CASE WHEN p.due_date IS NOT NULL THEN EXTRACT(EPOCH FROM (p.due_date - p.start_date))/86400 END) as avg_duration_days,
    COUNT(t.id) as total_todos,
    COUNT(t.id) FILTER (WHERE t.completed = true) as completed_todos
FROM public.projects p
LEFT JOIN public.todos t ON t.project_id = p.id
GROUP BY p.user_id, p.status, p.category, p.priority;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS project_stats_user_idx ON public.project_stats(user_id);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION public.refresh_project_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.project_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================

-- Create function to get table statistics
CREATE OR REPLACE FUNCTION public.get_table_stats()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    total_size TEXT,
    index_size TEXT,
    toast_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.schemaname||'.'||t.tablename as table_name,
        t.n_tup_ins - t.n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
        pg_size_pretty(pg_indexes_size(c.oid)) as index_size,
        pg_size_pretty(COALESCE(pg_total_relation_size(toast.oid), 0)) as toast_size
    FROM pg_stat_user_tables t
    JOIN pg_class c ON c.relname = t.tablename
    LEFT JOIN pg_class toast ON toast.oid = c.reltoastrelid
    WHERE t.schemaname = 'public'
    ORDER BY pg_total_relation_size(c.oid) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.thoughts IS 'Stores user thoughts with full-text search capabilities and comprehensive metadata';
COMMENT ON TABLE public.projects IS 'Enhanced project management with status tracking, time estimation, and structured metadata';
COMMENT ON TABLE public.todos IS 'Hierarchical todo system with progress tracking and time management';
COMMENT ON TABLE public.audit_log IS 'Comprehensive audit trail for all data changes';

COMMENT ON COLUMN public.thoughts.search_vector IS 'Generated full-text search vector for efficient text searching';
COMMENT ON COLUMN public.thoughts.word_count IS 'Auto-calculated word count for analytics';
COMMENT ON COLUMN public.projects.estimated_hours IS 'Initial time estimate for project completion';
COMMENT ON COLUMN public.projects.actual_hours IS 'Actual time spent on project';
COMMENT ON COLUMN public.todos.completion_percentage IS 'Progress percentage (0-100), auto-syncs with completed flag';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thoughts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.todos TO authenticated;
GRANT SELECT ON public.audit_log TO authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION public.calculate_project_completion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_thoughts(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_stats() TO authenticated;

-- Grant permissions on materialized views
GRANT SELECT ON public.project_stats TO authenticated;

-- ============================================================================
-- VACUUM AND ANALYZE
-- ============================================================================

-- Initial maintenance
VACUUM ANALYZE public.thoughts;
VACUUM ANALYZE public.projects;
VACUUM ANALYZE public.todos;
VACUUM ANALYZE public.audit_log;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Optimized database schema created successfully with enhanced performance, security, and monitoring capabilities!';
END $$;