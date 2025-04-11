/**
 * Validation utilities
 * Generic validation functions used across the application
 */

import { createAppError, ErrorCategory, ErrorCodes } from '../models/error';

/**
 * Validation result interface
 */
export interface ValidationResult {
  /**
   * Whether the validation was successful
   */
  isValid: boolean;
  
  /**
   * Error message if validation failed
   */
  errorMessage?: string;
  
  /**
   * Error code if validation failed
   */
  errorCode?: string;
  
  /**
   * Field that failed validation
   */
  field?: string;
}

/**
 * Creates a successful validation result
 */
export function validResult(): ValidationResult {
  return {
    isValid: true
  };
}

/**
 * Creates a failed validation result
 */
export function invalidResult(
  errorMessage: string, 
  field?: string, 
  errorCode: string = ErrorCodes.VALIDATION_INVALID_FORMAT
): ValidationResult {
  return {
    isValid: false,
    errorMessage,
    errorCode,
    field
  };
}

/**
 * Checks if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Validates that a required field exists
 */
export function validateRequired(value: any, fieldName: string): ValidationResult {
  if (!isDefined(value) || (typeof value === 'string' && value.trim() === '')) {
    return invalidResult(
      `${fieldName} is required`,
      fieldName,
      ErrorCodes.VALIDATION_REQUIRED_FIELD
    );
  }
  return validResult();
}

/**
 * Validates that a field matches a regular expression
 */
export function validatePattern(
  value: string | null | undefined, 
  pattern: RegExp, 
  fieldName: string,
  message?: string
): ValidationResult {
  // If value is not provided, consider it valid (use validateRequired separately)
  if (!isDefined(value)) {
    return validResult();
  }
  
  if (!pattern.test(value)) {
    return invalidResult(
      message || `${fieldName} has an invalid format`,
      fieldName
    );
  }
  
  return validResult();
}

/**
 * Validates that a numeric value is within a range
 */
export function validateRange(
  value: number | null | undefined,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  // If value is not provided, consider it valid (use validateRequired separately)
  if (!isDefined(value)) {
    return validResult();
  }
  
  if (value < min || value > max) {
    return invalidResult(
      `${fieldName} must be between ${min} and ${max}`,
      fieldName,
      ErrorCodes.VALIDATION_OUT_OF_RANGE
    );
  }
  
  return validResult();
}

/**
 * Validates that an array has at least one item
 */
export function validateNonEmptyArray<T>(
  value: T[] | null | undefined,
  fieldName: string
): ValidationResult {
  if (!isDefined(value) || value.length === 0) {
    return invalidResult(
      `${fieldName} must contain at least one item`,
      fieldName,
      ErrorCodes.VALIDATION_REQUIRED_FIELD
    );
  }
  
  return validResult();
}

/**
 * Validates an email address format
 */
export function validateEmail(email: string | null | undefined): ValidationResult {
  if (!isDefined(email)) {
    return validResult();
  }
  
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return validatePattern(
    email,
    emailPattern,
    'email',
    'Email address is not valid'
  );
}

/**
 * Validates a password strength
 */
export function validatePassword(password: string | null | undefined): ValidationResult {
  if (!isDefined(password)) {
    return validResult();
  }
  
  if (password.length < 8) {
    return invalidResult(
      'Password must be at least 8 characters long',
      'password',
      ErrorCodes.AUTH_WEAK_PASSWORD
    );
  }
  
  return validResult();
}

/**
 * Combines multiple validation results
 * Returns the first failed validation or a valid result if all pass
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  for (const result of results) {
    if (!result.isValid) {
      return result;
    }
  }
  
  return validResult();
}

/**
 * Throws an error if validation fails
 */
export function validateOrThrow(result: ValidationResult): void {
  if (!result.isValid) {
    throw createAppError(
      result.errorCode || ErrorCodes.VALIDATION_INVALID_FORMAT,
      result.errorMessage || 'Validation failed',
      {
        details: `Validation failed for field: ${result.field}`,
        category: ErrorCategory.VALIDATION,
        recoverable: true,
        recoveryAction: 'Please check the input and try again'
      }
    );
  }
}
