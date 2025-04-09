import { storage } from '../../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  transcribeAudio, 
  calculateSpeakingRate, 
  calculateClarityScore,
  TranscriptionResult
} from '../../../services/google-cloud/api-key/speechToText';
import { GOOGLE_CLOUD_API_KEY } from '../../../services/google-cloud/config';
import { db } from '../../../firebase';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Define interface for speech processing options
export interface SpeechProcessingOptions {
  uploadToStorage?: boolean;
  languageCode?: string;
  userId?: string;
  storeResults?: boolean;
  useCachedResults?: boolean;
  createSession?: boolean;
}

// Define interface for the speech processing result
export interface SpeechProcessingResult {
  transcriptionResult: TranscriptionResult;
  audioUrl?: string;
  processingTimeMs: number;
  wordsPerMinute?: number;
  clarityScore: number;
  sessionId?: string;
}

// Cache object for faster repeated analysis
const analysisCache = new Map<string, {
  result: SpeechProcessingResult;
  timestamp: number;
}>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Upload audio to Firebase Storage
 */
export const uploadAudio = async (
  blob: Blob, 
  prefix: string = 'speech_samples', 
  userId?: string
): Promise<string> => {
  try {
    // Create a unique file name with timestamp and optional user ID
    const timestamp = new Date().getTime();
    const userSegment = userId ? `user_${userId}/` : '';
    const fileName = `${prefix}/${userSegment}recording_${timestamp}.webm`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, blob);
    
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw new Error(`Failed to upload audio: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Convert audio blob to format required by Speech-to-Text API
 */
export const prepareAudioContent = async (blob: Blob): Promise<Uint8Array> => {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('Error preparing audio:', error);
    throw new Error(`Failed to prepare audio content: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generate a cache key for the audio blob
 */
const generateCacheKey = (blob: Blob, languageCode?: string): string => {
  return `audio_${blob.size}_${blob.type}_${languageCode || 'en-US'}`;
};

/**
 * Check if cached result is still valid
 */
const isCacheValid = (cacheEntry: { timestamp: number }): boolean => {
  return Date.now() - cacheEntry.timestamp < CACHE_EXPIRATION_MS;
};

/**
 * Store analysis result in Firestore
 */
const storeAnalysisResult = async (
  result: SpeechProcessingResult,
  userId?: string
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required to store analysis result');
    }
    
    // Create a new session document
    const sessionsCollection = collection(db, 'sessions');
    const sessionDoc = doc(sessionsCollection);
    const sessionId = sessionDoc.id;
    
    await setDoc(sessionDoc, {
      userId,
      timestamp: serverTimestamp(),
      audioUrl: result.audioUrl || null,
      transcript: result.transcriptionResult.transcript,
      wordsPerMinute: result.wordsPerMinute || null,
      clarityScore: result.clarityScore,
      fillerWordCount: result.transcriptionResult.fillerWords?.count || 0,
      processingTimeMs: result.processingTimeMs,
      duration: calculateDuration(result.transcriptionResult),
      metrics: {
        confidence: result.transcriptionResult.confidence,
        fillerWordPercentage: calculateFillerWordPercentage(result.transcriptionResult),
        pauseCount: result.transcriptionResult.pauseAnalysis?.totalPauses || 0,
        longPauseCount: result.transcriptionResult.pauseAnalysis?.longPauses || 0
      }
    });
    
    // Store the detailed analysis in a subcollection for larger data
    const analysisDoc = doc(db, `sessions/${sessionId}/analysis/details`);
    await setDoc(analysisDoc, {
      transcriptionResult: result.transcriptionResult,
      timestamp: serverTimestamp()
    });
    
    return sessionId;
  } catch (error) {
    console.error('Error storing analysis result:', error);
    // Don't throw here - this is a non-critical operation
    return '';
  }
};

/**
 * Process audio with Speech-to-Text 
 */
