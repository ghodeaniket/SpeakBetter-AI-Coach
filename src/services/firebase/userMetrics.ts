import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, Timestamp, DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, WithFieldValue } from "firebase/firestore";
import { db } from "../../firebase/config";

export interface UserMetrics {
  userId: string;
  sessionCount: number;
  totalSpeakingTime: number; // in seconds
  avgWordsPerMinute: number;
  avgFillerWordPercentage: number;
  avgClarityScore: number;
  lastUpdated: Timestamp;
  weeklyProgress: {
    [weekId: string]: { // Format: "YYYY-WW"
      wordsPerMinute: number;
      fillerWordPercentage: number;
      clarityScore: number;
      totalSessions: number;
    };
  };
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  achievedAt: Timestamp;
  iconPath: string;
}

// Converter for type safety with Firestore
const userMetricsConverter: FirestoreDataConverter<UserMetrics> = {
  toFirestore(userMetrics: WithFieldValue<UserMetrics>): DocumentData {
    return userMetrics;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): UserMetrics {
    const data = snapshot.data();
    return {
      userId: data.userId,
      sessionCount: data.sessionCount,
      totalSpeakingTime: data.totalSpeakingTime,
      avgWordsPerMinute: data.avgWordsPerMinute,
      avgFillerWordPercentage: data.avgFillerWordPercentage,
      avgClarityScore: data.avgClarityScore,
      lastUpdated: data.lastUpdated,
      weeklyProgress: data.weeklyProgress || {},
      achievements: data.achievements || [],
    };
  }
};

const userMetricsCollection = collection(db, "userMetrics").withConverter(userMetricsConverter);

/**
 * Get user metrics document for a specific user
 */
export const getUserMetrics = async (userId: string): Promise<UserMetrics | null> => {
  try {
    const docRef = doc(db, "userMetrics", userId).withConverter(userMetricsConverter);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching user metrics:", error);
    throw error;
  }
};

/**
 * Create or update user metrics document
 */
export const updateUserMetrics = async (metrics: Partial<UserMetrics>): Promise<void> => {
  try {
    const { userId } = metrics;
    if (!userId) {
      throw new Error("userId is required for updating metrics");
    }
    
    const docRef = doc(db, "userMetrics", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(docRef, {
        ...metrics,
        lastUpdated: Timestamp.now()
      });
    } else {
      // Create new document with default values
      await setDoc(docRef, {
        userId,
        sessionCount: metrics.sessionCount || 0,
        totalSpeakingTime: metrics.totalSpeakingTime || 0,
        avgWordsPerMinute: metrics.avgWordsPerMinute || 0,
        avgFillerWordPercentage: metrics.avgFillerWordPercentage || 0,
        avgClarityScore: metrics.avgClarityScore || 0,
        weeklyProgress: metrics.weeklyProgress || {},
        achievements: metrics.achievements || [],
        lastUpdated: Timestamp.now()
      });
    }
  } catch (error) {
    console.error("Error updating user metrics:", error);
    throw error;
  }
};

/**
 * Add an achievement to a user's metrics
 */
export const addAchievement = async (userId: string, achievement: Omit<Achievement, "achievedAt">): Promise<void> => {
  try {
    const docRef = doc(db, "userMetrics", userId);
    const docSnap = await getDoc(docRef);
    
    const newAchievement: Achievement = {
      ...achievement,
      achievedAt: Timestamp.now()
    };
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const achievements = data.achievements || [];
      
      // Check if achievement already exists
      const exists = achievements.some((a: Achievement) => a.id === achievement.id);
      if (!exists) {
        achievements.push(newAchievement);
        await updateDoc(docRef, { 
          achievements,
          lastUpdated: Timestamp.now()
        });
      }
    } else {
      // Create new metrics document with the achievement
      await setDoc(docRef, {
        userId,
        sessionCount: 0,
        totalSpeakingTime: 0,
        avgWordsPerMinute: 0,
        avgFillerWordPercentage: 0,
        avgClarityScore: 0,
        weeklyProgress: {},
        achievements: [newAchievement],
        lastUpdated: Timestamp.now()
      });
    }
  } catch (error) {
    console.error("Error adding achievement:", error);
    throw error;
  }
};

/**
 * Get the weekly progress data for a user
 */
export const getWeeklyProgress = async (userId: string): Promise<Record<string, any>> => {
  try {
    const userMetrics = await getUserMetrics(userId);
    return userMetrics?.weeklyProgress || {};
  } catch (error) {
    console.error("Error fetching weekly progress:", error);
    throw error;
  }
};

/**
 * Update weekly progress for current week
 */
export const updateWeeklyProgress = async (
  userId: string, 
  metrics: { 
    wordsPerMinute: number; 
    fillerWordPercentage: number; 
    clarityScore: number; 
  }
): Promise<void> => {
  try {
    // Get current week in YYYY-WW format
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((now.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
    const weekId = `${now.getFullYear()}-${weekNumber.toString().padStart(2, '0')}`;
    
    const userMetrics = await getUserMetrics(userId);
    
    if (userMetrics) {
      const weeklyProgress = userMetrics.weeklyProgress || {};
      const currentWeekData = weeklyProgress[weekId] || {
        wordsPerMinute: 0,
        fillerWordPercentage: 0,
        clarityScore: 0,
        totalSessions: 0
      };
      
      // Calculate new averages
      const totalSessions = currentWeekData.totalSessions + 1;
      const wordsPerMinute = ((currentWeekData.wordsPerMinute * currentWeekData.totalSessions) + metrics.wordsPerMinute) / totalSessions;
      const fillerWordPercentage = ((currentWeekData.fillerWordPercentage * currentWeekData.totalSessions) + metrics.fillerWordPercentage) / totalSessions;
      const clarityScore = ((currentWeekData.clarityScore * currentWeekData.totalSessions) + metrics.clarityScore) / totalSessions;
      
      weeklyProgress[weekId] = {
        wordsPerMinute,
        fillerWordPercentage,
        clarityScore,
        totalSessions
      };
      
      await updateUserMetrics({
        userId,
        weeklyProgress,
        sessionCount: userMetrics.sessionCount + 1,
        // Update overall averages as well
        avgWordsPerMinute: ((userMetrics.avgWordsPerMinute * userMetrics.sessionCount) + metrics.wordsPerMinute) / (userMetrics.sessionCount + 1),
        avgFillerWordPercentage: ((userMetrics.avgFillerWordPercentage * userMetrics.sessionCount) + metrics.fillerWordPercentage) / (userMetrics.sessionCount + 1),
        avgClarityScore: ((userMetrics.avgClarityScore * userMetrics.sessionCount) + metrics.clarityScore) / (userMetrics.sessionCount + 1),
      });
    } else {
      // Create new metrics document
      const weeklyProgress: Record<string, any> = {};
      weeklyProgress[weekId] = {
        wordsPerMinute: metrics.wordsPerMinute,
        fillerWordPercentage: metrics.fillerWordPercentage,
        clarityScore: metrics.clarityScore,
        totalSessions: 1
      };
      
      await updateUserMetrics({
        userId,
        sessionCount: 1,
        totalSpeakingTime: 0, // This will be updated separately
        avgWordsPerMinute: metrics.wordsPerMinute,
        avgFillerWordPercentage: metrics.fillerWordPercentage,
        avgClarityScore: metrics.clarityScore,
        weeklyProgress
      });
    }
  } catch (error) {
    console.error("Error updating weekly progress:", error);
    throw error;
  }
};
