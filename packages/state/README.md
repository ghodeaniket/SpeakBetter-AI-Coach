# @speakbetter/state

Shared state management for SpeakBetter AI Coach.

## Overview

This package provides cross-platform state management using Zustand:

- Authentication state
- User profile state
- Session management state
- Speech analysis state
- Shared selectors and actions

## Directory Structure

```
state/
├── src/
│   ├── auth/          # Authentication state
│   ├── user/          # User profile state
│   ├── sessions/      # Session management state
│   ├── speech/        # Speech analysis state
│   └── index.ts       # Package entry point
├── tests/             # Unit tests
└── README.md          # This file
```

## Usage

```typescript
// Import state hooks
import { useAuthStore, useSessionsStore } from '@speakbetter/state';

// Use in components
function MyComponent() {
  const { user, isLoading } = useAuthStore();
  const { sessions, currentSession, setCurrentSession } = useSessionsStore();

  // Use state in component
  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div>
      <h1>Welcome, {user.displayName}</h1>
      <SessionList
        sessions={sessions}
        onSelect={setCurrentSession}
      />
    </div>
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

## Testing

The state package includes tests for all stores and selectors. Run the tests with:

```bash
npm run test
```

## Dependencies

- `@speakbetter/core`: Core models and interfaces
- `zustand`: State management library
- `immer`: Immutable state updates
