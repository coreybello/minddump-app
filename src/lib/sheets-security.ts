/**
 * Enhanced Google Sheets Security Library
 * Provides comprehensive security for Google Sheets API operations
 */

import { GoogleAuth } from 'google-auth-library'
import { google } from 'googleapis'
import crypto from 'crypto'

export interface SheetsSecurityConfig {
  validateServiceAccount?: boolean
  encryptSensitiveData?: boolean
  auditAccess?: boolean
  restrictDomains?: string[]
  maxSheetSize?: number
  rateLimit?: {
    requests: number
    windowMs: number
  }
}

export interface SecureSheetEntry {
  rawInput: string
  category: string
  subcategory?: string
  priority?: 'Low' | 'Medium' | 'High'
  expandedText?: string
  timestamp: string
  hash?: string // For data integrity verification
  encrypted?: boolean
}

// Default security configuration
const DEFAULT_SECURITY_CONFIG: Required<SheetsSecurityConfig> = {
  validateServiceAccount: true,
  encryptSensitiveData: true,
  auditAccess: true,
  restrictDomains: [],
  maxSheetSize: 10000, // Maximum rows
  rateLimit: {
    requests: 60,
    windowMs: 60000 // 1 minute
  }
}

/**
 * Secure Google Sheets authentication with validation
 */
export class SecureSheetsAuth {
  private auth: GoogleAuth
  private isValidated: boolean = false
  private lastValidation: number = 0
  private readonly validationTtl: number = 3600000 // 1 hour
  
