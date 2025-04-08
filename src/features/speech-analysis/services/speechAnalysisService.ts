import { transcribeAudio, calculateSpeakingRate, calculateClarityScore } from '../../../services/google-cloud/speech';

// Define analysis result interface
export interface SpeechAnalysisResult {
  // Basic transcription info
  transcript: string;
  confidence: number;
  durationSeconds: number;
  
  // Word-level data
  wordCount: number;
  wordTimeOffsets?: Array<{
    word: string;
    startTime: number;
    endTime: number;
  }>;
  
  // Filler words analysis
  fillerWords?: {
    count: number;
    percentage: number;
    words: Array<{
      word: string;
      timestamp: number;
    }>;
  };
  
  // Speaking metrics
  wordsPerMinute: number | null;
  clarityScore: number;
  
  // Processing info
  processingTimeMs: number;
  analysisTimestamp: number;
}

// Filler word patterns for detection
export const fillerWordPatterns = [
  /\bum\b/gi,
  /\buh\b/gi,
  /\blike\b/gi,
  /\bso\b/gi,
  /\byou know\b/gi,
  /\bi mean\b/gi,
  /\bactually\b/gi,
  /\bbasically\b/gi,
  /\bkind of\b/gi,
  /\bsort of\b/gi,
  /\bjust\b/gi,
  /\btotally\b/gi,
  /\bliterally\b/gi,
  /\banyway\b/gi,
  /\buhm\b/gi,
  /\bhmm\b/gi,
  /\bah\b/gi,
  /\ber\b/gi,
];

/**
 * Analyze speech recording
 * @param audioBlob Audio recording to analyze
 * @returns Complete speech analysis result
 */
export const analyzeSpeech = async (audioBlob: Blob): Promise<SpeechAnalysisResult> => {
  try {
    const startTime = Date.now();
    
    // Convert Blob to ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContent = new Uint8Array(arrayBuffer);
    
    // Transcribe audio using Google Cloud Speech-to-Text
    const transcriptionResult = await transcribeAudio({
      audioContent,
      enableWordTimeOffsets: true,
    });
    
    // Extract basic information
    const { transcript, confidence, wordTimeOffsets, fillerWords, processingTimeMs } = transcriptionResult;
    
    // Calculate duration from word timestamps if available
    let durationSeconds = 0;
    if (wordTimeOffsets && wordTimeOffsets.length > 0) {
      const lastWord = wordTimeOffsets[wordTimeOffsets.length - 1];
      durationSeconds = lastWord.endTime;
    } else {
      // Estimate duration from audio length
      durationSeconds = Math.round(audioBlob.size / (16000 * 2)); // Rough estimate for 16kHz 16-bit mono
    }
    
    // Count words
    const wordCount = transcript.split(/\s+/).filter(word => word.length > 0).length;
    
    // Calculate speaking rate (words per minute)
    const wordsPerMinute = calculateSpeakingRate(transcriptionResult);
    
    // Calculate clarity score
    const clarityScore = calculateClarityScore(transcriptionResult);
    
    // Process filler words
    let fillerWordsAnalysis = undefined;
    if (fillerWords && fillerWords.count > 0) {
      fillerWordsAnalysis = {
        count: fillerWords.count,
        percentage: (fillerWords.count / wordCount) * 100,
        words: fillerWords.words,
      };
    }
    
    const analysisTimeMs = Date.now() - startTime;
    
    // Compile complete analysis result
    const result: SpeechAnalysisResult = {
      transcript,
      confidence,
      durationSeconds,
      wordCount,
      wordTimeOffsets,
      fillerWords: fillerWordsAnalysis,
      wordsPerMinute,
      clarityScore,
      processingTimeMs: processingTimeMs + analysisTimeMs,
      analysisTimestamp: Date.now(),
    };
    
    return result;
  } catch (error) {
    console.error('Error analyzing speech:', error);
    throw error;
  }
};

/**
 * Detect sentence boundaries in transcript
 * @param transcript Transcript text
 * @param wordTimeOffsets Word timing data
 * @returns Array of sentences with start and end times
 */
