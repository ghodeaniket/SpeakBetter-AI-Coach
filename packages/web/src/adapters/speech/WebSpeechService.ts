/**
 * Web Speech Service
 * Implements speech-to-text and text-to-speech functionality for web platform
 */

import {
  SpeechService,
  TranscriptionOptions,
  TranscriptionResult,
  SpeechSynthesisOptions,
  VoiceInfo,
  NetworkService
} from '@speakbetter/core/services';

import {
  createAppError,
  ErrorCategory,
  ErrorCodes
} from '@speakbetter/core/models/error';

import { WordTiming } from '@speakbetter/core/models/analysis';

/**
 * Google Cloud Speech API endpoint for speech-to-text
 */
const GOOGLE_SPEECH_API_ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize';

/**
 * Google Cloud Text-to-Speech API endpoint
 */
const GOOGLE_TTS_API_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/**
 * Default Google API key from environment
 */
const GOOGLE_API_KEY = process.env.VITE_GOOGLE_API_KEY || '';

/**
 * Web implementation of the Speech Service
 * Uses browser's SpeechRecognition API for speech-to-text
 * and SpeechSynthesis API for text-to-speech when available,
 * with fallback to Google Cloud APIs
 */
export class WebSpeechService implements SpeechService {
  /**
   * Recognition instance
   */
  private recognition: SpeechRecognition | null = null;
  
  /**
   * Synthesis voices
   */
  private voices: VoiceInfo[] = [];
  
  /**
   * Active synthesis utterance
   */
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  
  /**
   * Network service for API calls
   */
  private networkService: NetworkService;
  
  /**
   * Constructor
   */
  constructor(networkService: NetworkService) {
    this.networkService = networkService;
    
    // Initialize Web Speech API if available
    this.initWebSpeechAPI();
  }
  
  /**
   * Initialize Web Speech API
   */
  private initWebSpeechAPI(): void {
    // Check for SpeechRecognition support
    if (this.isRecognitionSupported()) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Configure recognition
      if (this.recognition) {
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
    }
    
    // Load voices for speech synthesis
    this.loadVoices();
    
    // Add event listener for voiceschanged event
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }
  
  /**
   * Load available voices
   */
  private loadVoices(): void {
    if (window.speechSynthesis) {
      const nativeVoices = window.speechSynthesis.getVoices();
      
      this.voices = nativeVoices.map(voice => ({
        id: voice.voiceURI,
        name: voice.name,
        languageCode: voice.lang,
        gender: this.determineGender(voice.name),
        isNeural: voice.name.toLowerCase().includes('neural')
      }));
    }
  }
  
  /**
   * Determine gender from voice name
   * This is a simple heuristic based on common voice naming conventions
   */
  private determineGender(voiceName: string): 'male' | 'female' | 'neutral' {
    const nameLower = voiceName.toLowerCase();
    
    if (nameLower.includes('male') || nameLower.includes('guy') || nameLower.includes('man')) {
      return 'male';
    } else if (nameLower.includes('female') || nameLower.includes('girl') || nameLower.includes('woman')) {
      return 'female';
    } else {
      return 'neutral';
    }
  }
  
