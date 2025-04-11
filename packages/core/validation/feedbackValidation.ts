/**
 * Feedback validation
 * Functions for validating feedback data
 */

import { Feedback, FeedbackCreateRequest, FeedbackUpdateRequest, TextFeedback } from '../models/feedback';
import { 
  ValidationResult, 
  validateRequired, 
  validateRange,
  combineValidationResults,
  validResult 
} from './utils';

/**
 * Validates text feedback
 */
function validateTextFeedback(feedback: TextFeedback): ValidationResult {
  return combineValidationResults(
    validateRequired(feedback.positive, 'positive'),
    validateRequired(feedback.improvement, 'improvement'),
    validateRequired(feedback.suggestion, 'suggestion'),
    validateRequired(feedback.encouragement, 'encouragement')
  );
}

/**
 * Validates a feedback creation request
 */
export function validateFeedbackCreate(request: FeedbackCreateRequest): ValidationResult {
  const baseValidation = combineValidationResults(
    validateRequired(request.userId, 'userId'),
    validateRequired(request.sessionId, 'sessionId'),
    validateRequired(request.analysisId, 'analysisId'),
    validateRequired(request.textFeedback, 'textFeedback')
  );
  
  if (!baseValidation.isValid) {
    return baseValidation;
  }
  
  // Validate text feedback
  const textFeedbackValidation = validateTextFeedback(request.textFeedback);
  if (!textFeedbackValidation.isValid) {
    return textFeedbackValidation;
  }
  
  return validResult();
}

/**
 * Validates a feedback update request
 */
export function validateFeedbackUpdate(request: FeedbackUpdateRequest): ValidationResult {
  // Validate userRating if provided
  if (request.userRating !== undefined) {
    const ratingValidation = validateRange(request.userRating, 1, 5, 'userRating');
    if (!ratingValidation.isValid) {
      return ratingValidation;
    }
  }
  
  // Validate partial text feedback if provided
  if (request.textFeedback) {
    const validations: ValidationResult[] = [];
    
    // Only validate fields that are provided
    if (request.textFeedback.positive !== undefined) {
      validations.push(validateRequired(request.textFeedback.positive, 'textFeedback.positive'));
    }
    
    if (request.textFeedback.improvement !== undefined) {
      validations.push(validateRequired(request.textFeedback.improvement, 'textFeedback.improvement'));
    }
    
    if (request.textFeedback.suggestion !== undefined) {
      validations.push(validateRequired(request.textFeedback.suggestion, 'textFeedback.suggestion'));
    }
    
    if (request.textFeedback.encouragement !== undefined) {
      validations.push(validateRequired(request.textFeedback.encouragement, 'textFeedback.encouragement'));
    }
    
    return combineValidationResults(...validations);
  }
  
  return validResult();
}

/**
 * Validates a complete feedback object
 */
export function validateFeedback(feedback: Feedback): ValidationResult {
  const baseValidation = combineValidationResults(
    validateRequired(feedback.id, 'id'),
    validateRequired(feedback.userId, 'userId'),
    validateRequired(feedback.sessionId, 'sessionId'),
    validateRequired(feedback.analysisId, 'analysisId'),
    validateRequired(feedback.textFeedback, 'textFeedback'),
    validateRequired(feedback.createdAt, 'createdAt')
  );
  
  if (!baseValidation.isValid) {
    return baseValidation;
  }
  
  // Validate text feedback
  const textFeedbackValidation = validateTextFeedback(feedback.textFeedback);
  if (!textFeedbackValidation.isValid) {
    return textFeedbackValidation;
  }
  
  // Validate userRating if provided
  if (feedback.userRating !== undefined) {
    const ratingValidation = validateRange(feedback.userRating, 1, 5, 'userRating');
    if (!ratingValidation.isValid) {
      return ratingValidation;
    }
  }
  
  return validResult();
}
