/**
 * Optimized Database Types for MindDump App
 * Auto-generated TypeScript interfaces matching the enhanced database schema
 * Author: Database Engineer (Swarm Agent)
 * Date: 2025-07-16
 */

// ============================================================================
// ENUMS (Enhanced v2.0 with 15-Category System)
// ============================================================================

export type ThoughtType = 
  | 'goal'         // Personal and professional goals
  | 'habit'        // Habit tracking and formation
  | 'projectidea'  // Project ideas and concepts
  | 'task'         // Actionable tasks and todos
  | 'reminder'     // Time-based reminders
  | 'note'         // General notes and observations
  | 'insight'      // Key insights and learnings
  | 'learning'     // Educational content and progress
  | 'career'       // Career-related thoughts
  | 'metric'       // Measurements and KPIs
  | 'idea'         // Creative and innovative ideas
  | 'system'       // System designs and processes
  | 'automation'   // Automation opportunities
  | 'person'       // People and relationship notes
  | 'sensitive'    // Private/sensitive information
  | 'uncategorized' // Default fallback category

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical' | 'urgent'
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived'
export type TodoStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'

// New v2.0 enum types
export type SentimentType = 'positive' | 'neutral' | 'negative' | 'mixed'
export type UrgencyLevel = 'none' | 'low' | 'medium' | 'high' | 'critical'

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface UserOwnedEntity extends BaseEntity {
  user_id: string
}

// ============================================================================
// THOUGHT INTERFACES
// ============================================================================

export interface Thought extends UserOwnedEntity {
  raw_text: string
  
  // Enhanced categorization fields (v2.0)
  category: ThoughtType
  subcategory?: string | null
  priority: PriorityLevel
  title?: string | null
  summary?: string | null
  urgency: UrgencyLevel
  sentiment: SentimentType
  
  // Legacy field for backward compatibility
  type: ThoughtType // Generated from category
  
  expanded_text?: string | null
  actions: string[]
  tags: string[]
  word_count: number
  search_vector?: string // Internal PostgreSQL field
  
  // Auto-generated fields
  auto_title?: string // Generated when title is null
  auto_summary?: string // Generated when summary is null
}

export interface ThoughtInsert {
  id?: string
  user_id: string
  raw_text: string
  
  // Enhanced categorization fields (v2.0)
  category?: ThoughtType
  subcategory?: string | null
  priority?: PriorityLevel
  title?: string | null
  summary?: string | null
  urgency?: UrgencyLevel
  sentiment?: SentimentType
  
  // Legacy compatibility
  type?: ThoughtType // Will be mapped to category
  
  expanded_text?: string | null
  actions?: string[]
  tags?: string[]
  created_at?: string
}

export interface ThoughtUpdate {
  id?: string
  raw_text?: string
  
  // Enhanced categorization fields (v2.0)
  category?: ThoughtType
  subcategory?: string | null
  priority?: PriorityLevel
  title?: string | null
  summary?: string | null
  urgency?: UrgencyLevel
  sentiment?: SentimentType
  
  // Legacy compatibility
  type?: ThoughtType // Will be mapped to category
  
  expanded_text?: string | null
  actions?: string[]
  tags?: string[]
  updated_at?: string
}

// ============================================================================
// PROJECT INTERFACES
// ============================================================================

export interface Project extends UserOwnedEntity {
  thought_id: string
  title: string
  summary: string
  description?: string | null
  readme?: string | null
  overview?: string | null
  
  // URLs and external references
  sheets_url?: string | null
  github_url?: string | null
  demo_url?: string | null
  
  // Project metadata
  status: ProjectStatus
  category: string
  priority: PriorityLevel
  urgency: UrgencyLevel // New v2.0 field
  estimated_hours?: number | null
  actual_hours: number
  
  // Structured data
  tech_stack: string[]
  features: string[]
  requirements: Record<string, any>
  milestones: any[]
  
  // Dates
  start_date?: string | null
  due_date?: string | null
  completed_date?: string | null
}

