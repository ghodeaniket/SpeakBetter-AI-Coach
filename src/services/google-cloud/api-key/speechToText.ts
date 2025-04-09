/**
 * Enhanced Speech-to-Text service using API key authentication
 */

// Speech recognition parameters
export interface RecognitionParams {
  encoding?: string;
  sampleRateHertz?: number;
  languageCode?: string;
  model?: string;
  enableAutomaticPunctuation?: boolean;
  enableWordTimeOffsets?: boolean;
  enableWordConfidence?: boolean;
  maxAlternatives?: number;
  profanityFilter?: boolean;
  audioChannelCount?: number;
}

// Result interface for transcription
export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  languageCode?: string;
  wordTimeOffsets?: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence?: number;
  }>;
  fillerWords?: {
    count: number;
    words: Array<{
      word: string;
      timestamp: number;
      category: 'filler' | 'hedge' | 'repetition';
    }>;
  };
  pauseAnalysis?: {
    totalPauses: number;
    longPauses: number; // Pauses > 2 seconds
    avgPauseDuration: number;
    pauseLocations: Array<{
      startTime: number;
      duration: number;
    }>;
  };
  sentenceAnalysis?: {
    sentences: Array<{
      text: string;
      startTime: number;
      endTime: number;
      wordsPerMinute?: number;
    }>;
    averageSentenceLength: number;
  };
  processingTimeMs?: number;
}

// Pause analysis thresholds
const SHORT_PAUSE_THRESHOLD = 0.5; // 500ms
const LONG_PAUSE_THRESHOLD = 2.0; // 2 seconds

/**
 * Transcribe audio using Speech-to-Text API with API key authentication
 */
