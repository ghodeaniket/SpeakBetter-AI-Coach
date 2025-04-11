/**
 * Goal validation
 * Functions for validating goal data
 */

import { Goal, GoalCreateRequest, GoalUpdateRequest, GoalType, FocusArea } from '../models/goal';
import { 
  ValidationResult, 
  validateRequired, 
  validateRange,
  validateNonEmptyArray,
  combineValidationResults,
  validResult 
} from './utils';

/**
 * Validates focus areas
 */
function validateFocusAreas(focusAreas: FocusArea[]): ValidationResult {
  const validFocusAreas = Object.values(FocusArea);
  
  for (const area of focusAreas) {
    if (!validFocusAreas.includes(area)) {
      return {
        isValid: false,
        errorMessage: `Invalid focus area: ${area}`,
        errorCode: 'validation/invalid-format',
        field: 'focusAreas'
      };
    }
  }
  
  return validResult();
}

/**
 * Validates a goal creation request
 */
export function validateGoalCreate(request: GoalCreateRequest): ValidationResult {
  const baseValidation = combineValidationResults(
    validateRequired(request.userId, 'userId'),
    validateRequired(request.type, 'type'),
    validateRequired(request.focusAreas, 'focusAreas'),
    validateNonEmptyArray(request.focusAreas, 'focusAreas'),
    validateRequired(request.weeklySessionTarget, 'weeklySessionTarget'),
    validateRange(request.weeklySessionTarget, 1, 14, 'weeklySessionTarget')
  );
  
  if (!baseValidation.isValid) {
    return baseValidation;
  }
  
  // Validate goal type
  const validTypes = Object.values(GoalType);
  if (!validTypes.includes(request.type)) {
    return {
      isValid: false,
      errorMessage: `Invalid goal type: ${request.type}`,
      errorCode: 'validation/invalid-format',
      field: 'type'
    };
  }
  
  // Custom goal requires a title
  if (request.type === GoalType.CUSTOM && (!request.title || request.title.trim() === '')) {
    return {
      isValid: false,
      errorMessage: 'Title is required for custom goals',
      errorCode: 'validation/required-field',
      field: 'title'
    };
  }
  
  // Validate focus areas
  const focusAreasValidation = validateFocusAreas(request.focusAreas);
  if (!focusAreasValidation.isValid) {
    return focusAreasValidation;
  }
  
  return validResult();
}

/**
 * Validates a goal update request
 */
export function validateGoalUpdate(request: GoalUpdateRequest): ValidationResult {
  const validations: ValidationResult[] = [];
  
  // Validate weeklySessionTarget if provided
  if (request.weeklySessionTarget !== undefined) {
    validations.push(
      validateRange(request.weeklySessionTarget, 1, 14, 'weeklySessionTarget')
    );
  }
  
  // Validate progress percentage if provided
  if (request.progressPercentage !== undefined) {
    validations.push(
      validateRange(request.progressPercentage, 0, 100, 'progressPercentage')
    );
  }
  
  // Validate focus areas if provided
  if (request.focusAreas && request.focusAreas.length > 0) {
    validations.push(
      validateFocusAreas(request.focusAreas)
    );
  }
  
  return combineValidationResults(...validations);
}

/**
 * Validates a complete goal object
 */
export function validateGoal(goal: Goal): ValidationResult {
  const baseValidation = combineValidationResults(
    validateRequired(goal.id, 'id'),
    validateRequired(goal.userId, 'userId'),
    validateRequired(goal.type, 'type'),
    validateRequired(goal.focusAreas, 'focusAreas'),
    validateNonEmptyArray(goal.focusAreas, 'focusAreas'),
    validateRequired(goal.weeklySessionTarget, 'weeklySessionTarget'),
    validateRange(goal.weeklySessionTarget, 1, 14, 'weeklySessionTarget'),
    validateRequired(goal.progressPercentage, 'progressPercentage'),
    validateRange(goal.progressPercentage, 0, 100, 'progressPercentage'),
    validateRequired(goal.createdAt, 'createdAt'),
    validateRequired(goal.updatedAt, 'updatedAt')
  );
  
  if (!baseValidation.isValid) {
    return baseValidation;
  }
  
  // Validate goal type
  const validTypes = Object.values(GoalType);
  if (!validTypes.includes(goal.type)) {
    return {
      isValid: false,
      errorMessage: `Invalid goal type: ${goal.type}`,
      errorCode: 'validation/invalid-format',
      field: 'type'
    };
  }
  
  // Custom goal requires a title
  if (goal.type === GoalType.CUSTOM && (!goal.title || goal.title.trim() === '')) {
    return {
      isValid: false,
      errorMessage: 'Title is required for custom goals',
      errorCode: 'validation/required-field',
      field: 'title'
    };
  }
  
  // Validate focus areas
  const focusAreasValidation = validateFocusAreas(goal.focusAreas);
  if (!focusAreasValidation.isValid) {
    return focusAreasValidation;
  }
  
  return validResult();
}
