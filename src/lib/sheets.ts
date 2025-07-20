import { GoogleAuth } from 'google-auth-library'
import { google } from 'googleapis'
import { secureSheets, SecureSheetEntry, validateSheetId } from './sheets-security'

// Legacy auth for backward compatibility - new code should use secureSheets
const auth = new GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

// Master sheet ID for centralized logging - this should be set in environment variables
const MASTER_SHEET_ID = process.env.MASTER_SHEET_ID || 'your-master-sheet-id-here'

export interface ThoughtCategory {
  id: string
  name: string
  color: string
  description?: string
}

// Updated categories based on the new schema requirements
export const THOUGHT_CATEGORIES: ThoughtCategory[] = [
  { id: 'goal', name: 'Goal', color: '#FF6B6B', description: 'Personal or professional objectives' },
  { id: 'habit', name: 'Habit', color: '#4ECDC4', description: 'New routines or behavioral tracking' },
  { id: 'projectidea', name: 'Project Idea', color: '#45B7D1', description: 'Apps, tools, features, or businesses' },
  { id: 'task', name: 'Task', color: '#96CEB4', description: 'Simple, actionable to-dos' },
  { id: 'reminder', name: 'Reminder', color: '#FFEAA7', description: 'Time-based notes or scheduling needs' },
  { id: 'note', name: 'Note', color: '#DDA0DD', description: 'General or unstructured information' },
  { id: 'insight', name: 'Insight', color: '#98D8C8', description: 'Personal realizations or journal-style reflections' },
  { id: 'learning', name: 'Learning', color: '#F7DC6F', description: 'Topics to study, courses to take, research leads' },
  { id: 'career', name: 'Career', color: '#85C1E9', description: 'Job goals, application ideas, networking plans' },
  { id: 'metric', name: 'Metric', color: '#F8C471', description: 'Self-tracking data (e.g. sleep, gym, mood logs)' },
  { id: 'idea', name: 'Idea', color: '#BB8FCE', description: 'Broad creative thoughts that don\'t fit elsewhere' },
  { id: 'system', name: 'System', color: '#7DCEA0', description: 'Frameworks, workflows, and organizational logic' },
  { id: 'automation', name: 'Automation', color: '#F1C40F', description: 'Specific automations or bots to build' },
  { id: 'person', name: 'Person', color: '#E74C3C', description: 'Notes about people, meetings, or conversations' },
  { id: 'sensitive', name: 'Sensitive', color: '#34495E', description: 'Private, non-routable entries' },
  { id: 'uncategorized', name: 'Uncategorized', color: '#95A5A6', description: 'Fallback if categorization fails' },
]

export interface CreateSheetsOptions {
  title: string
  category: string
  description?: string
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
  expandedText?: string
  actions?: string[]
}

// New interface for master sheet logging
export interface MasterSheetEntry {
  rawInput: string
  category: string
  subcategory?: string
  priority?: 'Low' | 'Medium' | 'High'
  expandedText?: string
  timestamp: string
}

// Retry configuration for robust error handling
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000  // 10 seconds
}

// Utility function for exponential backoff retry
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === config.maxRetries) {
        throw lastError
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt - 1),
        config.maxDelay
      )
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Enhanced function to log ALL inputs to master sheet with security
export async function logToMasterSheet(entry: MasterSheetEntry): Promise<void> {
  if (!MASTER_SHEET_ID || MASTER_SHEET_ID === 'your-master-sheet-id-here') {
    console.warn('Master sheet ID not configured, skipping master sheet logging')
    return
  }

  // Validate sheet ID format
  if (!validateSheetId(MASTER_SHEET_ID)) {
    console.error('Invalid master sheet ID format')
    return
  }
  
  // Convert to secure entry format
  const secureEntry: SecureSheetEntry = {
    rawInput: entry.rawInput,
    category: entry.category,
    subcategory: entry.subcategory,
    priority: entry.priority,
    expandedText: entry.expandedText,
    timestamp: entry.timestamp
  }

  // Use secure logging
  const result = await secureSheets.secureLogToMasterSheet(secureEntry)
  
  if (result.success) {
    console.log('✅ Successfully logged to secure master sheet:', entry.category)
  } else {
    console.error('❌ Failed to log to secure master sheet:', result.error)
    
    // Fallback to legacy method if secure method fails
    try {
      await withRetry(async () => {
        const masterSheetData = [
          entry.rawInput,
          entry.category,
          entry.subcategory || '',
          entry.priority || '',
          entry.expandedText || '',
          entry.timestamp
        ]

        await sheets.spreadsheets.values.append({
          spreadsheetId: MASTER_SHEET_ID,
          range: 'Master Log!A:F',
          valueInputOption: 'RAW',
          requestBody: {
            values: [masterSheetData],
          },
        })
        
        console.log('Fallback logging to master sheet successful:', entry.category)
      })
    } catch (fallbackError) {
      console.error('Both secure and fallback logging failed:', fallbackError)
      throw fallbackError
    }
  }
}

