/**
 * Optimized Google Sheets client with batching, caching, and queue management
 */

import { GoogleAuth } from 'google-auth-library'
import { google } from 'googleapis'
import { sheetsApiCache, sheetsQueue, withCache, withTiming, performanceMonitor, performanceConfig } from './performance'
import type { CreateSheetsOptions, MasterSheetEntry } from './sheets'

// Initialize optimized Google Sheets client
const auth = new GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ 
  version: 'v4', 
  auth,
  timeout: performanceConfig.sheetsTimeoutMs
})

const MASTER_SHEET_ID = process.env.MASTER_SHEET_ID || 'your-master-sheet-id-here'

// Batch operations queue
interface BatchedSheetOperation {
  id: string
  type: 'append' | 'update' | 'create'
  sheetId: string
  range: string
  values: any[][]
  timestamp: number
}

class SheetsOptimizer {
  private batchQueue: BatchedSheetOperation[] = []
  private processing = false
  private batchSize = performanceConfig.sheetsBatchSize
  private maxWaitMs = 3000

  // Add operation to batch queue
  queueOperation(operation: Omit<BatchedSheetOperation, 'timestamp'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const batchedOp: BatchedSheetOperation = {
        ...operation,
        timestamp: Date.now()
      }

      this.batchQueue.push(batchedOp)
      this.scheduleProcess()

      // Store resolve/reject for later
      ;(batchedOp as any).resolve = resolve
      ;(batchedOp as any).reject = reject
    })
  }

  private scheduleProcess(): void {
    if (this.processing) return

    // Process immediately if batch is full
    if (this.batchQueue.length >= this.batchSize) {
      this.processBatch()
      return
    }

    // Otherwise, wait for more operations or timeout
    setTimeout(() => {
      if (this.batchQueue.length > 0 && !this.processing) {
        this.processBatch()
      }
    }, this.maxWaitMs)
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.batchQueue.length === 0) return

    this.processing = true
    const batch = this.batchQueue.splice(0, this.batchSize)

    try {
      await withTiming(async () => {
        // Group operations by sheet ID for better API efficiency
        const groupedOps = this.groupOperationsBySheet(batch)
        
        await Promise.allSettled(
          Object.entries(groupedOps).map(([sheetId, ops]) => 
            this.processSheetBatch(sheetId, ops)
          )
        )
      }, 'sheets_batch_processing', {
        batchSize: batch.length.toString()
      })

      performanceMonitor.record('sheets_batch_success', batch.length)
    } catch (error) {
      performanceMonitor.record('sheets_batch_error', 1)
      console.error('Batch processing error:', error)
      
      // Reject all operations in batch
      batch.forEach(op => {
        const reject = (op as any).reject
        if (reject) reject(error)
      })
    } finally {
      this.processing = false
      
      // Process remaining queue
      if (this.batchQueue.length > 0) {
        this.scheduleProcess()
      }
    }
  }

  private groupOperationsBySheet(operations: BatchedSheetOperation[]): Record<string, BatchedSheetOperation[]> {
    return operations.reduce((groups, op) => {
      if (!groups[op.sheetId]) {
        groups[op.sheetId] = []
      }
      groups[op.sheetId].push(op)
      return groups
    }, {} as Record<string, BatchedSheetOperation[]>)
  }

  private async processSheetBatch(sheetId: string, operations: BatchedSheetOperation[]): Promise<void> {
    // Combine multiple append operations into single batch
    const appendOps = operations.filter(op => op.type === 'append')
    const updateOps = operations.filter(op => op.type === 'update')
    const createOps = operations.filter(op => op.type === 'create')

    try {
      // Process appends in batch
      if (appendOps.length > 0) {
        await this.batchAppendOperations(sheetId, appendOps)
      }

      // Process updates in batch
      if (updateOps.length > 0) {
        await this.batchUpdateOperations(sheetId, updateOps)
      }

      // Process creates individually (they need different handling)
      for (const createOp of createOps) {
        await this.processCreateOperation(createOp)
      }

      // Resolve all successful operations
      operations.forEach(op => {
        const resolve = (op as any).resolve
        if (resolve) resolve()
      })

    } catch (error) {
      // Reject all operations for this sheet
      operations.forEach(op => {
        const reject = (op as any).reject
        if (reject) reject(error)
      })
    }
  }

  private async batchAppendOperations(sheetId: string, operations: BatchedSheetOperation[]): Promise<void> {
    if (operations.length === 0) return

    // Combine all values into single append
    const allValues = operations.flatMap(op => op.values)
    const range = operations[0].range // Use first range as base

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: allValues,
      },
    })
  }

  private async batchUpdateOperations(sheetId: string, operations: BatchedSheetOperation[]): Promise<void> {
    if (operations.length === 0) return

    // Create batch update request
    const data = operations.map(op => ({
      range: op.range,
      values: op.values
    }))

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data
      }
    })
  }

  private async processCreateOperation(operation: BatchedSheetOperation): Promise<void> {
    // Create operations are handled individually
    // Implementation depends on specific create logic
    console.log(`Processing create operation: ${operation.id}`)
  }
}

