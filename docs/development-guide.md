# SpeakBetter AI Coach Development Guide

## Getting Started

This guide will help you set up your development environment and understand the workflow for developing the SpeakBetter AI Coach application.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18+)
- **npm** (v9+)
- **Git**
- For iOS development:
  - **Xcode** (latest version)
  - **CocoaPods**
- For Android development:
  - **Android Studio**
  - **JDK 11**
  - Android SDK

### Setting Up Your Environment

1. Clone the repository:

```bash
git clone https://github.com/yourusername/speakbetter-ai-coach.git
cd speakbetter-ai-coach
```

2. Install dependencies:

```bash
npm install
```

3. Build all packages:

```bash
npm run build
```

4. Set up environment variables:

Create `.env` files in the app directories:

For web (`apps/web-app/.env`):

```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key
```

For mobile (`apps/mobile-app/.env`):

```
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
FIREBASE_APP_ID=your-firebase-app-id
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key
```

5. For iOS development, install CocoaPods dependencies:

```bash
cd apps/mobile-app/ios
pod install
cd ../../..
```

### Running the Applications

#### Web Application

```bash
# Start development server
npm run dev:web

# Build for production
npm run build:web

# Preview production build
cd apps/web-app && npm run preview
```

The web app will be available at http://localhost:3000.

#### Mobile Application

```bash
# Start Metro bundler
npm run dev:mobile

# Run on iOS simulator
cd apps/mobile-app && npm run ios

# Run on Android emulator
cd apps/mobile-app && npm run android
```

## Development Workflow

### Monorepo Structure

The project uses a monorepo structure with Turborepo. Here's how it's organized:

```
speakbetter/
├── packages/           # Shared packages
│   ├── core/           # Core business logic and data models
│   ├── ui/             # Shared UI component interfaces
│   ├── api/            # API client implementations
│   ├── state/          # Shared state management
│   ├── web/            # Web-specific implementation
│   └── mobile/         # React Native implementation
└── apps/
    ├── web-app/        # Web app entry point
    └── mobile-app/     # Mobile app entry point
```

### Creating a New Feature

When creating a new feature, follow these steps:

1. **Identify the scope**: Determine which packages need to be modified.
2. **Implement shared logic**: Add platform-agnostic code to core packages.
3. **Create platform adapters**: Implement platform-specific adaptations.
4. **Update UI components**: Add or modify components in web and mobile packages.
5. **Test across platforms**: Ensure the feature works on all platforms.

#### Example: Adding a New Speech Analysis Feature

1. Define the feature interface in `packages/core/src/services`:

```typescript
// packages/core/src/services/speechAnalysis.ts
export interface PauseAnalysisOptions {
  transcription: string;
  wordTimings: WordTiming[];
}

export interface PauseAnalysisResult {
  totalPauses: number;
  averagePauseDuration: number;
  longPauses: number;
}

export interface SpeechAnalysisService {
  // Existing methods...

  analyzePauses(options: PauseAnalysisOptions): PauseAnalysisResult;
}
```

2. Implement the service in `packages/api/src/speech`:

```typescript
// packages/api/src/speech/googleSpeechService.ts
// Add to existing implementation
analyzePauses(options: PauseAnalysisOptions): PauseAnalysisResult {
  const { transcription, wordTimings } = options;

  // Implementation...

  return {
    totalPauses: 0,
    averagePauseDuration: 0,
    longPauses: 0
  };
}
```

3. Update state management in `packages/state/src/speech`:

```typescript
// Add to existing state
pauseAnalysis: PauseAnalysisResult | null;
setPauseAnalysis: (result: PauseAnalysisResult) => void;

// In the state implementation:
setPauseAnalysis: (result) => set((state) => {
  state.pauseAnalysis = result;
})
```

4. Create UI components for web and mobile:

```tsx
// packages/web/src/components/PauseAnalysisCard.tsx
import React from "react";
import { useSpeechStore } from "@speakbetter/state";

export const PauseAnalysisCard: React.FC = () => {
  const { pauseAnalysis } = useSpeechStore();

  if (!pauseAnalysis) return null;

  return (
    <div className="card">
      <h3>Pause Analysis</h3>
      <div>Total Pauses: {pauseAnalysis.totalPauses}</div>
      <div>
        Average Duration: {pauseAnalysis.averagePauseDuration.toFixed(1)}s
      </div>
      <div>Long Pauses: {pauseAnalysis.longPauses}</div>
    </div>
  );
};
```

```tsx
// packages/mobile/src/components/PauseAnalysisCard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSpeechStore } from "@speakbetter/state";

export const PauseAnalysisCard: React.FC = () => {
  const { pauseAnalysis } = useSpeechStore();

  if (!pauseAnalysis) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Pause Analysis</Text>
      <Text>Total Pauses: {pauseAnalysis.totalPauses}</Text>
      <Text>
        Average Duration: {pauseAnalysis.averagePauseDuration.toFixed(1)}s
      </Text>
      <Text>Long Pauses: {pauseAnalysis.longPauses}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
});
```

5. Integrate the components into the respective feature screens/pages.

### Working with Packages

#### Building Packages

To build a specific package:

```bash
cd packages/core && npm run build
```

To build all packages:

```bash
npm run build
```

#### Testing Packages

To run tests for a specific package:

```bash
cd packages/core && npm run test
```