  /**
   * Transcribe audio to text
   */
  async transcribe(options: TranscriptionOptions): Promise<TranscriptionResult> {
    // First try to use Google Cloud Speech API
    try {
      return await this.transcribeWithGoogleAPI(options);
    } catch (error) {
      console.error('Error using Google Speech API, falling back to Web Speech API:', error);
      
      // If Web Speech API is supported, try that as fallback
      if (this.isRecognitionSupported()) {
        return this.transcribeWithWebSpeechAPI(options);
      }
      
      // If we get here, both methods failed
      throw createAppError(
        ErrorCodes.SPEECH_RECOGNITION_ERROR,
        'Speech recognition failed',
        {
          category: ErrorCategory.SPEECH,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Transcribe audio using Google Cloud Speech API
   */
  private async transcribeWithGoogleAPI(options: TranscriptionOptions): Promise<TranscriptionResult> {
    if (!GOOGLE_API_KEY) {
      throw createAppError(
        ErrorCodes.SPEECH_RECOGNITION_ERROR,
        'Google API key is not configured',
        { category: ErrorCategory.SPEECH }
      );
    }
    
    try {
      // Convert audio to base64
      const audioBase64 = await this.blobToBase64(options.audioFile);
      
      // Build request body
      const requestBody = {
        config: {
          languageCode: options.languageCode || 'en-US',
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          profanityFilter: options.profanityFilter || false,
          maxAlternatives: options.maxAlternatives || 1,
          useEnhanced: options.enhancedModel || false,
          model: options.enhancedModel ? 'video' : 'default'
        },
        audio: {
          content: audioBase64
        }
      };
      
      // Make API request
      const response = await this.networkService.post(
        `${GOOGLE_SPEECH_API_ENDPOINT}?key=${GOOGLE_API_KEY}`,
        requestBody
      );
      
      // Process response
      const results = response.results || [];
      if (results.length === 0) {
        return {
          text: '',
          confidence: 0,
          wordTimings: [],
          languageCode: options.languageCode || 'en-US',
          durationSeconds: 0
        };
      }
      
      // Get transcript from first result
      const transcript = results[0].alternatives[0].transcript || '';
      const confidence = results[0].alternatives[0].confidence || 0;
      
      // Get alternatives if available
      const alternatives = results[0].alternatives.slice(1).map(alt => ({
        text: alt.transcript || '',
        confidence: alt.confidence || 0
      }));
      
      // Process word timings from all results
      const wordTimings: WordTiming[] = [];
      results.forEach(result => {
        const alternative = result.alternatives[0];
        if (alternative.words) {
          alternative.words.forEach(word => {
            wordTimings.push({
              word: word.word,
              startTime: this.parseGoogleTime(word.startTime),
              endTime: this.parseGoogleTime(word.endTime),
              confidence: word.confidence || 0
            });
          });
        }
      });
      
      // Calculate duration based on last word timing
      const durationSeconds = wordTimings.length > 0 
        ? wordTimings[wordTimings.length - 1].endTime 
        : 0;
      
      return {
        text: transcript,
        confidence,
        alternatives,
        wordTimings,
        languageCode: options.languageCode || 'en-US',
        durationSeconds
      };
    } catch (error) {
      console.error('Error transcribing with Google API:', error);
      throw createAppError(
        ErrorCodes.SPEECH_RECOGNITION_ERROR,
        'Failed to transcribe audio with Google Speech API',
        {
          category: ErrorCategory.SPEECH,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Parse Google time format (e.g. "1.500s") to seconds
   */
  private parseGoogleTime(timeStr: string): number {
    if (!timeStr) return 0;
    return parseFloat(timeStr.replace('s', ''));
  }
  
  /**
   * Convert Blob to base64 string
   */
  private async blobToBase64(blob: Blob | File | ArrayBuffer): Promise<string> {
    if (blob instanceof ArrayBuffer) {
      return this.arrayBufferToBase64(blob);
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix (e.g., "data:audio/wav;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  }
  
  /**
   * Transcribe audio using Web Speech API
   */
  private transcribeWithWebSpeechAPI(options: TranscriptionOptions): Promise<TranscriptionResult> {
    if (!this.recognition) {
      throw createAppError(
        ErrorCodes.SPEECH_RECOGNITION_NOT_SUPPORTED,
        'Web Speech API is not supported in this browser',
        { category: ErrorCategory.SPEECH }
      );
    }
    
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        return reject(new Error('Recognition not initialized'));
      }
      
      // Configure recognition
      this.recognition.lang = options.languageCode || 'en-US';
      
      // Final transcript and results
      let finalTranscript = '';
      const wordTimings: WordTiming[] = [];
      let startTime = Date.now() / 1000;
      
      // Handle result event
      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        const currentTime = Date.now() / 1000;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            
            // Create approximate word timing data
            // (Web Speech API doesn't provide accurate word timings)
            const words = transcript.trim().split(/\s+/);
            const timePerWord = 0.3; // Assume average word takes 300ms
            
            for (let j = 0; j < words.length; j++) {
              const wordStart = startTime + (j * timePerWord);
              const wordEnd = wordStart + timePerWord;
              
              wordTimings.push({
                word: words[j],
                startTime: wordStart,
                endTime: wordEnd,
                confidence
              });
            }
            
            startTime = currentTime;
          } else {
            interimTranscript += transcript;
          }
        }
      };
      
      // Handle end event
      this.recognition.onend = () => {
        // Calculate duration based on word timings
        const durationSeconds = wordTimings.length > 0 
          ? wordTimings[wordTimings.length - 1].endTime 
          : 0;
        
        // Return results
        resolve({
          text: finalTranscript,
          confidence: 0.8, // Web Speech API often doesn't provide reliable confidence
          wordTimings,
          languageCode: options.languageCode || 'en-US',
          durationSeconds
        });
      };
      
      // Handle error event
      this.recognition.onerror = (event) => {
        reject(createAppError(
          ErrorCodes.SPEECH_RECOGNITION_ERROR,
          `Speech recognition error: ${event.error}`,
          { category: ErrorCategory.SPEECH }
        ));
      };
      
      // Start recognition
      try {
        // For Web Speech API, we typically work with live input
        // For file-based input, we would need to play the audio
        // while recognizing, which is not ideal
        // Instead, we'll display a message about the limitation
        console.warn('Web Speech API cannot directly process audio files');
        
        this.recognition.start();
      } catch (error) {
        reject(createAppError(
          ErrorCodes.SPEECH_RECOGNITION_ERROR,
          'Failed to start speech recognition',
          {
            category: ErrorCategory.SPEECH,
            originalError: error as Error
          }
        ));
      }
    });
  }
  
  /**
   * Synthesize text to speech
   */
  async synthesize(options: SpeechSynthesisOptions): Promise<Blob> {
    // Try Web Speech API first if it's supported
    if (this.isSynthesisSupported()) {
      try {
        return await this.synthesizeWithWebSpeechAPI(options);
      } catch (error) {
        console.error('Error using Web Speech API, falling back to Google TTS:', error);
      }
    }
    
    // Fall back to Google Cloud Text-to-Speech API
    return this.synthesizeWithGoogleAPI(options);
  }
  
  /**
   * Synthesize text using Web Speech API
   */
  private synthesizeWithWebSpeechAPI(options: SpeechSynthesisOptions): Promise<Blob> {
    if (!window.speechSynthesis) {
      throw createAppError(
        ErrorCodes.SPEECH_SYNTHESIS_NOT_SUPPORTED,
        'Web Speech API is not supported in this browser',
        { category: ErrorCategory.SPEECH }
      );
    }
    
    return new Promise((resolve, reject) => {
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(options.text);
      
      // Set voice if specified
      if (options.voiceId) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.voiceURI === options.voiceId);
        if (voice) {
          utterance.voice = voice;
        }
      } else if (options.languageCode) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang === options.languageCode);
        if (voice) {
          utterance.voice = voice;
        }
      }
      
      // Set language
      if (options.languageCode) {
        utterance.lang = options.languageCode;
      }
      
      // Set rate
      if (options.speakingRate) {
        utterance.rate = options.speakingRate;
      }
      
      // Set pitch
      if (options.pitch) {
        // Convert from Google's range (-20 to 20) to Web Speech API range (0 to 2)
        utterance.pitch = 1 + (options.pitch / 20);
      }
      
      // Set volume
      if (options.volumeGainDb) {
        // Convert from Google's range (-96 to 16) to Web Speech API range (0 to 1)
        utterance.volume = Math.min(1, Math.max(0, (options.volumeGainDb + 96) / 112));
      }
      
      // Store the active utterance
      this.activeUtterance = utterance;
      
      // Unfortunately, Web Speech API doesn't provide a way to get the audio data
      // So we need to use MediaRecorder to capture the audio while it's playing
      // This is a workaround and may not work in all browsers
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(destination.stream);
      const audioChunks: Blob[] = [];
      
      // Connect a media recorder to capture the speech
      const source = audioContext.createGain();
      source.connect(destination);
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        resolve(audioBlob);
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Handle utterance end
      utterance.onend = () => {
        mediaRecorder.stop();
        this.activeUtterance = null;
      };
      
      // Handle utterance error
      utterance.onerror = (event) => {
        mediaRecorder.stop();
        this.activeUtterance = null;
        
        reject(createAppError(
          ErrorCodes.SPEECH_SYNTHESIS_ERROR,
          'Error synthesizing speech',
          { category: ErrorCategory.SPEECH }
        ));
      };
      
      // Start speaking
      window.speechSynthesis.speak(utterance);
    });
  }
  
  /**
   * Synthesize text using Google Cloud Text-to-Speech API
   */
  private async synthesizeWithGoogleAPI(options: SpeechSynthesisOptions): Promise<Blob> {
    if (!GOOGLE_API_KEY) {
      throw createAppError(
        ErrorCodes.SPEECH_SYNTHESIS_ERROR,
        'Google API key is not configured',
        { category: ErrorCategory.SPEECH }
      );
    }
    
    try {
      // Build request body
      const requestBody = {
        input: {
          text: options.text
        },
        voice: {
          languageCode: options.languageCode || 'en-US',
          name: options.voiceId || 'en-US-Wavenet-D',
          ssmlGender: this.getGoogleGender(options.voiceId)
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: options.speakingRate || 1.0,
          pitch: options.pitch || 0,
          volumeGainDb: options.volumeGainDb || 0
        }
      };
      
      // Make API request
      const response = await this.networkService.post(
        `${GOOGLE_TTS_API_ENDPOINT}?key=${GOOGLE_API_KEY}`,
        requestBody
      );
      
      // Process response
      if (!response.audioContent) {
        throw new Error('No audio content in response');
      }
      
      // Convert base64 to binary data
      const binaryString = window.atob(response.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create blob from binary data
      return new Blob([bytes], { type: 'audio/mp3' });
    } catch (error) {
      console.error('Error synthesizing with Google API:', error);
      throw createAppError(
        ErrorCodes.SPEECH_SYNTHESIS_ERROR,
        'Failed to synthesize speech with Google Text-to-Speech API',
        {
          category: ErrorCategory.SPEECH,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Get Google gender format from voice ID
   */
  private getGoogleGender(voiceId?: string): 'MALE' | 'FEMALE' | 'NEUTRAL' {
    if (!voiceId) return 'NEUTRAL';
    
    const voice = this.voices.find(v => v.id === voiceId);
    if (voice) {
      switch (voice.gender) {
        case 'male': return 'MALE';
        case 'female': return 'FEMALE';
        default: return 'NEUTRAL';
      }
    }
    
    // Default to neutral if voice not found
    return 'NEUTRAL';
  }
  
  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<VoiceInfo[]> {
    // If we already have voices loaded, return them
    if (this.voices.length > 0) {
      return this.voices;
    }
    
    // Try to load voices
    this.loadVoices();
    
    // If Web Speech API provided voices, return them
    if (this.voices.length > 0) {
      return this.voices;
    }
    
    // Otherwise, provide a default set of Google voices
    // This is a simplified list; in a real app, you'd fetch from the API
    return [
      {
        id: 'en-US-Wavenet-A',
        name: 'English US Female (Wavenet A)',
        languageCode: 'en-US',
        gender: 'female',
        isNeural: true
      },
      {
        id: 'en-US-Wavenet-B',
        name: 'English US Male (Wavenet B)',
        languageCode: 'en-US',
        gender: 'male',
        isNeural: true
      },
      {
        id: 'en-US-Wavenet-C',
        name: 'English US Female (Wavenet C)',
        languageCode: 'en-US',
        gender: 'female',
        isNeural: true
      },
      {
        id: 'en-US-Wavenet-D',
        name: 'English US Male (Wavenet D)',
        languageCode: 'en-US',
        gender: 'male',
        isNeural: true
      },
      {
        id: 'en-US-Wavenet-E',
        name: 'English US Female (Wavenet E)',
        languageCode: 'en-US',
        gender: 'female',
        isNeural: true
      },
      {
        id: 'en-US-Wavenet-F',
        name: 'English US Female (Wavenet F)',
        languageCode: 'en-US',
        gender: 'female',
        isNeural: true
      }
    ];
  }
  
  /**
   * Get voices for a specific language
   */
  async getVoicesForLanguage(languageCode: string): Promise<VoiceInfo[]> {
    const voices = await this.getAvailableVoices();
    return voices.filter(voice => voice.languageCode.startsWith(languageCode));
  }
  
  /**
   * Get voice by ID
   */
  async getVoiceById(id: string): Promise<VoiceInfo | null> {
    const voices = await this.getAvailableVoices();
    return voices.find(voice => voice.id === id) || null;
  }
  
  /**
   * Cancel ongoing operations
   */
  cancel(): void {
    // Cancel speech recognition
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.error('Error aborting speech recognition:', error);
      }
    }
    
    // Cancel speech synthesis
    if (window.speechSynthesis && this.activeUtterance) {
      try {
        window.speechSynthesis.cancel();
        this.activeUtterance = null;
      } catch (error) {
        console.error('Error canceling speech synthesis:', error);
      }
    }
  }
  
  /**
   * Check if speech recognition is supported
   */
  isRecognitionSupported(): boolean {
    return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  }
  
  /**
   * Check if speech synthesis is supported
   */
  isSynthesisSupported(): boolean {
    return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  }
}