const sheetsOptimizer = new SheetsOptimizer()

/**
 * Optimized master sheet logging with batching and caching
 */
export async function logToMasterSheetOptimized(entry: MasterSheetEntry): Promise<void> {
  if (!MASTER_SHEET_ID || MASTER_SHEET_ID === 'your-master-sheet-id-here') {
    console.warn('Master sheet ID not configured, skipping optimized logging')
    return
  }

  return withTiming(async () => {
    // Cache the sheet structure to avoid repeated API calls
    const cacheKey = `sheet_structure:${MASTER_SHEET_ID}`
    
    await withCache(
      cacheKey,
      async () => {
        // Verify sheet structure only once per cache period
        await initializeMasterSheetOptimized()
        return true
      },
      sheetsApiCache,
      60000 // 1 minute cache for sheet structure
    )

    // Queue the append operation for batching
    await sheetsOptimizer.queueOperation({
      id: `master_log_${Date.now()}`,
      type: 'append',
      sheetId: MASTER_SHEET_ID,
      range: 'Master Log!A:F',
      values: [[
        entry.rawInput,
        entry.category,
        entry.subcategory || '',
        entry.priority || '',
        entry.expandedText || '',
        entry.timestamp
      ]]
    })

    performanceMonitor.record('master_sheet_log_queued', 1, {
      category: entry.category
    })

  }, 'master_sheet_log_duration', {
    category: entry.category
  })
}

/**
 * Optimized batch logging for multiple entries
 */
export async function batchLogToMasterSheetOptimized(entries: MasterSheetEntry[]): Promise<void> {
  if (!MASTER_SHEET_ID || MASTER_SHEET_ID === 'your-master-sheet-id-here') {
    console.warn('Master sheet ID not configured, skipping batch logging')
    return
  }

  if (entries.length === 0) return

  return withTiming(async () => {
    await sheetsOptimizer.queueOperation({
      id: `batch_log_${Date.now()}`,
      type: 'append',
      sheetId: MASTER_SHEET_ID,
      range: 'Master Log!A:F',
      values: entries.map(entry => [
        entry.rawInput,
        entry.category,
        entry.subcategory || '',
        entry.priority || '',
        entry.expandedText || '',
        entry.timestamp
      ])
    })

    performanceMonitor.record('master_sheet_batch_log_queued', entries.length)

  }, 'master_sheet_batch_log_duration', {
    batchSize: entries.length.toString()
  })
}

/**
 * Optimized sheet initialization with caching
 */
async function initializeMasterSheetOptimized(): Promise<void> {
  const cacheKey = `master_sheet_initialized:${MASTER_SHEET_ID}`
  
  await withCache(
    cacheKey,
    async () => {
      // Check if headers exist
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: MASTER_SHEET_ID,
        range: 'Master Log!A1:F1',
      })
      
      // Add headers if missing
      if (!response.data.values || response.data.values.length === 0) {
        const headers = [
          'Raw Input',
          'Category', 
          'Subcategory',
          'Priority',
          'Expanded Text',
          'Timestamp'
        ]
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: MASTER_SHEET_ID,
          range: 'Master Log!A1:F1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers],
          },
        })
        
        // Format headers
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: MASTER_SHEET_ID,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: 0,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 0.9,
                        green: 0.9,
                        blue: 0.9,
                      },
                      textFormat: {
                        bold: true,
                      },
                    },
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat)',
                },
              },
            ],
          },
        })
      }
      
      return true
    },
    sheetsApiCache,
    3600000 // 1 hour cache for initialization
  )
}

/**
 * Optimized Google Sheet creation with better performance
 */
export async function createGoogleSheetOptimized(options: CreateSheetsOptions): Promise<string> {
  return withTiming(async () => {
    // Always log to master sheet first (with batching)
    const masterEntry: MasterSheetEntry = {
      rawInput: options.title,
      category: options.category.charAt(0).toUpperCase() + options.category.slice(1),
      subcategory: options.tags?.[0],
      priority: options.priority ? (options.priority.charAt(0).toUpperCase() + options.priority.slice(1)) as 'Low' | 'Medium' | 'High' : undefined,
      expandedText: options.expandedText,
      timestamp: new Date().toISOString()
    }
    
    await logToMasterSheetOptimized(masterEntry)
    
    // Only create project-specific sheets for ProjectIdea category
    if (options.category.toLowerCase() === 'projectidea') {
      return await createProjectSheetOptimized(options)
    }
    
    return `Logged to master sheet: ${masterEntry.category} - ${options.title}`
    
  }, 'sheet_creation_duration', {
    category: options.category,
    isProject: (options.category.toLowerCase() === 'projectidea').toString()
  })
}

