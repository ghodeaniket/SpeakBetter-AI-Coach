export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  settings?: UserSettings;
  goals?: UserGoal[];
}

export interface UserSettings {
  selectedVoice: string;
  coachPersonality: string;
  notificationPreferences?: {
    email: boolean;
    inApp: boolean;
    practiceDays: string[];
  };
}

export interface UserGoal {
  type: 'presentation' | 'interview' | 'everyday';
  focus: string[];
  targetDate?: Date;
  weeklySessionTarget: number;
}