// Common types shared across all Crizzel apps
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface AppConfig {
  name: string
  version: string
  description: string
  routes: {
    home: string
    auth: string
    dashboard?: string
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface NavigationItem {
  label: string
  href: string
  icon?: string
  children?: NavigationItem[]
}

// Re-export MindDump specific types
export * from './minddump'