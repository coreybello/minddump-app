/**
 * Performance Configuration for MindDump App
 * Centralized configuration for all performance optimizations
 */

module.exports = {
  // Cache Configuration
  cache: {
    // AI categorization cache - 24 hours for stable responses
    aiCategory: {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 1000,
      cleanupInterval: 5 * 60 * 1000 // 5 minutes
    },
    
    // Google Sheets API cache - 5 minutes for data freshness
    sheetsApi: {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxEntries: 500,
      cleanupInterval: 2 * 60 * 1000 // 2 minutes
    },
    
    // Webhook response cache - 3 minutes for retry logic
    webhookResponse: {
      ttl: 3 * 60 * 1000, // 3 minutes
      maxEntries: 200,
      cleanupInterval: 1 * 60 * 1000 // 1 minute
    }
  },

  // API Timeouts and Retry Configuration
  api: {
    claude: {
      timeoutMs: 30000, // 30 seconds
      maxRetries: 3,
      retryDelayMs: 1000,
      batchSize: 3
    },
    
    googleSheets: {
      timeoutMs: 15000, // 15 seconds
      maxRetries: 3,
      retryDelayMs: 2000,
      batchSize: 10
    },
    
    webhooks: {
      timeoutMs: 10000, // 10 seconds
      maxRetries: 3,
      retryDelayMs: 1000,
      batchSize: 5,
      concurrentRequests: 5
    }
  },

  // Queue Management
  queues: {
    webhook: {
      maxConcurrent: 5,
      batchSize: 5,
      maxWaitMs: 3000,
      priorityLevels: ['high', 'medium', 'low']
    },
    
    sheets: {
      maxConcurrent: 3,
      batchSize: 10,
      maxWaitMs: 3000
    },
    
    claude: {
      maxConcurrent: 2,
      batchSize: 3,
      maxWaitMs: 2000
    }
  },

  // Voice Processing Optimization
  voice: {
    // Debounce settings for voice input
    debounceMs: 300,
    
    // Audio processing
    sampleRate: 16000,
    fftSize: 2048,
    silenceThreshold: 0.01,
    silenceDurationMs: 1000,
    
    // Speech recognition
    maxAlternatives: 1,
    interimResults: true,
    continuous: true,
    
    // Web Worker settings
    useWebWorkers: true,
    workerTimeoutMs: 30000
  },

  // Performance Monitoring
  monitoring: {
    // Metrics retention
    metricsRetentionMs: 24 * 60 * 60 * 1000, // 24 hours
    maxMetricsPerType: 1000,
    
    // Alert thresholds
    thresholds: {
      errorRate: 0.05, // 5%
      averageResponseTime: 2000, // 2 seconds
      cacheHitRate: 0.8, // 80%
      queueLength: 20,
      memoryUsageMB: 100
    },
    
    // Performance collection intervals
    intervals: {
      metricsCollectionMs: 30000, // 30 seconds
      healthCheckMs: 60000, // 1 minute
      cacheStatsMs: 300000 // 5 minutes
    }
  },

  // Circuit Breaker Configuration
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5, // failures before opening
    resetTimeoutMs: 60000, // 1 minute
    monitoringPeriodMs: 300000 // 5 minutes
  },

  // Lazy Loading Configuration
  lazyLoading: {
    // Intersection Observer settings
    threshold: 0.1,
    rootMargin: '50px',
    
    // Component preloading
    preloadDelayMs: 2000,
    useRequestIdleCallback: true,
    
    // Bundle splitting
    chunkSizeWarning: 250000, // 250KB
    maxChunkSize: 500000 // 500KB
  },

  // Database/Storage Optimization
  storage: {
    // Local storage limits
    maxLocalStorageMB: 10,
    
    // IndexedDB settings
    useIndexedDB: true,
    maxIndexedDBMB: 50,
    
    // Session storage
    maxSessionStorageMB: 5
  },

  // Network Optimization
  network: {
    // Request batching
    enableRequestBatching: true,
    batchWindowMs: 100,
    maxBatchSize: 10,
    
    // Compression
    enableCompression: true,
    compressionLevel: 6,
    
    // Connection pooling
    maxConnectionsPerHost: 6,
    keepAliveTimeoutMs: 30000
  },

  // Memory Management
  memory: {
    // Garbage collection hints
    enablePerformanceObserver: true,
    memoryWarningThresholdMB: 80,
    memoryCriticalThresholdMB: 120,
    
    // Object pooling
    enableObjectPooling: true,
    maxPoolSize: 100,
    
    // WeakMap/WeakSet usage
    useWeakReferences: true
  },

  // Development vs Production Settings
  environment: {
    development: {
      // More verbose logging and monitoring
      enableVerboseLogging: true,
      enablePerformanceMarks: true,
      enableMemoryTracking: true,
      
      // Relaxed thresholds for development
      thresholds: {
        errorRate: 0.1, // 10%
        averageResponseTime: 5000, // 5 seconds
        cacheHitRate: 0.5 // 50%
      }
    },
    
    production: {
      // Optimized for performance
      enableVerboseLogging: false,
      enablePerformanceMarks: false,
      enableMemoryTracking: false,
      
      // Strict thresholds for production
      thresholds: {
        errorRate: 0.02, // 2%
        averageResponseTime: 1500, // 1.5 seconds
        cacheHitRate: 0.9 // 90%
      }
    }
  },

  // Feature Flags for Performance Features
  features: {
    // Cache features
    enableAICache: true,
    enableSheetsCache: true,
    enableWebhookCache: true,
    
    // Queue features
    enableWebhookQueue: true,
    enableSheetsQueue: true,
    enableClaudeQueue: true,
    
    // Advanced features
    enableWebWorkers: true,
    enableCircuitBreaker: true,
    enableRequestBatching: true,
    enableLazyLoading: true,
    
    // Monitoring features
    enablePerformanceMonitoring: true,
    enableHealthChecks: true,
    enableMetricsCollection: true
  },

  // Resource Limits
  limits: {
    // Request limits
    maxRequestsPerMinute: 60,
    maxConcurrentRequests: 20,
    maxRequestSizeBytes: 10 * 1024 * 1024, // 10MB
    
    // Processing limits
    maxTextLengthChars: 50000,
    maxBatchSize: 20,
    maxQueueSize: 100,
    
    // Memory limits
    maxCacheSizeMB: 50,
    maxWorkerMemoryMB: 20,
    maxSessionMemoryMB: 30
  },

  // Optimization Strategies
  strategies: {
    // Cache strategy
    cacheStrategy: 'adaptive', // 'fixed', 'adaptive', 'aggressive'
    
    // Queue processing strategy
    queueStrategy: 'priority', // 'fifo', 'lifo', 'priority'
    
    // Load balancing strategy
    loadBalancingStrategy: 'round_robin', // 'round_robin', 'least_connections', 'weighted'
    
    // Error handling strategy
    errorHandlingStrategy: 'retry_with_backoff', // 'fail_fast', 'retry_immediate', 'retry_with_backoff'
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports.getConfig = function(env = 'production') {
    const baseConfig = module.exports;
    const envConfig = baseConfig.environment[env] || baseConfig.environment.production;
    
    return {
      ...baseConfig,
      ...envConfig,
      // Override thresholds based on environment
      monitoring: {
        ...baseConfig.monitoring,
        thresholds: envConfig.thresholds
      }
    };
  };
}