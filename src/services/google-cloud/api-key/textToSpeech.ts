/**
 * Text-to-Speech service using API key authentication
 */

// Voice configuration options
export interface VoiceOption {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  language: string;
  description?: string;
}

// Available voices
export const availableVoices: VoiceOption[] = [
  { id: 'en-US-Wavenet-A', name: 'Wavenet A', gender: 'MALE', language: 'en-US', description: 'Male voice with a natural tone' },
  { id: 'en-US-Wavenet-B', name: 'Wavenet B', gender: 'MALE', language: 'en-US', description: 'Male voice with a deeper tone' },
  { id: 'en-US-Wavenet-C', name: 'Wavenet C', gender: 'FEMALE', language: 'en-US', description: 'Female voice with a natural tone' },
  { id: 'en-US-Wavenet-D', name: 'Wavenet D', gender: 'MALE', language: 'en-US', description: 'Male voice with a soft tone' },
  { id: 'en-US-Wavenet-E', name: 'Wavenet E', gender: 'FEMALE', language: 'en-US', description: 'Female voice with a higher pitch' },
  { id: 'en-US-Wavenet-F', name: 'Wavenet F', gender: 'FEMALE', language: 'en-US', description: 'Female voice with a warm tone' },
  { id: 'en-US-Neural2-A', name: 'Neural2 A', gender: 'MALE', language: 'en-US', description: 'Premium male voice with enhanced naturalness' },
  { id: 'en-US-Neural2-C', name: 'Neural2 C', gender: 'FEMALE', language: 'en-US', description: 'Premium female voice with enhanced naturalness' },
  { id: 'en-US-Neural2-D', name: 'Neural2 D', gender: 'MALE', language: 'en-US', description: 'Premium male voice with a softer tone' },
  { id: 'en-US-Neural2-F', name: 'Neural2 F', gender: 'FEMALE', language: 'en-US', description: 'Premium female voice with a warm tone' },
  { id: 'en-US-Neural2-I', name: 'Neural2 I', gender: 'MALE', language: 'en-US', description: 'Premium male voice with a deeper tone' },
  { id: 'en-US-Studio-O', name: 'Studio O', gender: 'FEMALE', language: 'en-US', description: 'Studio quality female voice with coaching style' }
];

// Default voice for coaching
export const defaultCoachVoice = 'en-US-Wavenet-F';

// Interface for synthesis options
export interface SynthesisOptions {
  text: string;
  voiceId?: string;
  languageCode?: string;
  speakingRate?: number;
  pitch?: number;
  volumeGainDb?: number;
  useSSML?: boolean;
}

// Interface for synthesis result
export interface SynthesisResult {
  audioContent: Uint8Array;
  audioUrl?: string;
  contentType: string;
  durationMs?: number;
  processingTimeMs: number;
}

/**
 * Synthesize speech from text using Google Cloud Text-to-Speech with API key
 */
export const synthesizeSpeech = async (
  options: SynthesisOptions,
  apiKey: string
): Promise<SynthesisResult> => {
  try {
    const startTime = Date.now();
    
    // Default options
    const voiceId = options.voiceId || defaultCoachVoice;
    const languageCode = options.languageCode || 'en-US';
    const speakingRate = options.speakingRate !== undefined ? options.speakingRate : 1.0;
    const pitch = options.pitch !== undefined ? options.pitch : 0.0;
    const volumeGainDb = options.volumeGainDb !== undefined ? options.volumeGainDb : 0.0;
    const useSSML = options.useSSML || false;
    
    // Validate voice id
    const voiceExists = availableVoices.some(voice => voice.id === voiceId);
    if (!voiceExists) {
      throw new Error(`Voice ID ${voiceId} not found in available voices`);
    }
    
    // Get voice gender from available voices
    const selectedVoice = availableVoices.find(voice => voice.id === voiceId);
    const gender = selectedVoice?.gender || 'NEUTRAL';
    
    // Create request body
    const requestBody = {
      input: useSSML 
        ? { ssml: options.text } 
        : { text: options.text },
      voice: {
        languageCode,
        name: voiceId,
        ssmlGender: gender,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate,
        pitch,
        volumeGainDb,
      },
    };
    
    // Make API call
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Text-to-Speech API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // Decode base64 audio content
    const audioContent = base64ToUint8Array(responseData.audioContent);
    
    const processingTimeMs = Date.now() - startTime;
    
    return {
      audioContent,
      contentType: 'audio/mp3',
      processingTimeMs,
      // Estimate duration: average speaking is ~150 words per minute
      // This is a rough estimate - not as accurate as getting duration from the audio file
      durationMs: Math.round((options.text.split(/\s+/).length / 150) * 60 * 1000),
    };
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw error;
  }
};

/**
 * Convert audio content to a data URL for browser playback
 */
export const audioContentToDataUrl = (audioContent: Uint8Array, contentType: string = 'audio/mp3'): string => {
  const base64Audio = uint8ArrayToBase64(audioContent);
  return `data:${contentType};base64,${base64Audio}`;
};

/**
 * Helper function to convert Uint8Array to Base64
 */
const uint8ArrayToBase64 = (array: Uint8Array): string => {
  let binary = '';
  const len = array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
};

/**
 * Helper function to convert Base64 to Uint8Array
 */
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export default {
  synthesizeSpeech,
  audioContentToDataUrl,
  availableVoices,
  defaultCoachVoice,
};
