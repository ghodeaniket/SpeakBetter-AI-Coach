# Environment Setup Instructions

This document explains how to complete the setup for React Native Config in your Android and iOS projects.

## iOS Setup

The Podfile has been updated to include react-native-config. To complete the setup:

1. Navigate to the iOS directory:

   ```bash
   cd ios
   ```

2. Install or update the pods:

   ```bash
   pod install
   ```

3. Make sure to properly link the library by running:
   ```bash
   npx react-native link react-native-config
   ```

## Android Setup

For Android, manual configuration may be needed:

1. Open `android/app/build.gradle` and add this line after the `apply plugin: "com.android.application"` line:

   ```gradle
   apply from: project(':react-native-config').projectDir.getPath() + '/dotenv.gradle'
   ```

2. Ensure the `android/app/src/main/assets` directory exists:

   ```bash
   mkdir -p android/app/src/main/assets
   ```

3. Rebuild your Android project:
   ```bash
   cd android
   ./gradlew clean
   ```

## Verifying the Setup

To verify that React Native Config is working correctly:

1. Add a debug statement in your App.js or App.tsx file:

   ```javascript
   console.log("Environment variables:", Config);
   ```

2. Run your app in development mode and check the logs for the environment variables.

## Troubleshooting

If you encounter issues:

1. Make sure you've run `npx react-native link react-native-config` (for older RN versions)
2. Try cleaning and rebuilding the project
3. For iOS: Delete the Pods directory and run pod install again
4. For Android: Run `./gradlew clean` and rebuild
