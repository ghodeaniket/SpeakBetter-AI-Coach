/**
 * Custom application error class
 */
export class AppError extends Error {
  /**
   * Error code
   */
  code: string;

  /**
   * Error category
   */
  category: string;

  /**
   * Additional error details
   */
  details?: Record<string, unknown>;

  /**
   * Create a new AppError
   * @param message Error message
   * @param code Error code
   * @param category Error category
   * @param details Additional error details
   */
  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    category: string = 'app',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.category = category;
    this.details = details;
  }
}
