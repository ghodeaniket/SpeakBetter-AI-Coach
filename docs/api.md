# SpeakBetter AI Coach: API Documentation

## Overview

This document provides detailed information about the key APIs and service interfaces used in the SpeakBetter AI Coach application. It covers core service interfaces, their implementations, and usage examples.

## Core Services

### Authentication Service

The authentication service handles user authentication and identity management.

#### Interface

```typescript
// packages/core/src/services/auth.ts
import { User } from "../models/user";

export interface AuthService {
  getCurrentUser(): Promise<User | null>;
  signInWithGoogle(): Promise<User>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}
```

#### Usage

```typescript
import { AuthService } from "@speakbetter/core";
import { createFirebaseAuthService } from "@speakbetter/api";

// Create service instance
const authService = createFirebaseAuthService({
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  // other firebase config
});

// Sign in with Google
const user = await authService.signInWithGoogle();

// Get current user
const currentUser = await authService.getCurrentUser();

// Listen for auth state changes
const unsubscribe = authService.onAuthStateChanged((user) => {
  if (user) {
    console.log("User is signed in:", user);
  } else {
    console.log("User is signed out");
  }
});

// Sign out
await authService.signOut();

// Cleanup listener
unsubscribe();
```

### Speech-to-Text Service

The speech-to-text service handles speech transcription and analysis.

#### Interface

```typescript
// packages/core/src/services/speechToText.ts
import { SpeechAnalysis } from "../models/analysis";

export interface TranscriptionOptions {
  audioBlob: Blob;
  languageCode?: string;
  enableWordTimestamps?: boolean;
}

export interface SpeechToTextService {
  transcribeAudio(options: TranscriptionOptions): Promise<SpeechAnalysis>;
  analyzeTranscription(transcription: string): SpeechAnalysis;
  getFillerWordStatistics(transcription: string): Record<string, number>;
  calculateSpeakingRate(transcription: string, durationSeconds: number): number;
  calculateClarityScore(analysis: Partial<SpeechAnalysis>): number;
}
```

#### Usage

```typescript
import { SpeechToTextService, TranscriptionOptions } from "@speakbetter/core";
import { createGoogleSpeechService } from "@speakbetter/api";

// Create service instance
const speechService = createGoogleSpeechService({
  apiKey: "your-google-cloud-api-key",
});

// Transcribe audio
const audioBlob = await fetch("audio-url").then((r) => r.blob());
const options: TranscriptionOptions = {
  audioBlob,
  languageCode: "en-US",
  enableWordTimestamps: true,
};

const analysis = await speechService.transcribeAudio(options);

// Analyze transcription
const transcription =
  "Hello, this is a test. Um, I'm speaking to demonstrate the speech analysis.";
const manualAnalysis = speechService.analyzeTranscription(transcription);

// Get filler word statistics
const fillerWords = speechService.getFillerWordStatistics(transcription);
// { "um": 1, "uh": 0, "like": 0, ... }

// Calculate speaking rate
const wordsPerMinute = speechService.calculateSpeakingRate(transcription, 5); // 5 seconds duration

// Calculate clarity score
const clarityScore = speechService.calculateClarityScore(analysis);
```

### Firestore Service

The Firestore service handles database operations for storing and retrieving data.

#### Interface

```typescript
// packages/core/src/services/firestore.ts
export interface FirestoreService {
  getDocument<T>(path: string): Promise<T | null>;
  setDocument<T>(path: string, data: T): Promise<void>;
  updateDocument<T>(path: string, data: Partial<T>): Promise<void>;
  deleteDocument(path: string): Promise<void>;
  query<T>(collection: string, ...queryConstraints: any[]): Promise<T[]>;
}
```

#### Usage

```typescript
import { FirestoreService } from "@speakbetter/core";
import { createFirestoreService } from "@speakbetter/api";
import { where, orderBy, limit } from "firebase/firestore";

// Create service instance
const firestoreService = createFirestoreService({
  apiKey: "your-api-key",
  // other firebase config
});

// Get a document
const user = await firestoreService.getDocument<User>("users/user123");

// Set a document
await firestoreService.setDocument("users/user123", {
  displayName: "John Doe",
  email: "john@example.com",
  // other user data
});

// Update a document
await firestoreService.updateDocument("users/user123", {
  displayName: "John Smith",
});

// Query documents
const sessions = await firestoreService.query<Session>(
  "sessions",
  where("userId", "==", "user123"),
  orderBy("createdAt", "desc"),
  limit(10),
);

// Delete a document
await firestoreService.deleteDocument("sessions/session123");
```

### Text-to-Speech Service

The text-to-speech service converts text to spoken audio for coaching feedback.

#### Interface

