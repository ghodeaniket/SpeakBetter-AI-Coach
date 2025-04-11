import { 
  UserService, 
  User, 
  UserCreateRequest, 
  UserUpdateRequest, 
  UserSettings,
  AppError
} from '@speakbetter/core';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';

/**
 * Firebase implementation of the UserService interface
 */
export class FirebaseUserService implements UserService {
  private db;
  private readonly usersCollection = 'users';
  
  constructor(app: FirebaseApp) {
    this.db = getFirestore(app);
  }
  
  /**
   * Get a user by ID
   */
  async getUserById(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(this.db, this.usersCollection, uid));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      
      return {
        uid: userDoc.id,
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL,
        emailVerified: userData.emailVerified,
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
        settings: userData.settings || {
          selectedVoice: 'default',
          coachPersonality: 'supportive',
          notificationPreferences: {
            email: true,
            inApp: true,
            practiceDays: ['monday', 'wednesday', 'friday']
          }
        }
      };
    } catch (error: any) {
      const appError: AppError = {
        code: 'user/get-failed',
        message: `Failed to get user: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Create a new user profile
   */
  async createUser(request: UserCreateRequest): Promise<User> {
    try {
      const now = new Date();
      const defaultSettings: UserSettings = {
        selectedVoice: 'default',
        coachPersonality: 'supportive',
        notificationPreferences: {
          email: true,
          inApp: true,
          practiceDays: ['monday', 'wednesday', 'friday']
        }
      };
      
      const userData = {
        displayName: request.displayName,
        email: request.email,
        photoURL: request.photoURL,
        emailVerified: false,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        settings: request.settings || defaultSettings
      };
      
      await setDoc(doc(this.db, this.usersCollection, request.uid), userData);
      
      return {
        uid: request.uid,
        displayName: request.displayName,
        email: request.email,
        photoURL: request.photoURL,
        emailVerified: false,
        createdAt: now,
        lastLoginAt: now,
        settings: request.settings || defaultSettings
      };
    } catch (error: any) {
      const appError: AppError = {
        code: 'user/create-failed',
        message: `Failed to create user: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Update an existing user profile
   */
  async updateUser(uid: string, request: UserUpdateRequest): Promise<User> {
    try {
      const userRef = doc(this.db, this.usersCollection, uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error(`User with ID ${uid} does not exist`);
      }
      
      const updateData: Record<string, any> = {};
      
      if (request.displayName !== undefined) {
        updateData.displayName = request.displayName;
      }
      
      if (request.photoURL !== undefined) {
        updateData.photoURL = request.photoURL;
      }
      
      if (request.settings) {
        const currentData = userDoc.data();
        updateData.settings = {
          ...currentData.settings,
          ...request.settings
        };
      }
      
      await updateDoc(userRef, updateData);
      
      // Get the updated user data
      const updatedUserDoc = await getDoc(userRef);
      const userData = updatedUserDoc.data();
      
      return {
        uid: updatedUserDoc.id,
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL,
        emailVerified: userData.emailVerified,
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
        settings: userData.settings
      };
    } catch (error: any) {
      const appError: AppError = {
        code: 'user/update-failed',
        message: `Failed to update user: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Delete a user profile
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, this.usersCollection, uid));
    } catch (error: any) {
      const appError: AppError = {
        code: 'user/delete-failed',
        message: `Failed to delete user: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Get user settings
   */
  async getUserSettings(uid: string): Promise<UserSettings | null> {
    try {
      const userDoc = await getDoc(doc(this.db, this.usersCollection, uid));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      return userData.settings || null;
    } catch (error: any) {
      const appError: AppError = {
        code: 'user/get-settings-failed',
        message: `Failed to get user settings: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Update user settings
   */
  async updateUserSettings(uid: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const userRef = doc(this.db, this.usersCollection, uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error(`User with ID ${uid} does not exist`);
      }
      
      const userData = userDoc.data();
      const updatedSettings = {
        ...userData.settings,
        ...settings
      };
      
      await updateDoc(userRef, {
        settings: updatedSettings
      });
      
      return updatedSettings;
    } catch (error: any) {
      const appError: AppError = {
        code: 'user/update-settings-failed',
        message: `Failed to update user settings: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Check if a user exists
   */
  async userExists(uid: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(this.db, this.usersCollection, uid));
      return userDoc.exists();
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get the last login time for a user
   */
  async getLastLoginTime(uid: string): Promise<Date | null> {
    try {
      const userDoc = await getDoc(doc(this.db, this.usersCollection, uid));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      return userData.lastLoginAt?.toDate() || null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Update the last login time for a user
   */
  async updateLastLoginTime(uid: string): Promise<void> {
    try {
      const userRef = doc(this.db, this.usersCollection, uid);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp()
      });
    } catch (error: any) {
      const appError: AppError = {
        code: 'user/update-last-login-failed',
        message: `Failed to update last login time: ${error.message}`,
        originalError: error
      };
      throw appError;
    }
  }
}

/**
 * Create a Firebase user service instance
 */
export function createFirebaseUserService(app: FirebaseApp): UserService {
  return new FirebaseUserService(app);
}
