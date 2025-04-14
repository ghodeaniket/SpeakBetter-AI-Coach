# SpeakBetter AI Coach - Architecture Documentation

## Overview

The SpeakBetter AI Coach application has been refactored to use a more scalable and maintainable architecture. The main changes include:

1. Implementing a feature-based folder structure
2. Creating dedicated service layers for each feature
3. Breaking down large components into smaller, reusable pieces
4. Removing dependency on Firebase Extensions
5. Adding proper routing with React Router
6. Implementing context providers for shared state
7. Adding custom hooks for reusable logic

## Folder Structure

The application follows a feature-based folder structure:

```
src/
├── features/            # Feature modules
│   ├── dashboard/       # Dashboard feature
│   ├── speech-to-text/  # Speech analysis feature
│   │   ├── components/  # Feature-specific components
│   │   ├── hooks/       # Feature-specific hooks
│   │   └── services/    # Feature-specific services
│   └── text-to-speech/  # Speech synthesis feature
│       ├── components/
│       ├── hooks/
│       └── services/
├── services/            # Shared services
│   └── google-cloud/    # Google Cloud API services
├── shared/              # Shared code
│   ├── components/      # Shared UI components
│   ├── contexts/        # Context providers
│   ├── hooks/           # Custom hooks
│   ├── routes/          # Routing configuration
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── firebase/            # Firebase configuration
├── App.tsx              # Root component
└── main.tsx             # Entry point
```

## Key Architecture Decisions

### 1. Direct Google Cloud API Integration

We've replaced Firebase Extensions with direct integration to Google Cloud APIs:

- `services/google-cloud/speech.ts`: Direct integration with Speech-to-Text API
- `services/google-cloud/textToSpeech.ts`: Direct integration with Text-to-Speech API

This gives us more control over the API calls and reduces dependencies on external services.

### 2. React Context for State Management

We use React Context for sharing state across components:

- `SpeechContext`: Provides shared state for audio recording, transcription, and feedback

### 3. Custom Hooks

Custom hooks extract and reuse complex logic:

- `useAudioRecording`: Handles audio recording and visualization
- More hooks can be added as needed

### 4. Reusable Components

Common UI elements are extracted into reusable components:

- `AudioRecorder`: Records and visualizes audio
- `DebugLog`: Displays and manages debug logs
- `AppLayout`: Provides consistent layout and navigation

### 5. Service Layer

Each feature has its own service layer to handle API calls and data processing:

- `speechToTextService`: Handles speech analysis
- `textToSpeechService`: Manages speech synthesis

## Key Features

### Speech Analysis

The Speech Analysis feature allows users to:

1. Record speech using the AudioRecorder component
2. Analyze the recording using the Google Cloud Speech-to-Text API
3. View detailed analysis including transcription, filler words, and speaking rate
4. Compare against reference text for accuracy

### Speech Synthesis

The Speech Synthesis feature allows users to:

1. Enter text or select from predefined templates
2. Configure voice settings (voice selection, speed, pitch)
3. Generate natural-sounding speech using Google Cloud Text-to-Speech API
4. Play back the generated audio

## Removed Dependencies

The following dependencies have been removed:

1. Firebase Extensions for Speech-to-Text and Text-to-Speech
2. Extension-specific components and code

## Technology Stack

- **Frontend Framework**: React
- **UI Library**: Material UI
- **Routing**: React Router
- **API Integration**: Direct Google Cloud API calls
- **Backend Services**: Firebase (Authentication, Firestore, Storage)
- **Speech APIs**: Google Cloud Speech-to-Text and Text-to-Speech

## Future Enhancements

1. **User Authentication**: Add user authentication with Firebase Authentication
2. **Progress Tracking**: Implement progress tracking and history
3. **Advanced Analytics**: Add more detailed analysis and visualizations
4. **Offline Support**: Add service workers for offline capabilities
5. **Mobile App**: Convert to a progressive web app or native mobile app

## Development Guidelines

1. **Component Size**: Keep components under 200 lines of code
2. **Feature Organization**: New features should be added as separate modules in the `features` directory
3. **Service Abstraction**: API calls should be abstracted through service layers
4. **State Management**: Use React Context for shared state, component state for local state
5. **Testing**: Add unit tests for critical components and services

## Migration Notes

If you're working with the previous version of the codebase:

1. Firebase extension-related code has been backed up to `src/backup/firebase-extensions/`
2. Firebase configuration files have been backed up to `src/backup/firebase-config/`
3. The direct API implementations replace the functionality previously provided by Firebase Extensions

## Getting Started for Developers

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up Google Cloud credentials following instructions in `API_CREDENTIALS_SETUP.md`
4. Start the development server with `npm run dev`