```typescript
// packages/core/src/services/textToSpeech.ts
export interface TextToSpeechOptions {
  text: string;
  voiceName?: string;
  pitch?: number;
  speakingRate?: number;
}

export interface TextToSpeechService {
  synthesizeSpeech(options: TextToSpeechOptions): Promise<Blob>;
  getAvailableVoices(): Promise<string[]>;
}
```

#### Usage

```typescript
import { TextToSpeechService, TextToSpeechOptions } from "@speakbetter/core";
import { createGoogleTextToSpeechService } from "@speakbetter/api";

// Create service instance
const ttsService = createGoogleTextToSpeechService({
  apiKey: "your-google-cloud-api-key",
});

// Get available voices
const voices = await ttsService.getAvailableVoices();

// Synthesize speech
const options: TextToSpeechOptions = {
  text: "Great job! I noticed you spoke clearly and at a good pace.",
  voiceName: "en-US-Wavenet-F",
  pitch: 0,
  speakingRate: 1.0,
};

const audioBlob = await ttsService.synthesizeSpeech(options);

// Play the audio
const audioUrl = URL.createObjectURL(audioBlob);
const audio = new Audio(audioUrl);
audio.play();
```

## State Management

### Auth Store

The auth store manages authentication state.

#### Interface

```typescript
// packages/state/src/auth/index.ts
import { User } from "@speakbetter/core";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}

export const useAuthStore: () => AuthState;
```

#### Usage

```typescript
import { useAuthStore } from "@speakbetter/state";
import { useEffect } from "react";
import { AuthService } from "@speakbetter/core";

function AuthStateManager({ authService }: { authService: AuthService }) {
  const { setUser, setLoading, setError } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    const unsubscribe = authService.onAuthStateChanged(
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [authService, setUser, setLoading, setError]);

  return null;
}
```

### Sessions Store

The sessions store manages practice session state.

#### Interface

```typescript
// packages/state/src/sessions/index.ts
import { Session } from "@speakbetter/core";

interface SessionsState {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: Error | null;
  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (session: Session | null) => void;
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}

export const useSessionsStore: () => SessionsState;
```

#### Usage

```typescript
import { useSessionsStore } from "@speakbetter/state";
import { useEffect } from "react";
import { FirestoreService } from "@speakbetter/core";
import { where, orderBy } from "firebase/firestore";

function SessionsManager({
  firestoreService,
  userId,
}: {
  firestoreService: FirestoreService;
  userId: string;
}) {
  const { setSessions, setLoading, setError } = useSessionsStore();

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);

      try {
        const sessions = await firestoreService.query(
          "sessions",
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
        );

        setSessions(sessions);
        setLoading(false);
      } catch (error) {
        setError(error as Error);
        setLoading(false);
      }
    };

    loadSessions();
  }, [firestoreService, userId, setSessions, setLoading, setError]);

  return null;
}
```

## Platform-Specific APIs

### Web Audio Recorder

The web audio recorder provides audio recording functionality for the web platform.

#### Interface

```typescript
// packages/web/src/adapters/audioRecorder.ts
export interface WebAudioRecorderOptions {
  maxDurationMs?: number;
  mimeType?: string;
}

export interface WebAudioRecorder {
  startRecording(): Promise<void>;
  stopRecording(): Promise<Blob>;
  cancelRecording(): void;
  isRecording(): boolean;
  getAudioData(): Blob | null;
  getAudioUrl(): string | null;
  getRecordingTime(): number;
  onRecordingTimeUpdate(callback: (time: number) => void): () => void;
  getAudioVisualizationData(): Uint8Array | null;
}

export function createWebAudioRecorder(
  options?: WebAudioRecorderOptions,
): WebAudioRecorder;
```

#### Usage

```typescript
import { createWebAudioRecorder } from '@speakbetter/web';

function RecordingComponent() {
  const [recorder, setRecorder] = useState<WebAudioRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    const audioRecorder = createWebAudioRecorder({
      maxDurationMs: 180000, // 3 minutes
      mimeType: 'audio/webm',
    });

    setRecorder(audioRecorder);

    const unsubscribe = audioRecorder.onRecordingTimeUpdate(setRecordingTime);

    return () => {
      unsubscribe();
      if (audioRecorder.isRecording()) {
        audioRecorder.cancelRecording();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    if (recorder) {
      await recorder.startRecording();
    }
  };

  const handleStopRecording = async () => {
    if (recorder) {
      const audioBlob = await recorder.stopRecording();
      setAudioUrl(recorder.getAudioUrl());
      // Process the audio...
    }
  };

  return (
    <div>
      <div>Recording Time: {formatTime(recordingTime)}</div>
      <button onClick={handleStartRecording}>Start Recording</button>
      <button onClick={handleStopRecording}>Stop Recording</button>
      {audioUrl && <audio src={audioUrl} controls />}
    </div>
  );
}
```

### React Native Audio Recorder

