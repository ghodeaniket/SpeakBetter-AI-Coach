/**
 * Mobile Speech Adapter
 * React Native implementation of the Speech Service interface
 */

import {
  SpeechService,
  TranscriptionOptions,
  TranscriptionResult,
  SpeechSynthesisOptions,
  VoiceInfo,
  NetworkService,
} from "@speakbetter/core/services";
import { Platform } from "react-native";
import Voice from "@react-native-voice/voice";
import Tts from "react-native-tts";
import RNFS from "react-native-fs";
import { Buffer } from "buffer";
import { WordTiming } from "@speakbetter/core/models/analysis";
import { NativeModules } from "react-native";

// Define types for API responses
interface SpeechWord {
  word: string;
  startTime: string;
  endTime: string;
}

interface SpeechAlternative {
  transcript: string;
  confidence: number;
  words?: SpeechWord[];
}

interface SpeechResponse {
  results?: Array<{
    alternatives: SpeechAlternative[];
  }>;
}

// Import the native AudioSession module if available
const { AudioSessionModule } = NativeModules;

/**
 * Mobile implementation of the Speech Service interface
 */
export class MobileSpeechAdapter implements SpeechService {
  private isListening = false;
  private voices: VoiceInfo[] = [];
  private lastOperation: AbortController | null = null;
  private networkService: NetworkService;

  /**
   * Create a new MobileSpeechAdapter
   */
  constructor(networkService: NetworkService) {
    this.networkService = networkService;
    this.initializeTts();
  }

