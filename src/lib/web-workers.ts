/**
 * Web Workers for offloading heavy processing tasks
 * Improves main thread performance for voice processing and data analysis
 */

// Voice processing worker for real-time transcription
export const createVoiceProcessingWorker = (): Worker | null => {
  if (typeof window === 'undefined' || !window.Worker) {
    return null
  }

  const workerCode = `
    // Voice processing worker
    let audioContext;
    let analyser;
    let dataArray;
    
    // Audio analysis configuration
    const SAMPLE_RATE = 16000;
    const FFT_SIZE = 2048;
    const SILENCE_THRESHOLD = 0.01;
    const SILENCE_DURATION = 1000; // ms
    
    let lastSoundTime = Date.now();
    let isProcessing = false;
    
    // Initialize audio processing
    function initializeAudioProcessing() {
      try {
        audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
        analyser = audioContext.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = 0.3;
        
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        postMessage({ type: 'initialized', sampleRate: SAMPLE_RATE });
      } catch (error) {
        postMessage({ type: 'error', message: error.message });
      }
    }
    
    // Process audio data for voice activity detection
    function processAudioData(audioData) {
      if (!analyser || !dataArray) return;
      
      // Calculate RMS (Root Mean Square) for volume detection
      let sum = 0;
      for (let i = 0; i < audioData.length; i++) {
        const normalized = audioData[i] / 255.0;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / audioData.length);
      
      // Detect voice activity
      const hasVoice = rms > SILENCE_THRESHOLD;
      const now = Date.now();
      
      if (hasVoice) {
        lastSoundTime = now;
      }
      
      const silenceDuration = now - lastSoundTime;
      const isQuiet = silenceDuration > SILENCE_DURATION;
      
      // Send analysis results
      postMessage({
        type: 'audioAnalysis',
        volume: rms,
        hasVoice,
        isQuiet,
        silenceDuration,
        timestamp: now
      });
    }
    
    // Enhanced speech recognition processing
    function processSpeechRecognition(transcript, confidence, isFinal) {
      const words = transcript.toLowerCase().split(' ').filter(w => w.length > 0);
      
      // Calculate speech metrics
      const wordCount = words.length;
      const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount || 0;
      const speechRate = wordCount / (Date.now() - lastSoundTime) * 60000; // words per minute
      
      // Detect potential categories based on keywords
      const categoryHints = detectCategoryHints(words);
      
      // Quality assessment
      const quality = assessTranscriptQuality(transcript, confidence, wordCount);
      
      postMessage({
        type: 'speechProcessed',
        transcript,
        confidence,
        isFinal,
        metrics: {
          wordCount,
          avgWordLength,
          speechRate,
          quality
        },
        categoryHints,
        timestamp: Date.now()
      });
    }
    
    // Detect category hints from speech patterns
    function detectCategoryHints(words) {
      const categoryKeywords = {
        task: ['need', 'do', 'complete', 'finish', 'todo', 'action'],
        goal: ['want', 'achieve', 'target', 'aim', 'objective', 'plan'],
        idea: ['think', 'maybe', 'could', 'idea', 'concept', 'imagine'],
        reminder: ['remember', 'remind', 'schedule', 'appointment', 'meeting'],
        learning: ['learn', 'study', 'research', 'understand', 'course'],
        project: ['build', 'create', 'develop', 'make', 'app', 'system'],
        insight: ['realize', 'understand', 'discover', 'insight', 'reflection'],
        person: ['person', 'people', 'friend', 'colleague', 'contact', 'meet']
      };
      
      const hints = {};
      
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        const matchCount = words.filter(word => 
          keywords.some(keyword => word.includes(keyword))
        ).length;
        
        if (matchCount > 0) {
          hints[category] = matchCount / words.length;
        }
      }
      
      return hints;
    }
    
    // Assess transcript quality
    function assessTranscriptQuality(transcript, confidence, wordCount) {
      let score = confidence || 0.5;
      
      // Penalize very short transcripts
      if (wordCount < 3) score *= 0.7;
      
      // Penalize transcripts with too many filler words
      const fillerWords = ['um', 'uh', 'like', 'you know', 'actually'];
      const fillerCount = transcript.toLowerCase().split(' ')
        .filter(word => fillerWords.includes(word)).length;
      
      if (fillerCount > wordCount * 0.3) {
        score *= 0.8;
      }
      
      // Boost score for complete sentences
      if (transcript.trim().endsWith('.') || transcript.trim().endsWith('!') || transcript.trim().endsWith('?')) {
        score *= 1.1;
      }
      
      return Math.min(1, Math.max(0, score));
    }
    
    // Batch process multiple transcripts
    function batchProcessTranscripts(transcripts) {
      const results = transcripts.map(({ transcript, confidence, id }) => {
        const words = transcript.toLowerCase().split(' ').filter(w => w.length > 0);
        const categoryHints = detectCategoryHints(words);
        const quality = assessTranscriptQuality(transcript, confidence, words.length);
        
        return {
          id,
          transcript,
          confidence,
          quality,
          categoryHints,
          wordCount: words.length
        };
      });
      
      postMessage({
        type: 'batchProcessed',
        results,
        timestamp: Date.now()
      });
    }
    
    // Message handler
    self.onmessage = function(e) {
      const { type, data } = e.data;
      
      switch (type) {
        case 'initialize':
          initializeAudioProcessing();
          break;
          
        case 'processAudio':
          processAudioData(data.audioData);
          break;
          
        case 'processSpeech':
          processSpeechRecognition(data.transcript, data.confidence, data.isFinal);
          break;
          
        case 'batchProcess':
          batchProcessTranscripts(data.transcripts);
          break;
          
        case 'terminate':
          if (audioContext) {
            audioContext.close();
          }
          self.close();
          break;
          
        default:
          postMessage({ type: 'error', message: 'Unknown message type' });
      }
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' })
  return new Worker(URL.createObjectURL(blob))
}

// Data processing worker for heavy analysis tasks
export const createDataProcessingWorker = (): Worker | null => {
  if (typeof window === 'undefined' || !window.Worker) {
    return null
  }

  const workerCode = `
    // Data processing worker for heavy computations
    
    // Text analysis functions
    function analyzeText(text) {
      const words = text.toLowerCase().split(/\\s+/).filter(w => w.length > 0);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // Basic metrics
      const wordCount = words.length;
      const sentenceCount = sentences.length;
      const avgWordsPerSentence = wordCount / sentenceCount || 0;
      const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount || 0;
      
      // Readability score (simplified Flesch reading ease)
      const avgSentenceLength = wordCount / sentenceCount || 0;
      const syllableCount = estimateSyllables(words);
      const avgSyllablesPerWord = syllableCount / wordCount || 0;
      
      const readabilityScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
      
      // Sentiment analysis (basic)
      const sentiment = analyzeSentiment(words);
      
      // Complexity indicators
      const complexity = analyzeComplexity(text, words);
      
      return {
        wordCount,
        sentenceCount,
        avgWordsPerSentence,
        avgWordLength,
        readabilityScore,
        sentiment,
        complexity
      };
    }
    
    function estimateSyllables(words) {
      return words.reduce((total, word) => {
        // Simple syllable estimation
        const vowels = (word.match(/[aeiouy]+/g) || []).length;
        const consonantClusters = (word.match(/[bcdfghjklmnpqrstvwxz]{2,}/g) || []).length;
        const estimate = Math.max(1, vowels - consonantClusters);
        return total + estimate;
      }, 0);
    }
    
    function analyzeSentiment(words) {
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'like', 'happy', 'excited', 'wonderful'];
      const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'annoyed'];
      
      let positive = 0;
      let negative = 0;
      
      words.forEach(word => {
        if (positiveWords.includes(word)) positive++;
        if (negativeWords.includes(word)) negative++;
      });
      
      const total = positive + negative;
      if (total === 0) return 'neutral';
      
      const positiveRatio = positive / total;
      if (positiveRatio > 0.6) return 'positive';
      if (positiveRatio < 0.4) return 'negative';
      return 'neutral';
    }
    
    function analyzeComplexity(text, words) {
      // Technical terms and jargon indicators
      const technicalTerms = words.filter(word => 
        word.length > 8 || 
        /^(auto|micro|multi|inter|trans|pre|post|pro|anti)/.test(word)
      ).length;
      
      // Complex punctuation
      const complexPunctuation = (text.match(/[;:()[\]{}]/g) || []).length;
      
      // Long sentences
      const longSentences = text.split(/[.!?]+/)
        .filter(s => s.trim().split(/\\s+/).length > 20).length;
      
      const complexityScore = (technicalTerms + complexPunctuation + longSentences) / words.length;
      
      return {
        technicalTerms,
        complexPunctuation,
        longSentences,
        score: complexityScore
      };
    }
    
    // Performance monitoring
    function measurePerformance(operation, data) {
      const startTime = performance.now();
      let result;
      
      try {
        switch (operation) {
          case 'analyzeText':
            result = analyzeText(data);
            break;
          case 'batchAnalyze':
            result = data.map(text => analyzeText(text));
            break;
          default:
            throw new Error('Unknown operation');
        }
        
        const duration = performance.now() - startTime;
        
        postMessage({
          type: 'performanceResult',
          operation,
          result,
          performance: {
            duration,
            inputSize: typeof data === 'string' ? data.length : data.length,
            timestamp: Date.now()
          }
        });
        
      } catch (error) {
        postMessage({
          type: 'error',
          operation,
          message: error.message,
          timestamp: Date.now()
        });
      }
    }
    
    // Message handler
    self.onmessage = function(e) {
      const { type, operation, data } = e.data;
      
      switch (type) {
        case 'analyze':
          measurePerformance(operation, data);
          break;
          
        case 'terminate':
          self.close();
          break;
          
        default:
          postMessage({ type: 'error', message: 'Unknown message type' });
      }
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' })
  return new Worker(URL.createObjectURL(blob))
}

