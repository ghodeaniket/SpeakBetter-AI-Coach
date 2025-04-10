import { useUserProfileContext } from '../contexts/UserProfileContext';
import { UserGoal, UserProfile, UserSettings } from '../../types/userProfile';

/**
 * Hook to access and manage user profile data
 * Provides simplified access to the UserProfileContext
 */
export const useUserProfile = () => {
  const {
    userProfile,
    loading,
    error,
    updateProfile,
    updateGoals,
    updateSettings,
    addGoal,
    removeGoal
  } = useUserProfileContext();

  /**
   * Check if the user has set any goals
   */
  const hasGoals = (): boolean => {
    return !!userProfile?.goals && userProfile.goals.length > 0;
  };

  /**
   * Get goals for a specific type
   */
  const getGoalsByType = (type: string): UserGoal[] => {
    if (!userProfile?.goals) return [];
    return userProfile.goals.filter(goal => goal.type === type);
  };

  /**
   * Get the most recent goal
   */
  const getMostRecentGoal = (): UserGoal | null => {
    if (!userProfile?.goals || userProfile.goals.length === 0) return null;
    
    // Sort goals by ID descending (assuming ID is based on timestamp)
    const sortedGoals = [...userProfile.goals].sort((a, b) => {
      const aId = a.id ? parseInt(a.id) : 0;
      const bId = b.id ? parseInt(b.id) : 0;
      return bId - aId;
    });
    
    return sortedGoals[0];
  };

  /**
   * Update a single goal by ID
   */
  const updateGoal = async (updatedGoal: UserGoal): Promise<void> => {
    if (!userProfile) throw new Error('No user profile available');
    
    const updatedGoals = userProfile.goals.map(goal => 
      goal.id === updatedGoal.id ? updatedGoal : goal
    );
    
    await updateGoals(updatedGoals);
  };

  /**
   * Check if the user profile is complete (has basic info and at least one goal)
   */
  const isProfileComplete = (): boolean => {
    if (!userProfile) return false;
    
    // Check if basic information is filled
    const hasBasicInfo = !!userProfile.displayName;
    
    // Check if at least one goal is set
    const hasAtLeastOneGoal = userProfile.goals.length > 0;
    
    return hasBasicInfo && hasAtLeastOneGoal;
  };

  /**
   * Get the user's preferred coach personality
   */
  const getCoachPersonality = (): string => {
    return userProfile?.settings?.coachPersonality || 'supportive';
  };

  /**
   * Get the user's preferred voice
   */
  const getSelectedVoice = (): string => {
    return userProfile?.settings?.selectedVoice || 'female';
  };

  /**
   * Update notification preferences
   */
  const updateNotificationPreferences = async (preferences: {
    email?: boolean;
    inApp?: boolean;
    practiceDays?: string[];
  }): Promise<void> => {
    if (!userProfile) throw new Error('No user profile available');
    
    const currentSettings = userProfile.settings;
    const updatedNotificationPreferences = {
      ...currentSettings.notificationPreferences,
      ...preferences
    };
    
    const updatedSettings: UserSettings = {
      ...currentSettings,
      notificationPreferences: updatedNotificationPreferences
    };
    
    await updateSettings(updatedSettings);
  };

  return {
    userProfile,
    loading,
    error,
    updateProfile,
    updateGoals,
    updateSettings,
    addGoal,
    removeGoal,
    hasGoals,
    getGoalsByType,
    getMostRecentGoal,
    updateGoal,
    isProfileComplete,
    getCoachPersonality,
    getSelectedVoice,
    updateNotificationPreferences
  };
};