export interface ProjectInsert {
  id?: string
  user_id: string
  thought_id: string
  title: string
  summary: string
  description?: string | null
  readme?: string | null
  overview?: string | null
  sheets_url?: string | null
  github_url?: string | null
  demo_url?: string | null
  status?: ProjectStatus
  category?: string
  priority?: PriorityLevel
  urgency?: UrgencyLevel // New v2.0 field
  estimated_hours?: number | null
  actual_hours?: number
  tech_stack?: string[]
  features?: string[]
  requirements?: Record<string, any>
  milestones?: any[]
  start_date?: string | null
  due_date?: string | null
  completed_date?: string | null
  created_at?: string
}

export interface ProjectUpdate {
  id?: string
  title?: string
  summary?: string
  description?: string | null
  readme?: string | null
  overview?: string | null
  sheets_url?: string | null
  github_url?: string | null
  demo_url?: string | null
  status?: ProjectStatus
  category?: string
  priority?: PriorityLevel
  urgency?: UrgencyLevel // New v2.0 field
  estimated_hours?: number | null
  actual_hours?: number
  tech_stack?: string[]
  features?: string[]
  requirements?: Record<string, any>
  milestones?: any[]
  start_date?: string | null
  due_date?: string | null
  completed_date?: string | null
  updated_at?: string
}

// ============================================================================
// TODO INTERFACES
// ============================================================================

export interface Todo extends UserOwnedEntity {
  task: string
  description?: string | null
  priority: PriorityLevel
  urgency: UrgencyLevel // New v2.0 field
  status: TodoStatus
  category?: string | null // New v2.0 field
  
  // Relationships
  project_id?: string | null
  thought_id?: string | null
  parent_todo_id?: string | null
  
  // Time management
  due_date?: string | null
  due_time?: string | null
  estimated_minutes?: number | null
  actual_minutes: number
  
  // Progress tracking
  completed: boolean
  completion_percentage: number
  completed_at?: string | null
  
  // Metadata
  tags: string[]
  notes?: string | null
}

export interface TodoInsert {
  id?: string
  user_id: string
  task: string
  description?: string | null
  priority?: PriorityLevel
  urgency?: UrgencyLevel // New v2.0 field
  status?: TodoStatus
  category?: string | null // New v2.0 field
  project_id?: string | null
  thought_id?: string | null
  parent_todo_id?: string | null
  due_date?: string | null
  due_time?: string | null
  estimated_minutes?: number | null
  actual_minutes?: number
  completed?: boolean
  completion_percentage?: number
  tags?: string[]
  notes?: string | null
  created_at?: string
}

export interface TodoUpdate {
  id?: string
  task?: string
  description?: string | null
  priority?: PriorityLevel
  urgency?: UrgencyLevel // New v2.0 field
  status?: TodoStatus
  category?: string | null // New v2.0 field
  project_id?: string | null
  parent_todo_id?: string | null
  due_date?: string | null
  due_time?: string | null
  estimated_minutes?: number | null
  actual_minutes?: number
  completed?: boolean
  completion_percentage?: number
  completed_at?: string | null
  tags?: string[]
  notes?: string | null
  updated_at?: string
}

// ============================================================================
// CATEGORY ANALYTICS INTERFACE (New v2.0)
// ============================================================================

export interface CategoryAnalytics extends UserOwnedEntity {
  category: ThoughtType
  subcategory?: string | null
  
  // Analytics data
  total_thoughts: number
  avg_word_count?: number | null
  sentiment_distribution: Record<SentimentType, number>
  priority_distribution: Record<PriorityLevel, number>
  urgency_distribution: Record<UrgencyLevel, number>
  
  // Time-based metrics
  thoughts_this_week: number
  thoughts_this_month: number
  avg_thoughts_per_day: number
  
  // Last calculation timestamp
  last_calculated: string
}

