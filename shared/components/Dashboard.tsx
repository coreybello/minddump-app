import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Alert, AlertDescription } from './ui/alert'
import { 
  CheckSquare, 
  Lightbulb, 
  GitBranch, 
  Heart, 
  MessageSquare,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { ThoughtCard } from './ThoughtCard'
import { StatsCard } from './StatsCard'
import ErrorBoundary from './ErrorBoundary'
import { cn } from '../utils/cn'
import type { 
  Thought, 
  ThoughtStats, 
  ThoughtFilters, 
  DashboardProps,
  ThoughtType 
} from '../types/minddump'

export function Dashboard({ 
  className, 
  filters: externalFilters,
  onFiltersChange,
  ...props 
}: DashboardProps) {
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ThoughtFilters>(
    externalFilters || { type: 'all' }
  )

  const typeIcons = {
    idea: Lightbulb,
    task: CheckSquare,
    project: GitBranch,
    vent: MessageSquare,
    reflection: Heart,
  } as const

  // Compute stats from thoughts
  const stats = useMemo((): ThoughtStats => {
    const total = thoughts.length
    const projects = thoughts.filter(t => t.type === 'project').length
    const todos = thoughts.reduce((acc, t) => acc + (t.todos?.length || 0), 0)
    const completedTodos = thoughts.reduce(
      (acc, t) => acc + (t.todos?.filter(todo => todo.completed).length || 0), 
      0
    )

    const byType = thoughts.reduce((acc, thought) => {
      acc[thought.type] = (acc[thought.type] || 0) + 1
      return acc
    }, {} as Record<ThoughtType, number>)

    return { total, projects, todos, completedTodos, byType }
  }, [thoughts])

  // Fetch thoughts based on filters
  useEffect(() => {
    const fetchThoughts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        if (filters.type && filters.type !== 'all') {
          params.append('type', filters.type)
        }
        if (filters.searchQuery) {
          params.append('search', filters.searchQuery)
        }
        if (filters.dateRange) {
          params.append('start_date', filters.dateRange.start)
          params.append('end_date', filters.dateRange.end)
        }
        
        const url = `/api/thoughts${params.toString() ? `?${params.toString()}` : ''}`
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch thoughts: ${response.statusText}`)
        }
        
        const data = await response.json()
        setThoughts(data.thoughts || [])
      } catch (error) {
        console.error('Error fetching thoughts:', error)
        setError(error instanceof Error ? error.message : 'Failed to load thoughts')
      } finally {
        setLoading(false)
      }
    }
    
    fetchThoughts()
  }, [filters])

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ThoughtFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange?.(updatedFilters)
  }

  const handleRefresh = () => {
    setFilters({ ...filters }) // Trigger useEffect
  }

  const handleProjectOpen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleTodoToggle = async (todoId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      })

      if (!response.ok) {
        throw new Error('Failed to update todo')
      }

      // Update local state
      setThoughts(prev => prev.map(thought => ({
        ...thought,
        todos: thought.todos?.map(todo => 
          todo.id === todoId ? { ...todo, completed } : todo
        )
      })))
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  if (loading) {
    return (
      <div className={cn('space-y-4', className)} {...props}>
        {/* Stats Loading */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        
        {/* Content Loading */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('space-y-4', className)} {...props}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className={cn('space-y-6', className)} {...props}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="TOTAL_THOUGHTS"
            value={stats.total}
            icon={MessageSquare}
            iconClassName="text-neon-purple"
          />
          
          <StatsCard
            title="PROJECTS"
            value={stats.projects}
            icon={GitBranch}
            iconClassName="text-blue-400"
          />
          
          <StatsCard
            title="TOTAL_TASKS"
            value={stats.todos}
            icon={CheckSquare}
            iconClassName="text-green-400"
          />
          
          <StatsCard
            title="COMPLETED"
            value={stats.completedTodos}
            icon={CheckSquare}
            iconClassName="text-neon-purple"
            trend={stats.todos > 0 ? {
              value: Math.round((stats.completedTodos / stats.todos) * 100),
              label: 'completion rate',
              positive: true
            } : undefined}
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold cyber-section-title">Neural Archive</h2>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {filters.type === 'all' ? 'All Types' : 
                   filters.type ? filters.type.charAt(0).toUpperCase() + filters.type.slice(1) : 
                   'All Types'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleFilterChange({ type: 'all' })}>
                  All Types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange({ type: 'project' })}>
                  Projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange({ type: 'idea' })}>
                  Ideas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange({ type: 'task' })}>
                  Tasks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange({ type: 'reflection' })}>
                  Reflections
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange({ type: 'vent' })}>
                  Vents
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Thoughts List */}
        <div className="space-y-4">
          {thoughts.length === 0 ? (
            <Card className="cyber-card">
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-neon-purple mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neon-cyan mb-2 font-mono">
                  NEURAL_MATRIX_EMPTY
                </h3>
                <p className="text-neon-green/70 font-mono text-sm">
                  INITIALIZE FIRST THOUGHT STREAM TO BEGIN DATA COLLECTION
                </p>
              </CardContent>
            </Card>
          ) : (
            thoughts.map((thought) => (
              <ThoughtCard
                key={thought.id}
                thought={thought}
                onProjectOpen={handleProjectOpen}
                onTodoToggle={handleTodoToggle}
                showActions={true}
              />
            ))
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default Dashboard