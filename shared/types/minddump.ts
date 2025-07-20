// MindDump specific types and interfaces
export interface Thought {
  id: string
  raw_text: string
  type: ThoughtType
  expanded_text: string
  created_at: string
  updated_at?: string
  projects?: Project[]
  todos?: Todo[]
  user_id?: string
}

export type ThoughtType = 'goal' | 'habit' | 'projectidea' | 'task' | 'reminder' | 'note' | 'insight' | 'learning' | 'career' | 'metric' | 'idea' | 'system' | 'automation' | 'person' | 'sensitive'

export interface Project {
  id: string
  title: string
  summary: string
  sheets_url?: string
  category?: string
  tech_stack?: string[]
  created_at: string
  updated_at?: string
}

export interface Todo {
  id: string
  task: string
  completed: boolean
  priority: TodoPriority
  created_at: string
  updated_at?: string
  due_date?: string
  assigned_to?: string
}

export type TodoPriority = 'low' | 'medium' | 'high' | 'critical'

export interface ThoughtStats {
  total: number
  projects: number
  todos: number
  completedTodos: number
  byType: Record<ThoughtType, number>
}

export interface ThoughtFilters {
  type?: ThoughtType | 'all'
  dateRange?: {
    start: string
    end: string
  }
  searchQuery?: string
  completed?: boolean
}

export interface MindDumpInputProps {
  onSubmit: (text: string, category?: ThoughtType) => Promise<void>
  isProcessing?: boolean
  placeholder?: string
  maxLength?: number
  className?: string
}

export interface DashboardProps {
  className?: string
  filters?: ThoughtFilters
  onFiltersChange?: (filters: ThoughtFilters) => void
}

// Voice recognition types
export interface VoiceRecognitionState {
  isListening: boolean
  isSupported: boolean
  transcript: string
  error?: string
}

// Error handling types
export interface ComponentError {
  message: string
  code?: string
  timestamp: string
  component: string
}

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

// UI component variant types
export interface ThoughtCardVariants {
  size: 'sm' | 'md' | 'lg'
  variant: 'default' | 'compact' | 'expanded'
  interactive: boolean
}

export interface StatsCardVariants {
  layout: 'horizontal' | 'vertical'
  emphasis: 'number' | 'icon' | 'balanced'
  animation: boolean
}