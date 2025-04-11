/**
 * Analysis validation
 * Functions for validating analysis data
 */

import { Analysis, AnalysisCreateRequest, AnalysisUpdateRequest, SpeechMetrics } from '../models/analysis';
import { 
  ValidationResult, 
  validateRequired, 
  validateRange,
  combineValidationResults,
  validResult 
} from './utils';

/**
 * Validates speech metrics
 */
function validateSpeechMetrics(metrics: SpeechMetrics): ValidationResult {
  return combineValidationResults(
    validateRequired(metrics.wordsPerMinute, 'wordsPerMinute'),
    validateRequired(metrics.totalWords, 'totalWords'),
    validateRequired(metrics.durationSeconds, 'durationSeconds'),
    validateRequired(metrics.fillerWordCounts, 'fillerWordCounts'),
    validateRequired(metrics.totalFillerWords, 'totalFillerWords'),
    validateRequired(metrics.fillerWordPercentage, 'fillerWordPercentage'),
    validateRequired(metrics.clarityScore, 'clarityScore'),
    validateRange(metrics.clarityScore, 0, 100, 'clarityScore'),
    validateRange(metrics.fillerWordPercentage, 0, 100, 'fillerWordPercentage')
  );
}

/**
 * Validates an analysis creation request
 */
export function validateAnalysisCreate(request: AnalysisCreateRequest): ValidationResult {
  const baseValidation = combineValidationResults(
    validateRequired(request.userId, 'userId'),
    validateRequired(request.sessionId, 'sessionId'),
    validateRequired(request.transcription, 'transcription'),
    validateRequired(request.metrics, 'metrics'),
    validateRequired(request.wordTimings, 'wordTimings'),
    validateRequired(request.fillerInstances, 'fillerInstances')
  );
  
  if (!baseValidation.isValid) {
    return baseValidation;
  }
  
  // Validate metrics
  const metricsValidation = validateSpeechMetrics(request.metrics);
  if (!metricsValidation.isValid) {
    return metricsValidation;
  }
  
  return validResult();
}

/**
 * Validates an analysis update request
 */
export function validateAnalysisUpdate(request: AnalysisUpdateRequest): ValidationResult {
  // No required fields for update
  if (request.metrics) {
    // Only validate metrics that are provided
    const validations: ValidationResult[] = [];
    
    if (request.metrics.clarityScore !== undefined) {
      validations.push(
        validateRange(request.metrics.clarityScore, 0, 100, 'metrics.clarityScore')
      );
    }
    
    if (request.metrics.fillerWordPercentage !== undefined) {
      validations.push(
        validateRange(request.metrics.fillerWordPercentage, 0, 100, 'metrics.fillerWordPercentage')
      );
    }
    
    return combineValidationResults(...validations);
  }
  
  return validResult();
}

/**
 * Validates a complete analysis object
 */
export function validateAnalysis(analysis: Analysis): ValidationResult {
  const baseValidation = combineValidationResults(
    validateRequired(analysis.id, 'id'),
    validateRequired(analysis.userId, 'userId'),
    validateRequired(analysis.sessionId, 'sessionId'),
    validateRequired(analysis.transcription, 'transcription'),
    validateRequired(analysis.metrics, 'metrics'),
    validateRequired(analysis.wordTimings, 'wordTimings'),
    validateRequired(analysis.fillerInstances, 'fillerInstances'),
    validateRequired(analysis.createdAt, 'createdAt')
  );
  
  if (!baseValidation.isValid) {
    return baseValidation;
  }
  
  // Validate metrics
  const metricsValidation = validateSpeechMetrics(analysis.metrics);
  if (!metricsValidation.isValid) {
    return metricsValidation;
  }
  
  return validResult();
}
