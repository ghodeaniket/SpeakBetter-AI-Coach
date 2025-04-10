import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { UserProfile, UserGoal, UserSettings } from '../../types/userProfile';

/**
 * Retrieves a user profile from Firestore
 * @param userId - The user ID
 * @returns Promise with the user profile or null if not found
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Convert Firestore timestamps to Date objects
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        goals: data.goals.map((goal: any) => ({
          ...goal,
          targetDate: goal.targetDate?.toDate() || undefined
        }))
      } as UserProfile;
    } else {
      console.log('No profile found for this user');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Creates a new user profile in Firestore
 * @param userId - The user ID
 * @param profileData - The profile data to save
 */
export const createUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  try {
    const defaultProfile: UserProfile = {
      uid: userId,
      displayName: profileData.displayName || '',
      email: profileData.email || '',
      photoURL: profileData.photoURL || '',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      settings: {
        selectedVoice: 'female', // Default voice
        coachPersonality: 'supportive', // Default personality
        notificationPreferences: {
          email: true,
          inApp: true,
          practiceDays: ['monday', 'wednesday', 'friday']
        }
      },
      goals: [],
    };

    const mergedProfile = { ...defaultProfile, ...profileData };
    
    await setDoc(doc(db, 'users', userId), mergedProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Updates a user profile in Firestore
 * @param userId - The user ID
 * @param profileData - The profile data to update
 */
export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { ...profileData, lastLoginAt: new Date() });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Updates user goals in Firestore
 * @param userId - The user ID
 * @param goals - The updated goals array
 */
export const updateUserGoals = async (userId: string, goals: UserGoal[]): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { goals });
  } catch (error) {
    console.error('Error updating user goals:', error);
    throw error;
  }
};

/**
 * Updates user settings in Firestore
 * @param userId - The user ID
 * @param settings - The updated settings object
 */
export const updateUserSettings = async (userId: string, settings: UserSettings): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { settings });
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

/**
 * Adds a new goal to the user's profile
 * @param userId - The user ID
 * @param goal - The new goal to add
 */
export const addUserGoal = async (userId: string, goal: UserGoal): Promise<void> => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    const updatedGoals = [...userProfile.goals, { ...goal, id: Date.now().toString() }];
    await updateUserGoals(userId, updatedGoals);
  } catch (error) {
    console.error('Error adding user goal:', error);
    throw error;
  }
};

/**
 * Removes a goal from the user's profile
 * @param userId - The user ID
 * @param goalId - The ID of the goal to remove
 */
export const removeUserGoal = async (userId: string, goalId: string): Promise<void> => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    const updatedGoals = userProfile.goals.filter(goal => goal.id !== goalId);
    await updateUserGoals(userId, updatedGoals);
  } catch (error) {
    console.error('Error removing user goal:', error);
    throw error;
  }
};
