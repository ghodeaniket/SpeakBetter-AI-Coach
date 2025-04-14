# Mobile Adapters

This directory contains mobile-specific implementations of the core service interfaces. These adapters use React Native APIs to provide platform-specific functionality for iOS and Android.

## Implemented Adapters

### MobileServiceFactory

The `MobileServiceFactory` is a singleton factory that provides access to all service instances. It follows the same pattern as the `WebServiceFactory` but creates mobile-specific implementations.

```typescript
import { mobileServiceFactory } from "./adapters/MobileServiceFactory";

// Get speech service
const speechService = mobileServiceFactory.getSpeechService();

// Get audio service
const audioService = mobileServiceFactory.getAudioService();
```

### MobileSpeechAdapter

The `MobileSpeechAdapter` provides speech-to-text and text-to-speech functionality using:

- Google Cloud Speech API for transcription
- React Native TTS for speech synthesis

It handles platform-specific audio session management for iOS through the native `AudioSessionModule`.

### MobileAudioAdapter

The `MobileAudioAdapter` handles audio recording and playback using:

- `react-native-audio-recorder-player` for recording and playback
- File system integration with `react-native-fs`
- Haptic feedback on iOS

### MobileNetworkAdapter

The `MobileNetworkAdapter` provides network connectivity monitoring using:

- `@react-native-community/netinfo` for connection state monitoring
- Retry and backoff mechanisms for handling network interruptions

## Usage

These adapters are automatically instantiated by the `MobileServiceFactory`. Typically, you'll use the factory to get service instances rather than creating adapters directly.

```typescript
import { mobileServiceFactory } from "./adapters";

// In a React component
useEffect(() => {
  const audioService = mobileServiceFactory.getAudioService();
  audioService.requestPermission().then((hasPermission) => {
    if (hasPermission) {
      // Ready to record
    }
  });
}, []);
```

## Testing

Each adapter has corresponding test files in the `__tests__` directory. Run tests with:

```
npm test
```
