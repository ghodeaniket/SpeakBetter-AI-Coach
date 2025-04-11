/**
 * Session validation
 * Functions for validating session data
 */

import { Session, SessionCreateRequest, SessionUpdateRequest, SessionType } from '../models/session';
import { 
  ValidationResult, 
  validateRequired, 
  combineValidationResults,
  validResult 
} from './utils';

/**
 * Validates a session creation request
 */
export function validateSessionCreate(request: SessionCreateRequest): ValidationResult {
  const baseValidation = combineValidationResults(
    validateRequired(request.userId, 'userId'),
    validateRequired(request.type, 'type'),
    validateRequired(request.title, 'title')
  );
  
  if (!baseValidation.isValid) {
    return baseValidation;
  }
  
  // Type-specific validations
  if (request.type === SessionType.GUIDED) {
    if (!request.guidedText || request.guidedText.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Guided text is required for guided practice sessions',
        errorCode: 'validation/required-field',
        field: 'guidedText'
      };
    }
  }
  
  if (request.type === SessionType.QA) {
    if (!request.qaQuestions || request.qaQuestions.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Questions are required for Q&A practice sessions',
        errorCode: 'validation/required-field',
        field: 'qaQuestions'
      };
    }
  }
  
  return validResult();
}

/**
 * Validates a session update request
 */
export function validateSessionUpdate(request: SessionUpdateRequest): ValidationResult {
  // No required fields for update
  if (request.durationSeconds !== undefined && request.durationSeconds < 0) {
    return {
      isValid: false,
      errorMessage: 'Duration must be a positive number',
      errorCode: 'validation/out-of-range',
      field: 'durationSeconds'
    };
  }
  
  return validResult();
}

/**
 * Validates a complete session object
 */
export function validateSession(session: Session): ValidationResult {
  const baseValidation = combineValidationResults(
    validateRequired(session.id, 'id'),
    validateRequired(session.userId, 'userId'),
    validateRequired(session.type, 'type'),
    validateRequired(session.title, 'title'),
    validateRequired(session.status, 'status'),
    validateRequired(session.createdAt, 'createdAt'),
    validateRequired(session.updatedAt, 'updatedAt')
  );
  
  if (!baseValidation.isValid) {
    return baseValidation;
  }
  
  // Type-specific validations
  if (session.type === SessionType.GUIDED && (!session.guidedText || session.guidedText.trim() === '')) {
    return {
      isValid: false,
      errorMessage: 'Guided text is required for guided practice sessions',
      errorCode: 'validation/required-field',
      field: 'guidedText'
    };
  }
  
  if (session.type === SessionType.QA && (!session.qaQuestions || session.qaQuestions.length === 0)) {
    return {
      isValid: false,
      errorMessage: 'Questions are required for Q&A practice sessions',
      errorCode: 'validation/required-field',
      field: 'qaQuestions'
    };
  }
  
  return validResult();
}
