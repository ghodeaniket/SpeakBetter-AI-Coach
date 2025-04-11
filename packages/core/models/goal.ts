/**
 * Goal model definition
 * Contains all goal-related types and interfaces
 */

/**
 * Enum for goal types
 */
export enum GoalType {
  PRESENTATION = 'presentation',
  INTERVIEW = 'interview',
  EVERYDAY = 'everyday',
  CUSTOM = 'custom'
}

/**
 * Enum for improvement focus areas
 */
export enum FocusArea {
  PACE = 'pace',
  FILLERS = 'fillers',
  CLARITY = 'clarity',
  CONFIDENCE = 'confidence',
  ARTICULATION = 'articulation',
  VOLUME = 'volume',
  PAUSES = 'pauses'
}

/**
 * Goal interface representing a user's improvement goal
 */
export interface Goal {
  /**
   * Unique identifier for the goal
   */
  id: string;
  
  /**
   * User ID that the goal belongs to
   */
  userId: string;
  
  /**
   * Type of goal
   */
  type: GoalType;
  
  /**
   * Title of the goal (for custom goals)
   */
  title?: string;
  
  /**
   * Description of the goal
   */
  description?: string;
  
  /**
   * Specific areas to focus on
   */
  focusAreas: FocusArea[];
  
  /**
   * Target date for achieving the goal
   */
  targetDate?: Date;
  
  /**
   * Number of sessions per week target
   */
  weeklySessionTarget: number;
  
  /**
   * Whether this is the user's primary goal
   */
  isPrimary: boolean;
  
  /**
   * Current progress percentage (0-100)
   */
  progressPercentage: number;
  
  /**
   * Timestamp when the goal was created
   */
  createdAt: Date;
  
  /**
   * Timestamp when the goal was last updated
   */
  updatedAt: Date;
  
  /**
   * Timestamp when the goal was completed
   */
  completedAt?: Date;
  
  /**
   * Optional goal metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Goal create request model
 * Used when creating a new goal
 */
export interface GoalCreateRequest {
  userId: string;
  type: GoalType;
  title?: string;
  description?: string;
  focusAreas: FocusArea[];
  targetDate?: Date;
  weeklySessionTarget: number;
  isPrimary: boolean;
  metadata?: Record<string, any>;
}

/**
 * Goal update request model
 * Used when updating an existing goal
 */
export interface GoalUpdateRequest {
  title?: string;
  description?: string;
  focusAreas?: FocusArea[];
  targetDate?: Date;
  weeklySessionTarget?: number;
  isPrimary?: boolean;
  progressPercentage?: number;
  completedAt?: Date;
  metadata?: Record<string, any>;
}
