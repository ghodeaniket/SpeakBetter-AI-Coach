/**
 * User model definition
 * Contains all user-related types and interfaces
 */

export interface UserSettings {
  /**
   * The voice selected for the AI coach
   * Can be a specific voice ID or a predefined option like "male" or "female"
   */
  selectedVoice: string;
  
  /**
   * The coaching personality style
   * Options include "supportive", "direct", or "analytical"
   */
  coachPersonality: 'supportive' | 'direct' | 'analytical';
  
  /**
   * Notification preferences for the user
   */
  notificationPreferences: {
    /**
     * Whether to send email notifications
     */
    email: boolean;
    
    /**
     * Whether to send in-app notifications
     */
    inApp: boolean;
    
    /**
     * Days of the week the user wants to practice
     */
    practiceDays: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>;
  };
}

/**
 * User interface representing a user in the application
 */
export interface User {
  /**
   * Unique identifier for the user
   * Typically the user's Firebase UID
   */
  uid: string;
  
  /**
   * User's display name
   */
  displayName: string | null;
  
  /**
   * User's email address
   */
  email: string | null;
  
  /**
   * URL to the user's profile photo
   */
  photoURL: string | null;
  
  /**
   * Timestamp when the user was created
   */
  createdAt: Date;
  
  /**
   * Timestamp when the user last logged in
   */
  lastLoginAt: Date;
  
  /**
   * User's application settings
   */
  settings: UserSettings;
  
  /**
   * Whether the user's email is verified
   */
  emailVerified: boolean;
}

/**
 * User create request model
 * Used when creating a new user
 */
export interface UserCreateRequest {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  settings?: Partial<UserSettings>;
}

/**
 * User update request model
 * Used when updating an existing user
 */
export interface UserUpdateRequest {
  displayName?: string;
  photoURL?: string;
  settings?: Partial<UserSettings>;
}

/**
 * User authentication credentials
 * Used for email/password sign-in
 */
export interface UserCredentials {
  email: string;
  password: string;
}
