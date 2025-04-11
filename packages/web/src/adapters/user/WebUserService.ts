/**
 * Web User Service
 * Implements user profile management for web platform using Firebase Firestore
 */

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

import {
  UserService,
  AuthService
} from '@speakbetter/core/services';
import {
  User,
  UserCreateRequest,
  UserUpdateRequest,
  UserSettings
} from '@speakbetter/core/models/user';
import {
  createAppError,
  ErrorCategory,
  ErrorCodes
} from '@speakbetter/core/models/error';
import {
  validateUserCreate,
  validateUserUpdate,
  validateOrThrow
} from '@speakbetter/core/validation';

/**
 * Web implementation of the User Service
 * Uses Firebase Firestore for user profile data
 */
export class WebUserService implements UserService {
  private db;
  private authService: AuthService;
  
  constructor(authService: AuthService) {
    this.authService = authService;
    
    // Get the Firebase app instance from the auth service
    // In a real implementation, we would handle this better
    const app = (this.authService as any).app;
    this.db = getFirestore(app);
  }
  
  /**
   * Get a user by ID
   */
  async getUserById(uid: string): Promise<User | null> {
    try {
      const userRef = doc(this.db, 'users', uid);
      const userSnapshot = await getDoc(userRef);
      
      if (!userSnapshot.exists()) {
        return null;
      }
      
      const data = userSnapshot.data();
      
      // Convert Firestore timestamps to Date objects
      return {
        uid: userSnapshot.id,
        displayName: data.displayName || null,
        email: data.email || null,
        photoURL: data.photoURL || null,
        emailVerified: data.emailVerified || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        settings: data.settings || {
          selectedVoice: 'default',
          coachPersonality: 'supportive',
          notificationPreferences: {
            email: true,
            inApp: true,
            practiceDays: ['monday', 'wednesday', 'friday']
          }
        }
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw createAppError(
        ErrorCodes.SERVER_INTERNAL_ERROR,
        'Failed to get user profile',
        {
          category: ErrorCategory.SERVER,
          details: `Error getting user with ID: ${uid}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Create a new user profile
   */
  async createUser(request: UserCreateRequest): Promise<User> {
    // Validate the request
    validateOrThrow(validateUserCreate(request));
    
    try {
      // Check if user already exists
      const existingUser = await this.getUserById(request.uid);
      if (existingUser) {
        throw createAppError(
          ErrorCodes.AUTH_EMAIL_ALREADY_IN_USE,
          'User already exists',
          { category: ErrorCategory.AUTHENTICATION }
        );
      }
      
      // Prepare user data
      const now = new Date();
      const userData = {
        displayName: request.displayName,
        email: request.email,
        photoURL: request.photoURL,
        emailVerified: false,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        settings: request.settings || {
          selectedVoice: 'default',
          coachPersonality: 'supportive',
          notificationPreferences: {
            email: true,
            inApp: true,
            practiceDays: ['monday', 'wednesday', 'friday']
          }
        }
      };
      
      // Save user to Firestore
      const userRef = doc(this.db, 'users', request.uid);
      await setDoc(userRef, userData);
      
      // Return the created user
      return {
        uid: request.uid,
        displayName: request.displayName,
        email: request.email,
        photoURL: request.photoURL,
        emailVerified: false,
        createdAt: now,
        lastLoginAt: now,
        settings: userData.settings
      };
    } catch (error) {
      console.error('Error creating user:', error);
      
      if ((error as any).code === ErrorCodes.AUTH_EMAIL_ALREADY_IN_USE) {
        throw error;
      }
      
      throw createAppError(
        ErrorCodes.SERVER_INTERNAL_ERROR,
        'Failed to create user profile',
        {
          category: ErrorCategory.SERVER,
          details: `Error creating user with ID: ${request.uid}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Update an existing user profile
   */
  async updateUser(uid: string, request: UserUpdateRequest): Promise<User> {
    // Validate the request
    validateOrThrow(validateUserUpdate(request));
    
    try {
      // Check if user exists
      const existingUser = await this.getUserById(uid);
      if (!existingUser) {
        throw createAppError(
          ErrorCodes.AUTH_USER_NOT_FOUND,
          'User not found',
          { category: ErrorCategory.AUTHENTICATION }
        );
      }
      
      // Prepare update data (only include fields that are provided)
      const updateData: any = {};
      
      if (request.displayName !== undefined) {
        updateData.displayName = request.displayName;
      }
      
      if (request.photoURL !== undefined) {
        updateData.photoURL = request.photoURL;
      }
      
      if (request.settings) {
        // Merge settings with existing settings
        updateData.settings = {
          ...existingUser.settings,
          ...request.settings,
          // Handle nested objects
          notificationPreferences: request.settings.notificationPreferences 
            ? {
                ...existingUser.settings.notificationPreferences,
                ...request.settings.notificationPreferences
              }
            : existingUser.settings.notificationPreferences
        };
      }
      
      // Update user in Firestore
      const userRef = doc(this.db, 'users', uid);
      await updateDoc(userRef, updateData);
      
      // Return the updated user
      return {
        ...existingUser,
        ...updateData,
        // Handle nested fields
        settings: updateData.settings || existingUser.settings
      };
    } catch (error) {
      console.error('Error updating user:', error);
      
      if ((error as any).code === ErrorCodes.AUTH_USER_NOT_FOUND) {
        throw error;
      }
      
      throw createAppError(
        ErrorCodes.SERVER_INTERNAL_ERROR,
        'Failed to update user profile',
        {
          category: ErrorCategory.SERVER,
          details: `Error updating user with ID: ${uid}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Delete a user profile
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      // Check if user exists
      const existingUser = await this.getUserById(uid);
      if (!existingUser) {
        throw createAppError(
          ErrorCodes.AUTH_USER_NOT_FOUND,
          'User not found',
          { category: ErrorCategory.AUTHENTICATION }
        );
      }
      
      // Delete user from Firestore
      const userRef = doc(this.db, 'users', uid);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      
      if ((error as any).code === ErrorCodes.AUTH_USER_NOT_FOUND) {
        throw error;
      }
      
      throw createAppError(
        ErrorCodes.SERVER_INTERNAL_ERROR,
        'Failed to delete user profile',
        {
          category: ErrorCategory.SERVER,
          details: `Error deleting user with ID: ${uid}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Get user settings
   */
  async getUserSettings(uid: string): Promise<UserSettings | null> {
    try {
      const user = await this.getUserById(uid);
      return user ? user.settings : null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw createAppError(
        ErrorCodes.SERVER_INTERNAL_ERROR,
        'Failed to get user settings',
        {
          category: ErrorCategory.SERVER,
          details: `Error getting settings for user with ID: ${uid}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Update user settings
   */
  async updateUserSettings(uid: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      // Get current user
      const existingUser = await this.getUserById(uid);
      if (!existingUser) {
        throw createAppError(
          ErrorCodes.AUTH_USER_NOT_FOUND,
          'User not found',
          { category: ErrorCategory.AUTHENTICATION }
        );
      }
      
      // Update user with new settings
      const updatedUser = await this.updateUser(uid, { settings });
      
      return updatedUser.settings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      
      if ((error as any).code === ErrorCodes.AUTH_USER_NOT_FOUND) {
        throw error;
      }
      
      throw createAppError(
        ErrorCodes.SERVER_INTERNAL_ERROR,
        'Failed to update user settings',
        {
          category: ErrorCategory.SERVER,
          details: `Error updating settings for user with ID: ${uid}`,
          originalError: error as Error
        }
      );
    }
  }
  
  /**
   * Check if a user exists
   */
  async userExists(uid: string): Promise<boolean> {
    try {
      const userRef = doc(this.db, 'users', uid);
      const userSnapshot = await getDoc(userRef);
      return userSnapshot.exists();
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }
  
  /**
   * Get the last login time for a user
   */
  async getLastLoginTime(uid: string): Promise<Date | null> {
    try {
      const user = await this.getUserById(uid);
      return user ? user.lastLoginAt : null;
    } catch (error) {
      console.error('Error getting last login time:', error);
      return null;
    }
  }
  
  /**
   * Update the last login time for a user
   */
  async updateLastLoginTime(uid: string): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', uid);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login time:', error);
      throw createAppError(
        ErrorCodes.SERVER_INTERNAL_ERROR,
        'Failed to update last login time',
        {
          category: ErrorCategory.SERVER,
          details: `Error updating last login time for user with ID: ${uid}`,
          originalError: error as Error
        }
      );
    }
  }
}
