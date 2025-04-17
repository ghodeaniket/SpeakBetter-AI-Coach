// Types shared between the mobile app and the mobile package

// Configuration types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface GoogleCloudConfig {
  apiKey: string;
}

// Service interfaces will be implemented in Phase 2
