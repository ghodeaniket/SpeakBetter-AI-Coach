/**
 * Speech-to-Text service using API key authentication
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
      encoding: 'WEBM_OPUS', // WebRTC typically uses WEBM_OPUS format
      // Omit sampleRateHertz to let API auto-detect from header
      languageCode: 'en-US',
      model: 'default',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
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
      throw new Error(`Speech-to-Text API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // Check if we got valid results
    if (!responseData.results || responseData.results.length === 0) {
      throw new Error('No transcription results returned');
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
      endTime: parseFloat(wordInfo.endTime.replace('s', ''))
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
    
    const fillerWordsFound: Array<{ word: string; timestamp: number }> = [];
    
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
      languageCode: recognitionParams.languageCode,
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
