import { z } from 'zod';

// User validation schemas
export const userSettingsSchema = z.object({
  selectedVoice: z.string(),
  coachPersonality: z.string(),
  notificationPreferences: z.object({
    email: z.boolean(),
    inApp: z.boolean(),
    practiceDays: z.array(z.string())
  }).optional()
});

export const userGoalSchema = z.object({
  type: z.enum(['presentation', 'interview', 'everyday']),
  focus: z.array(z.string()),
  targetDate: z.date().optional(),
  weeklySessionTarget: z.number().int().positive()
});

export const userSchema = z.object({
  uid: z.string(),
  displayName: z.string().nullable(),
  email: z.string().email().nullable(),
  photoURL: z.string().url().nullable(),
  createdAt: z.date(),
  lastLoginAt: z.date(),
  settings: userSettingsSchema.optional(),
  goals: z.array(userGoalSchema).optional()
});

// Session validation schemas
export const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['freestyle', 'guided', 'qa']),
  status: z.enum(['completed', 'processing', 'error']),
  recordingUrl: z.string().url().optional(),
  durationSeconds: z.number().positive(),
  createdAt: z.date(),
  hasAnalysis: z.boolean(),
  hasFeedback: z.boolean()
});

// Speech analysis validation schemas
export const speechMetricsSchema = z.object({
  wordsPerMinute: z.number(),
  totalWords: z.number().int().nonnegative(),
  durationSeconds: z.number().positive(),
  fillerWordCounts: z.record(z.string(), z.number().int().nonnegative()),
  totalFillerWords: z.number().int().nonnegative(),
  fillerWordPercentage: z.number().nonnegative(),
  clarityScore: z.number().nonnegative().max(100)
});

export const wordTimingSchema = z.object({
  word: z.string(),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative()
});

export const fillerInstanceSchema = z.object({
  word: z.string(),
  timestamp: z.number().nonnegative()
});

export const speechAnalysisSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  userId: z.string(),
  transcription: z.string(),
  metrics: speechMetricsSchema,
  wordTimings: z.array(wordTimingSchema).optional(),
  fillerInstances: z.array(fillerInstanceSchema).optional(),
  timestamp: z.date()
});

// Feedback validation schemas
export const feedbackContentSchema = z.object({
  positive: z.string(),
  improvement: z.string(),
  suggestion: z.string(),
  encouragement: z.string()
});

export const feedbackSchema = z.object({
  id: z.string(),
  userId: z.string(),
  analysisId: z.string(),
  sessionId: z.string(),
  textFeedback: feedbackContentSchema,
  audioFeedbackUrl: z.string().url().optional(),
  createdAt: z.date(),
  viewedAt: z.date().optional()
});