import { storage } from '../../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  synthesizeSpeech, 
  audioContentToDataUrl, 
  SynthesisOptions,
  SynthesisResult,
  VoiceOption,
  availableVoices
} from '../../../services/google-cloud/textToSpeech';

/**
 * Save audio to Firebase Storage
 */
export const saveAudioToStorage = async (
  audioContent: Uint8Array, 
  prefix: string = 'tts_audio'
): Promise<string> => {
  try {
    const timestamp = new Date().getTime();
    const fileName = `${prefix}/speech_${timestamp}.mp3`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, audioContent);
    
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error saving audio:', error);
    throw error;
  }
};

/**
 * Generate speech from text
 */
export const generateSpeech = async (
  text: string,
  options: {
    voiceId?: string,
    speed?: number,
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
  const startTime = Date.now();
  
  try {
    const synthesisOptions: SynthesisOptions = {
      text,
      voiceId: options.voiceId,
      speakingRate: options.speed,
      pitch: options.pitch,
      useSSML: options.useSSML
    };
    
    const result = await synthesizeSpeech(synthesisOptions);
    
    // Create data URL for immediate playback
    const dataUrl = audioContentToDataUrl(result.audioContent, result.contentType);
    
    // Optionally save to Firebase Storage
    let storageUrl = dataUrl;
    if (options.saveToStorage) {
      storageUrl = await saveAudioToStorage(result.audioContent);
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
