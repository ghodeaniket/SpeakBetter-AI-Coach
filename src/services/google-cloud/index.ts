// Export all Google Cloud services
import speech, { 
  transcribeAudio, 
  calculateSpeakingRate, 
  calculateClarityScore,
  TranscriptionOptions,
  TranscriptionResult
} from './speech';

import textToSpeech, { 
  synthesizeSpeech, 
  audioContentToDataUrl,
  availableVoices,
  defaultCoachVoice,
  VoiceOption,
  SynthesisOptions,
  SynthesisResult
} from './textToSpeech';

export {
  // Speech to text
  transcribeAudio,
  calculateSpeakingRate,
  calculateClarityScore,
  TranscriptionOptions,
  TranscriptionResult,
  
  // Text to speech
  synthesizeSpeech,
  audioContentToDataUrl,
  availableVoices,
  defaultCoachVoice,
  VoiceOption,
  SynthesisOptions,
  SynthesisResult
};

export default {
  speech,
  textToSpeech
};
