import { User } from '@speakbetter/core';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserSettings {
  selectedVoice: string;
  coachPersonality: string;
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
    practiceDays: string[];
  };
}

export interface UserGoal {
  type: string;
  focus: string[];
  targetDate?: Date;
  weeklySessionTarget: number;
}

/**
 * User profile service for React Native
 */
export class UserProfileAdapter {
  private usersCollection = firestore().collection('users');
  
  /**
   * Get user profile from Firestore
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await this.usersCollection.doc(userId).get();
      
      if (!userDoc.exists) {
        return null;
      }
      
      return userDoc.data() as User;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
  
  /**
   * Create or update user profile in Firestore
   */
  async updateUserProfile(user: User): Promise<void> {
    try {
      await this.usersCollection.doc(user.uid).set(user, { merge: true });
      
      // Store critical settings in AsyncStorage for offline access
      await AsyncStorage.setItem('user_settings', JSON.stringify(user.settings));
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }
  
  /**
   * Update user settings
   */
  async updateUserSettings(userId: string, settings: UserSettings): Promise<void> {
    try {
      await this.usersCollection.doc(userId).update({
        settings: settings
      });
      
      // Update local storage
      await AsyncStorage.setItem('user_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw new Error('Failed to update user settings');
    }
  }
  
  /**
   * Update user goals
   */
  async updateUserGoals(userId: string, goals: UserGoal[]): Promise<void> {
    try {
      await this.usersCollection.doc(userId).update({
        goals: goals
      });
    } catch (error) {
      console.error('Error updating user goals:', error);
      throw new Error('Failed to update user goals');
    }
  }
  
  /**
   * Get user settings from local storage (for offline access)
   */
  async getCachedUserSettings(): Promise<UserSettings | null> {
    try {
      const settings = await AsyncStorage.getItem('user_settings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting cached user settings:', error);
      return null;
    }
  }
  
  /**
   * Create a new user profile when a user signs up
   */
  async createUserProfile(user: User): Promise<void> {
    try {
      const { uid, displayName, email, photoURL } = user;
      
      // Default user profile data
      const userData = {
        uid,
        displayName,
        email,
        photoURL,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        settings: {
          selectedVoice: 'default',
          coachPersonality: 'supportive',
          notificationPreferences: {
            email: true,
            inApp: true,
            practiceDays: ['monday', 'wednesday', 'friday']
          }
        },
        goals: [
          {
            type: 'presentation',
            focus: ['pace', 'fillers'],
            weeklySessionTarget: 3
          }
        ]
      };
      
      await this.usersCollection.doc(uid).set(userData);
      
      // Store critical settings in AsyncStorage for offline access
      await AsyncStorage.setItem('user_settings', JSON.stringify(userData.settings));
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }
  
  /**
   * Update user profile photo
   */
  async updateProfilePhoto(userId: string, photoURL: string): Promise<void> {
    try {
      await this.usersCollection.doc(userId).update({
        photoURL: photoURL
      });
      
      // Update auth user profile
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.updateProfile({
          photoURL: photoURL
        });
      }
    } catch (error) {
      console.error('Error updating profile photo:', error);
      throw new Error('Failed to update profile photo');
    }
  }
  
  /**
   * Update user display name
   */
  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    try {
      await this.usersCollection.doc(userId).update({
        displayName: displayName
      });
      
      // Update auth user profile
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.updateProfile({
          displayName: displayName
        });
      }
    } catch (error) {
      console.error('Error updating display name:', error);
      throw new Error('Failed to update display name');
    }
  }
}

// Export a singleton instance
export const userProfileAdapter = new UserProfileAdapter();