// Worker manager for lifecycle and communication
export class WorkerManager {
  private workers: Map<string, Worker> = new Map()
  private messageHandlers: Map<string, (data: any) => void> = new Map()

  createWorker(name: string, workerFactory: () => Worker | null): boolean {
    if (this.workers.has(name)) {
      console.warn(`Worker ${name} already exists`)
      return false
    }

    const worker = workerFactory()
    if (!worker) {
      console.warn(`Failed to create worker ${name}`)
      return false
    }

    worker.onmessage = (e) => {
      const handler = this.messageHandlers.get(name)
      if (handler) {
        handler(e.data)
      }
    }

    worker.onerror = (error) => {
      console.error(`Worker ${name} error:`, error)
    }

    this.workers.set(name, worker)
    return true
  }

  postMessage(workerName: string, message: any): boolean {
    const worker = this.workers.get(workerName)
    if (!worker) {
      console.warn(`Worker ${workerName} not found`)
      return false
    }

    worker.postMessage(message)
    return true
  }

  setMessageHandler(workerName: string, handler: (data: any) => void): void {
    this.messageHandlers.set(workerName, handler)
  }

  terminateWorker(workerName: string): void {
    const worker = this.workers.get(workerName)
    if (worker) {
      worker.postMessage({ type: 'terminate' })
      worker.terminate()
      this.workers.delete(workerName)
      this.messageHandlers.delete(workerName)
    }
  }

  terminateAll(): void {
    for (const [name] of this.workers) {
      this.terminateWorker(name)
    }
  }

  getWorkerStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {}
    for (const [name] of this.workers) {
      status[name] = true
    }
    return status
  }
}

// Global worker manager instance
export const workerManager = new WorkerManager()

// Initialize workers for the application
export const initializeWorkers = (): { voice: boolean; data: boolean } => {
  const voiceWorkerCreated = workerManager.createWorker('voice', createVoiceProcessingWorker)
  const dataWorkerCreated = workerManager.createWorker('data', createDataProcessingWorker)

  // Set up default message handlers
  workerManager.setMessageHandler('voice', (data) => {
    console.log('Voice worker message:', data)
  })

  workerManager.setMessageHandler('data', (data) => {
    console.log('Data worker message:', data)
  })

  return {
    voice: voiceWorkerCreated,
    data: dataWorkerCreated
  }
}

// Cleanup function
export const cleanupWorkers = (): void => {
  workerManager.terminateAll()
}