// Function to ensure master sheet has proper headers
export async function initializeMasterSheet(): Promise<void> {
  if (!MASTER_SHEET_ID || MASTER_SHEET_ID === 'your-master-sheet-id-here') {
    console.warn('Master sheet ID not configured, skipping initialization')
    return
  }
  
  try {
    // Check if headers already exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID,
      range: 'Master Log!A1:F1',
    })
    
    // If no headers found, add them
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
      
      console.log('Master sheet initialized with headers')
    }
  } catch (error) {
    console.error('Error initializing master sheet:', error)
  }
}

// Enhanced function that logs to master sheet AND creates project-specific sheets for ProjectIdea
export async function createGoogleSheet(options: CreateSheetsOptions): Promise<string> {
  try {
    const category = THOUGHT_CATEGORIES.find(c => c.id === options.category) || THOUGHT_CATEGORIES[15] // fallback to uncategorized
    const timestamp = new Date().toISOString()
    
    // ALWAYS log to master sheet first
    const masterEntry: MasterSheetEntry = {
      rawInput: options.title,
      category: category.name,
      subcategory: options.tags?.[0], // Use first tag as subcategory if available
      priority: options.priority ? (options.priority.charAt(0).toUpperCase() + options.priority.slice(1)) as 'Low' | 'Medium' | 'High' : undefined,
      expandedText: options.expandedText,
      timestamp: timestamp
    }
    
    await logToMasterSheet(masterEntry)
    
    // Only create project-specific sheets for ProjectIdea category
    if (options.category.toLowerCase() === 'projectidea' || category.name === 'Project Idea') {
      return await withRetry(async () => {
        const spreadsheet = await sheets.spreadsheets.create({
          requestBody: {
            properties: {
              title: `MindDump: ${options.title}`,
            },
            sheets: [
              {
                properties: {
                  title: 'Project Details',
                  tabColor: {
                    red: parseInt(category.color.slice(1, 3), 16) / 255,
                    green: parseInt(category.color.slice(3, 5), 16) / 255,
                    blue: parseInt(category.color.slice(5, 7), 16) / 255,
                  },
                },
              },
            ],
          },
        })

        const spreadsheetId = spreadsheet.data.spreadsheetId!
        
        const headers = [
          'Timestamp',
          'Original Idea',
          'Expanded Description',
          'Category',
          'Priority',
          'Tags',
          'Actions',
          'Status',
          'Notes'
        ]
        
        const initialData = [
          timestamp,
          options.title,
          options.expandedText || '',
          category.name,
          options.priority || 'medium',
          (options.tags || []).join(', '),
          (options.actions || []).join('; '),
          'Active',
          options.description || ''
        ]

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Project Details!A1:I2',
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers, initialData],
          },
        })

        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
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

        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      })
    }
    
    // For all other categories, return a confirmation message
    return `Logged to master sheet: ${category.name} - ${options.title}`
    
  } catch (error) {
    console.error('Error in createGoogleSheet:', error)
    throw new Error(`Failed to process thought: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Enhanced addThoughtToSheet that also logs to master sheet
export async function addThoughtToSheet(sheetId: string, thought: CreateSheetsOptions): Promise<void> {
  try {
    const category = THOUGHT_CATEGORIES.find(c => c.id === thought.category) || THOUGHT_CATEGORIES[15] // fallback to uncategorized
    const timestamp = new Date().toISOString()
    
    // First, log to master sheet
    const masterEntry: MasterSheetEntry = {
      rawInput: thought.title,
      category: category.name,
      subcategory: thought.tags?.[0],
      priority: thought.priority ? (thought.priority.charAt(0).toUpperCase() + thought.priority.slice(1)) as 'Low' | 'Medium' | 'High' : undefined,
      expandedText: thought.expandedText,
      timestamp: timestamp
    }
    
    await logToMasterSheet(masterEntry)
    
    // Then add to specific sheet (with retry logic)
    await withRetry(async () => {
      const data = [
        timestamp,
        thought.title,
        thought.expandedText || '',
        category.name,
        thought.priority || 'medium',
        (thought.tags || []).join(', '),
        (thought.actions || []).join('; '),
        'Active',
        thought.description || ''
      ]

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Thoughts!A:I',
        valueInputOption: 'RAW',
        requestBody: {
          values: [data],
        },
      })
    })
    
  } catch (error) {
    console.error('Error adding thought to sheet:', error)
    throw new Error('Failed to add thought to Google Sheet')
  }
}

// New convenience function for logging thoughts directly to master sheet only
export async function logThoughtToMaster(
  rawInput: string,
  category: string,
  subcategory?: string,
  priority?: 'Low' | 'Medium' | 'High',
  expandedText?: string
): Promise<void> {
  const masterEntry: MasterSheetEntry = {
    rawInput,
    category,
    subcategory,
    priority,
    expandedText,
    timestamp: new Date().toISOString()
  }
  
  await logToMasterSheet(masterEntry)
}

// Enhanced validation that also checks master sheet access
export async function validateSheetsAccess(): Promise<boolean> {
  try {
    const authClient = await auth.getClient()
    await authClient.getAccessToken()
    
    // Also try to initialize master sheet if configured
    if (MASTER_SHEET_ID && MASTER_SHEET_ID !== 'your-master-sheet-id-here') {
      try {
        await initializeMasterSheet()
        console.log('Master sheet access validated')
      } catch (masterSheetError) {
        console.warn('Master sheet access validation failed:', masterSheetError)
        // Don't fail overall validation if master sheet has issues
      }
    }
    
    return true
  } catch (error) {
    console.error('Google Sheets access validation failed:', error)
    return false
  }
}

export function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

export function generateSheetTitle(text: string, category: string): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const cleanText = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30)
  
  return `${category}-${cleanText}-${timestamp}`
}

// Utility function to get category by name or ID
export function getCategoryByIdOrName(identifier: string): ThoughtCategory | undefined {
  return THOUGHT_CATEGORIES.find(
    c => c.id.toLowerCase() === identifier.toLowerCase() || 
         c.name.toLowerCase() === identifier.toLowerCase()
  )
}

// Function to batch log multiple entries to master sheet
export async function batchLogToMasterSheet(entries: MasterSheetEntry[]): Promise<void> {
  if (!MASTER_SHEET_ID || MASTER_SHEET_ID === 'your-master-sheet-id-here') {
    console.warn('Master sheet ID not configured, skipping batch logging')
    return
  }
  
  if (entries.length === 0) return
  
  await withRetry(async () => {
    const rows = entries.map(entry => [
      entry.rawInput,
      entry.category,
      entry.subcategory || '',
      entry.priority || '',
      entry.expandedText || '',
      entry.timestamp
    ])

    await sheets.spreadsheets.values.append({
      spreadsheetId: MASTER_SHEET_ID,
      range: 'Master Log!A:F',
      valueInputOption: 'RAW',
      requestBody: {
        values: rows,
      },
    })
    
    console.log(`Successfully batch logged ${entries.length} entries to master sheet`)
  })
}

// Function to check if master sheet is properly configured
export function isMasterSheetConfigured(): boolean {
  return !!(MASTER_SHEET_ID && MASTER_SHEET_ID !== 'your-master-sheet-id-here')
}

// Export master sheet ID for external access
export function getMasterSheetId(): string | undefined {
  return isMasterSheetConfigured() ? MASTER_SHEET_ID : undefined
}