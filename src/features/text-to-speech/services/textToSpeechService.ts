import { storage } from '../../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  synthesizeSpeech, 
  audioContentToDataUrl, 
  availableVoices,
  VoiceOption,
  SynthesisOptions
} from '../../../services/google-cloud/api-key/textToSpeech';
import { GOOGLE_CLOUD_API_KEY } from '../../../services/google-cloud/config';

/**
 * Save audio to Firebase Storage
 */
export const saveAudioToStorage = async (
  audioContent: Uint8Array, 
  prefix: string = 'tts_audio'
): Promise<string> => {
  if (!audioContent || !(audioContent instanceof Uint8Array)) {
    console.error('Invalid audioContent - must be a Uint8Array', typeof audioContent);
    throw new Error('Invalid audio content format');
  }
  
  try {
    // Generate a unique filename
    const timestamp = new Date().getTime();
    const fileName = `${prefix}/speech_${timestamp}.mp3`;
    
    // Log for debugging
    console.log(`Saving audio to Firebase Storage: ${fileName}, content size: ${audioContent.length} bytes`);
    
    // Create storage reference
    const storageRef = ref(storage, fileName);
    
    // Create a Blob from the Uint8Array to ensure proper upload
    const blob = new Blob([audioContent], { type: 'audio/mp3' });
    
    // Upload the blob
    const uploadResult = await uploadBytes(storageRef, blob);
    console.log('Upload successful:', uploadResult.metadata.name);
    
    // Get the download URL
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error saving audio to storage:', error);
    // Return a data URL as fallback so app continues working
    return audioContentToDataUrl(audioContent, 'audio/mp3');
  }
};

/**
 * Generate speech from text
 */
export const generateSpeech = async (
  text: string,
  options: {
    voiceId?: string,
    speakingRate?: number,
    pitch?: number,
    useSSML?: boolean,
    saveToStorage?: boolean
  } = {}
): Promise<{
  audioUrl: string,
  dataUrl: string,
  durationMs: number,
  processingTimeMs: number
}> => {
  if (!GOOGLE_CLOUD_API_KEY) {
    throw new Error('Google Cloud API key is not configured. Please add it to your environment variables.');
  }
  
  const startTime = Date.now();
  
  try {
    const synthesisOptions: SynthesisOptions = {
      text,
      voiceId: options.voiceId,
      speakingRate: options.speakingRate,
      pitch: options.pitch,
      useSSML: options.useSSML
    };
    
    // Call the API key-based implementation
    const result = await synthesizeSpeech(synthesisOptions, GOOGLE_CLOUD_API_KEY);
    
    if (!result || !result.audioContent) {
      console.error('No valid audio content received from synthesis');
      throw new Error('Failed to generate speech: No audio content received');
    }
    
    console.log(`Received audio content of size: ${result.audioContent.length} bytes`);
    
    // Create data URL for immediate playback
    const dataUrl = audioContentToDataUrl(result.audioContent, result.contentType);
    
    // Optionally save to Firebase Storage
    let storageUrl = dataUrl;
    if (options.saveToStorage && result.audioContent) {
      try {
        storageUrl = await saveAudioToStorage(result.audioContent);
      } catch (storageError) {
        console.warn('Failed to save to storage, using data URL as fallback:', storageError);
        // Continue with data URL if storage fails
      }
    }
    
    return {
      audioUrl: storageUrl,
      dataUrl,
      durationMs: result.durationMs || 0,
      processingTimeMs: result.processingTimeMs
    };
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
};

/**
 * Get voice options by gender
 */
export const getVoicesByGender = (gender?: 'MALE' | 'FEMALE' | 'NEUTRAL'): VoiceOption[] => {
  if (!gender) {
    return availableVoices;
  }
  
  return availableVoices.filter(voice => voice.gender === gender);
};

/**
 * Get voice by ID
 */
export const getVoiceById = (voiceId: string): VoiceOption | undefined => {
  return availableVoices.find(voice => voice.id === voiceId);
};

/**
 * Get voice options by type (WaveNet, Neural2, Standard, etc.)
 */
export const getVoicesByType = (type: string): VoiceOption[] => {
  return availableVoices.filter(voice => voice.id.includes(type));
};

/**
 * Predefined feedback templates for coaching
 */
export const feedbackTemplates = [
  {
    id: 'positive',
    label: "Positive Feedback",
    text: "Great job with your presentation! Your pacing was excellent, and you spoke with clarity and confidence. I particularly liked how you emphasized the key points with vocal variety."
  },
  {
    id: 'constructive',
    label: "Constructive Feedback",
    text: "I noticed you used filler words like 'um' and 'like' quite frequently. Try replacing these with brief pauses to sound more confident. Your content was excellent, but slowing down slightly would help your audience absorb the information better."
  },
  {
    id: 'mixed',
    label: "Mixed Feedback",
    text: "Your introduction was engaging and well-paced. I liked your vocal energy throughout the presentation. One area for improvement is to reduce the repetition of certain phrases. Also, try making more eye contact with your audience to build connection."
  },
  {
    id: 'technical',
    label: "Technical Speech",
    text: "The technical aspects of your product demonstration were clearly explained. Your use of specific terminology was appropriate for the audience. Consider adding more real-world examples to illustrate the practical applications of these technical features."
  }
];

export default {
  saveAudioToStorage,
  generateSpeech,
  getVoicesByGender,
  getVoiceById,
  getVoicesByType,
  feedbackTemplates
};