export interface CategoryInsight {
  user_id: string
  category: ThoughtType
  subcategory?: string | null
  total_thoughts: number
  avg_word_count?: number | null
  thoughts_this_week: number
  thoughts_this_month: number
  avg_thoughts_per_day: number
  sentiment_distribution: Record<SentimentType, number>
  priority_distribution: Record<PriorityLevel, number>
  urgency_distribution: Record<UrgencyLevel, number>
  last_calculated: string
  weekly_trend: 'increasing' | 'decreasing' | 'stable'
}

// ============================================================================
// AUDIT LOG INTERFACE
// ============================================================================

export interface AuditLog extends BaseEntity {
  table_name: string
  record_id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values?: Record<string, any> | null
  new_values?: Record<string, any> | null
  changed_by?: string | null
  changed_at: string
  ip_address?: string | null
  user_agent?: string | null
}

// ============================================================================
// ANALYTICS AND STATISTICS
// ============================================================================

export interface ProjectStats {
  user_id: string
  status: ProjectStatus
  category: string
  priority: PriorityLevel
  project_count: number
  avg_hours: number
  avg_duration_days: number
  total_todos: number
  completed_todos: number
}

export interface TableStats {
  table_name: string
  row_count: number
  total_size: string
  index_size: string
  toast_size: string
}

// ============================================================================
// SEARCH INTERFACES
// ============================================================================

export interface SearchResult {
  id: string
  raw_text: string
  type: ThoughtType
  expanded_text?: string | null
  rank: number
  created_at: string
}

export interface SearchOptions {
  query: string
  user_id?: string
  limit?: number
  type?: ThoughtType
  tags?: string[]
  date_from?: string
  date_to?: string
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_more: boolean
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

// ============================================================================
// DASHBOARD INTERFACES
// ============================================================================

export interface DashboardStats {
  thoughts: {
    total: number
    by_type: Record<ThoughtType, number>
    recent: Thought[]
  }
  projects: {
    total: number
    by_status: Record<ProjectStatus, number>
    by_priority: Record<PriorityLevel, number>
    active: Project[]
    overdue: Project[]
    completion_rate: number
  }
  todos: {
    total: number
    completed: number
    pending: number
    overdue: number
    by_priority: Record<PriorityLevel, number>
    completion_rate: number
    avg_completion_time: number
  }
  productivity: {
    daily_thoughts: { date: string; count: number }[]
    weekly_projects: { week: string; completed: number }[]
    monthly_hours: { month: string; hours: number }[]
  }
}

// ============================================================================
// FORM INTERFACES
// ============================================================================

export interface ThoughtForm {
  text: string
  
  // Enhanced categorization fields (v2.0)
  category?: ThoughtType
  subcategory?: string
  priority?: PriorityLevel
  title?: string
  summary?: string
  urgency?: UrgencyLevel
  sentiment?: SentimentType
  
