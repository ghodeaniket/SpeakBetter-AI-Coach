/**
 * Mobile-specific Adapters
 * This file exports adapters for mobile-specific implementations
 * of platform-agnostic interfaces
 */

// Export audio-related adapters
export * from "./MobileAudioAdapter";
export * from "./MobileSpeechAdapter";

// Export auth-related adapters
export * from "./FirebaseAuthAdapter";
export * from "./UserProfileAdapter";

// Export network and storage adapters
export * from "./MobileNetworkAdapter";

// Export service factory
export * from "./MobileServiceFactory";

// Note: The following adapters are referenced in MobileServiceFactory
// but aren't implemented yet. These will be created in subsequent phases.
// - MobileLocalStorageAdapter
// - MobileRemoteStorageAdapter
// - MobileSessionAdapter
// - MobileAnalysisAdapter
// - MobileFeedbackAdapter
// - MobileVisualizationAdapter
