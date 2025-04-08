// Google Cloud Speech-to-Text service
import { SpeechClient } from '@google-cloud/speech';

// Initialize the client
const speechClient = new SpeechClient();

// Interface for transcription options
export interface TranscriptionOptions {
  audioContent: Uint8Array;
  languageCode?: string;
  sampleRateHertz?: number;
  encoding?: string;
  enableWordTimeOffsets?: boolean;
  audioChannelCount?: number;
}

// Interface for transcription result with word-level timestamps
export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  languageCode?: string;
  wordTimeOffsets?: Array<{
    word: string;
    startTime: number;
    endTime: number;
  }>;
  fillerWords?: {
    count: number;
    words: Array<{
      word: string;
      timestamp: number;
    }>;
  };
  processingTimeMs?: number;
}

/**
 * Process audio and return transcription with word-level timestamps
 */
export const transcribeAudio = async (options: TranscriptionOptions): Promise<TranscriptionResult> => {
  try {
    const startTime = Date.now();
    
    // Default options
    const languageCode = options.languageCode || 'en-US';
    const sampleRateHertz = options.sampleRateHertz || 16000;
    const encoding = options.encoding || 'LINEAR16';
    const enableWordTimeOffsets = options.enableWordTimeOffsets !== undefined ? options.enableWordTimeOffsets : true;
    const audioChannelCount = options.audioChannelCount || 1;
    
    // Create request
    const request = {
      audio: {
        content: Buffer.from(options.audioContent).toString('base64'),
      },
      config: {
        languageCode,
        sampleRateHertz,
        encoding,
        enableWordTimeOffsets,
        audioChannelCount,
        model: 'default',
        useEnhanced: true, // Use enhanced model for better accuracy
      },
    };
    
    // Make API call
    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      ?.map(result => result.alternatives?.[0])
      .filter(Boolean);
    
    if (!transcription || transcription.length === 0) {
      throw new Error('No transcription results returned');
    }
    
    // Extract transcript text and confidence
    const transcript = transcription[0]?.transcript || '';
    const confidence = transcription[0]?.confidence || 0;
    
    // Extract word-level timestamps if available
    const wordTimeOffsets = transcription[0]?.words
      ?.map(wordInfo => ({
        word: wordInfo.word || '',
        startTime: wordInfo.startTime?.seconds || 0,
        endTime: wordInfo.endTime?.seconds || 0,
      })) || [];
    
    // Process filler words (um, uh, like, so, etc.)
    const fillerWordPatterns = [
      /\bum\b/gi,
      /\buh\b/gi,
      /\blike\b/gi,
      /\bso\b/gi,
      /\byou know\b/gi,
      /\bi mean\b/gi,
      /\bactually\b/gi,
      /\bbasically\b/gi,
    ];
    
    const fillerWordsFound = [];
    
    for (const pattern of fillerWordPatterns) {
      const matches = [...transcript.matchAll(pattern)];
      
      for (const match of matches) {
        const matchedWord = match[0];
        const matchIndex = match.index;
        
        if (matchIndex !== undefined) {
          // Find closest word timestamp
          const closestWordInfo = wordTimeOffsets.find(word => 
            transcript.indexOf(word.word, matchIndex) === matchIndex
          );
          
          if (closestWordInfo) {
            fillerWordsFound.push({
              word: matchedWord,
              timestamp: closestWordInfo.startTime,
            });
          }
        }
      }
    }
    
    const processingTimeMs = Date.now() - startTime;
    
    return {
      transcript,
      confidence,
      languageCode,
      wordTimeOffsets: wordTimeOffsets.length > 0 ? wordTimeOffsets : undefined,
      fillerWords: fillerWordsFound.length > 0 ? {
        count: fillerWordsFound.length,
        words: fillerWordsFound,
      } : undefined,
      processingTimeMs,
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};

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
 * Calculate clarity score based on speaking rate and filler word percentage
 */
export const calculateClarityScore = (result: TranscriptionResult): number => {
  // Calculate base score (0-100)
  let score = 80; // Start with a default good score
  
  // Adjust for filler words if present
  if (result.fillerWords && result.wordTimeOffsets) {
    const fillerWordPercentage = (result.fillerWords.count / result.wordTimeOffsets.length) * 100;
    
    // Penalize for high filler word percentage
    if (fillerWordPercentage > 15) {
      score -= 30;
    } else if (fillerWordPercentage > 10) {
      score -= 20;
    } else if (fillerWordPercentage > 5) {
      score -= 10;
    }
  }
  
  // Adjust for speaking rate if calculated
  const wordsPerMinute = calculateSpeakingRate(result);
  if (wordsPerMinute) {
    // Optimal range is 140-160 WPM
    if (wordsPerMinute > 200) {
      score -= 20; // Too fast
    } else if (wordsPerMinute < 100) {
      score -= 15; // Too slow
    } else if (wordsPerMinute < 120 || wordsPerMinute > 180) {
      score -= 5; // Slightly outside optimal range
    }
  }
  
  // Adjust for confidence
  if (result.confidence < 0.7) {
    score -= 10; // Low confidence might mean unclear speech
  }
  
  // Ensure score stays in 0-100 range
  return Math.max(0, Math.min(100, score));
};

export default {
  transcribeAudio,
  calculateSpeakingRate,
  calculateClarityScore,
};