export const detectSentences = (
  transcript: string,
  wordTimeOffsets?: Array<{ word: string; startTime: number; endTime: number }>
): Array<{ text: string; startTime: number; endTime: number }> => {
  if (!wordTimeOffsets || wordTimeOffsets.length === 0) {
    return [{ text: transcript, startTime: 0, endTime: 0 }];
  }
  
  // Split transcript into sentences
  const sentenceRegex = /[.!?]+\s+/g;
  const sentences = transcript.split(sentenceRegex).filter(s => s.trim().length > 0);
  
  const result = [];
  let currentPosition = 0;
  
  for (const sentence of sentences) {
    // Find the starting word index
    const sentenceStartIndex = transcript.indexOf(sentence, currentPosition);
    if (sentenceStartIndex === -1) continue;
    
    // Update current position for next search
    currentPosition = sentenceStartIndex + sentence.length;
    
    // Find the word that contains this position
    let startWordIndex = -1;
    let currentCharPosition = 0;
    
    for (let i = 0; i < wordTimeOffsets.length; i++) {
      const word = wordTimeOffsets[i].word;
      if (sentenceStartIndex >= currentCharPosition && 
          sentenceStartIndex < currentCharPosition + word.length + 1) {
        startWordIndex = i;
        break;
      }
      currentCharPosition += word.length + 1; // +1 for space
    }
    
    // If we couldn't find a starting word, skip this sentence
    if (startWordIndex === -1) continue;
    
    // Find the ending word index
    const sentenceEndIndex = sentenceStartIndex + sentence.length;
    let endWordIndex = startWordIndex;
    currentCharPosition = 0;
    
    for (let i = 0; i < wordTimeOffsets.length; i++) {
      const word = wordTimeOffsets[i].word;
      if (sentenceEndIndex >= currentCharPosition && 
          sentenceEndIndex <= currentCharPosition + word.length + 1) {
        endWordIndex = i;
        break;
      }
      currentCharPosition += word.length + 1; // +1 for space
    }
    
    // Create the sentence entry
    result.push({
      text: sentence.trim(),
      startTime: wordTimeOffsets[startWordIndex].startTime,
      endTime: wordTimeOffsets[endWordIndex].endTime,
    });
  }
  
  return result;
};

/**
 * Calculate speaking rate for a segment of speech
 * @param words Array of words with timing information
 * @returns Speaking rate in words per minute
 */
export const calculateSegmentRate = (
  words: Array<{ word: string; startTime: number; endTime: number }>
): number | null => {
  if (words.length === 0) return null;
  
  const startTime = words[0].startTime;
  const endTime = words[words.length - 1].endTime;
  const durationMinutes = (endTime - startTime) / 60;
  
  if (durationMinutes <= 0) return null;
  
  return Math.round(words.length / durationMinutes);
};

/**
 * Find words spoken too quickly
 * @param wordTimeOffsets Word timing data
 * @param threshold Threshold in words per minute (default: 180)
 * @returns Array of words spoken too quickly
 */
export const findRapidWords = (
  wordTimeOffsets?: Array<{ word: string; startTime: number; endTime: number }>,
  threshold = 180
): Array<{ word: string; startTime: number; endTime: number; wpm: number }> => {
  if (!wordTimeOffsets || wordTimeOffsets.length < 3) {
    return [];
  }
  
  const rapidWords = [];
  
  // Use a sliding window of 3 words to detect rapid speech
  for (let i = 1; i < wordTimeOffsets.length - 1; i++) {
    const prevWord = wordTimeOffsets[i - 1];
    const currentWord = wordTimeOffsets[i];
    const nextWord = wordTimeOffsets[i + 1];
    
    // Calculate the speaking rate for this 3-word segment
    const words = [prevWord, currentWord, nextWord];
    const startTime = words[0].startTime;
    const endTime = words[2].endTime;
    const durationMinutes = (endTime - startTime) / 60;
    
    if (durationMinutes > 0) {
      const wpm = Math.round(words.length / durationMinutes);
      
      // If speaking rate exceeds threshold, mark the current word
      if (wpm > threshold) {
        rapidWords.push({
          ...currentWord,
          wpm
        });
      }
    }
  }
  
  return rapidWords;
};

/**
 * Find long pauses in speech
 * @param wordTimeOffsets Word timing data
 * @param thresholdSeconds Threshold in seconds (default: 1.5)
 * @returns Array of pauses with surrounding words
 */
export const findPauses = (
  wordTimeOffsets?: Array<{ word: string; startTime: number; endTime: number }>,
  thresholdSeconds = 1.5
): Array<{ 
  pauseStart: number; 
  pauseEnd: number; 
  pauseDuration: number;
  wordBefore: string;
  wordAfter: string;
}> => {
  if (!wordTimeOffsets || wordTimeOffsets.length < 2) {
    return [];
  }
  
  const pauses = [];
  
  // Check gaps between consecutive words
  for (let i = 0; i < wordTimeOffsets.length - 1; i++) {
    const currentWord = wordTimeOffsets[i];
    const nextWord = wordTimeOffsets[i + 1];
    
    const pauseStart = currentWord.endTime;
    const pauseEnd = nextWord.startTime;
    const pauseDuration = pauseEnd - pauseStart;
    
    // If pause exceeds threshold, record it
    if (pauseDuration > thresholdSeconds) {
      pauses.push({
        pauseStart,
        pauseEnd,
        pauseDuration,
        wordBefore: currentWord.word,
        wordAfter: nextWord.word,
      });
    }
  }
  
  return pauses;
};

export default {
  analyzeSpeech,
  detectSentences,
  calculateSegmentRate,
  findRapidWords,
  findPauses,
};
