# @speakbetter/core

This package contains the core business logic, models, services, and utilities shared across the SpeakBetter AI Coach application.

## Structure

- **models/**: Data models and interfaces
- **services/**: Service interfaces
- **utils/**: Utility functions
- **validation/**: Data validation functions

## Usage

### Installation

This package is part of the SpeakBetter AI Coach monorepo and is not meant to be installed separately.

### Importing

```typescript
// Import models
import { User, SessionMetadata, SpeechAnalysisResult } from '@speakbetter/core';

// Import service interfaces
import { AuthService, SpeechService, SessionService } from '@speakbetter/core';

// Import utility functions
import { formatDate, formatDuration, generateId, debounce } from '@speakbetter/core';

// Import validation functions
import { isValidEmail, isNotEmpty, isInRange, isValidAudioDuration } from '@speakbetter/core';
```

## Models

### User

Represents a user of the application.

```typescript
interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
```

### SessionMetadata

Represents metadata for a practice session.

```typescript
interface SessionMetadata {
  id: string;
  userId: string;
  type: 'freestyle' | 'guided' | 'qa';
  createdAt: Date;
  duration: number; // in seconds
}
```

### SpeechAnalysisResult

Represents the result of a speech analysis.

```typescript
interface SpeechAnalysisResult {
  transcription: string;
  wordsPerMinute: number;
  fillerWordCounts: Record<string, number>;
  fillerWordPercentage: number;
  clarityScore: number;
}
```

## Services

### AuthService

Interface for authentication operations.

```typescript
interface AuthService {
  signIn(): Promise<User | null>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}
```

### SpeechService

Interface for speech processing operations.

```typescript
interface SpeechService {
  transcribeAudio(audioBlob: Blob): Promise<SpeechAnalysisResult>;
  synthesizeSpeech(text: string, voice?: string): Promise<ArrayBuffer>;
}
```

### SessionService

Interface for session management operations.

```typescript
interface SessionService {
  getSessions(userId: string): Promise<SessionMetadata[]>;
  getSession(sessionId: string): Promise<SessionMetadata | null>;
  saveSession(session: SessionMetadata): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
}
```

## Utilities

### Date and Time

- `formatDate(date: Date): string` - Format a date to a human-readable string
- `formatDuration(seconds: number): string` - Format seconds to a human-readable duration

### General Utilities

- `generateId(): string` - Generate a unique ID
- `debounce<T>(fn: T, ms: number): T` - Debounce a function

## Validation

- `isValidEmail(email: string): boolean` - Validate an email address
- `isNotEmpty(value: string): boolean` - Check if a string is not empty
- `isInRange(value: number, min: number, max: number): boolean` - Check if a number is within a range
- `isValidAudioDuration(seconds: number): boolean` - Check if an audio duration is acceptable

## Development

### Building

```
npm run build --workspace=@speakbetter/core
```

### Testing

```
npm run test --workspace=@speakbetter/core
```