export const processAudio = async (
  audioBlob: Blob, 
  options: SpeechProcessingOptions = {}
): Promise<SpeechProcessingResult> => {
  const {
    uploadToStorage = true,
    languageCode = 'en-US',
    userId,
    storeResults = false,
    useCachedResults = true,
    createSession = false
  } = options;
  
  if (!GOOGLE_CLOUD_API_KEY) {
    throw new Error('Google Cloud API key is not configured. Please add it to your environment variables.');
  }
  
  const startTime = Date.now();
  
  try {
    // Check cache first if enabled
    const cacheKey = generateCacheKey(audioBlob, languageCode);
    const cachedEntry = useCachedResults ? analysisCache.get(cacheKey) : undefined;
    
    if (cachedEntry && isCacheValid(cachedEntry)) {
      console.log('Using cached analysis result');
      return cachedEntry.result;
    }
    
    // Optionally upload to Firebase Storage
    let audioUrl: string | undefined;
    if (uploadToStorage) {
      audioUrl = await uploadAudio(audioBlob, 'speech_samples', userId);
    }
    
    // Prepare audio content
    const audioContent = await prepareAudioContent(audioBlob);
    
    // Transcribe using API key-based implementation
    // Let the API auto-detect encoding from the WAV header
    const transcriptionResult = await transcribeAudio(
      audioContent, 
      GOOGLE_CLOUD_API_KEY, 
      {
        languageCode,
        // Removed explicit encoding setting to let API auto-detect
        enableWordTimeOffsets: true,
        enableWordConfidence: true,
        enableAutomaticPunctuation: true
      }
    );
    
    // Calculate additional metrics
    const wordsPerMinute = calculateSpeakingRate(transcriptionResult);
    const clarityScore = calculateClarityScore(transcriptionResult);
    
    const processingTimeMs = Date.now() - startTime;
    
    const result: SpeechProcessingResult = {
      transcriptionResult,
      audioUrl,
      processingTimeMs,
      wordsPerMinute: wordsPerMinute || undefined,
      clarityScore
    };
    
    // Store in cache
    analysisCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    // Create a session if requested and user is authenticated
    if (createSession && storeResults && userId) {
      const sessionId = await storeAnalysisResult(result, userId);
      result.sessionId = sessionId;
    }
    
    return result;
  } catch (error) {
    console.error('Error processing audio:', error);
    
    // Enhanced error handling with specific error types
    if (error instanceof TypeError) {
      throw new Error(`Invalid input: ${error.message}`);
    } else if (error instanceof Error && error.message.includes('API error')) {
      throw new Error(`Speech recognition service error: ${error.message}`);
    } else if (error instanceof Error && error.message.includes('No transcription results returned')) {
      throw new Error('No speech detected. Please ensure your audio contains clear speech.');
    } else {
      throw new Error(`Failed to process audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

/**
 * Calculate accuracy between transcript and reference text
 */
export const calculateAccuracy = (transcript: string, referenceText: string): number => {
  if (!transcript || !referenceText) {
    return 0;
  }
  
  const normalizedTranscript = transcript.trim().toLowerCase();
  const normalizedReference = referenceText.trim().toLowerCase();
  
  // Simple word-based similarity calculation
  const referenceWords = new Set(normalizedReference.split(/\s+/));
  const transcriptWords = normalizedTranscript.split(/\s+/);
  
  const commonWords = transcriptWords.filter(word => referenceWords.has(word)).length;
  const maxPossible = Math.max(referenceWords.size, transcriptWords.length);
  
  return maxPossible > 0 ? (commonWords / maxPossible) * 100 : 0;
};

/**
 * Calculate filler word percentage
 */
export const getFillerWordPercentage = (transcriptionResult: TranscriptionResult): number => {
  if (
    !transcriptionResult || 
    !transcriptionResult.fillerWords || 
    !transcriptionResult.wordTimeOffsets ||
    !transcriptionResult.wordTimeOffsets.length
  ) {
    return 0;
  }
  
  const totalWords = transcriptionResult.wordTimeOffsets.length;
  const fillerCount = transcriptionResult.fillerWords.count;
  
  return (fillerCount / totalWords) * 100;
};

/**
 * Calculate the duration of the speech from word timings
 */
export const calculateDuration = (transcriptionResult: TranscriptionResult): number => {
  if (
    !transcriptionResult || 
    !transcriptionResult.wordTimeOffsets ||
    !transcriptionResult.wordTimeOffsets.length
  ) {
    return 0;
  }
  
  const wordTimings = transcriptionResult.wordTimeOffsets;
  return wordTimings[wordTimings.length - 1].endTime - wordTimings[0].startTime;
};

/**
 * Get the most frequent filler words
 */
export const getFrequentFillerWords = (
  transcriptionResult: TranscriptionResult, 
  limit: number = 3
): Array<{word: string; count: number}> => {
  if (
    !transcriptionResult || 
    !transcriptionResult.fillerWords ||
    !transcriptionResult.fillerWords.words.length
  ) {
    return [];
  }
  
  // Count occurrences of each filler word
  const wordCounts = transcriptionResult.fillerWords.words.reduce<Record<string, number>>(
    (counts, fillerWord) => {
      const word = fillerWord.word.toLowerCase();
      counts[word] = (counts[word] || 0) + 1;
      return counts;
    }, 
    {}
  );
  
  // Convert to array and sort by count descending
  return Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Analyze speech pace variation
 */
export const analyzePaceVariation = (transcriptionResult: TranscriptionResult): {
  variation: 'consistent' | 'somewhat-varied' | 'highly-varied';
  rangeWPM: [number, number] | null;
} => {
  if (
    !transcriptionResult ||
    !transcriptionResult.sentenceAnalysis ||
    !transcriptionResult.sentenceAnalysis.sentences.length
  ) {
    return { variation: 'consistent', rangeWPM: null };
  }
  
  // Get speaking rates for all sentences
  const rates = transcriptionResult.sentenceAnalysis.sentences
    .map(s => s.wordsPerMinute)
    .filter(Boolean) as number[];
  
  if (rates.length < 2) {
    return { variation: 'consistent', rangeWPM: null };
  }
  
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  
  // Calculate coefficient of variation (standard deviation / mean)
  const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  const squaredDiffs = rates.map(rate => Math.pow(rate - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / rates.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  
  let variation: 'consistent' | 'somewhat-varied' | 'highly-varied';
  
  if (cv < 0.15) {
    variation = 'consistent';
  } else if (cv < 0.30) {
    variation = 'somewhat-varied';
  } else {
    variation = 'highly-varied';
  }
  
  return { 
    variation,
    rangeWPM: [Math.round(min), Math.round(max)]
  };
};

/**
 * Clear the analysis cache
 */
export const clearAnalysisCache = (): void => {
  analysisCache.clear();
};

export default {
  uploadAudio,
  prepareAudioContent,
  processAudio,
  calculateAccuracy,
  getFillerWordPercentage,
  getFrequentFillerWords,
  analyzePaceVariation,
  clearAnalysisCache
};
