/**
 * Interface for the native EnvHelper module
 * Note: You need to implement the native module before using this
 */
import { NativeModules, Platform } from "react-native";

// Type definition for the native module
interface EnvHelperInterface {
  isConfigured(): Promise<boolean>;
  getFirebaseConfig(): Promise<{
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  }>;
  appEnv: string;
  apiUrl: string;
}

// Default mock implementation for development when module isn't available
const mockEnvHelper: EnvHelperInterface = {
  isConfigured: async () => {
    console.warn("EnvHelper native module not available, using mock");
    return false;
  },
  getFirebaseConfig: async () => {
    console.warn("EnvHelper native module not available, using mock");
    return {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
    };
  },
  appEnv: "development",
  apiUrl: "https://api.dev.speakbetter.ai",
};

// Get the native module or use mock implementation if not available
const getNativeModule = (): EnvHelperInterface => {
  if (Platform.OS === "ios" && NativeModules.EnvHelper) {
    return NativeModules.EnvHelper as EnvHelperInterface;
  }
  return mockEnvHelper;
};

// Export the EnvHelper
export const EnvHelper = getNativeModule();

export default EnvHelper;
