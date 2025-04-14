# @speakbetter/mobile-app

Mobile application entry point for SpeakBetter AI Coach.

## Overview

This package serves as the entry point for the mobile version of SpeakBetter AI Coach:

- React Native application entry point
- Native code (iOS and Android)
- Build configuration
- Environment-specific settings
- Mobile-specific assets

## Directory Structure

```
mobile-app/
├── android/         # Android native code
├── ios/             # iOS native code
├── src/
│   ├── App.tsx      # Application entry point
│   └── index.ts     # JavaScript entry point
├── index.js         # React Native entry point
├── app.json         # Application configuration
├── metro.config.js  # Metro bundler configuration
└── README.md        # This file
```

## Development

```bash
# Start Metro bundler
npm run start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run tests
npm run test

# Lint code
npm run lint

# Install iOS pods
npm run pods
```

## Environment Setup

Create a `.env` file in the root of this package with the following variables:

```
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
FIREBASE_APP_ID=your-firebase-app-id
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key
```

Use the `react-native-dotenv` package to access these environment variables in your code.

## Native Dependencies

This package includes native dependencies that require proper linking:

- `react-native-audio-recorder-player`: For audio recording and playback
- `@react-native-firebase/app`: Firebase core functionality
- `@react-native-firebase/auth`: Firebase authentication
- `@react-native-firebase/firestore`: Firestore database
- `@react-native-firebase/storage`: Firebase storage

## iOS Development

```bash
# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Run on iOS simulator
npm run ios

# Run on specific iOS device
npm run ios -- --device "iPhone 13"
```

## Android Development

```bash
# Run on Android emulator
npm run android

# Run on specific Android device
npm run android -- --deviceId=your-device-id
```

## Building for Production

### iOS

```bash
# Build for iOS
cd ios
xcodebuild -workspace SpeakBetterCoach.xcworkspace -scheme SpeakBetterCoach -configuration Release -sdk iphoneos build
```

### Android

```bash
# Build for Android
cd android
./gradlew assembleRelease
```

## Dependencies

- `@speakbetter/mobile`: Mobile implementation
- `@speakbetter/core`: Core models and interfaces
- `@speakbetter/api`: API implementations
- `@speakbetter/ui`: UI component interfaces
- `@speakbetter/state`: State management
