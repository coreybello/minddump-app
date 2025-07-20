'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Clock, 
  Zap, 
  Database, 
  Globe, 
  Brain, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  RefreshCw
} from 'lucide-react'

interface PerformanceMetrics {
  claude: {
    apiCalls: number
    averageResponseTime: number
    cacheHitRate: number
    errorRate: number
    categories: Array<{ category: string; count: number }>
  }
  sheets: {
    batchOperations: number
    averageProcessingTime: number
    cacheHitRate: number
    errorRate: number
    queueStats: { pending: number; processing: boolean }
  }
  webhooks: {
    metrics: {
      queued: number
      successful: number
      failed: number
      retries: number
      averageDeliveryTime: number
    }
    successRate: number
    queueStats: {
      queueLength: number
      activeRequests: number
      maxConcurrent: number
    }
    health: { status: string; score: number }
  }
  overall: {
    healthy: boolean
    score: number
    timestamp: string
  }
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/performance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchMetrics, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [autoRefresh])

  const getHealthColor = (score: number): string => {
    if (score >= 0.9) return 'text-green-400'
    if (score >= 0.7) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getHealthIcon = (score: number) => {
    if (score >= 0.9) return <CheckCircle className="h-4 w-4 text-green-400" />
    if (score >= 0.7) return <AlertTriangle className="h-4 w-4 text-yellow-400" />
    return <XCircle className="h-4 w-4 text-red-400" />
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatPercent = (ratio: number): string => {
    return `${Math.round(ratio * 100)}%`
  }

  if (isLoading) {
    return (
      <Card className="cyber-card">
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin text-neon-cyan mr-3" />
          <span className="text-neon-cyan font-mono">Loading performance metrics...</span>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card className="cyber-card border-red-500/50">
        <CardContent className="flex items-center justify-center p-8">
          <XCircle className="h-6 w-6 text-red-400 mr-3" />
          <span className="text-red-400 font-mono">Failed to load performance data</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neon-cyan font-mono">PERFORMANCE_MONITOR</h2>
          <p className="text-neon-green/70 font-mono text-sm">
            Real-time system optimization metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`cyber-button ${autoRefresh ? 'bg-neon-green/20 border-neon-green' : 'border-gray-500'}`}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            className="cyber-button"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health */}
      <Card className={`cyber-card ${metrics.overall.healthy ? 'border-green-500/50' : 'border-red-500/50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-neon-cyan font-mono">
            {getHealthIcon(metrics.overall.score)}
            SYSTEM_HEALTH
            <Badge className={`ml-auto ${metrics.overall.healthy ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {metrics.overall.healthy ? 'OPTIMAL' : 'DEGRADED'}
            </Badge>
          </CardTitle>
          <CardDescription className="text-neon-green/70 font-mono">
            Overall system performance score: {formatPercent(metrics.overall.score)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                metrics.overall.score >= 0.9 ? 'bg-green-400' :
                metrics.overall.score >= 0.7 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${metrics.overall.score * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          
          {lastUpdate && (
            <p className="text-xs text-neon-green/60 font-mono mt-2">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Component Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Claude AI Performance */}
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-neon-purple font-mono">
              <Brain className="h-5 w-5" />
              CLAUDE_AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm font-mono">
              <div>
                <div className="text-neon-green/70">API Calls</div>
                <div className="text-neon-cyan font-bold">{metrics.claude.apiCalls}</div>
              </div>
              <div>
                <div className="text-neon-green/70">Avg Response</div>
                <div className="text-neon-cyan font-bold">
                  {formatDuration(metrics.claude.averageResponseTime)}
                </div>
              </div>
              <div>
                <div className="text-neon-green/70">Cache Hit Rate</div>
                <div className={`font-bold ${getHealthColor(metrics.claude.cacheHitRate)}`}>
                  {formatPercent(metrics.claude.cacheHitRate)}
                </div>
              </div>
              <div>
                <div className="text-neon-green/70">Error Rate</div>
                <div className={`font-bold ${getHealthColor(1 - metrics.claude.errorRate)}`}>
                  {formatPercent(metrics.claude.errorRate)}
                </div>
              </div>
            </div>
            
            {metrics.claude.categories.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-neon-green/70 font-mono mb-2">Top Categories</div>
                <div className="space-y-1">
                  {metrics.claude.categories.slice(0, 3).map((cat, index) => (
                    <div key={cat.category} className="flex justify-between text-xs font-mono">
                      <span className="text-neon-cyan">{cat.category}</span>
                      <span className="text-neon-green">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Sheets Performance */}
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-neon-green font-mono">
              <Database className="h-5 w-5" />
              SHEETS_API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm font-mono">
              <div>
                <div className="text-neon-green/70">Batch Ops</div>
                <div className="text-neon-cyan font-bold">{metrics.sheets.batchOperations}</div>
              </div>
              <div>
                <div className="text-neon-green/70">Avg Process</div>
                <div className="text-neon-cyan font-bold">
                  {formatDuration(metrics.sheets.averageProcessingTime)}
                </div>
              </div>
              <div>
                <div className="text-neon-green/70">Cache Hit Rate</div>
                <div className={`font-bold ${getHealthColor(metrics.sheets.cacheHitRate)}`}>
                  {formatPercent(metrics.sheets.cacheHitRate)}
                </div>
              </div>
              <div>
                <div className="text-neon-green/70">Error Rate</div>
                <div className={`font-bold ${getHealthColor(1 - metrics.sheets.errorRate)}`}>
                  {formatPercent(metrics.sheets.errorRate)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neon-green/70">Queue Status</span>
              <div className="flex items-center gap-2">
                <span className="text-neon-cyan">{metrics.sheets.queueStats.pending} pending</span>
                {metrics.sheets.queueStats.processing && (
                  <Badge className="bg-yellow-900/50 text-yellow-300 text-xs">PROCESSING</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Performance */}
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-neon-orange font-mono">
              <Globe className="h-5 w-5" />
              WEBHOOKS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm font-mono">
              <div>
                <div className="text-neon-green/70">Queued</div>
                <div className="text-neon-cyan font-bold">{metrics.webhooks.metrics.queued}</div>
              </div>
              <div>
                <div className="text-neon-green/70">Successful</div>
                <div className="text-green-400 font-bold">{metrics.webhooks.metrics.successful}</div>
              </div>
              <div>
                <div className="text-neon-green/70">Failed</div>
                <div className="text-red-400 font-bold">{metrics.webhooks.metrics.failed}</div>
              </div>
              <div>
                <div className="text-neon-green/70">Retries</div>
                <div className="text-yellow-400 font-bold">{metrics.webhooks.metrics.retries}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neon-green/70">Success Rate</span>
                <span className={`font-bold ${getHealthColor(metrics.webhooks.successRate)}`}>
                  {formatPercent(metrics.webhooks.successRate)}
                </span>
              </div>
              
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neon-green/70">Avg Delivery</span>
                <span className="text-neon-cyan">
                  {formatDuration(metrics.webhooks.metrics.averageDeliveryTime)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {getHealthIcon(metrics.webhooks.health.score)}
                <Badge className={`text-xs ${
                  metrics.webhooks.health.status === 'healthy' ? 'bg-green-900/50 text-green-300' :
                  metrics.webhooks.health.status === 'degraded' ? 'bg-yellow-900/50 text-yellow-300' :
                  'bg-red-900/50 text-red-300'
                }`}>
                  {metrics.webhooks.health.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Queue Status */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-neon-cyan font-mono">
            <BarChart3 className="h-5 w-5" />
            QUEUE_STATUS
          </CardTitle>
          <CardDescription className="text-neon-green/70 font-mono">
            Real-time processing queue metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Webhook Queue */}
            <div className="space-y-2">
              <div className="text-sm font-mono text-neon-orange">Webhook Queue</div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-neon-green/70">Queue Length</span>
                  <span className="text-neon-cyan">{metrics.webhooks.queueStats.queueLength}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neon-green/70">Active Requests</span>
                  <span className="text-neon-cyan">{metrics.webhooks.queueStats.activeRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neon-green/70">Max Concurrent</span>
                  <span className="text-neon-cyan">{metrics.webhooks.queueStats.maxConcurrent}</span>
                </div>
              </div>
              
              {/* Queue utilization bar */}
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-neon-orange rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(metrics.webhooks.queueStats.activeRequests / metrics.webhooks.queueStats.maxConcurrent) * 100}%`
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Performance Trends */}
            <div className="space-y-2">
              <div className="text-sm font-mono text-neon-purple">Performance Trends</div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-neon-green/70">Response Time</span>
                  <span className="text-green-400">↓ Improving</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-neon-green/70">Cache Hit Rate</span>
                  <span className="text-green-400">↑ Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-yellow-400" />
                  <span className="text-neon-green/70">Queue Utilization</span>
                  <span className="text-yellow-400">~ Stable</span>
                </div>
              </div>
            </div>

            {/* System Alerts */}
            <div className="space-y-2">
              <div className="text-sm font-mono text-neon-pink">System Alerts</div>
              <div className="space-y-1 text-xs font-mono">
                {metrics.webhooks.health.status !== 'healthy' && (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Webhook performance degraded</span>
                  </div>
                )}
                {metrics.claude.errorRate > 0.05 && (
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="h-3 w-3" />
                    <span>High Claude API error rate</span>
                  </div>
                )}
                {metrics.sheets.errorRate > 0.05 && (
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="h-3 w-3" />
                    <span>Sheets API issues detected</span>
                  </div>
                )}
                {metrics.overall.healthy && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    <span>All systems operational</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}