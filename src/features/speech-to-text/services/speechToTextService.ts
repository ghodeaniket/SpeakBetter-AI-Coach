import { storage } from '../../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  transcribeAudio, 
  calculateSpeakingRate, 
  calculateClarityScore,
  TranscriptionResult
} from '../../../services/google-cloud/api-key/speechToText';
import { GOOGLE_CLOUD_API_KEY } from '../../../services/google-cloud/config';

/**
 * Upload audio to Firebase Storage
 */
export const uploadAudio = async (blob: Blob, prefix: string = 'speech_samples'): Promise<string> => {
  try {
    // Create a unique file name with timestamp
    const timestamp = new Date().getTime();
    const fileName = `${prefix}/recording_${timestamp}.webm`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, blob);
    
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
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
    throw error;
  }
};

/**
 * Process audio with Speech-to-Text 
 */
export const processAudio = async (
  audioBlob: Blob, 
  options: { 
    uploadToStorage?: boolean,
    languageCode?: string
  } = {}
): Promise<{
  transcriptionResult: TranscriptionResult,
  audioUrl?: string,
  processingTimeMs: number,
  wordsPerMinute?: number,
  clarityScore: number
}> => {
  if (!GOOGLE_CLOUD_API_KEY) {
    throw new Error('Google Cloud API key is not configured. Please add it to your environment variables.');
  }
  
  const startTime = Date.now();
  
  try {
    // Optionally upload to Firebase Storage
    let audioUrl: string | undefined;
    if (options.uploadToStorage) {
      audioUrl = await uploadAudio(audioBlob);
    }
    
    // Prepare audio content
    const audioContent = await prepareAudioContent(audioBlob);
    
    // Transcribe using API key-based implementation
    const transcriptionResult = await transcribeAudio(
      audioContent, 
      GOOGLE_CLOUD_API_KEY, 
      {
        languageCode: options.languageCode || 'en-US',
        enableWordTimeOffsets: true,
      }
    );
    
    // Calculate additional metrics
    const wordsPerMinute = calculateSpeakingRate(transcriptionResult);
    const clarityScore = calculateClarityScore(transcriptionResult);
    
    const processingTimeMs = Date.now() - startTime;
    
    return {
      transcriptionResult,
      audioUrl,
      processingTimeMs,
      wordsPerMinute,
      clarityScore
    };
  } catch (error) {
    console.error('Error processing audio:', error);
    throw error;
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
  
  // Simple similarity score based on common words
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

export default {
  uploadAudio,
  prepareAudioContent,
  processAudio,
  calculateAccuracy,
  getFillerWordPercentage
};
