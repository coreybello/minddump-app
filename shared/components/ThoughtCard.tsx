import React from 'react'
import { Card, CardContent, CardHeader } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { 
  CheckSquare, 
  Lightbulb, 
  GitBranch, 
  Heart, 
  MessageSquare,
  ExternalLink,
  Clock,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '../utils/cn'
import type { Thought, ThoughtCardVariants } from '../types/minddump'

const typeIcons = {
  idea: Lightbulb,
  task: CheckSquare,
  project: GitBranch,
  vent: MessageSquare,
  reflection: Heart,
} as const

const typeColors = {
  idea: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  task: 'bg-green-500/20 text-green-300 border-green-500/30',
  project: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  vent: 'bg-red-500/20 text-red-300 border-red-500/30',
  reflection: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
} as const

interface ThoughtCardProps extends Partial<ThoughtCardVariants> {
  thought: Thought
  className?: string
  onProjectOpen?: (url: string) => void
  onTodoToggle?: (todoId: string, completed: boolean) => void
  showActions?: boolean
  actions?: React.ReactNode
}

export function ThoughtCard({
  thought,
  size = 'md',
  variant = 'default',
  interactive = true,
  className,
  onProjectOpen,
  onTodoToggle,
  showActions = false,
  actions,
  ...props
}: ThoughtCardProps) {
  const Icon = typeIcons[thought.type]
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const cardClasses = cn(
    'cyber-card transition-all duration-200',
    {
      'hover:shadow-md hover:border-neon-purple/40': interactive,
      'cursor-pointer': interactive,
      'scale-95': size === 'sm',
      'scale-105': size === 'lg',
    },
    className
  )

  const contentClasses = cn({
    'space-y-2': size === 'sm',
    'space-y-4': size === 'md',
    'space-y-6': size === 'lg',
  })

  return (
    <Card className={cardClasses} {...props}>
      <CardHeader className={cn('pb-3', size === 'sm' && 'pb-2')}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Icon className={cn(
              'text-gray-600',
              size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
            )} />
            <Badge className={typeColors[thought.type]}>
              {thought.type}
            </Badge>
            <div className={cn(
              'flex items-center text-gray-500',
              size === 'sm' ? 'text-xs' : 'text-sm'
            )}>
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(thought.created_at)}
            </div>
          </div>
          {showActions && (
            <div className="flex items-center space-x-1">
              {actions}
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={cn('pt-0', contentClasses)}>
        {/* Main content */}
        <div>
          <p className={cn(
            'text-gray-900 leading-relaxed',
            size === 'sm' && 'text-sm',
            size === 'lg' && 'text-lg'
          )}>
            {thought.raw_text}
          </p>
          
          {variant !== 'compact' && thought.expanded_text && 
           thought.expanded_text !== thought.raw_text && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>AI Expansion:</strong> {thought.expanded_text}
              </p>
            </div>
          )}
        </div>

        {/* Project Details */}
        {variant !== 'compact' && thought.projects && thought.projects.length > 0 && (
          <div className="space-y-2">
            <Separator />
            {thought.projects.map((project) => (
              <div key={project.id} className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={cn(
                    'font-medium text-blue-900',
                    size === 'sm' && 'text-sm'
                  )}>
                    {project.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {project.sheets_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onProjectOpen?.(project.sheets_url!)}
                        className="h-6 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Sheet
                      </Button>
                    )}
                    {project.category && (
                      <Badge variant="outline" className="text-xs">
                        {project.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-blue-800">{project.summary}</p>
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {project.tech_stack.map((tech: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Todos */}
        {variant !== 'compact' && thought.todos && thought.todos.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Action Items:</h4>
              {thought.todos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    'flex items-center space-x-2 p-2 rounded transition-colors',
                    todo.completed 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={(e) => onTodoToggle?.(todo.id, e.target.checked)}
                    className="rounded"
                    disabled={!onTodoToggle}
                  />
                  <span className={cn(
                    'flex-1',
                    todo.completed && 'line-through',
                    size === 'sm' && 'text-sm'
                  )}>
                    {todo.task}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs',
                      todo.priority === 'high' && 'border-red-300 text-red-700',
                      todo.priority === 'medium' && 'border-yellow-300 text-yellow-700',
                      todo.priority === 'low' && 'border-green-300 text-green-700'
                    )}
                  >
                    {todo.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ThoughtCard