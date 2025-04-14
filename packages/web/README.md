# @speakbetter/web

Web implementation for SpeakBetter AI Coach.

## Overview

This package provides the web-specific implementation of the SpeakBetter AI Coach:

- React web components
- Web-specific adapters for core services
- Feature implementations for web
- Web-specific utilities and hooks

## Directory Structure

```
web/
├── src/
│   ├── adapters/      # Web-specific adapters for core services
│   ├── components/    # Web-specific React components
│   ├── features/      # Feature implementations
│   ├── shared/        # Shared utilities and hooks
│   ├── utils/         # Web-specific utilities
│   ├── App.tsx        # Root application component
│   └── index.ts       # Package entry point
├── tests/             # Unit tests
└── README.md          # This file
```

## Usage

```typescript
// In web-app/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@speakbetter/web';

// Initialize with configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // other firebase config
};

const googleCloudConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_CLOUD_API_KEY,
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App
      firebaseConfig={firebaseConfig}
      googleCloudConfig={googleCloudConfig}
    />
  </React.StrictMode>
);
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

The web package includes tests for components and integrations. Run the tests with:

```bash
npm run test
```

## Dependencies

- `@speakbetter/core`: Core models and interfaces
- `@speakbetter/api`: API implementations
- `@speakbetter/ui`: UI component interfaces
- `@speakbetter/state`: State management
- `react`: React library
- `react-dom`: React DOM renderer
- `react-router-dom`: Routing library
