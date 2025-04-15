import Config from "react-native-config";

// Firebase Configuration
export const firebaseConfig = {
  apiKey: Config.FIREBASE_API_KEY || "",
  authDomain: Config.FIREBASE_AUTH_DOMAIN || "",
  projectId: Config.FIREBASE_PROJECT_ID || "",
  storageBucket: Config.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: Config.FIREBASE_APP_ID || "",
};

// Google Cloud Configuration
export const googleCloudConfig = {
  apiKey: Config.GOOGLE_CLOUD_API_KEY || "",
};

// App Configuration
export const appConfig = {
  env: Config.APP_ENV || "development",
  apiUrl: Config.API_URL || "https://api.dev.speakbetter.ai",
  isProduction: Config.APP_ENV === "production",
  isDevelopment: Config.APP_ENV === "development" || !Config.APP_ENV,
  isTest: Config.APP_ENV === "test",
};

// Validate configuration
export const validateConfig = (): {
  isValid: boolean;
  missingVars: string[];
} => {
  const requiredVars = [
    { key: "FIREBASE_API_KEY", config: firebaseConfig.apiKey },
    { key: "FIREBASE_AUTH_DOMAIN", config: firebaseConfig.authDomain },
    { key: "FIREBASE_PROJECT_ID", config: firebaseConfig.projectId },
    { key: "FIREBASE_STORAGE_BUCKET", config: firebaseConfig.storageBucket },
    {
      key: "FIREBASE_MESSAGING_SENDER_ID",
      config: firebaseConfig.messagingSenderId,
    },
    { key: "FIREBASE_APP_ID", config: firebaseConfig.appId },
    { key: "GOOGLE_CLOUD_API_KEY", config: googleCloudConfig.apiKey },
  ];

  const missingVars = requiredVars
    .filter(({ config }) => !config)
    .map(({ key }) => key);

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
};

// Log configuration status on import
const { isValid, missingVars } = validateConfig();
if (!isValid) {
  console.warn(
    `Missing environment variables: ${missingVars.join(", ")}. ` +
      "The app may not function correctly. " +
      "Make sure to set these variables in your .env file.",
  );
}

export default {
  firebase: firebaseConfig,
  googleCloud: googleCloudConfig,
  app: appConfig,
  isValid,
};
