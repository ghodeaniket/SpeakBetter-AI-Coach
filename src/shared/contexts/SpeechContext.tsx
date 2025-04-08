import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { TranscriptionResult } from '../../services/google-cloud/speech';

// Define the state shape
interface SpeechState {
  // Audio recording
  audioBlob: Blob | null;
  audioUrl: string | null;
  isRecording: boolean;
  
  // Speech-to-text
  transcriptionResult: TranscriptionResult | null;
  isTranscribing: boolean;
  transcriptionError: Error | null;
  
  // Text-to-speech
  generatedAudioUrl: string | null;
  isGeneratingSpeech: boolean;
  speechGenerationError: Error | null;
  
  // Reference text for comparison
  referenceText: string;
  
  // Progress tracking
  sessions: Array<{
    id: string;
    date: Date;
    audioUrl: string;
    transcriptionResult: TranscriptionResult;
    accuracy?: number;
  }>;
  
  // Debug information
  logs: string[];
}

// Define action types
type SpeechAction =
  | { type: 'SET_AUDIO_BLOB'; payload: Blob | null }
  | { type: 'SET_AUDIO_URL'; payload: string | null }
  | { type: 'SET_IS_RECORDING'; payload: boolean }
  | { type: 'SET_TRANSCRIPTION_RESULT'; payload: TranscriptionResult | null }
  | { type: 'SET_IS_TRANSCRIBING'; payload: boolean }
  | { type: 'SET_TRANSCRIPTION_ERROR'; payload: Error | null }
  | { type: 'SET_GENERATED_AUDIO_URL'; payload: string | null }
  | { type: 'SET_IS_GENERATING_SPEECH'; payload: boolean }
  | { type: 'SET_SPEECH_GENERATION_ERROR'; payload: Error | null }
  | { type: 'SET_REFERENCE_TEXT'; payload: string }
  | { type: 'ADD_SESSION'; payload: { id: string; date: Date; audioUrl: string; transcriptionResult: TranscriptionResult; accuracy?: number } }
  | { type: 'ADD_LOG'; payload: string }
  | { type: 'CLEAR_LOGS' }
  | { type: 'RESET_STATE' };

// Define initial state
const initialState: SpeechState = {
  audioBlob: null,
  audioUrl: null,
  isRecording: false,
  
  transcriptionResult: null,
  isTranscribing: false,
  transcriptionError: null,
  
  generatedAudioUrl: null,
  isGeneratingSpeech: false,
  speechGenerationError: null,
  
  referenceText: '',
  
  sessions: [],
  
  logs: []
};

// Create the context
const SpeechContext = createContext<{
  state: SpeechState;
  dispatch: React.Dispatch<SpeechAction>;
}>({
  state: initialState,
  dispatch: () => null
});

// Reducer function
const speechReducer = (state: SpeechState, action: SpeechAction): SpeechState => {
  switch (action.type) {
    case 'SET_AUDIO_BLOB':
      return { ...state, audioBlob: action.payload };
    
    case 'SET_AUDIO_URL':
      return { ...state, audioUrl: action.payload };
    
    case 'SET_IS_RECORDING':
      return { ...state, isRecording: action.payload };
    
    case 'SET_TRANSCRIPTION_RESULT':
      return { ...state, transcriptionResult: action.payload };
    
    case 'SET_IS_TRANSCRIBING':
      return { ...state, isTranscribing: action.payload };
    
    case 'SET_TRANSCRIPTION_ERROR':
      return { ...state, transcriptionError: action.payload };
    
    case 'SET_GENERATED_AUDIO_URL':
      return { ...state, generatedAudioUrl: action.payload };
    
    case 'SET_IS_GENERATING_SPEECH':
      return { ...state, isGeneratingSpeech: action.payload };
    
    case 'SET_SPEECH_GENERATION_ERROR':
      return { ...state, speechGenerationError: action.payload };
    
    case 'SET_REFERENCE_TEXT':
      return { ...state, referenceText: action.payload };
    
    case 'ADD_SESSION':
      return { 
        ...state, 
        sessions: [...state.sessions, action.payload] 
      };
    
    case 'ADD_LOG':
      return { 
        ...state, 
        logs: [...state.logs, `${new Date().toLocaleTimeString()} - ${action.payload}`] 
      };
    
    case 'CLEAR_LOGS':
      return { ...state, logs: [] };
    
    case 'RESET_STATE':
      return {
        ...initialState,
        // Preserve certain state values if needed
        sessions: state.sessions,
        logs: state.logs
      };
    
    default:
      return state;
  }
};

// Provider component
export const SpeechProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(speechReducer, initialState);
  
  return (
    <SpeechContext.Provider value={{ state, dispatch }}>
      {children}
    </SpeechContext.Provider>
  );
};

// Custom hook for using the speech context
export const useSpeech = () => {
  const context = useContext(SpeechContext);
  
  if (!context) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  
  return context;
};

export default SpeechContext;