  tags?: string[]
  analysis?: Record<string, any>
}

export interface ProjectForm {
  title: string
  summary: string
  description?: string
  category?: string
  priority?: PriorityLevel
  urgency?: UrgencyLevel // New v2.0 field
  estimated_hours?: number
  tech_stack?: string[]
  features?: string[]
  start_date?: string
  due_date?: string
}

export interface TodoForm {
  task: string
  description?: string
  priority?: PriorityLevel
  urgency?: UrgencyLevel // New v2.0 field
  category?: string // New v2.0 field
  project_id?: string
  due_date?: string
  due_time?: string
  estimated_minutes?: number
  tags?: string[]
}

// ============================================================================
// FILTER AND SORT INTERFACES
// ============================================================================

export interface FilterOptions {
  status?: string[]
  priority?: PriorityLevel[]
  category?: string[]
  tags?: string[]
  date_from?: string
  date_to?: string
  completed?: boolean
  search?: string
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface QueryOptions {
  filters?: FilterOptions
  sort?: SortOptions
  pagination?: {
    page: number
    limit: number
  }
}

// ============================================================================
// EXPORT INTERFACES
// ============================================================================

export interface ExportOptions {
  format: 'json' | 'csv' | 'markdown'
  tables: ('thoughts' | 'projects' | 'todos')[]
  date_range?: {
    from: string
    to: string
  }
  include_deleted?: boolean
}

export interface ImportResult {
  success: boolean
  imported: {
    thoughts: number
    projects: number
    todos: number
  }
  errors: string[]
  warnings: string[]
}

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

export interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl: boolean
  pool: {
    min: number
    max: number
    idle_timeout: number
  }
  migrations: {
    auto_run: boolean
    directory: string
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export interface PerformanceMetrics {
  query_time: number
  connection_count: number
  cache_hit_ratio: number
  index_usage: Record<string, number>
  slow_queries: {
    query: string
    duration: number
    count: number
  }[]
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isThought(obj: any): obj is Thought {
  return obj && typeof obj.raw_text === 'string' && typeof obj.type === 'string'
}

export function isProject(obj: any): obj is Project {
  return obj && typeof obj.title === 'string' && typeof obj.summary === 'string'
}

export function isTodo(obj: any): obj is Todo {
  return obj && typeof obj.task === 'string' && typeof obj.completed === 'boolean'
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

// Database operation types
export type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>

// Specific entity operations
export type CreateThought = CreateInput<Thought>
export type UpdateThought = UpdateInput<Thought>
export type CreateProject = CreateInput<Project>
export type UpdateProject = UpdateInput<Project>
export type CreateTodo = CreateInput<Todo>
export type UpdateTodo = UpdateInput<Todo>

// ============================================================================
// DATABASE CLIENT INTERFACE
// ============================================================================

export interface DatabaseClient {
  // Thoughts operations
  thoughts: {
    findById(id: string): Promise<Thought | null>
    findByUserId(userId: string, options?: QueryOptions): Promise<PaginatedResponse<Thought>>
    search(options: SearchOptions): Promise<SearchResult[]>
    create(data: CreateThought): Promise<Thought>
    update(id: string, data: UpdateThought): Promise<Thought>
    delete(id: string): Promise<boolean>
  }
  
  // Projects operations
  projects: {
    findById(id: string): Promise<Project | null>
    findByUserId(userId: string, options?: QueryOptions): Promise<PaginatedResponse<Project>>
    create(data: CreateProject): Promise<Project>
    update(id: string, data: UpdateProject): Promise<Project>
    delete(id: string): Promise<boolean>
    getStats(userId: string): Promise<ProjectStats[]>
    calculateCompletion(id: string): Promise<number>
  }
  
  // Todos operations
  todos: {
    findById(id: string): Promise<Todo | null>
    findByUserId(userId: string, options?: QueryOptions): Promise<PaginatedResponse<Todo>>
    findByProjectId(projectId: string, options?: QueryOptions): Promise<Todo[]>
    create(data: CreateTodo): Promise<Todo>
    update(id: string, data: UpdateTodo): Promise<Todo>
    delete(id: string): Promise<boolean>
    markCompleted(id: string): Promise<Todo>
  }
  
  // Analytics (Enhanced v2.0)
  analytics: {
    getDashboardStats(userId: string): Promise<DashboardStats>
    getTableStats(): Promise<TableStats[]>
    getPerformanceMetrics(): Promise<PerformanceMetrics>
    getCategoryAnalytics(userId: string): Promise<CategoryAnalytics[]>
    getCategoryInsights(userId: string): Promise<CategoryInsight[]>
    updateCategoryAnalytics(userId: string, category: ThoughtType): Promise<void>
  }
  
  // Category Analytics (New v2.0)
  categories: {
    getAnalytics(userId: string, category?: ThoughtType): Promise<CategoryAnalytics[]>
    getInsights(userId: string): Promise<CategoryInsight[]>
    updateAnalytics(userId: string, category: ThoughtType): Promise<void>
    autoCategorizeThought(text: string): Promise<ThoughtType>
    analyzeSentiment(text: string): Promise<SentimentType>
    determineUrgency(text: string): Promise<UrgencyLevel>
  }
  
  // Audit
  audit: {
    getLog(options?: QueryOptions): Promise<PaginatedResponse<AuditLog>>
  }
}

export default DatabaseClient