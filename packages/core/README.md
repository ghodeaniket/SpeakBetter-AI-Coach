# @speakbetter/core

Core business logic and data models for SpeakBetter AI Coach.

## Overview

This package contains:

- Data models for users, sessions, speech analysis
- Service interfaces for authentication, speech processing, feedback generation
- Validation utilities using Zod
- Shared utility functions

## Usage

```typescript
import { User, Session, SpeechAnalysis } from '@speakbetter/core';
import { AuthService, SpeechToTextService } from '@speakbetter/core';

// Use models and interfaces in your application
```

## Type Definitions

### Models

- `User`: User profile information
- `Session`: Recording session data
- `SpeechAnalysis`: Results of speech analysis

### Services

- `AuthService`: User authentication and management
- `SpeechToTextService`: Speech transcription and analysis
- `FeedbackService`: AI coaching feedback generation
- `StorageService`: File storage management

## Validation

This package includes Zod schemas for runtime validation of all data models.

## Development

```bash
# Build the package
npm run build

# Run tests
npm run test
```