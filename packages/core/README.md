# @speakbetter/core

Core business logic and data models for SpeakBetter AI Coach.

## Overview

This package contains the platform-agnostic foundation for the SpeakBetter AI Coach application:

- Data models for users, sessions, speech analysis
- Service interfaces for authentication, speech processing, etc.
- Validation utilities
- Shared utilities

## Directory Structure

```
core/
├── src/
│   ├── models/        # Data models and interfaces
│   ├── services/      # Service interfaces
│   ├── utils/         # Shared utilities
│   ├── validation/    # Data validation logic
│   └── index.ts       # Package entry point
├── tests/             # Unit tests
└── README.md          # This file
```

## Usage

```typescript
// Import models
import { User, Session, SpeechAnalysis } from "@speakbetter/core";

// Import service interfaces
import { AuthService, SpeechToTextService } from "@speakbetter/core";

// Use models and interfaces in your application
const user: User = {
  uid: "123",
  displayName: "Test User",
  email: "test@example.com",
  photoURL: null,
  createdAt: new Date(),
  lastLoginAt: new Date(),
};
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

The core package includes comprehensive tests for all models and service interfaces. Run the tests with:

```bash
npm run test
```

## Dependencies

This package has minimal dependencies to ensure it remains platform-agnostic.
