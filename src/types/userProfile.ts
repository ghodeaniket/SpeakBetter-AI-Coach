/**
 * Types for user profile management
 */

export interface UserNotificationPreferences {
  email: boolean;
  inApp: boolean;
  practiceDays: string[]; // e.g., ["monday", "wednesday", "friday"]
}

export interface UserSettings {
  selectedVoice: string; // "male" | "female" | specific voice ID
  coachPersonality: string; // "supportive" | "direct" | "analytical"
  notificationPreferences: UserNotificationPreferences;
}

export interface UserGoal {
  id?: string; // Added to make it easier to update specific goals
  type: string; // "presentation" | "interview" | "everyday"
  focus: string[]; // ["pace", "fillers", "clarity", "confidence"]
  targetDate?: Date;
  weeklySessionTarget: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: Date;
  lastLoginAt: Date;
  settings: UserSettings;
  goals: UserGoal[];
}
