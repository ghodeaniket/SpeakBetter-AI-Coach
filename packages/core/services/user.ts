/**
 * User Service Interface
 * Provides user profile management functionality
 */

import { User, UserCreateRequest, UserUpdateRequest, UserSettings } from '../models/user';

/**
 * User service interface
 * Platform-agnostic interface for user profile operations
 */
export interface UserService {
  /**
   * Get a user by ID
   */
  getUserById(uid: string): Promise<User | null>;
  
  /**
   * Create a new user profile
   */
  createUser(request: UserCreateRequest): Promise<User>;
  
  /**
   * Update an existing user profile
   */
  updateUser(uid: string, request: UserUpdateRequest): Promise<User>;
  
  /**
   * Delete a user profile
   */
  deleteUser(uid: string): Promise<void>;
  
  /**
   * Get user settings
   */
  getUserSettings(uid: string): Promise<UserSettings | null>;
  
  /**
   * Update user settings
   */
  updateUserSettings(uid: string, settings: Partial<UserSettings>): Promise<UserSettings>;
  
  /**
   * Check if a user exists
   */
  userExists(uid: string): Promise<boolean>;
  
  /**
   * Get the last login time for a user
   */
  getLastLoginTime(uid: string): Promise<Date | null>;
  
  /**
   * Update the last login time for a user
   */
  updateLastLoginTime(uid: string): Promise<void>;
}
