# @speakbetter/api

API client implementations for SpeakBetter AI Coach.

## Overview

This package contains implementations of the service interfaces defined in `@speakbetter/core`:

- Firebase authentication, Firestore, and Storage clients
- Google Cloud Speech-to-Text and Text-to-Speech services
- Storage adapters for different platforms
- API utilities and helpers

## Directory Structure

```
api/
├── src/
│   ├── firebase/      # Firebase client implementations
│   ├── speech/        # Speech API client implementations
│   ├── storage/       # Storage adapters
│   └── index.ts       # Package entry point
├── tests/             # Unit tests
└── README.md          # This file
```

## Usage

```typescript
// Import service factory functions
import {
  createFirebaseAuthService,
  createFirestoreService,
  createGoogleSpeechService,
} from "@speakbetter/api";

// Create service instances
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};

const authService = createFirebaseAuthService(firebaseConfig);
const firestoreService = createFirestoreService(firebaseConfig);

// Use services
authService.signInWithGoogle().then((user) => {
  console.log("Signed in user:", user);
});
```

## Development

```bash
# Build the package
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Testing

The API package includes tests for all service implementations. Run the tests with:

```bash
npm run test
```

## Dependencies

- `@speakbetter/core`: Core models and interfaces
- `firebase`: Firebase SDK
- Other platform-specific dependencies as needed