To run all tests:

```bash
npm run test
```

#### Creating a New Package

To create a new package:

1. Create a new directory in `packages/`
2. Initialize it with a package.json:

```json
{
  "name": "@speakbetter/new-package",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint 'src/**/*.{ts,tsx}'"
  },
  "dependencies": {
    "@speakbetter/core": "*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.6.3"
  }
}
```

3. Add it to the workspace in the root package.json
4. Install dependencies and build the project

### Code Style and Best Practices

#### TypeScript

- Use strict typing for all code
- Create interfaces for data models and service APIs
- Use generics for reusable components and utilities
- Document public APIs with JSDoc comments

#### React and React Native

- Use functional components with hooks
- Separate business logic from UI components
- Implement responsive design for all components
- Follow platform-specific design guidelines

#### State Management

- Keep state normalized and minimal
- Use selectors for derived state
- Implement middleware for side effects
- Test state changes thoroughly

#### Testing

- Write unit tests for core business logic
- Test components with React Testing Library
- Use mocks for external dependencies
- Implement integration tests for key flows

## Troubleshooting

### Common Issues

#### Monorepo Dependencies

If you encounter issues with dependencies not being found:

```bash
npm install
npm run build
```

#### iOS Build Issues

If you encounter iOS build issues:

```bash
cd apps/mobile-app/ios
pod deintegrate
pod install
```

#### Android Build Issues

If you encounter Android build issues:

```bash
cd apps/mobile-app/android
./gradlew clean
cd ../..
npm run android
```

#### Metro Bundler Issues

If Metro bundler has issues finding modules:

```bash
npm run dev:mobile -- --reset-cache
```

## Deployment

### Web Deployment

To deploy the web application:

1. Build the web app:

```bash
npm run build:web
```

2. Deploy to Firebase Hosting:

```bash
cd apps/web-app
firebase deploy --only hosting
```

### Mobile Deployment

#### iOS

1. Ensure all native dependencies are up-to-date:

```bash
cd apps/mobile-app/ios
pod install --repo-update
cd ../../..
```

2. Configure signing in Xcode:

   - Open the Xcode workspace: `open apps/mobile-app/ios/SpeakBetterCoach.xcworkspace`
   - Select the project in the navigator
   - Go to the "Signing & Capabilities" tab
   - Set up your Apple Developer Team and provisioning profiles

3. Create a production build:

   - Select "Product" > "Archive" in Xcode
   - Once archiving is complete, the Organizer window will open
   - Select "Distribute App" and follow the wizard
   - Choose "App Store Connect" for App Store distribution or "Ad Hoc" for TestFlight

4. Follow App Store Connect submission process:
   - Complete app metadata, screenshots, and descriptions
   - Submit for review

#### Android

1. Generate a signing key (if you don't have one):

```bash
keytool -genkey -v -keystore apps/mobile-app/android/app/release.keystore -alias speakbetter-release -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure signing in `apps/mobile-app/android/app/build.gradle`:

```gradle
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword System.getenv("ANDROID_STORE_PASSWORD")
        keyAlias 'speakbetter-release'
        keyPassword System.getenv("ANDROID_KEY_PASSWORD")
    }
}
```

3. Create a signed release bundle:

```bash
cd apps/mobile-app/android
./gradlew bundleRelease
```

4. Upload to Google Play Console:
   - Navigate to the Google Play Console
   - Create a new release in the appropriate track (internal, alpha, beta, production)
   - Upload the AAB file from `apps/mobile-app/android/app/build/outputs/bundle/release/`
   - Complete store listing and submit for review

### Continuous Integration/Deployment

We use GitHub Actions for CI/CD pipelines:

1. **Pull Request Workflow**: Automatically runs tests and checks
2. **Main Branch Deployment**: Deploys to staging environments
3. **Release Tag Deployment**: Creates production builds

See the `.github/workflows` directory for configuration details.

## Contributing

Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Cross-Platform Development Considerations

When developing for both web and mobile platforms, keep these considerations in mind:

### Shared Logic

- Place all business logic in `@speakbetter/core` and `@speakbetter/state` packages
- Avoid platform-specific imports in shared code
- Use dependency injection for platform-specific functionality
- Create clear interfaces for all services

### Platform Differences

#### Audio Processing

- **Web**: Uses WebAudio API and MediaRecorder
- **Mobile**: Uses React Native's audio modules
- Abstract these differences in platform-specific adapters

#### Storage

- **Web**: Uses IndexedDB for offline storage
- **Mobile**: Uses AsyncStorage or SQLite
- Both implement the same storage interface

#### UI Components

- Follow platform conventions while maintaining consistent branding
- Create responsive designs that adapt to various screen sizes
- Handle touch interactions differently from mouse events

#### Offline Support

- Design features to work offline first
- Implement synchronization logic in shared code
- Handle connectivity changes appropriately on each platform

### Performance Optimization

- **Web**: Optimize bundle size with code splitting
- **Mobile**: Minimize JS thread blocking
- Both: Implement virtualized lists for long content

### Testing Cross-Platform Features

- Test on both platforms after implementing a feature
- Use platform-specific mocks in tests
- Verify edge cases on each platform

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text/docs)
- [Monorepo Handbook](https://turbo.build/repo/docs/handbook)
- [React Native Performance](https://reactnative.dev/docs/performance)
