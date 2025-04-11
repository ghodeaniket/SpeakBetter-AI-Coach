/**
 * Audio Processing Utilities
 * Provides utility functions for audio processing and analysis
 */

import { WordTiming, FillerWordInstance } from '../../models/analysis';

/**
 * Common filler words in English
 */
export const ENGLISH_FILLER_WORDS = [
  'um', 'uh', 'ah', 'er', 'like', 'you know', 'so', 'actually',
  'basically', 'literally', 'I mean', 'right', 'well', 'kind of',
  'sort of', 'anyway', 'okay', 'hmm', 'mmm'
];

/**
 * Calculate words per minute from transcript and duration
 */
export const calculateWordsPerMinute = (
  wordCount: number,
  durationSeconds: number
): number => {
  if (!durationSeconds) return 0;
  
  return (wordCount / durationSeconds) * 60;
};

/**
 * Detect filler words in transcription
 */
export const detectFillerWords = (
  transcription: string,
  wordTimings: WordTiming[],
  customFillerWords: string[] = []
): FillerWordInstance[] => {
  // Combine default and custom filler words
  const fillerWords = [...ENGLISH_FILLER_WORDS, ...customFillerWords];
  
  // Convert transcription to lowercase for case-insensitive matching
  const transcriptionLower = transcription.toLowerCase();
  
  // Detected filler word instances
  const fillerInstances: FillerWordInstance[] = [];
  
  // Check each word timing
  for (const wordTiming of wordTimings) {
    const word = wordTiming.word.toLowerCase();
    
    // Check if this word is a filler word
    if (fillerWords.includes(word)) {
      fillerInstances.push({
        word: wordTiming.word,
        timestamp: wordTiming.startTime
      });
      continue;
    }
    
    // Check multi-word filler phrases
    for (const fillerWord of fillerWords) {
      if (fillerWord.includes(' ')) {
        // For multi-word fillers, check if this word starts a filler phrase
        const fillerWords = fillerWord.split(' ');
        if (fillerWords[0] === word) {
          // Get the relevant part of the transcription
          const startIndex = transcriptionLower.indexOf(word, Math.max(0, transcriptionLower.indexOf(word) - 20));
          if (startIndex >= 0) {
            const transcriptPart = transcriptionLower.substring(startIndex, startIndex + fillerWord.length + 5);
            if (transcriptPart.includes(fillerWord)) {
              fillerInstances.push({
                word: fillerWord,
                timestamp: wordTiming.startTime
              });
              break;
            }
          }
        }
      }
    }
  }
  
  return fillerInstances;
};

/**
 * Calculate speech metrics
 */
export const calculateSpeechMetrics = (
  transcription: string,
  wordTimings: WordTiming[],
  durationSeconds: number,
  customFillerWords: string[] = []
) => {
  // Total words
  const totalWords = wordTimings.length;
  
  // Words per minute
  const wordsPerMinute = calculateWordsPerMinute(totalWords, durationSeconds);
  
  // Detect filler words
  const fillerInstances = detectFillerWords(transcription, wordTimings, customFillerWords);
  
  // Count each filler word
  const fillerWordCounts: Record<string, number> = {};
  for (const instance of fillerInstances) {
    fillerWordCounts[instance.word] = (fillerWordCounts[instance.word] || 0) + 1;
  }
  
  // Total filler words
  const totalFillerWords = fillerInstances.length;
  
  // Filler word percentage
  const fillerWordPercentage = totalWords > 0
    ? (totalFillerWords / totalWords) * 100
    : 0;
  
  // Detect pauses
  const pauses: Array<{
    startTime: number;
    endTime: number;
    duration: number;
  }> = [];
  
  for (let i = 0; i < wordTimings.length - 1; i++) {
    const currentWord = wordTimings[i];
    const nextWord = wordTimings[i + 1];
    
    // Calculate gap between words
    const gap = nextWord.startTime - currentWord.endTime;
    
    // If gap is significant (> 0.5s), consider it a pause
    if (gap > 0.5) {
      pauses.push({
        startTime: currentWord.endTime,
        endTime: nextWord.startTime,
        duration: gap
      });
    }
  }
  
  // Calculate pause metrics
  const totalPauses = pauses.length;
  const totalPauseDuration = pauses.reduce((sum, pause) => sum + pause.duration, 0);
  const avgPauseDuration = totalPauses > 0 ? totalPauseDuration / totalPauses : 0;
  const pausesPerMinute = durationSeconds > 0
    ? (totalPauses / durationSeconds) * 60
    : 0;
  
  // Calculate clarity score (0-100)
  // This is a simple heuristic, you can refine this based on your needs
  // Lower filler word percentage and optimal pauses increase clarity
  const fillerWordScore = Math.max(0, 100 - fillerWordPercentage * 5);
  const pauseScore = Math.max(0, 100 - Math.abs(pausesPerMinute - 4) * 5);
  const paceScore = Math.max(0, 100 - Math.abs(wordsPerMinute - 150) * 0.5);
  
  const clarityScore = Math.round(
    (fillerWordScore * 0.4) + (pauseScore * 0.3) + (paceScore * 0.3)
  );
  
  return {
    wordsPerMinute,
    totalWords,
    durationSeconds,
    fillerWordCounts,
    totalFillerWords,
    fillerWordPercentage,
    avgPauseDuration,
    pausesPerMinute,
    clarityScore,
    pauses
  };
};

/**
 * Classify speaking pace
 */
