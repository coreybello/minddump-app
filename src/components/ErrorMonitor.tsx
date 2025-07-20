'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Download,
  Trash2,
  Activity
} from 'lucide-react'
import { errorLogger, ErrorLog } from '@/lib/error-logging'

interface ErrorMonitorProps {
  className?: string
}

export default function ErrorMonitor({ className }: ErrorMonitorProps) {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [deploymentHealth, setDeploymentHealth] = useState<{
    status: 'healthy' | 'warning' | 'critical'
    lastDeployment: string
    errorCount: number
    recommendations: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadErrorData()
  }, [])

  const loadErrorData = async () => {
    setLoading(true)
    try {
      const errorData = errorLogger.exportErrors()
      const health = await errorLogger.getDeploymentHealth()
      
      setErrors(errorData)
      setDeploymentHealth(health)
    } catch (error) {
      console.error('Failed to load error data:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearErrors = () => {
    errorLogger.clearErrors()
    setErrors([])
    loadErrorData()
  }

  const exportErrors = () => {
    const errorData = errorLogger.exportErrors()
    const blob = new Blob([JSON.stringify(errorData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `minddump-errors-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'eslint':
        return 'bg-blue-100 text-blue-800'
      case 'typescript':
        return 'bg-purple-100 text-purple-800'
      case 'deployment':
        return 'bg-red-100 text-red-800'
      case 'build':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Error Monitor...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Deployment Health Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {deploymentHealth && getStatusIcon(deploymentHealth.status)}
            Deployment Health
          </CardTitle>
          <CardDescription>
            Current system status and error monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deploymentHealth && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={getStatusColor(deploymentHealth.status)}>
                  {deploymentHealth.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recent Errors:</span>
                <span className="text-sm">{deploymentHealth.errorCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Deployment:</span>
                <span className="text-sm">
                  {deploymentHealth.lastDeployment !== 'Never' 
                    ? new Date(deploymentHealth.lastDeployment).toLocaleString()
                    : 'Never'
                  }
                </span>
              </div>

              {deploymentHealth.recommendations.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                  <div className="space-y-2">
                    {deploymentHealth.recommendations.map((rec, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {rec}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Error Logs ({errors.length})</CardTitle>
              <CardDescription>
                Recent errors and automated fix suggestions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadErrorData}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportErrors}
                disabled={errors.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearErrors}
                disabled={errors.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <p>No errors logged. System running smoothly!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {errors.slice(-10).reverse().map((error) => (
                <div key={error.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getErrorTypeColor(error.type)}>
                        {error.type}
                      </Badge>
                      {error.autoFixApplied && (
                        <Badge className="bg-green-100 text-green-800">
                          Auto-fix Applied
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(error.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium mb-2">{error.message}</p>
                  
                  {error.file && (
                    <p className="text-xs text-gray-600 mb-2">
                      {error.file}
                      {error.line && `:${error.line}`}
                      {error.column && `:${error.column}`}
                    </p>
                  )}
                  
                  {error.fixDetails && error.fixDetails.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                      <h5 className="text-sm font-medium text-green-800 mb-2">
                        Auto-fix Suggestions:
                      </h5>
                      <ul className="text-sm text-green-700 space-y-1">
                        {error.fixDetails.map((fix, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            {fix}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
              
              {errors.length > 10 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Showing latest 10 errors. Export for full history.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}