  /**
   * Initialize TTS engine
   */
  private async initializeTts(): Promise<void> {
    try {
      if (Platform.OS === "android") {
        await Tts.getInitStatus();
      }

      // Set default TTS settings
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);

      // Initialize available voices
      const availableVoices = await Tts.voices();
      this.voices = availableVoices
        .filter((voice) => voice.networkConnectionRequired === false)
        .map((voice) => ({
          id: voice.id,
          name: voice.name,
          languageCode: voice.language,
          gender: this.determineGender(voice.name),
          isNeural: voice.quality === "enhanced",
        }));
    } catch (err) {
      console.error("Failed to initialize TTS", err);
    }
  }

  /**
   * Determine gender from voice name
   */
  private determineGender(voiceName: string): "male" | "female" | "neutral" {
    const lowerName = voiceName.toLowerCase();
    if (
      lowerName.includes("male") ||
      lowerName.includes("guy") ||
      lowerName.includes("man")
    ) {
      return "male";
    } else if (lowerName.includes("female") || lowerName.includes("woman")) {
      return "female";
    }

    // Default to neutral if no gender can be determined
    return "neutral";
  }

  /**
   * Configure audio session (iOS only)
   */
  private async configureAudioSession(): Promise<void> {
    if (Platform.OS === "ios" && AudioSessionModule) {
      try {
        await AudioSessionModule.configureAudioSession();
      } catch (err) {
        console.warn("Failed to configure audio session", err);
      }
    }
  }

  /**
   * Transcribe audio to text
   * Uses Google Cloud Speech API for transcription
   */
  async transcribe(
    options: TranscriptionOptions,
  ): Promise<TranscriptionResult> {
    try {
      // Configure audio session for iOS
      await this.configureAudioSession();

      // Create an abort controller for cancellation
      this.lastOperation = new AbortController();
      const { signal } = this.lastOperation;

      // Check network connection
      if (!this.networkService.isOnline()) {
        throw new Error("No internet connection available for transcription");
      }

      // For file-based transcription, we need to send the file to Google Cloud Speech API
      let fileData: string | ArrayBuffer;

      if (
        options.audioFile instanceof Blob ||
        options.audioFile instanceof File
      ) {
        // Read blob as array buffer
        fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(options.audioFile as Blob);
        });
      } else {
        // Already an ArrayBuffer
        fileData = options.audioFile;
      }

      // Convert to base64
      const base64Data = Buffer.from(fileData as ArrayBuffer).toString(
        "base64",
      );

      // Set up API URL using your environment variables or config
      const apiKey = process.env.GOOGLE_SPEECH_API_KEY || "";
      const apiUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;

      // Set up request parameters
      const requestBody = {
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          languageCode: options.languageCode || "en-US",
          maxAlternatives: options.maxAlternatives || 1,
          profanityFilter: options.profanityFilter || false,
          enableWordTimeOffsets: true,
          enableAutomaticPunctuation: true,
          useEnhanced: options.enhancedModel || false,
          model: "default",
          speechContexts: options.speechContexts
            ? [
                {
                  phrases: options.speechContexts,
                },
              ]
            : undefined,
        },
        audio: {
          content: base64Data,
        },
      };

      // Make API request
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal, // For cancellation
      });

      if (!response.ok) {
        throw new Error(
          `Speech API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as SpeechResponse;

      // Handle empty response
      if (!data.results || data.results.length === 0) {
        return {
          text: "",
          confidence: 0,
          wordTimings: [],
          languageCode: options.languageCode || "en-US",
          durationSeconds: 0,
        };
      }

      // Process response
      const result = data.results[0];
      const alternative = result.alternatives[0];

      // Extract word timings if available
      const wordTimings: WordTiming[] = [];

      if (alternative.words) {
        alternative.words.forEach((word) => {
          const startTime = parseFloat(word.startTime.replace("s", ""));
          const endTime = parseFloat(word.endTime.replace("s", ""));

          wordTimings.push({
            word: word.word,
            startTime,
            endTime,
          });
        });
      }

      // Calculate duration based on the last word timing, or default to 0
      const durationSeconds =
        wordTimings.length > 0
          ? wordTimings[wordTimings.length - 1].endTime
          : 0;

      // Create result object
      const transcriptionResult: TranscriptionResult = {
        text: alternative.transcript,
        confidence: alternative.confidence,
        wordTimings,
        languageCode: options.languageCode || "en-US",
        durationSeconds,
        alternatives: result.alternatives.slice(1).map((alt) => ({
          text: alt.transcript,
          confidence: alt.confidence || 0,
        })),
      };

      return transcriptionResult;
    } catch (err) {
      // Handle cancellation
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Transcription cancelled");
      }

      console.error("Transcription error:", err);
      throw err instanceof Error
        ? err
        : new Error("Failed to transcribe audio");
    } finally {
      this.lastOperation = null;
    }
  }

  /**
   * Synthesize text to speech
   * Uses React Native TTS
   */
  async synthesize(options: SpeechSynthesisOptions): Promise<Blob> {
    try {
      // Configure audio session for iOS
      await this.configureAudioSession();

      // Create destination path for synthesized audio
      const timestamp = new Date().getTime();
      const outputPath = `${RNFS.CachesDirectoryPath}/tts_${timestamp}.mp3`;

      // Set voice if specified
      if (options.voiceId) {
        await Tts.setDefaultVoice(options.voiceId);
      }

      // Set rate and pitch if specified
      if (options.speakingRate !== undefined) {
        await Tts.setDefaultRate(options.speakingRate);
      }

      if (options.pitch !== undefined) {
        await Tts.setDefaultPitch(options.pitch);
      }

      // iOS supports saving to file directly
      if (Platform.OS === "ios") {
        return new Promise<Blob>((resolve, reject) => {
          Tts.addEventListener("tts-finish", async () => {
            try {
              // Check if file exists
              const exists = await RNFS.exists(outputPath);
              if (!exists) {
                reject(new Error("TTS file not created"));
                return;
              }

              // Read file as base64
              const base64Data = await RNFS.readFile(outputPath, "base64");

              // Convert to blob
              const blob = this.base64ToBlob(base64Data, "audio/mp3");
              resolve(blob);

              // Clean up
              Tts.removeAllListeners("tts-finish");
              RNFS.unlink(outputPath).catch(console.error);
            } catch (err) {
              reject(err);
            }
          });

          // Start synthesis
          Tts.speak(options.text, {
            iosVoiceId: options.voiceId,
            rate: options.speakingRate,
            pitch: options.pitch,
            path: outputPath,
          });
        });
      } else {
        // Android doesn't support saving directly, so we'll need to use a workaround
        // This is a placeholder - actual implementation would require a native module
        throw new Error("Direct TTS to file not supported on Android yet");
      }
    } catch (err) {
      console.error("TTS error:", err);
      throw err instanceof Error
        ? err
        : new Error("Failed to synthesize speech");
    }
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<VoiceInfo[]> {
    try {
      // If voices are already loaded, return them
      if (this.voices.length > 0) {
        return [...this.voices];
      }

      // Otherwise, reload voices
      const availableVoices = await Tts.voices();

      this.voices = availableVoices
        .filter((voice) => voice.networkConnectionRequired === false)
        .map((voice) => ({
          id: voice.id,
          name: voice.name,
          languageCode: voice.language,
          gender: this.determineGender(voice.name),
          isNeural: voice.quality === "enhanced",
        }));

      return [...this.voices];
    } catch (err) {
      console.error("Failed to get available voices", err);
      return [];
    }
  }

  /**
   * Get voices for a specific language
   */
  async getVoicesForLanguage(languageCode: string): Promise<VoiceInfo[]> {
    try {
      const allVoices = await this.getAvailableVoices();
      return allVoices.filter((voice) =>
        voice.languageCode.toLowerCase().startsWith(languageCode.toLowerCase()),
      );
    } catch (err) {
      console.error("Failed to get voices for language", err);
      return [];
    }
  }

  /**
   * Get voice by ID
   */
  async getVoiceById(id: string): Promise<VoiceInfo | null> {
    try {
      const allVoices = await this.getAvailableVoices();
      return allVoices.find((voice) => voice.id === id) || null;
    } catch (err) {
      console.error("Failed to get voice by ID", err);
      return null;
    }
  }

  /**
   * Cancel ongoing operations
   */
  cancel(): void {
    // Cancel any ongoing API requests
    if (this.lastOperation) {
      this.lastOperation.abort();
      this.lastOperation = null;
    }

    // Stop any ongoing TTS
    Tts.stop();

    // Stop any ongoing speech recognition
    if (this.isListening) {
      Voice.stop().catch(console.error);
      this.isListening = false;
    }
  }

  /**
   * Check if speech recognition is supported
   */
  isRecognitionSupported(): boolean {
    return true; // Generally supported on iOS and Android via the Google API
  }

  /**
   * Check if speech synthesis is supported
   */
  isSynthesisSupported(): boolean {
    return true; // Generally supported on iOS and Android
  }

  /**
   * Convert base64 to blob
   */
  private base64ToBlob(base64: string, type: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type });
  }
}
