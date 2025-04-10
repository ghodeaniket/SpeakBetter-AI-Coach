import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { UserProfile, UserGoal, UserSettings } from '../../types/userProfile';
import { 
  getUserProfile, 
  createUserProfile, 
  updateUserProfile, 
  updateUserGoals, 
  updateUserSettings,
  addUserGoal,
  removeUserGoal
} from '../../services/firebase/userProfile';

interface UserProfileContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  updateGoals: (goals: UserGoal[]) => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<void>;
  addGoal: (goal: UserGoal) => Promise<void>;
  removeGoal: (goalId: string) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      try {
        if (user) {
          // User is signed in
          let profile = await getUserProfile(user.uid);
          
          if (!profile) {
            // Create a new profile if one doesn't exist
            await createUserProfile(user.uid, {
              displayName: user.displayName || '',
              email: user.email || '',
              photoURL: user.photoURL || '',
            });
            profile = await getUserProfile(user.uid);
          }
          
          setUserProfile(profile);
        } else {
          // User is signed out
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateProfile = async (profileData: Partial<UserProfile>): Promise<void> => {
    if (!userProfile) {
      throw new Error('No user is signed in');
    }

    try {
      await updateUserProfile(userProfile.uid, profileData);
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...profileData } : null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const updateGoals = async (goals: UserGoal[]): Promise<void> => {
    if (!userProfile) {
      throw new Error('No user is signed in');
    }

    try {
      await updateUserGoals(userProfile.uid, goals);
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, goals } : null);
    } catch (err) {
      console.error('Error updating goals:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const updateSettings = async (settings: UserSettings): Promise<void> => {
    if (!userProfile) {
      throw new Error('No user is signed in');
    }

    try {
      await updateUserSettings(userProfile.uid, settings);
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, settings } : null);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const addGoal = async (goal: UserGoal): Promise<void> => {
    if (!userProfile) {
      throw new Error('No user is signed in');
    }

    try {
      await addUserGoal(userProfile.uid, goal);
      
      // Update local state - we create a new ID on the server side, so refresh the whole profile
      const updatedProfile = await getUserProfile(userProfile.uid);
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
    } catch (err) {
      console.error('Error adding goal:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const removeGoal = async (goalId: string): Promise<void> => {
    if (!userProfile) {
      throw new Error('No user is signed in');
    }

    try {
      await removeUserGoal(userProfile.uid, goalId);
      
      // Update local state
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          goals: prev.goals.filter(goal => goal.id !== goalId)
        };
      });
    } catch (err) {
      console.error('Error removing goal:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  const value = {
    userProfile,
    loading,
    error,
    updateProfile,
    updateGoals,
    updateSettings,
    addGoal,
    removeGoal
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfileContext = (): UserProfileContextType => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfileContext must be used within a UserProfileProvider');
  }
  return context;
};
