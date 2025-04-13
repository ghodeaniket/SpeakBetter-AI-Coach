import firestore from '@react-native-firebase/firestore';
import { UserPreferences } from '../../hooks/useUserPreferences';

class UserService {
  private usersCollection = firestore().collection('users');
  
  /**
   * Get user profile data by ID
   */
  async getUserProfile(userId: string) {
    try {
      const userDoc = await this.usersCollection.doc(userId).get();
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }
  
  /**
   * Update user notification token for push notifications
   */
  async updateUserNotificationToken(userId: string, token: string) {
    try {
      await this.usersCollection.doc(userId).update({
        notificationTokens: firestore.FieldValue.arrayUnion(token),
        lastUpdated: firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating notification token:', error);
      throw error;
    }
  }
  
  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const userDoc = await this.usersCollection.doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      
      // Return preferences if they exist, or create default preferences
      return userData?.preferences || this.getDefaultPreferences();
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  }
  
  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: UserPreferences) {
    try {
      await this.usersCollection.doc(userId).update({
        preferences,
        lastUpdated: firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
  
  /**
   * Get default user preferences
   */
  getDefaultPreferences(): UserPreferences {
    return {
      notifications: {
        practiceReminders: true,
        milestones: true,
        feedbackNotifications: true,
        reminderTime: '18:00', // 6:00 PM
        reminderDays: [1, 3, 5], // Monday, Wednesday, Friday
      },
      theme: 'system',
      voicePreference: 'female',
      coachingStyle: 'supportive',
    };
  }
}

export const userService = new UserService();
