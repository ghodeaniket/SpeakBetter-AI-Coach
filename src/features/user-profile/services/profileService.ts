import { UserProfile, UserGoal, UserSettings } from '../../../types/userProfile';
import { 
  getUserProfile, 
  updateUserProfile, 
  updateUserGoals, 
  updateUserSettings,
  addUserGoal,
  removeUserGoal
} from '../../../services/firebase/userProfile';

/**
 * Service for managing user profiles, providing higher-level operations 
 * than the direct Firebase interactions
 */
export class ProfileService {
  /**
   * Get recommended practice exercises based on user's goals
   * @param userProfile The user profile
   * @returns Array of recommended exercise ids
   */
  static getRecommendedExercises(userProfile: UserProfile): string[] {
    if (!userProfile || !userProfile.goals || userProfile.goals.length === 0) {
      return ['freestyle-general']; // Default exercise if no goals set
    }

    // Get the most recent goal's focus areas
    const recentGoal = this.getMostRecentGoal(userProfile);
    if (!recentGoal) return ['freestyle-general'];

    const recommendedExercises: string[] = [];

    // Map focus areas to recommended exercises
    recentGoal.focus.forEach(focus => {
      switch (focus) {
        case 'pace':
          recommendedExercises.push('guided-pacing');
          break;
        case 'fillers':
          recommendedExercises.push('filler-reduction');
          break;
        case 'clarity':
          recommendedExercises.push('articulation-practice');
          break;
        case 'confidence':
          recommendedExercises.push('confidence-building');
          break;
        case 'structure':
          recommendedExercises.push('structured-speech');
          break;
        default:
          recommendedExercises.push('freestyle-general');
      }
    });

    // Add goal-specific exercises
    switch (recentGoal.type) {
      case 'presentation':
        recommendedExercises.push('presentation-opener');
        break;
      case 'interview':
        recommendedExercises.push('interview-qa');
        break;
      case 'everyday':
        recommendedExercises.push('casual-conversation');
        break;
    }

    return recommendedExercises;
  }

  /**
   * Get feedback style based on user preferences
   * @param userProfile The user profile
   * @returns Object with feedback style parameters
   */
  static getFeedbackStyle(userProfile: UserProfile): {
    tone: string;
    detailLevel: 'basic' | 'detailed';
    emphasisAreas: string[];
  } {
    if (!userProfile || !userProfile.settings) {
      return {
        tone: 'supportive',
        detailLevel: 'basic',
        emphasisAreas: ['pace', 'fillers']
      };
    }

    const personality = userProfile.settings.coachPersonality;
    let tone = 'supportive';
    let detailLevel: 'basic' | 'detailed' = 'basic';
    
    // Set tone based on personality
    switch (personality) {
      case 'supportive':
        tone = 'encouraging';
        detailLevel = 'basic';
        break;
      case 'direct':
        tone = 'straightforward';
        detailLevel = 'basic';
        break;
      case 'analytical':
        tone = 'detailed';
        detailLevel = 'detailed';
        break;
      case 'casual':
        tone = 'friendly';
        detailLevel = 'basic';
        break;
    }

    // Get emphasis areas from user goals
    const emphasisAreas: string[] = [];
    if (userProfile.goals && userProfile.goals.length > 0) {
      // Combine focus areas from all goals
      userProfile.goals.forEach(goal => {
        goal.focus.forEach(focus => {
          if (!emphasisAreas.includes(focus)) {
            emphasisAreas.push(focus);
          }
        });
      });
    }

    // Default if no focus areas found
    if (emphasisAreas.length === 0) {
      emphasisAreas.push('pace', 'fillers');
    }

    return {
      tone,
      detailLevel,
      emphasisAreas
    };
  }

  /**
   * Check if user profile setup is complete
   * @param userProfile The user profile
   * @returns Boolean indicating if profile setup is complete
   */
  static isProfileSetupComplete(userProfile: UserProfile): boolean {
    if (!userProfile) return false;
    
    // Check if basic information is filled
    const hasBasicInfo = !!userProfile.displayName;
    
    // Check if at least one goal is set
    const hasAtLeastOneGoal = userProfile.goals && userProfile.goals.length > 0;
    
    // Check if settings are configured
    const hasSettings = !!userProfile.settings;
    
    return hasBasicInfo && hasAtLeastOneGoal && hasSettings;
  }

  /**
   * Determine if the user should be prompted to set up their profile
   * @param userProfile The user profile
   * @returns Boolean indicating if user should be prompted
   */
  static shouldPromptForSetup(userProfile: UserProfile): boolean {
    return !this.isProfileSetupComplete(userProfile);
  }

  /**
   * Get the most recent goal for a user
   * @param userProfile The user profile
   * @returns The most recent goal or null if none
   */
  static getMostRecentGoal(userProfile: UserProfile): UserGoal | null {
    if (!userProfile?.goals || userProfile.goals.length === 0) return null;
    
    // Sort goals by ID descending (assuming ID is based on timestamp)
    const sortedGoals = [...userProfile.goals].sort((a, b) => {
      const aId = a.id ? parseInt(a.id.toString()) : 0;
      const bId = b.id ? parseInt(b.id.toString()) : 0;
      return bId - aId;
    });
    
    return sortedGoals[0];
  }

  /**
   * Generate personalized coaching tips based on user profile
   * @param userProfile The user profile
   * @returns Array of coaching tips
   */
  static getPersonalizedCoachingTips(userProfile: UserProfile): string[] {
    if (!userProfile || !userProfile.goals || userProfile.goals.length === 0) {
      return [
        "Try speaking at a slightly slower pace for better clarity.",
        "Remember to pause naturally between sentences.",
        "Practice will help you reduce filler words like 'um' and 'uh'."
      ];
    }

    const tips: string[] = [];
    const recentGoal = this.getMostRecentGoal(userProfile);
    
    if (!recentGoal) return tips;

    // Add focus-specific tips
    recentGoal.focus.forEach(focus => {
      switch (focus) {
        case 'pace':
          tips.push("Try varying your speaking pace to emphasize important points.");
          tips.push("Aim for 140-160 words per minute for optimal comprehension.");
          break;
        case 'fillers':
          tips.push("Instead of using filler words, try embracing short pauses.");
          tips.push("Record yourself in casual conversation to identify your most common filler words.");
          break;
        case 'clarity':
          tips.push("Practice articulating challenging words and sounds daily.");
          tips.push("Reading aloud for 5 minutes daily can significantly improve pronunciation.");
          break;
        case 'confidence':
          tips.push("Standing tall and maintaining good posture can increase your speaking confidence.");
          tips.push("Visualize successful speaking experiences before you begin.");
          break;
        case 'structure':
          tips.push("Try using the 'Problem-Solution-Benefit' structure for persuasive speaking.");
          tips.push("Start with a strong opening that hooks your audience's attention.");
          break;
      }
    });

    // Add goal-type specific tips
    switch (recentGoal.type) {
      case 'presentation':
        tips.push("Presentations are more engaging when you include stories or examples.");
        tips.push("Rehearsing with a timer can help you pace your presentation effectively.");
        break;
      case 'interview':
        tips.push("Using the STAR method can help structure your interview responses effectively.");
        tips.push("Pausing briefly before answering interview questions shows thoughtfulness.");
        break;
      case 'everyday':
        tips.push("Active listening is just as important as speaking clearly in conversations.");
        tips.push("Using concrete examples makes your points more relatable in everyday conversations.");
        break;
    }

    // Only return a maximum of 3 tips
    return tips.slice(0, 3);
  }
}
