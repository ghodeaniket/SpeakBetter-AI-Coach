/**
 * Mobile Speech Adapter Tests
 */

import { MobileSpeechAdapter } from "../MobileSpeechAdapter";
import { NetworkService } from "@speakbetter/core/services";
import Voice from "@react-native-voice/voice";
import Tts from "react-native-tts";
import { NativeModules } from "react-native";

// Mock dependencies
jest.mock("@react-native-voice/voice");
jest.mock("react-native-tts");
jest.mock("react-native-fs");
jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: jest.fn().mockImplementation((obj) => obj.ios),
  },
  NativeModules: {
    AudioSessionModule: {
      configureAudioSession: jest.fn().mockResolvedValue(true),
    },
  },
}));

// Mock NetworkService
const mockNetworkService: jest.Mocked<NetworkService> = {
  isOnline: jest.fn().mockReturnValue(true),
  onNetworkStateChanged: jest.fn().mockReturnValue(() => {}),
  getNetworkStatus: jest
    .fn()
    .mockReturnValue({ isOnline: true, type: "wifi", isSlowConnection: false }),
  isSlowConnection: jest.fn().mockReturnValue(false),
  isApiReachable: jest.fn().mockResolvedValue(true),
  waitForConnection: jest.fn().mockResolvedValue(undefined),
  retry: jest.fn().mockImplementation((fn) => fn()),
};

// Mock fetch function for API calls
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({
    results: [
      {
        alternatives: [
          {
            transcript: "test transcription",
            confidence: 0.9,
            words: [
              { word: "test", startTime: "0s", endTime: "0.5s" },
              { word: "transcription", startTime: "0.6s", endTime: "1.2s" },
            ],
          },
        ],
      },
    ],
  }),
});

// Mock Buffer for base64 operations
global.Buffer = {
  from: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue("base64-encoded-content"),
  }),
} as unknown as typeof Buffer;

// Mock atob for base64 decoding
global.atob = jest.fn().mockImplementation((str) => str);

describe("MobileSpeechAdapter", () => {
  let adapter: MobileSpeechAdapter;
  let mockVoices: Array<Record<string, string | boolean>>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup TTS voices mock
    mockVoices = [
      {
        id: "com.apple.voice.compact.en-US.Samantha",
        name: "Samantha",
        language: "en-US",
        quality: "enhanced",
        networkConnectionRequired: false,
      },
      {
        id: "com.apple.voice.compact.en-US.Alex",
        name: "Alex",
        language: "en-US",
        quality: "standard",
        networkConnectionRequired: false,
      },
    ];

    (Tts.voices as jest.Mock).mockResolvedValue(mockVoices);

    adapter = new MobileSpeechAdapter(mockNetworkService);
  });

  it("should initialize TTS on construction", async () => {
    // Wait for the constructor to finish async initialization
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(Tts.setDefaultRate).toHaveBeenCalledWith(0.5);
    expect(Tts.setDefaultPitch).toHaveBeenCalledWith(1.0);
    expect(Tts.voices).toHaveBeenCalled();
  });

  describe("transcribe", () => {
    it("should configure audio session on iOS", async () => {
      const audioBlob = new Blob(["test audio"], { type: "audio/wav" });

      await adapter.transcribe({
        audioFile: audioBlob,
        languageCode: "en-US",
      });

      expect(
        NativeModules.AudioSessionModule.configureAudioSession,
      ).toHaveBeenCalled();
    });

    it("should make an API call to Google Speech API", async () => {
      const audioBlob = new Blob(["test audio"], { type: "audio/wav" });

      await adapter.transcribe({
        audioFile: audioBlob,
        languageCode: "en-US",
      });

      expect(fetch).toHaveBeenCalled();
      const [url, options] = (fetch as jest.Mock).mock.calls[0];

      expect(url).toContain("speech.googleapis.com");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toHaveProperty("audio.content");
      expect(JSON.parse(options.body)).toHaveProperty(
        "config.languageCode",
        "en-US",
      );
    });

    it("should parse the API response correctly", async () => {
      const audioBlob = new Blob(["test audio"], { type: "audio/wav" });

      const result = await adapter.transcribe({
        audioFile: audioBlob,
        languageCode: "en-US",
      });

      expect(result).toHaveProperty("text", "test transcription");
      expect(result).toHaveProperty("confidence", 0.9);
      expect(result.wordTimings).toHaveLength(2);
      expect(result.wordTimings[0]).toHaveProperty("word", "test");
      expect(result.wordTimings[0]).toHaveProperty("startTime", 0);
      expect(result.wordTimings[0]).toHaveProperty("endTime", 0.5);
    });

    it("should handle network errors", async () => {
      mockNetworkService.isOnline.mockReturnValueOnce(false);

      const audioBlob = new Blob(["test audio"], { type: "audio/wav" });

      await expect(
        adapter.transcribe({
          audioFile: audioBlob,
          languageCode: "en-US",
        }),
      ).rejects.toThrow("No internet connection");
    });
  });

  describe("getAvailableVoices", () => {
    it("should return available voices", async () => {
      const voices = await adapter.getAvailableVoices();

      expect(voices).toHaveLength(2);
      expect(voices[0]).toHaveProperty(
        "id",
        "com.apple.voice.compact.en-US.Samantha",
      );
      expect(voices[0]).toHaveProperty("name", "Samantha");
      expect(voices[0]).toHaveProperty("languageCode", "en-US");
      expect(voices[0]).toHaveProperty("isNeural", true);
    });

    it("should cache voices after first call", async () => {
      await adapter.getAvailableVoices();
      await adapter.getAvailableVoices();

      // Tts.voices should only be called once during initialization
      expect(Tts.voices).toHaveBeenCalledTimes(1);
    });
  });

  describe("getVoicesForLanguage", () => {
    it("should filter voices by language code", async () => {
      // Add a voice with a different language
      mockVoices.push({
        id: "com.apple.voice.compact.fr-FR.Thomas",
        name: "Thomas",
        language: "fr-FR",
        quality: "standard",
        networkConnectionRequired: false,
      });

      (Tts.voices as jest.Mock).mockResolvedValue(mockVoices);

      // Recreate adapter with new mock data
      adapter = new MobileSpeechAdapter(mockNetworkService);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const voices = await adapter.getVoicesForLanguage("en");

      expect(voices).toHaveLength(2);
      expect(voices[0].languageCode).toBe("en-US");
      expect(voices[1].languageCode).toBe("en-US");
    });
  });

  describe("getVoiceById", () => {
    it("should return a voice by ID", async () => {
      const voice = await adapter.getVoiceById(
        "com.apple.voice.compact.en-US.Alex",
      );

      expect(voice).not.toBeNull();
      expect(voice?.name).toBe("Alex");
    });

    it("should return null for non-existent voice ID", async () => {
      const voice = await adapter.getVoiceById("non-existent-id");

      expect(voice).toBeNull();
    });
  });

  describe("cancel", () => {
    it("should stop TTS", () => {
      adapter.cancel();

      expect(Tts.stop).toHaveBeenCalled();
    });

    it("should stop Voice recognition if active", () => {
      // Set private property
      (adapter as unknown as { isListening: boolean }).isListening = true;

      adapter.cancel();

      expect(Voice.stop).toHaveBeenCalled();
      expect((adapter as unknown as { isListening: boolean }).isListening).toBe(
        false,
      );
    });
  });

  describe("feature detection", () => {
    it("should report recognition as supported", () => {
      expect(adapter.isRecognitionSupported()).toBe(true);
    });

    it("should report synthesis as supported", () => {
      expect(adapter.isSynthesisSupported()).toBe(true);
    });
  });
});