export const classifySpeakingPace = (wordsPerMinute: number): 'slow' | 'moderate' | 'fast' => {
  if (wordsPerMinute < 120) {
    return 'slow';
  } else if (wordsPerMinute > 160) {
    return 'fast';
  } else {
    return 'moderate';
  }
};

/**
 * Generate feedback based on speech metrics
 */
export const generateFeedback = (metrics: {
  wordsPerMinute: number;
  totalWords: number;
  durationSeconds: number;
  fillerWordCounts: Record<string, number>;
  totalFillerWords: number;
  fillerWordPercentage: number;
  avgPauseDuration?: number;
  pausesPerMinute?: number;
  clarityScore: number;
}) => {
  // Positive feedback
  let positiveFeedback = '';
  
  // Improvement areas
  let improvementAreas = '';
  
  // Suggestions
  let suggestions = '';
  
  // Speaking pace feedback
  const pace = classifySpeakingPace(metrics.wordsPerMinute);
  if (pace === 'moderate') {
    positiveFeedback += 'Your speaking pace is well-balanced at ' + 
      Math.round(metrics.wordsPerMinute) + ' words per minute. ';
  } else if (pace === 'slow') {
    improvementAreas += 'Your speaking pace is a bit slow at ' + 
      Math.round(metrics.wordsPerMinute) + ' words per minute. ';
    suggestions += 'Try to increase your speaking rate slightly to improve engagement. ';
  } else {
    improvementAreas += 'Your speaking pace is a bit fast at ' + 
      Math.round(metrics.wordsPerMinute) + ' words per minute. ';
    suggestions += 'Consider slowing down slightly to improve clarity and allow listeners to better process your message. ';
  }
  
  // Filler word feedback
  if (metrics.fillerWordPercentage <= 2) {
    positiveFeedback += 'You used very few filler words, which makes your speech sound confident and polished. ';
  } else if (metrics.fillerWordPercentage <= 5) {
    positiveFeedback += 'You used a reasonable amount of filler words. ';
  } else {
    improvementAreas += 'You used filler words at a rate of ' + 
      metrics.fillerWordPercentage.toFixed(1) + '% of your total words. ';
    
    // Find most common filler word
    let mostCommonFiller = '';
    let maxCount = 0;
    
    for (const [word, count] of Object.entries(metrics.fillerWordCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonFiller = word;
      }
    }
    
    if (mostCommonFiller) {
      improvementAreas += 'Your most frequently used filler word was "' + mostCommonFiller + '". ';
      suggestions += 'Try to replace filler words with brief pauses to sound more confident. ';
    }
  }
  
  // Pause feedback
  if (metrics.pausesPerMinute !== undefined) {
    if (metrics.pausesPerMinute < 2) {
      improvementAreas += 'You had very few pauses in your speech. ';
      suggestions += 'Consider adding strategic pauses to emphasize key points and give listeners time to process information. ';
    } else if (metrics.pausesPerMinute > 8) {
      improvementAreas += 'Your speech contained many pauses. ';
      suggestions += 'Try to use pauses more strategically and keep your thoughts more connected. ';
    } else {
      positiveFeedback += 'You used pauses effectively throughout your speech. ';
    }
  }
  
  // Clarity score feedback
  if (metrics.clarityScore >= 85) {
    positiveFeedback += 'Your overall clarity score is excellent at ' + metrics.clarityScore + '/100. ';
  } else if (metrics.clarityScore >= 70) {
    positiveFeedback += 'Your overall clarity score is good at ' + metrics.clarityScore + '/100. ';
  } else {
    improvementAreas += 'Your overall clarity score is ' + metrics.clarityScore + '/100, which has room for improvement. ';
    suggestions += 'Focus on reducing filler words and using a more consistent pace to improve clarity. ';
  }
  
  // Ensure we have some positive feedback
  if (!positiveFeedback) {
    positiveFeedback = 'Thank you for recording your speech. ';
  }
  
  // Encouragement
  const encouragement = 'With practice, you can continue to refine your speaking skills and deliver even more impactful speeches.';
  
  return {
    positive: positiveFeedback,
    improvement: improvementAreas,
    suggestion: suggestions,
    encouragement
  };
};

/**
 * Convert audio format
 * This is a utility function that should be implemented platform-specifically
 */
export const convertAudioFormat = async (
  audioBlob: Blob,
  targetFormat: string,
  audioContext: AudioContext
): Promise<Blob> => {
  // Convert blob to array buffer
  const arrayBuffer = await audioBlob.arrayBuffer();
  
  // Decode audio data
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Create offline context for rendering
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  // Create buffer source
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  
  // Start rendering
  source.start(0);
  const renderedBuffer = await offlineContext.startRendering();
  
  // Convert to WAV
  return audioBufferToWav(renderedBuffer);
};

/**
 * Convert AudioBuffer to WAV blob
 */
export const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  let result;
  if (numChannels === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }
  
  const dataLength = result.length * (bitDepth / 8);
  const buffer2 = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer2);
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  
  // FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  
  // Data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Write PCM data
  floatTo16BitPCM(view, 44, result);
  
  return new Blob([buffer2], { type: 'audio/wav' });
};

/**
 * Write string to DataView
 */
export const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

/**
 * Interleave two Float32Arrays
 */
export const interleave = (inputL: Float32Array, inputR: Float32Array): Float32Array => {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  
  let index = 0;
  for (let i = 0; i < inputL.length; i++) {
    result[index++] = inputL[i];
    result[index++] = inputR[i];
  }
  
  return result;
};

/**
 * Convert Float32Array to 16-bit PCM
 */
export const floatTo16BitPCM = (
  output: DataView,
  offset: number,
  input: Float32Array
): void => {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
};
