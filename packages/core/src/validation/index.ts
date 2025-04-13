// Validation functions

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a string is not empty
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validates if a number is within a range
 */
export function isValueInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validates if an audio duration is acceptable
 */
export function isValidAudioDuration(seconds: number): boolean {
  // Minimum 5 seconds, maximum 5 minutes (300 seconds)
  return isValueInRange(seconds, 5, 300);
}