The React Native audio recorder provides audio recording functionality for mobile platforms.

#### Interface

```typescript
// packages/mobile/src/adapters/audioRecorder.ts
export interface RNAudioRecorderOptions {
  maxDurationMs?: number;
  audioQuality?: "low" | "medium" | "high";
  sampleRate?: number;
  channels?: number;
}

export interface RNAudioRecorder {
  startRecording(): Promise<void>;
  stopRecording(): Promise<string>; // Returns file path
  cancelRecording(): Promise<void>;
  isRecording(): boolean;
  getAudioPath(): string | null;
  getRecordingTime(): number;
  onRecordingTimeUpdate(callback: (time: number) => void): () => void;
  getAudioVisualizationData(): Promise<number[]>;
}

export function createRNAudioRecorder(
  options?: RNAudioRecorderOptions,
): RNAudioRecorder;
```

#### Usage

```typescript
import { createRNAudioRecorder } from '@speakbetter/mobile';
import { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';

function RecordingComponent() {
  const [recorder, setRecorder] = useState(null);
  const [audioPath, setAudioPath] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    const audioRecorder = createRNAudioRecorder({
      maxDurationMs: 180000, // 3 minutes
      audioQuality: 'high',
      sampleRate: 44100,
      channels: 1,
    });

    setRecorder(audioRecorder);

    const unsubscribe = audioRecorder.onRecordingTimeUpdate(setRecordingTime);

    return () => {
      unsubscribe();
      if (audioRecorder.isRecording()) {
        audioRecorder.cancelRecording();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    if (recorder) {
      await recorder.startRecording();
    }
  };

  const handleStopRecording = async () => {
    if (recorder) {
      const path = await recorder.stopRecording();
      setAudioPath(path);
      // Process the audio...
    }
  };

  return (
    <View>
      <Text>Recording Time: {formatTime(recordingTime)}</Text>
      <Button title="Start Recording" onPress={handleStartRecording} />
      <Button title="Stop Recording" onPress={handleStopRecording} />
      {audioPath && <Text>Recorded to: {audioPath}</Text>}
    </View>
  );
}
```

## Error Handling

### API Error Types

```typescript
// packages/core/src/utils/errors.ts
export enum ErrorCode {
  // Authentication errors
  AUTH_REQUIRED = "auth/required",
  AUTH_INVALID_CREDENTIALS = "auth/invalid-credentials",

  // Network errors
  NETWORK_OFFLINE = "network/offline",
  NETWORK_TIMEOUT = "network/timeout",

  // API errors
  API_RATE_LIMIT = "api/rate-limit",
  API_INVALID_REQUEST = "api/invalid-request",

  // Speech processing errors
  SPEECH_RECOGNITION_FAILED = "speech/recognition-failed",
  SPEECH_NO_AUDIO = "speech/no-audio",

  // Data errors
  DATA_NOT_FOUND = "data/not-found",
  DATA_INVALID = "data/invalid",
}

export class AppError extends Error {
  code: ErrorCode;

  constructor(
    code: ErrorCode,
    message: string,
    public originalError?: any,
  ) {
    super(message);
    this.code = code;
    this.name = "AppError";
  }
}
```

### Error Handling Example

```typescript
import { AppError, ErrorCode } from "@speakbetter/core";

async function handleSpeechAnalysis(
  audioBlob: Blob,
  speechService: SpeechToTextService,
) {
  try {
    const analysis = await speechService.transcribeAudio({ audioBlob });
    return analysis;
  } catch (error) {
    if (error instanceof AppError) {
      // Handle known error types
      switch (error.code) {
        case ErrorCode.SPEECH_NO_AUDIO:
          // Handle no audio case
          break;
        case ErrorCode.SPEECH_RECOGNITION_FAILED:
          // Handle recognition failure
          break;
        default:
          // Handle other known errors
          break;
      }
    } else {
      // Handle unknown errors
      throw new AppError(
        ErrorCode.SPEECH_RECOGNITION_FAILED,
        "Speech recognition failed",
        error,
      );
    }
  }
}
```

## API Best Practices

1. **Use Service Interfaces**: Always define service interfaces in the core package before implementing them.

2. **Factory Pattern**: Use factory functions to create service instances with proper configuration.

3. **Platform Adapters**: Implement platform-specific adapters that conform to shared interfaces.

4. **Error Handling**: Use consistent error types and handling patterns across all services.

5. **Async Operations**: All potentially long-running operations should be async and provide progress updates when possible.

6. **Dependency Injection**: Services should receive dependencies through constructors or factory functions.

7. **Testability**: Design services with testability in mind, using interfaces and dependency injection.

8. **Documentation**: Document all public APIs with JSDoc comments.

9. **Versioning**: Consider API versioning for interfaces that might change over time.

10. **Security**: Handle sensitive data and API keys securely, never exposing them in client code.
