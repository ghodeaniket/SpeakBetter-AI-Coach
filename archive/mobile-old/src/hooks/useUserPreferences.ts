import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { userService } from '../services/user/userService';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/types';
import { setUserPreferences } from '../store/slices/userSlice';

export interface NotificationPreferences {
  practiceReminders: boolean;
  milestones: boolean;
  feedbackNotifications: boolean;
  reminderTime?: string;
  reminderDays?: number[];
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  theme: 'light' | 'dark' | 'system';
  voicePreference: string;
  coachingStyle: string;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const preferences = useSelector((state: RootState) => state.user.preferences);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid && !preferences) {
      fetchUserPreferences();
    }
  }, [user]);

  const fetchUserPreferences = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userPreferences = await userService.getUserPreferences(user.uid);
      dispatch(setUserPreferences(userPreferences));
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError('Failed to load your preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updateNotificationPreferences = async (notificationPreferences: NotificationPreferences) => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPreferences = {
        ...preferences,
        notifications: notificationPreferences
      };
      
      await userService.updateUserPreferences(user.uid, updatedPreferences);
      dispatch(setUserPreferences(updatedPreferences));
      return true;
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError('Failed to update notification preferences');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateThemePreference = async (theme: 'light' | 'dark' | 'system') => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPreferences = {
        ...preferences,
        theme
      };
      
      await userService.updateUserPreferences(user.uid, updatedPreferences);
      dispatch(setUserPreferences(updatedPreferences));
      return true;
    } catch (err) {
      console.error('Error updating theme preference:', err);
      setError('Failed to update theme preference');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateVoicePreference = async (voicePreference: string) => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPreferences = {
        ...preferences,
        voicePreference
      };
      
      await userService.updateUserPreferences(user.uid, updatedPreferences);
      dispatch(setUserPreferences(updatedPreferences));
      return true;
    } catch (err) {
      console.error('Error updating voice preference:', err);
      setError('Failed to update voice preference');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCoachingStyle = async (coachingStyle: string) => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPreferences = {
        ...preferences,
        coachingStyle
      };
      
      await userService.updateUserPreferences(user.uid, updatedPreferences);
      dispatch(setUserPreferences(updatedPreferences));
      return true;
    } catch (err) {
      console.error('Error updating coaching style:', err);
      setError('Failed to update coaching style');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    preferences,
    isLoading,
    error,
    fetchUserPreferences,
    updateNotificationPreferences,
    updateThemePreference,
    updateVoicePreference,
    updateCoachingStyle,
  };
};