export const transcribeAudio = async (
  audioContent: Uint8Array, 
  apiKey: string,
  params: RecognitionParams = {}
): Promise<TranscriptionResult> => {
  const startTime = Date.now();
  
  try {
    // Default parameters
    const defaultParams = {
      // Don't set encoding by default - let API detect it from audio headers
      languageCode: 'en-US',
      model: 'default',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      enableWordConfidence: true, // Add confidence for each word
      maxAlternatives: 1,
      profanityFilter: false,
      audioChannelCount: 1
    };
    
    // Merge with user-provided parameters
    const recognitionParams = { ...defaultParams, ...params };
    
    // Remove sampleRateHertz if present to let API auto-detect it
    if (recognitionParams.sampleRateHertz) {
      delete recognitionParams.sampleRateHertz;
    }
    
    // Prepare the API request body
    const requestBody = {
      config: {
        encoding: recognitionParams.encoding,
        languageCode: recognitionParams.languageCode,
        model: recognitionParams.model,
        enableAutomaticPunctuation: recognitionParams.enableAutomaticPunctuation,
        enableWordTimeOffsets: recognitionParams.enableWordTimeOffsets,
        enableWordConfidence: recognitionParams.enableWordConfidence,
        maxAlternatives: recognitionParams.maxAlternatives,
        profanityFilter: recognitionParams.profanityFilter,
        audioChannelCount: recognitionParams.audioChannelCount
      },
      audio: {
        content: arrayBufferToBase64(audioContent)
      }
    };
    
    // Make the API request
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || response.statusText;
      const errorCode = errorData.error?.code || response.status;
      
      throw new Error(`Speech-to-Text API error (${errorCode}): ${errorMessage}`);
    }
    
    const responseData = await response.json();
    
    // Check if we got valid results
    if (!responseData.results || responseData.results.length === 0) {
      throw new Error('No transcription results returned. The audio may be too short or contain no speech.');
    }
    
    // Extract transcript text and confidence
    const result = responseData.results[0];
    const alternative = result.alternatives[0];
    const transcript = alternative.transcript || '';
    const confidence = alternative.confidence || 0;
    
    // Process word timestamps if available
    const wordTimeOffsets = alternative.words?.map((wordInfo: any) => ({
      word: wordInfo.word || '',
      startTime: parseFloat(wordInfo.startTime.replace('s', '')),
      endTime: parseFloat(wordInfo.endTime.replace('s', '')),
      confidence: wordInfo.confidence || 0
    })) || [];
    
    // Enhanced filler word detection
    const fillerWordAnalysis = analyzeFillerWords(transcript, wordTimeOffsets);
    
    // Analyze pauses
    const pauseAnalysis = analyzeSpeeches(wordTimeOffsets);
    
    // Sentence analysis
    const sentenceAnalysis = analyzeSentences(transcript, wordTimeOffsets);
    
    const processingTimeMs = Date.now() - startTime;
    
    return {
      transcript,
      confidence,
      languageCode: recognitionParams.languageCode,
      wordTimeOffsets: wordTimeOffsets.length > 0 ? wordTimeOffsets : undefined,
      fillerWords: fillerWordAnalysis,
      pauseAnalysis,
      sentenceAnalysis,
      processingTimeMs,
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};

/**
 * Enhanced filler word detection with categorization
 */
function analyzeFillerWords(
  transcript: string, 
  wordTimeOffsets: Array<{word: string; startTime: number; endTime: number}>
): TranscriptionResult['fillerWords'] {
  // Define filler word patterns by category
  const fillerWordPatterns = {
    // Pure filler words that add no meaning
    filler: [
      /\bum\b/gi,
      /\buh\b/gi,
      /\ber\b/gi,
      /\behm\b/gi,
      /\bmm\b/gi,
      /\bhmm\b/gi,
    ],
    // Hedge words that diminish confidence
    hedge: [
      /\blike\b/gi,
      /\bso\b/gi,
      /\byou know\b/gi,
      /\bi mean\b/gi,
      /\bactually\b/gi,
      /\bbasically\b/gi,
      /\bjust\b/gi,
      /\bkind of\b/gi,
      /\bsort of\b/gi,
    ],
    // Words or phrases repeated in succession
    repetition: [] // Detected algorithmically below
  };
  
  // Array to store all detected filler words
  const fillerWordsFound: Array<{
    word: string; 
    timestamp: number;
    category: 'filler' | 'hedge' | 'repetition'
  }> = [];
  
  // Process each category of filler words
  for (const [category, patterns] of Object.entries(fillerWordPatterns) as [
    'filler' | 'hedge' | 'repetition', RegExp[]
  ][]) {
    for (const pattern of patterns) {
      const matches = [...transcript.matchAll(pattern)];
      
      for (const match of matches) {
        const matchedWord = match[0];
        const matchIndex = match.index;
        
        if (matchIndex !== undefined) {
          // Find closest word timestamp
          const closestWordInfo = wordTimeOffsets.find(word => 
            transcript.indexOf(word.word, matchIndex) === matchIndex ||
            transcript.indexOf(word.word, Math.max(0, matchIndex - 2)) === Math.max(0, matchIndex - 2)
          );
          
          if (closestWordInfo) {
            fillerWordsFound.push({
              word: matchedWord,
              timestamp: closestWordInfo.startTime,
              category: category as 'filler' | 'hedge' | 'repetition'
            });
          }
        }
      }
    }
  }
  
  // Detect word repetitions (e.g., "the the", "I, I", etc.)
  if (wordTimeOffsets.length > 1) {
    for (let i = 1; i < wordTimeOffsets.length; i++) {
      const currentWord = wordTimeOffsets[i].word.toLowerCase().replace(/[.,;!?]$/, '');
      const previousWord = wordTimeOffsets[i-1].word.toLowerCase().replace(/[.,;!?]$/, '');
      
      // Check for exact repetition
      if (currentWord === previousWord && currentWord.length > 1) { // Avoid flagging common repetitions of "a", "I", etc.
        fillerWordsFound.push({
          word: `${previousWord} ${currentWord}`,
          timestamp: wordTimeOffsets[i-1].startTime,
          category: 'repetition'
        });
      }
    }
  }
  
  return fillerWordsFound.length > 0 ? {
    count: fillerWordsFound.length,
    words: fillerWordsFound,
  } : undefined;
}

/**
 * Analyze pauses in speech
 */
function analyzeSpeeches(
  wordTimeOffsets: Array<{word: string; startTime: number; endTime: number}>
): TranscriptionResult['pauseAnalysis'] {
  if (!wordTimeOffsets || wordTimeOffsets.length < 2) {
    return undefined;
  }
  
  const pauses: Array<{startTime: number; duration: number}> = [];
  
  // Find pauses between words
  for (let i = 1; i < wordTimeOffsets.length; i++) {
    const currentWordStart = wordTimeOffsets[i].startTime;
    const previousWordEnd = wordTimeOffsets[i-1].endTime;
    
    const pauseDuration = currentWordStart - previousWordEnd;
    
    // Only count pauses above threshold
    if (pauseDuration > SHORT_PAUSE_THRESHOLD) {
      pauses.push({
        startTime: previousWordEnd,
        duration: pauseDuration
      });
    }
  }
  
  // Calculate pause statistics
  const totalPauses = pauses.length;
  const longPauses = pauses.filter(p => p.duration > LONG_PAUSE_THRESHOLD).length;
  
  const totalPauseDuration = pauses.reduce((sum, pause) => sum + pause.duration, 0);
  const avgPauseDuration = totalPauses > 0 ? totalPauseDuration / totalPauses : 0;
  
  return {
    totalPauses,
    longPauses,
    avgPauseDuration,
    pauseLocations: pauses
  };
}

/**
 * Analyze sentences and their properties
 */
function analyzeSentences(
  transcript: string,
  wordTimeOffsets: Array<{word: string; startTime: number; endTime: number}>
): TranscriptionResult['sentenceAnalysis'] {
  if (!transcript || !wordTimeOffsets || wordTimeOffsets.length === 0) {
    return undefined;
  }
  
  // Split text into sentences using punctuation
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentenceMatches = [...transcript.matchAll(sentenceRegex)];
  
  // If no sentence endings found, treat the whole transcript as one sentence
  if (sentenceMatches.length === 0 && transcript.trim().length > 0) {
    const firstWordStart = wordTimeOffsets[0].startTime;
    const lastWordEnd = wordTimeOffsets[wordTimeOffsets.length - 1].endTime;
    const duration = lastWordEnd - firstWordStart;
    const words = wordTimeOffsets.length;
    
    // Calculate words per minute if duration is valid
    const wordsPerMinute = duration > 0 ? Math.round((words / duration) * 60) : undefined;
    
    return {
      sentences: [{
        text: transcript.trim(),
        startTime: firstWordStart,
        endTime: lastWordEnd,
        wordsPerMinute
      }],
      averageSentenceLength: words
    };
  }
  
  // Process each detected sentence
  const sentences: Array<{
    text: string;
    startTime: number;
    endTime: number;
    wordsPerMinute?: number;
  }> = [];
  
  for (const match of sentenceMatches) {
    const sentenceText = match[0].trim();
    const sentenceStart = match.index || 0;
    const sentenceEnd = sentenceStart + match[0].length;
    
    // Find words that belong to this sentence
    const sentenceWords = wordTimeOffsets.filter(word => {
      const wordPosition = transcript.indexOf(word.word, Math.max(0, sentenceStart - word.word.length));
      return wordPosition >= sentenceStart && wordPosition < sentenceEnd;
    });
    
    if (sentenceWords.length > 0) {
      const firstWordStart = sentenceWords[0].startTime;
      const lastWordEnd = sentenceWords[sentenceWords.length - 1].endTime;
      const duration = lastWordEnd - firstWordStart;
      
      // Calculate words per minute for this sentence
      const wordsPerMinute = duration > 0 ? Math.round((sentenceWords.length / duration) * 60) : undefined;
      
      sentences.push({
        text: sentenceText,
        startTime: firstWordStart,
        endTime: lastWordEnd,
        wordsPerMinute
      });
    }
  }
  
  // Calculate average sentence length
  const totalWords = sentences.reduce((sum, s) => {
    const wordCount = s.text.split(/\s+/).length;
    return sum + wordCount;
  }, 0);
  
  const averageSentenceLength = sentences.length > 0 ? totalWords / sentences.length : 0;
  
  return {
    sentences,
    averageSentenceLength
  };
}

/**
 * Calculate speaking rate in words per minute
 */
export const calculateSpeakingRate = (result: TranscriptionResult): number | null => {
  if (!result.wordTimeOffsets || result.wordTimeOffsets.length === 0) {
    return null;
  }
  
  const words = result.wordTimeOffsets;
  const startTime = words[0].startTime;
  const endTime = words[words.length - 1].endTime;
  const durationMinutes = (endTime - startTime) / 60;
  
  if (durationMinutes <= 0) {
    return null;
  }
  
  return Math.round(words.length / durationMinutes);
};

/**
 * Enhanced clarity score calculation based on multiple factors
 */
export const calculateClarityScore = (result: TranscriptionResult): number => {
  // Base score starts at 85 (good by default)
  let score = 85;
  
  // Factor 1: Filler words impact
  if (result.fillerWords && result.wordTimeOffsets) {
    const totalWords = result.wordTimeOffsets.length;
    const fillerWordPercentage = (result.fillerWords.count / totalWords) * 100;
    
    // Penalize based on filler word percentage
    if (fillerWordPercentage > 15) {
      score -= 25;
    } else if (fillerWordPercentage > 10) {
      score -= 15;
    } else if (fillerWordPercentage > 5) {
      score -= 10;
    } else if (fillerWordPercentage > 2) {
      score -= 5;
    }
    
    // Additional penalty for hedge words which indicate uncertainty
    const hedgeWords = result.fillerWords.words.filter(w => w.category === 'hedge');
    const hedgePercentage = (hedgeWords.length / totalWords) * 100;
    
    if (hedgePercentage > 8) {
      score -= 10;
    } else if (hedgePercentage > 5) {
      score -= 5;
    }
    
    // Penalty for word repetitions which disrupt flow
    const repetitions = result.fillerWords.words.filter(w => w.category === 'repetition');
    if (repetitions.length > 3) {
      score -= 10;
    } else if (repetitions.length > 1) {
      score -= 5;
    }
  }
  
  // Factor 2: Pauses impact
  if (result.pauseAnalysis) {
    const { totalPauses, longPauses, avgPauseDuration } = result.pauseAnalysis;
    
    // Too many long pauses can indicate hesitation
    if (longPauses > 5) {
      score -= 15;
    } else if (longPauses > 2) {
      score -= 8;
    }
    
    // Average pause duration greater than 2 seconds can indicate overthinking
    if (avgPauseDuration > 3) {
      score -= 12;
    } else if (avgPauseDuration > 2) {
      score -= 8;
    }
    
    // Too few pauses can indicate rushing
    const speechDuration = result.wordTimeOffsets
      ? result.wordTimeOffsets[result.wordTimeOffsets.length - 1].endTime - result.wordTimeOffsets[0].startTime
      : 0;
    
    const pausesPerMinute = speechDuration > 0 
      ? (totalPauses / (speechDuration / 60))
      : 0;
    
    if (pausesPerMinute < 2 && speechDuration > 30) {
      score -= 10; // Too few pauses for a long speech
    }
  }
  
  // Factor 3: Speaking rate
  const wordsPerMinute = calculateSpeakingRate(result);
  if (wordsPerMinute) {
    // Optimal range is around 140-160 WPM
    if (wordsPerMinute > 200) {
      score -= 20; // Too fast
    } else if (wordsPerMinute > 180) {
      score -= 10; // Somewhat fast
    } else if (wordsPerMinute < 100) {
      score -= 15; // Too slow
    } else if (wordsPerMinute < 120) {
      score -= 5; // Somewhat slow
    }
  }
  
  // Factor 4: Recognition confidence
  if (result.confidence < 0.7) {
    score -= 10; // Low confidence might mean unclear speech
  } else if (result.confidence < 0.85) {
    score -= 5; // Moderate confidence
  }
  
  // Factor 5: Sentence structure
  if (result.sentenceAnalysis) {
    // Extremely long sentences can be hard to follow
    if (result.sentenceAnalysis.averageSentenceLength > 30) {
      score -= 10;
    } else if (result.sentenceAnalysis.averageSentenceLength > 20) {
      score -= 5;
    }
    
    // Inconsistent speaking rate between sentences
    if (result.sentenceAnalysis.sentences.length >= 2) {
      const speakingRates = result.sentenceAnalysis.sentences
        .map(s => s.wordsPerMinute)
        .filter(Boolean) as number[];
      
      if (speakingRates.length >= 2) {
        const min = Math.min(...speakingRates);
        const max = Math.max(...speakingRates);
        
        if (max > min * 2) {
          score -= 10; // Large variation in speaking rate
        } else if (max > min * 1.5) {
          score -= 5; // Moderate variation
        }
      }
    }
  }
  
  // Ensure score stays in 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Helper function to convert ArrayBuffer to Base64
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
};

export default {
  transcribeAudio,
  calculateSpeakingRate,
  calculateClarityScore
};