  constructor(private config: SheetsSecurityConfig = {}) {
    const mergedConfig = { ...DEFAULT_SECURITY_CONFIG, ...config }
    
    // Validate required environment variables
    this.validateEnvironmentVariables()
    
    this.auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })
  }
  
  /**
   * Validate environment variables for security
   */
  private validateEnvironmentVariables(): void {
    const required = ['GOOGLE_SHEETS_CLIENT_EMAIL', 'GOOGLE_SHEETS_PRIVATE_KEY']
    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
    
    // Validate private key format
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY
    if (privateKey && !privateKey.includes('BEGIN PRIVATE KEY')) {
      throw new Error('Invalid private key format - must be a valid PEM key')
    }
    
    // Validate service account email format
    const serviceEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
    if (serviceEmail && !serviceEmail.includes('@') && !serviceEmail.includes('.iam.gserviceaccount.com')) {
      console.warn('Service account email format may be invalid')
    }
  }
  
  /**
   * Validate service account permissions and authentication
   */
  async validateServiceAccount(): Promise<{ isValid: boolean; errors: string[] }> {
    const now = Date.now()
    const errors: string[] = []
    
    // Check if we need to revalidate
    if (this.isValidated && (now - this.lastValidation) < this.validationTtl) {
      return { isValid: true, errors: [] }
    }
    
    try {
      const authClient = await this.auth.getClient()
      const accessToken = await authClient.getAccessToken()
      
      if (!accessToken.token) {
        errors.push('Failed to obtain access token')
        return { isValid: false, errors }
      }
      
      // Test basic Sheets API access
      const sheets = google.sheets({ version: 'v4', auth: this.auth })
      
      // Try to access a test spreadsheet or create one for validation
      const testSheetId = process.env.MASTER_SHEET_ID
      if (testSheetId && testSheetId !== 'your-master-sheet-id-here') {
        try {
          await sheets.spreadsheets.get({
            spreadsheetId: testSheetId,
            fields: 'properties.title'
          })
        } catch (testError) {
          errors.push(`Cannot access master sheet: ${testError instanceof Error ? testError.message : 'Unknown error'}`)
        }
      }
      
      this.isValidated = errors.length === 0
      this.lastValidation = now
      
      return { isValid: this.isValidated, errors }
      
    } catch (error) {
      errors.push(`Service account validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { isValid: false, errors }
    }
  }
  
  /**
   * Get authenticated Sheets client
   */
  async getClient() {
    const validation = await this.validateServiceAccount()
    if (!validation.isValid) {
      throw new Error(`Authentication failed: ${validation.errors.join(', ')}`)
    }
    
    return google.sheets({ version: 'v4', auth: this.auth })
  }
}

/**
 * Data encryption utilities for sensitive sheet data
 */
export class SheetsDataEncryption {
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyLength = 32
  
  constructor(private encryptionKey?: string) {
    if (!encryptionKey) {
      this.encryptionKey = this.generateEncryptionKey()
    }
  }
  
  /**
   * Generate a secure encryption key
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex')
  }
  
  /**
   * Encrypt sensitive data
   */
  encrypt(data: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(this.algorithm, this.encryptionKey!)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    }
  }
  
  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey!)
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
  
  /**
   * Check if data should be encrypted based on content
   */
  shouldEncrypt(data: string, category: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /ssn/i,
      /social.security/i,
      /credit.card/i,
      /bank.account/i,
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card pattern
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
    ]
    
    const isSensitiveCategory = ['sensitive', 'person', 'private'].includes(category.toLowerCase())
    const hasSensitiveContent = sensitivePatterns.some(pattern => pattern.test(data))
    
    return isSensitiveCategory || hasSensitiveContent
  }
}

/**
 * Rate limiting for Google Sheets API
 */
class SheetsRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()
  
  constructor(
    private maxRequests: number = 60,
    private windowMs: number = 60000
  ) {
    // Cleanup expired entries
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }
  
  isAllowed(identifier: string = 'global'): boolean {
    const now = Date.now()
    const record = this.requests.get(identifier)
    
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, { count: 1, resetTime: now + this.windowMs })
      return true
    }
    
    if (record.count >= this.maxRequests) {
      return false
    }
    
    record.count++
    return true
  }
  
  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

/**
 * Secure Google Sheets operations with comprehensive security
 */
export class SecureGoogleSheets {
  private auth: SecureSheetsAuth
  private encryption: SheetsDataEncryption
  private rateLimiter: SheetsRateLimiter
  private config: Required<SheetsSecurityConfig>
  
  constructor(config: SheetsSecurityConfig = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config }
    this.auth = new SecureSheetsAuth(config)
    this.encryption = new SheetsDataEncryption(process.env.SHEETS_ENCRYPTION_KEY)
    this.rateLimiter = new SheetsRateLimiter(
      this.config.rateLimit.requests,
      this.config.rateLimit.windowMs
    )
  }
  
  /**
   * Create data integrity hash
   */
  private createDataHash(data: SecureSheetEntry): string {
    const dataString = JSON.stringify({
      rawInput: data.rawInput,
      category: data.category,
      timestamp: data.timestamp
    })
    return crypto.createHash('sha256').update(dataString).digest('hex')
  }
  
  /**
   * Sanitize and validate sheet input
   */
  private sanitizeSheetData(entry: SecureSheetEntry): SecureSheetEntry {
    return {
      rawInput: String(entry.rawInput || '').substring(0, 10000).trim(),
      category: String(entry.category || '').substring(0, 100).trim(),
      subcategory: entry.subcategory ? String(entry.subcategory).substring(0, 100).trim() : undefined,
      priority: entry.priority,
      expandedText: entry.expandedText ? String(entry.expandedText).substring(0, 50000).trim() : undefined,
      timestamp: entry.timestamp,
      hash: this.createDataHash(entry),
      encrypted: false
    }
  }
  
  /**
   * Securely log entry to master sheet
   */
  async secureLogToMasterSheet(entry: SecureSheetEntry): Promise<{ success: boolean; error?: string }> {
    try {
      // Rate limiting check
      if (!this.rateLimiter.isAllowed()) {
        return { success: false, error: 'Rate limit exceeded' }
      }
      
      // Validate master sheet configuration
      const masterSheetId = process.env.MASTER_SHEET_ID
      if (!masterSheetId || masterSheetId === 'your-master-sheet-id-here') {
        return { success: false, error: 'Master sheet not configured' }
      }
      
      // Sanitize data
      const sanitizedEntry = this.sanitizeSheetData(entry)
      
      // Encrypt sensitive data if needed
      let processedEntry = sanitizedEntry
      if (this.config.encryptSensitiveData && 
          this.encryption.shouldEncrypt(sanitizedEntry.rawInput, sanitizedEntry.category)) {
        const encryptedData = this.encryption.encrypt(sanitizedEntry.rawInput)
        processedEntry = {
          ...sanitizedEntry,
          rawInput: JSON.stringify(encryptedData),
          encrypted: true
        }
      }
      
      // Get authenticated client
      const sheets = await this.auth.getClient()
      
      // Prepare row data with security metadata
      const rowData = [
        processedEntry.rawInput,
        processedEntry.category,
        processedEntry.subcategory || '',
        processedEntry.priority || '',
        processedEntry.expandedText || '',
        processedEntry.timestamp,
        processedEntry.hash || '',
        processedEntry.encrypted ? 'YES' : 'NO'
      ]
      
      // Check sheet size limit
      try {
        const existingData = await sheets.spreadsheets.values.get({
          spreadsheetId: masterSheetId,
          range: 'Master Log!A:A'
        })
        
        const rowCount = existingData.data.values?.length || 0
        if (rowCount >= this.config.maxSheetSize) {
          return { success: false, error: 'Sheet size limit exceeded' }
        }
      } catch {
        // Continue if we can't check size
      }
      
      // Append data to sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId: masterSheetId,
        range: 'Master Log!A:H',
        valueInputOption: 'RAW',
        requestBody: {
          values: [rowData]
        }
      })
      
      // Audit log if enabled
      if (this.config.auditAccess) {
        console.log(`[AUDIT] Sheet access: ${processedEntry.category} - ${processedEntry.timestamp}`)
      }
      
      return { success: true }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Secure sheets operation failed:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }
  
  /**
   * Batch log multiple entries securely
   */
  async secureBatchLog(entries: SecureSheetEntry[]): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const errors: string[] = []
    let processed = 0
    
    // Rate limiting check
    if (!this.rateLimiter.isAllowed('batch')) {
      return { success: false, processed: 0, errors: ['Batch rate limit exceeded'] }
    }
    
    const batchSize = 100 // Process in smaller batches for safety
    const batches = []
    
    for (let i = 0; i < entries.length; i += batchSize) {
      batches.push(entries.slice(i, i + batchSize))
    }
    
    for (const batch of batches) {
      try {
        const processedBatch = batch.map(entry => this.sanitizeSheetData(entry))
        
        // Process each entry in the batch
        for (const entry of processedBatch) {
          const result = await this.secureLogToMasterSheet(entry)
          if (result.success) {
            processed++
          } else {
            errors.push(result.error || 'Unknown error')
          }
        }
      } catch (error) {
        errors.push(`Batch processing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    return {
      success: errors.length === 0,
      processed,
      errors
    }
  }
  
  /**
   * Initialize master sheet with security headers
   */
  async initializeSecureMasterSheet(): Promise<{ success: boolean; error?: string }> {
    try {
      const masterSheetId = process.env.MASTER_SHEET_ID
      if (!masterSheetId || masterSheetId === 'your-master-sheet-id-here') {
        return { success: false, error: 'Master sheet ID not configured' }
      }
      
      const sheets = await this.auth.getClient()
      
      // Check if headers already exist
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: masterSheetId,
          range: 'Master Log!A1:H1'
        })
        
        if (response.data.values && response.data.values.length > 0) {
          return { success: true } // Headers already exist
        }
      } catch {
        // Continue to create headers
      }
      
      // Create secure headers
      const headers = [
        'Raw Input',
        'Category',
        'Subcategory',
        'Priority',
        'Expanded Text',
        'Timestamp',
        'Data Hash',
        'Encrypted'
      ]
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: masterSheetId,
        range: 'Master Log!A1:H1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers]
        }
      })
      
      // Format headers with security indication
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: masterSheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.8, green: 0.9, blue: 0.8 },
                    textFormat: { bold: true }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            }
          ]
        }
      })
      
      return { success: true }
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  /**
   * Validate sheets environment and security settings
   */
  async validateSecurity(): Promise<{ isValid: boolean; warnings: string[]; errors: string[] }> {
    const warnings: string[] = []
    const errors: string[] = []
    
    // Validate service account
    const authValidation = await this.auth.validateServiceAccount()
    if (!authValidation.isValid) {
      errors.push(...authValidation.errors)
    }
    
    // Check encryption key
    if (this.config.encryptSensitiveData && !process.env.SHEETS_ENCRYPTION_KEY) {
      warnings.push('SHEETS_ENCRYPTION_KEY not set - sensitive data will not be encrypted')
    }
    
    // Check master sheet configuration
    const masterSheetId = process.env.MASTER_SHEET_ID
    if (!masterSheetId || masterSheetId === 'your-master-sheet-id-here') {
      warnings.push('Master sheet ID not configured properly')
    }
    
    // Validate production settings
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.SHEETS_ENCRYPTION_KEY) {
        errors.push('SHEETS_ENCRYPTION_KEY required in production')
      }
      
      if (this.config.rateLimit.requests > 100) {
        warnings.push('High rate limit configured for production')
      }
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors
    }
  }
}

// Export singleton instance with default configuration
export const secureSheets = new SecureGoogleSheets()

/**
 * Utility function to validate sheet ID format
 */
export function validateSheetId(sheetId: string): boolean {
  const sheetIdPattern = /^[a-zA-Z0-9-_]{44}$/
  return sheetIdPattern.test(sheetId)
}

/**
 * Utility function to sanitize sheet name
 */
export function sanitizeSheetName(name: string): string {
  return name
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100)
    .toLowerCase()
}