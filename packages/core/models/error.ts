/**
 * Error model definition
 * Contains application-specific error types and interfaces
 */

/**
 * Enum for error categories
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  SERVER = 'server',
  STORAGE = 'storage',
  AUDIO = 'audio',
  SPEECH = 'speech',
  PERMISSION = 'permission',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

/**
 * Enum for error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Application error interface
 * Used for structured error handling across the application
 */
export interface AppError {
  /**
   * Unique error code
   */
  code: string;
  
  /**
   * Error message for users
   */
  message: string;
  
  /**
   * Technical details for debugging (not shown to users)
   */
  details?: string;
  
  /**
   * Error category
   */
  category: ErrorCategory;
  
  /**
   * Error severity level
   */
  severity: ErrorSeverity;
  
  /**
   * Original error if this wraps another error
   */
  originalError?: Error;
  
  /**
   * Whether the error is recoverable by the user
   */
  recoverable: boolean;
  
  /**
   * Suggested recovery action (if recoverable)
   */
  recoveryAction?: string;
}

/**
 * Error class implementation
 * Extends Error to provide structured error handling
 */
export class AppErrorImpl extends Error implements AppError {
  public code: string;
  public details?: string;
  public category: ErrorCategory;
  public severity: ErrorSeverity;
  public originalError?: Error;
  public recoverable: boolean;
  public recoveryAction?: string;

  constructor(
    code: string,
    message: string,
    options: {
      details?: string;
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      originalError?: Error;
      recoverable?: boolean;
      recoveryAction?: string;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = options.details;
    this.category = options.category || ErrorCategory.UNKNOWN;
    this.severity = options.severity || ErrorSeverity.ERROR;
    this.originalError = options.originalError;
    this.recoverable = options.recoverable !== undefined ? options.recoverable : false;
    this.recoveryAction = options.recoveryAction;
  }
}

/**
 * Error factory function
 * Creates a structured AppError object
 */
export function createAppError(
  code: string,
  message: string,
  options: {
    details?: string;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    originalError?: Error;
    recoverable?: boolean;
    recoveryAction?: string;
  } = {}
): AppError {
  return {
    code,
    message,
    details: options.details,
    category: options.category || ErrorCategory.UNKNOWN,
    severity: options.severity || ErrorSeverity.ERROR,
    originalError: options.originalError,
    recoverable: options.recoverable !== undefined ? options.recoverable : false,
    recoveryAction: options.recoveryAction,
  };
}

/**
 * Common application error codes
 */
export const ErrorCodes = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'auth/invalid-credentials',
  AUTH_USER_NOT_FOUND: 'auth/user-not-found',
  AUTH_EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  AUTH_WEAK_PASSWORD: 'auth/weak-password',
  AUTH_REQUIRES_RECENT_LOGIN: 'auth/requires-recent-login',
  AUTH_OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
  
  // Network errors
  NETWORK_OFFLINE: 'network/offline',
  NETWORK_REQUEST_FAILED: 'network/request-failed',
  NETWORK_TIMEOUT: 'network/timeout',
  NETWORK_ERROR: 'network/error',
  
  // Storage errors
  STORAGE_UPLOAD_FAILED: 'storage/upload-failed',
  STORAGE_DOWNLOAD_FAILED: 'storage/download-failed',
  STORAGE_DELETE_FAILED: 'storage/delete-failed',
  STORAGE_NOT_FOUND: 'storage/not-found',
  
  // Audio errors
  AUDIO_RECORDING_NOT_SUPPORTED: 'audio/recording-not-supported',
  AUDIO_RECORDING_PERMISSION_DENIED: 'audio/recording-permission-denied',
  AUDIO_RECORDING_ERROR: 'audio/recording-error',
  AUDIO_PLAYBACK_ERROR: 'audio/playback-error',
  
  // Mobile specific audio errors
  PERMISSION_DENIED: 'permission/denied',
  ALREADY_RECORDING: 'audio/already-recording',
  NOT_RECORDING: 'audio/not-recording',
  RECORDING_INTERRUPTED: 'audio/recording-interrupted',
  BACKGROUND_RECORDING_ERROR: 'audio/background-recording-error',
  PLAYBACK_INTERRUPTED: 'audio/playback-interrupted',
  NOT_PLAYING: 'audio/not-playing',
  MEMORY_ERROR: 'system/memory-error',
  
  // Speech errors
  SPEECH_RECOGNITION_FAILED: 'speech/recognition-failed',
  SPEECH_RECOGNITION_ERROR: 'speech/recognition-error',
  SPEECH_SYNTHESIS_ERROR: 'speech/synthesis-error',
  SPEECH_SYNTHESIS_FAILED: 'speech/synthesis-failed',
  SPEECH_NO_SPEECH_DETECTED: 'speech/no-speech-detected',
  
  // Validation errors
  VALIDATION_REQUIRED_FIELD: 'validation/required-field',
  VALIDATION_INVALID_FORMAT: 'validation/invalid-format',
  VALIDATION_OUT_OF_RANGE: 'validation/out-of-range',
  
  // Server errors
  SERVER_INTERNAL_ERROR: 'server/internal-error',
  SERVER_UNAVAILABLE: 'server/unavailable',
  SERVER_QUOTA_EXCEEDED: 'server/quota-exceeded',
  
  // Unknown errors
  UNKNOWN_ERROR: 'unknown/error'
};