/**
 * Optimized project sheet creation
 */
async function createProjectSheetOptimized(options: CreateSheetsOptions): Promise<string> {
  const cacheKey = `project_template:${options.category}`
  
  // Cache the project template for reuse
  const template = await withCache(
    cacheKey,
    async () => ({
      headers: [
        'Timestamp',
        'Original Idea',
        'Expanded Description',
        'Category',
        'Priority',
        'Tags',
        'Actions',
        'Status',
        'Notes'
      ],
      tabColor: {
        red: 0.27,
        green: 0.71,
        blue: 0.82
      }
    }),
    sheetsApiCache,
    3600000 // 1 hour cache
  )

  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `MindDump: ${options.title}`,
      },
      sheets: [
        {
          properties: {
            title: 'Project Details',
            tabColor: template.tabColor,
          },
        },
      ],
    },
  })

  const spreadsheetId = spreadsheet.data.spreadsheetId!
  
  const initialData = [
    new Date().toISOString(),
    options.title,
    options.expandedText || '',
    options.category,
    options.priority || 'medium',
    (options.tags || []).join(', '),
    (options.actions || []).join('; '),
    'Active',
    options.description || ''
  ]

  // Use batch operations for better performance
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Update values
        {
          updateCells: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 2,
              startColumnIndex: 0,
              endColumnIndex: template.headers.length
            },
            rows: [
              {
                values: template.headers.map(header => ({
                  userEnteredValue: { stringValue: header },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                    textFormat: { bold: true }
                  }
                }))
              },
              {
                values: initialData.map(value => ({
                  userEnteredValue: { stringValue: String(value) }
                }))
              }
            ],
            fields: 'userEnteredValue,userEnteredFormat'
          }
        },
        // Auto-resize columns
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: 0,
              dimension: 'COLUMNS',
            },
          },
        },
      ],
    },
  })

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  
  performanceMonitor.record('project_sheet_created', 1, {
    category: options.category
  })
  
  return url
}

/**
 * Get Sheets performance statistics
 */
export function getSheetsPerformanceStats() {
  const last5min = 300000
  
  return {
    batchOperations: performanceMonitor.getMetrics('sheets_batch_success', last5min).length,
    averageProcessingTime: performanceMonitor.getAverage('sheets_batch_processing', last5min),
    cacheHitRate: calculateSheetsHitRate(last5min),
    errorRate: calculateSheetsErrorRate(last5min),
    queueStats: {
      // Add queue statistics here
      pending: 0, // Would get from sheetsOptimizer
      processing: false
    },
    timestamp: Date.now()
  }
}

function calculateSheetsHitRate(timeRangeMs: number): number {
  const hits = performanceMonitor.getMetrics('cache_hit', timeRangeMs)
    .filter(m => m.tags?.key?.includes('sheet')).length
  const misses = performanceMonitor.getMetrics('cache_miss', timeRangeMs)
    .filter(m => m.tags?.key?.includes('sheet')).length
  const total = hits + misses
  
  return total > 0 ? hits / total : 0
}

function calculateSheetsErrorRate(timeRangeMs: number): number {
  const errors = performanceMonitor.getMetrics('sheets_batch_error', timeRangeMs).length
  const total = performanceMonitor.getMetrics('sheets_batch_success', timeRangeMs).length + errors
  
  return total > 0 ? errors / total : 0
}

// Validate optimized sheets access
export async function validateSheetsAccessOptimized(): Promise<{ success: boolean; performance: any }> {
  const startTime = performance.now()
  
  try {
    const authClient = await auth.getClient()
    await authClient.getAccessToken()
    
    // Test master sheet access if configured
    if (MASTER_SHEET_ID && MASTER_SHEET_ID !== 'your-master-sheet-id-here') {
      await initializeMasterSheetOptimized()
    }
    
    const duration = performance.now() - startTime
    performanceMonitor.record('sheets_validation_success', duration)
    
    return {
      success: true,
      performance: {
        validationTime: duration,
        cacheStats: sheetsApiCache.getStats()
      }
    }
  } catch (error) {
    const duration = performance.now() - startTime
    performanceMonitor.record('sheets_validation_error', duration)
    
    return {
      success: false,
      performance: {
        validationTime: duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}