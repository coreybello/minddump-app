'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  CheckSquare, 
  Lightbulb, 
  GitBranch, 
  MessageSquare,
  Filter,
  ExternalLink,
  Clock,
  TrendingUp,
  Database,
  Activity,
  Target,
  RotateCcw,
  BrainCircuit,
  BookOpen,
  Briefcase,
  BarChart3,
  Cog,
  Bot,
  User,
  Lock,
  Bell,
  StickyNote
} from 'lucide-react'

interface Thought {
  id: string
  raw_text: string
  type: 'goal' | 'habit' | 'projectidea' | 'task' | 'reminder' | 'note' | 'insight' | 'learning' | 'career' | 'metric' | 'idea' | 'system' | 'automation' | 'person' | 'sensitive'
  expanded_text: string
  created_at: string
  projects?: Array<{id: string, title: string, summary: string, sheets_url?: string, category?: string, tech_stack?: string[]}>
  todos?: Array<{id: string, task: string, completed: boolean, priority: string}>
}

interface DashboardProps {
  className?: string
}

export default function Dashboard({ className }: DashboardProps) {
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const typeIcons = {
    goal: Target,
    habit: RotateCcw,
    projectidea: Lightbulb,
    task: CheckSquare,
    reminder: Bell,
    note: StickyNote,
    insight: BrainCircuit,
    learning: BookOpen,
    career: Briefcase,
    metric: BarChart3,
    idea: Lightbulb,
    system: Cog,
    automation: Bot,
    person: User,
    sensitive: Lock,
  }

  const typeColors = {
    goal: 'bg-purple-500/20 text-neon-purple border-purple-500/30',
    habit: 'bg-green-500/20 text-neon-green border-green-500/30',
    projectidea: 'bg-yellow-500/20 text-neon-yellow border-yellow-500/30',
    task: 'bg-blue-500/20 text-neon-blue border-blue-500/30',
    reminder: 'bg-orange-500/20 text-neon-orange border-orange-500/30',
    note: 'bg-pink-500/20 text-neon-pink border-pink-500/30',
    insight: 'bg-cyan-500/20 text-neon-cyan border-cyan-500/30',
    learning: 'bg-purple-500/20 text-neon-purple border-purple-500/30',
    career: 'bg-green-500/20 text-neon-green border-green-500/30',
    metric: 'bg-yellow-500/20 text-neon-yellow border-yellow-500/30',
    idea: 'bg-blue-500/20 text-neon-blue border-blue-500/30',
    system: 'bg-orange-500/20 text-neon-orange border-orange-500/30',
    automation: 'bg-pink-500/20 text-neon-pink border-pink-500/30',
    person: 'bg-cyan-500/20 text-neon-cyan border-cyan-500/30',
    sensitive: 'bg-red-500/20 text-red-300 border-red-500/30',
  }

  // Fetch thoughts on component mount and filter change
  useEffect(() => {
    const fetchThoughts = async () => {
      try {
        setLoading(true)
        const url = filter === 'all' 
          ? '/api/thoughts' 
          : `/api/thoughts?type=${filter}`
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setThoughts(data.thoughts || [])
        }
      } catch (error) {
        console.error('Error fetching thoughts:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchThoughts()
  }, [filter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStats = () => {
    const total = thoughts.length
    const projects = thoughts.filter(t => t.type === 'project').length
    const todos = thoughts.reduce((acc, t) => acc + (t.todos?.length || 0), 0)
    const completedTodos = thoughts.reduce(
      (acc, t) => acc + (t.todos?.filter(todo => todo.completed).length || 0), 
      0
    )

    return { total, projects, todos, completedTodos }
  }

  const stats = getStats()

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="cyber-card h-24"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-neon-cyan/10 via-cyber-purple/10 to-neon-pink/10 rounded-lg"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                style={{ backgroundSize: '200% 200%' }}
              />
            </motion.div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="cyber-card h-32"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-neon-purple/10 via-neon-cyan/10 to-neon-green/10 rounded-lg"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                style={{ backgroundSize: '200% 200%' }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    )
  }

  const statCards = [
    {
      title: "NEURAL_STREAMS",
      value: stats.total,
      icon: Database,
      color: "neon-cyan",
      description: "Total thoughts processed"
    },
    {
      title: "ACTIVE_PROJECTS",
      value: stats.projects,
      icon: GitBranch,
      color: "neon-purple",
      description: "Projects generated"
    },
    {
      title: "TASK_QUEUE",
      value: stats.todos,
      icon: Activity,
      color: "neon-green",
      description: "Action items created"
    },
    {
      title: "COMPLETION_RATE",
      value: stats.todos > 0 ? Math.round((stats.completedTodos / stats.todos) * 100) + '%' : '0%',
      icon: TrendingUp,
      color: "neon-pink",
      description: "Tasks completed"
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`space-y-6 ${className}`}
    >
      {/* Enhanced Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative"
            >
              <Card className="cyber-card relative overflow-hidden group">
                {/* Animated background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r from-${stat.color}/5 via-${stat.color}/10 to-${stat.color}/5`}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                  }}
                  transition={{
                    duration: 3 + index,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  style={{ backgroundSize: '200% 200%' }}
                />
                
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <motion.p 
                        className="text-xs font-medium text-neon-green font-mono uppercase tracking-wider"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        {stat.title}
                      </motion.p>
                      <motion.p 
                        className={`text-2xl font-bold text-${stat.color} font-mono`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          delay: 0.5 + index * 0.1,
                          type: "spring",
                          stiffness: 400,
                          damping: 15
                        }}
                      >
                        {stat.value}
                      </motion.p>
                      <motion.p
                        className="text-xs text-neon-green/60 font-mono"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                      >
                        {stat.description}
                      </motion.p>
                    </div>
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 2 + index * 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className="relative"
                    >
                      <IconComponent className={`h-8 w-8 text-${stat.color}`} />
                      <motion.div
                        className={`absolute -inset-2 bg-${stat.color}/20 rounded-full blur-sm`}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Enhanced Filter Controls */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <motion.h2 
          className="text-xl font-semibold cyber-section-title"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          Neural Archive
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="cyber-button bg-midnight-purple/50 border-cyber-purple text-neon-cyan">
                <Filter className="h-4 w-4 mr-2" />
                {filter === 'all' ? 'ALL_TYPES' : filter.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-midnight-purple/95 border-cyber-purple backdrop-blur-md max-h-80 overflow-y-auto">
              {['all', 'goal', 'habit', 'projectidea', 'task', 'reminder', 'note', 'insight', 'learning', 'career', 'metric', 'idea', 'system', 'automation', 'person', 'sensitive'].map((filterType) => (
                <DropdownMenuItem 
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className="text-neon-cyan hover:bg-cyber-purple/30 font-mono"
                >
                  {filterType === 'all' ? 'ALL_TYPES' : filterType.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </motion.div>

      {/* Enhanced Thoughts List */}
      <AnimatePresence mode="wait">
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {thoughts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="cyber-card relative overflow-hidden">
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 via-neon-cyan/5 to-neon-green/5"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  style={{ backgroundSize: '200% 200%' }}
                />
                
                <CardContent className="p-8 text-center relative z-10">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="mb-4"
                  >
                    <MessageSquare className="h-12 w-12 text-neon-purple mx-auto" />
                  </motion.div>
                  
                  <motion.h3 
                    className="text-lg font-medium text-neon-cyan mb-2 font-mono"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    NEURAL_MATRIX_EMPTY
                  </motion.h3>
                  
                  <motion.p 
                    className="text-neon-green/70 font-mono text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    INITIALIZE FIRST THOUGHT STREAM TO BEGIN DATA COLLECTION
                  </motion.p>
                  
                  <motion.div
                    className="mt-4 flex items-center justify-center gap-2 text-neon-purple/50 font-mono text-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <span className="animate-pulse">▶</span>
                    AWAITING_INPUT...
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
          thoughts.map((thought, index) => {
            const Icon = typeIcons[thought.type]
            return (
              <motion.div
                key={thought.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  transition: { duration: 0.2 }
                }}
                layout
              >
                <Card className="cyber-card relative overflow-hidden group">
                  {/* Animated background gradient */}
                  <motion.div
                    className={`absolute inset-0 ${
                      thought.type === 'idea' ? 'bg-gradient-to-r from-yellow-500/5 via-yellow-400/10 to-yellow-500/5' :
                      thought.type === 'task' ? 'bg-gradient-to-r from-green-500/5 via-green-400/10 to-green-500/5' :
                      thought.type === 'project' ? 'bg-gradient-to-r from-blue-500/5 via-blue-400/10 to-blue-500/5' :
                      thought.type === 'vent' ? 'bg-gradient-to-r from-red-500/5 via-red-400/10 to-red-500/5' :
                      'bg-gradient-to-r from-purple-500/5 via-purple-400/10 to-purple-500/5'
                    }`}
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                    }}
                    transition={{
                      duration: 6 + index,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    style={{ backgroundSize: '200% 200%' }}
                  />
                  
                  <CardHeader className="pb-3 relative z-10">
                    <motion.div 
                      className="flex items-start justify-between"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                    >
                      <div className="flex items-center space-x-3">
                        <motion.div
                          animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{
                            duration: 2 + index * 0.3,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        >
                          <Icon className="h-5 w-5 text-neon-cyan" />
                        </motion.div>
                        
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                        >
                          <Badge className={`${typeColors[thought.type]} font-mono text-xs`}>
                            {thought.type.toUpperCase()}
                          </Badge>
                        </motion.div>
                        
                        <motion.div 
                          className="flex items-center text-sm text-neon-green/60 font-mono"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(thought.created_at)}
                        </motion.div>
                      </div>
                    </motion.div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-4 relative z-10">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                    >
                      <p className="text-neon-cyan leading-relaxed font-mono text-sm">
                        {thought.raw_text}
                      </p>
                      
                      {thought.expanded_text && thought.expanded_text !== thought.raw_text && (
                        <motion.div 
                          className="mt-3 p-3 bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg backdrop-blur-sm"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + index * 0.05 }}
                        >
                          <p className="text-sm text-neon-green/80 font-mono">
                            <strong className="text-neon-purple">AI_EXPANSION:</strong> {thought.expanded_text}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>

                  {/* Project Details */}
                  {thought.projects && thought.projects.length > 0 && (
                    <div className="space-y-2">
                      <Separator />
                      {thought.projects.map((project) => (
                        <div key={project.id} className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-blue-900">{project.title}</h4>
                            {project.sheets_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(project.sheets_url, '_blank')}
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
                          <p className="text-sm text-blue-800">{project.summary}</p>
                          {project.tech_stack && project.tech_stack.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {project.tech_stack.map((tech: string, techIndex: number) => (
                                <Badge key={techIndex} variant="outline" className="text-xs">
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
                  {thought.todos && thought.todos.length > 0 && (
                    <div className="space-y-2">
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Action Items:</h4>
                        {thought.todos.map((todo: {id: string, task: string, completed: boolean, priority: string}) => (
                          <div
                            key={todo.id}
                            className={`flex items-center space-x-2 p-2 rounded ${
                              todo.completed ? 'bg-green-50 text-green-800' : 'bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              className="rounded"
                              readOnly
                            />
                            <span className={todo.completed ? 'line-through' : ''}>
                              {todo.task}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {todo.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}