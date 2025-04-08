import speechToText, {
  transcribeAudio,
  calculateSpeakingRate, 
  calculateClarityScore,
  RecognitionParams,
  TranscriptionResult
} from './speechToText';

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
  RecognitionParams,
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
  speechToText,
  textToSpeech
};
