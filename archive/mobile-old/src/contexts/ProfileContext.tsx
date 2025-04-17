import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '@speakbetter/core';
import { userProfileAdapter, UserSettings, UserGoal } from '../adapters';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  userProfile: User | null;
  loading: boolean;
  error: string | null;
  updateSettings: (settings: UserSettings) => Promise<void>;
  updateGoals: (goals: UserGoal[]) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  updateProfilePhoto: (photoURL: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const profile = await userProfileAdapter.getUserProfile(user.uid);
        
        if (profile) {
          setUserProfile(profile);
        } else {
          // If no profile exists, create one
          await userProfileAdapter.createUserProfile(user);
          // Fetch the newly created profile
          const newProfile = await userProfileAdapter.getUserProfile(user.uid);
          setUserProfile(newProfile);
        }
      } catch (error: any) {
        setError(error.message || 'Failed to fetch user profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profile = await userProfileAdapter.getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error: any) {
      setError(error.message || 'Failed to refresh user profile');
    } finally {
      setLoading(false);
    }
  };
  
  const updateSettings = async (settings: UserSettings) => {
    if (!user) return;
    
    try {
      setLoading(true);
      await userProfileAdapter.updateUserSettings(user.uid, settings);
      
      // Update local state
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          settings
        };
      });
    } catch (error: any) {
      setError(error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };
  
  const updateGoals = async (goals: UserGoal[]) => {
    if (!user) return;
    
    try {
      setLoading(true);
      await userProfileAdapter.updateUserGoals(user.uid, goals);
      
      // Update local state
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          goals
        };
      });
    } catch (error: any) {
      setError(error.message || 'Failed to update goals');
    } finally {
      setLoading(false);
    }
  };
  
  const updateDisplayName = async (displayName: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      await userProfileAdapter.updateDisplayName(user.uid, displayName);
      
      // Update local state
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          displayName
        };
      });
    } catch (error: any) {
      setError(error.message || 'Failed to update display name');
    } finally {
      setLoading(false);
    }
  };
  
  const updateProfilePhoto = async (photoURL: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      await userProfileAdapter.updateProfilePhoto(user.uid, photoURL);
      
      // Update local state
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          photoURL
        };
      });
    } catch (error: any) {
      setError(error.message || 'Failed to update profile photo');
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    userProfile,
    loading,
    error,
    updateSettings,
    updateGoals,
    updateDisplayName,
    updateProfilePhoto,
    refreshProfile
  };
  
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};