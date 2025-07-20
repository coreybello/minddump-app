// Mock Supabase client for authentication-free operation
// This file provides mock implementations to replace Supabase functionality
// since authentication was removed in Issue #16

export const createSupabaseClient = () => {
  // Return a mock client that doesn't require Supabase packages
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ error: new Error('Authentication disabled') }),
      signInWithOAuth: () => Promise.resolve({ error: new Error('Authentication disabled') }),
      signUp: () => Promise.resolve({ error: new Error('Authentication disabled') }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({ error: new Error('Database operations disabled - auth removed') }),
      insert: () => ({ error: new Error('Database operations disabled - auth removed') })
    })
  }
}

export const createSupabaseServerClient = () => {
  // Return a mock server client that doesn't require Supabase packages
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      exchangeCodeForSession: () => Promise.resolve({ error: new Error('Authentication disabled') })
    },
    from: () => ({
      select: () => ({ error: new Error('Database operations disabled - auth removed') }),
      insert: () => ({ error: new Error('Database operations disabled - auth removed') })
    })
  }
}

// Keep database types for reference but mark as unused
export type Database = {
  public: {
    Tables: {
      thoughts: {
        Row: {
          id: string
          raw_text: string
          type: 'idea' | 'task' | 'project' | 'vent' | 'reflection'
          expanded_text: string | null
          actions: string[] | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          raw_text: string
          type: 'idea' | 'task' | 'project' | 'vent' | 'reflection'
          expanded_text?: string | null
          actions?: string[] | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          raw_text?: string
          type?: 'idea' | 'task' | 'project' | 'vent' | 'reflection'
          expanded_text?: string | null
          actions?: string[] | null
          created_at?: string
          user_id?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          summary: string
          readme: string | null
          overview: string | null
          github_repo_url: string | null
          created_at: string
          user_id: string
          thought_id: string
        }
        Insert: {
          id?: string
          title: string
          summary: string
          readme?: string | null
          overview?: string | null
          github_repo_url?: string | null
          created_at?: string
          user_id: string
          thought_id: string
        }
        Update: {
          id?: string
          title?: string
          summary?: string
          readme?: string | null
          overview?: string | null
          github_repo_url?: string | null
          created_at?: string
          user_id?: string
          thought_id?: string
        }
      }
      todos: {
        Row: {
          id: string
          task: string
          priority: 'low' | 'medium' | 'high'
          project_id: string | null
          due_date: string | null
          completed: boolean
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          task: string
          priority: 'low' | 'medium' | 'high'
          project_id?: string | null
          due_date?: string | null
          completed?: boolean
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          task?: string
          priority?: 'low' | 'medium' | 'high'
          project_id?: string | null
          due_date?: string | null
          completed?: boolean
          created_at?: string
          user_id?: string
        }
      }
    }
  }
}