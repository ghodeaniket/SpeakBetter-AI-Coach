# @speakbetter/state

State management for the SpeakBetter AI Coach application.

## Overview

This package contains Zustand stores for managing application state:

- `auth`: Authentication state (user, loading, etc.)
- `user`: User profile, goals, and settings
- `sessions`: Practice sessions and history
- `speech`: Speech recording, analysis, and feedback

## Usage

```typescript
import { useAuthStore, useUserStore, useSessionsStore, useSpeechStore } from '@speakbetter/state';

// In your component
const { user, isLoading } = useAuthStore();
const { sessions } = useSessionsStore();

// Use Firebase authentication
import { useFirebaseAuth } from '@speakbetter/state';
import { createFirebaseAuthService } from '@speakbetter/api';

const MyComponent = () => {
  const authService = createFirebaseAuthService(firebaseConfig);
  const { user, isLoading, signInWithGoogle, signOut } = useFirebaseAuth(authService);
  
  // Use authentication in your component
};
```

## State Stores

### Auth Store

Manages authentication state including the current user, loading state, and errors.

### User Store

Manages user profile data, goals, and application settings.

### Sessions Store

Manages speech practice sessions including history and the current session.

### Speech Store

Manages the state of speech recording, analysis, and feedback.

## Development

```bash
# Build the package
npm run build

# Run tests
npm run test
```