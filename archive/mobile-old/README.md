# @speakbetter/mobile

React Native implementation for SpeakBetter AI Coach.

## Overview

This package provides the mobile-specific implementation of the SpeakBetter AI Coach:

- React Native components
- Mobile-specific adapters for core services
- Mobile screens and navigation
- Mobile-specific utilities and hooks
- Native module integrations

## Directory Structure

```
mobile/
├── src/
│   ├── adapters/      # Mobile-specific adapters for core services
│   ├── components/    # React Native components
│   ├── screens/       # Mobile app screens
│   ├── navigation/    # Navigation configuration
│   ├── hooks/         # Mobile-specific hooks
│   ├── services/      # Mobile-specific services
│   ├── theme/         # Theme implementation for React Native
│   ├── App.tsx        # Root application component
│   └── index.ts       # Package entry point
├── tests/             # Unit tests
└── README.md          # This file
```

## Usage

```typescript
// In mobile-app/src/App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { App } from '@speakbetter/mobile';

// Import services
import { createFirebaseAuthService, createFirestoreService } from '@speakbetter/api';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  // other firebase config
};

// Google Cloud configuration
const googleCloudConfig = {
  apiKey: process.env.GOOGLE_CLOUD_API_KEY,
};

export default function AppEntry() {
  // Initialize services
  const authService = createFirebaseAuthService(firebaseConfig);
  const firestoreService = createFirestoreService(firebaseConfig);

  return (
    <SafeAreaProvider>
      <App
        authService={authService}
        firestoreService={firestoreService}
        googleCloudConfig={googleCloudConfig}
      />
    </SafeAreaProvider>
  );
}
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

## Native Modules

This package includes native module integrations for:

- Audio recording and processing
- Speech recognition
- File system access
- Push notifications

## Testing

The mobile package includes tests for components and integrations. Run the tests with:

```bash
npm run test
```

## Dependencies

- `@speakbetter/core`: Core models and interfaces
- `@speakbetter/api`: API implementations
- `@speakbetter/ui`: UI component interfaces
- `@speakbetter/state`: State management
- `react`: React library
- `react-native`: React Native framework
- `@react-navigation/native`: Navigation library
- `react-native-safe-area-context`: Safe area utilities
