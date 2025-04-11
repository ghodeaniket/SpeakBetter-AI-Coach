/**
 * User validation
 * Functions for validating user data
 */

import { User, UserCreateRequest, UserUpdateRequest, UserCredentials } from '../models/user';
import { 
  ValidationResult, 
  validateRequired, 
  validateEmail, 
  validatePassword, 
  combineValidationResults,
  validResult 
} from './utils';

/**
 * Validates user credentials for authentication
 */
export function validateUserCredentials(credentials: UserCredentials): ValidationResult {
  return combineValidationResults(
    validateRequired(credentials.email, 'email'),
    validateEmail(credentials.email),
    validateRequired(credentials.password, 'password')
  );
}

/**
 * Validates a user creation request
 */
export function validateUserCreate(request: UserCreateRequest): ValidationResult {
  return combineValidationResults(
    validateRequired(request.uid, 'uid'),
    validateEmail(request.email)
  );
}

/**
 * Validates a user update request
 */
export function validateUserUpdate(request: UserUpdateRequest): ValidationResult {
  // No required fields for update - just validate format if provided
  if (request.settings?.notificationPreferences?.practiceDays) {
    const validDays = [
      'monday', 'tuesday', 'wednesday', 'thursday', 
      'friday', 'saturday', 'sunday'
    ];
    
    const invalidDay = request.settings.notificationPreferences.practiceDays.find(
      day => !validDays.includes(day)
    );
    
    if (invalidDay) {
      return {
        isValid: false,
        errorMessage: `Invalid practice day: ${invalidDay}`,
        errorCode: 'validation/invalid-format',
        field: 'settings.notificationPreferences.practiceDays'
      };
    }
  }
  
  return validResult();
}

/**
 * Validates a complete user object
 */
export function validateUser(user: User): ValidationResult {
  return combineValidationResults(
    validateRequired(user.uid, 'uid'),
    validateEmail(user.email),
    validateRequired(user.settings, 'settings'),
    validateRequired(user.settings.coachPersonality, 'settings.coachPersonality'),
    validateRequired(user.settings.selectedVoice, 'settings.selectedVoice')
  );
}
