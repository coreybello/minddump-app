-- Create custom types
CREATE TYPE thought_type AS ENUM ('idea', 'task', 'project', 'vent', 'reflection');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create thoughts table
CREATE TABLE IF NOT EXISTS public.thoughts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    raw_text TEXT NOT NULL,
    type thought_type NOT NULL,
    expanded_text TEXT,
    actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    thought_id UUID REFERENCES public.thoughts(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    readme TEXT,
    overview TEXT,
    sheets_url TEXT,
    category TEXT DEFAULT 'general',
    tech_stack JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task TEXT NOT NULL,
    priority priority_level DEFAULT 'medium'::priority_level,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    thought_id UUID REFERENCES public.thoughts(id) ON DELETE CASCADE,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS thoughts_user_id_idx ON public.thoughts(user_id);
CREATE INDEX IF NOT EXISTS thoughts_type_idx ON public.thoughts(type);
CREATE INDEX IF NOT EXISTS thoughts_created_at_idx ON public.thoughts(created_at DESC);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS projects_thought_id_idx ON public.projects(thought_id);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON public.projects(created_at DESC);

CREATE INDEX IF NOT EXISTS todos_user_id_idx ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS todos_project_id_idx ON public.todos(project_id);
CREATE INDEX IF NOT EXISTS todos_completed_idx ON public.todos(completed);
CREATE INDEX IF NOT EXISTS todos_due_date_idx ON public.todos(due_date);

-- Row Level Security Policies

-- Thoughts policies
CREATE POLICY "Users can view their own thoughts" ON public.thoughts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thoughts" ON public.thoughts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thoughts" ON public.thoughts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thoughts" ON public.thoughts
    FOR DELETE USING (auth.uid() = user_id);

-- Projects policies
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

-- Enable RLS on all tables
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER thoughts_updated_at
    BEFORE UPDATE ON public.thoughts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER todos_updated_at
    BEFORE UPDATE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();