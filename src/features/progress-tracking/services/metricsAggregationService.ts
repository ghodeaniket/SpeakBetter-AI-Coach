import { getUserMetrics, updateWeeklyProgress } from '../../../services/firebase/userMetrics';
import { getUserSessions, Session } from '../../../features/session-management/services/sessionService';

// Define the return type for aggregated metrics
export interface AggregatedMetrics {
  wordsPerMinute: {
    current: number;
    previous: number;
    trend: number; // Percentage improvement
  };
  fillerWordPercentage: {
    current: number;
    previous: number;
    trend: number; // Negative is good (less fillers)
  };
  clarityScore: {
    current: number;
    previous: number;
    trend: number; // Percentage improvement
  };
  totalSessions: number;
  totalPracticingTime: number; // In minutes
  recentSessions: Session[];
  weeklyData: {
    labels: string[];
    wordsPerMinute: number[];
    fillerWordPercentage: number[];
    clarityScore: number[];
  };
}

/**
 * Calculate aggregated metrics for a user
 */
export const calculateAggregatedMetrics = async (userId: string): Promise<AggregatedMetrics> => {
  try {
    // Get user metrics and session data
    const userMetrics = await getUserMetrics(userId);
    const sessions = await getUserSessions(userId);
    
    if (!userMetrics) {
      throw new Error("User metrics not found");
    }
    
    // Get weekly progress data
    const weeklyProgress = userMetrics.weeklyProgress || {};
    const weekIds = Object.keys(weeklyProgress).sort();
    
    // If we have less than 2 weeks of data, use defaults for previous values
    const currentWeekId = weekIds.length > 0 ? weekIds[weekIds.length - 1] : '';
    const previousWeekId = weekIds.length > 1 ? weekIds[weekIds.length - 2] : '';
    
    const currentWeekData = currentWeekId ? weeklyProgress[currentWeekId] : { wordsPerMinute: 0, fillerWordPercentage: 0, clarityScore: 0, totalSessions: 0 };
    const previousWeekData = previousWeekId ? weeklyProgress[previousWeekId] : { wordsPerMinute: 0, fillerWordPercentage: 0, clarityScore: 0, totalSessions: 0 };
    
    // Calculate trends (percentage change)
    const wpmTrend = previousWeekData.wordsPerMinute === 0 ? 0 : 
      ((currentWeekData.wordsPerMinute - previousWeekData.wordsPerMinute) / previousWeekData.wordsPerMinute) * 100;
      
    const fillerTrend = previousWeekData.fillerWordPercentage === 0 ? 0 : 
      ((currentWeekData.fillerWordPercentage - previousWeekData.fillerWordPercentage) / previousWeekData.fillerWordPercentage) * 100;
      
    const clarityTrend = previousWeekData.clarityScore === 0 ? 0 : 
      ((currentWeekData.clarityScore - previousWeekData.clarityScore) / previousWeekData.clarityScore) * 100;
    
    // Format data for weekly chart
    const labels: string[] = [];
    const wpmData: number[] = [];
    const fillerData: number[] = [];
    const clarityData: number[] = [];
    
    // Use last 6 weeks max for charts
    const recentWeekIds = weekIds.slice(-6);
    
    recentWeekIds.forEach(weekId => {
      const weekData = weeklyProgress[weekId];
      // Format weekId (YYYY-WW) to a more readable format (Week W)
      const [year, week] = weekId.split('-');
      labels.push(`Week ${week}`);
      wpmData.push(weekData.wordsPerMinute);
      fillerData.push(weekData.fillerWordPercentage);
      clarityData.push(weekData.clarityScore);
    });
    
    // Calculate total practicing time (in minutes)
    const totalPracticingTime = Math.round(userMetrics.totalSpeakingTime / 60);
    
    // Get recent sessions (max 5)
    const recentSessions = sessions.sort((a, b) => {
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    }).slice(0, 5);
    
    return {
      wordsPerMinute: {
        current: Math.round(currentWeekData.wordsPerMinute),
        previous: Math.round(previousWeekData.wordsPerMinute),
        trend: Math.round(wpmTrend),
      },
      fillerWordPercentage: {
        current: Math.round(currentWeekData.fillerWordPercentage * 100) / 100,
        previous: Math.round(previousWeekData.fillerWordPercentage * 100) / 100,
        trend: Math.round(fillerTrend * 100) / 100,
      },
      clarityScore: {
        current: Math.round(currentWeekData.clarityScore),
        previous: Math.round(previousWeekData.clarityScore),
        trend: Math.round(clarityTrend),
      },
      totalSessions: userMetrics.sessionCount,
      totalPracticingTime,
      recentSessions,
      weeklyData: {
        labels,
        wordsPerMinute: wpmData,
        fillerWordPercentage: fillerData,
        clarityScore: clarityData,
      },
    };
  } catch (error) {
    console.error("Error calculating aggregated metrics:", error);
    throw error;
  }
};

/**
 * Detect achievements based on metrics
 * 
 * This function checks the user's metrics to identify any new achievements
 * that the user has unlocked.
 */
export const detectAchievements = async (userId: string): Promise<string[]> => {
  try {
    const metrics = await getUserMetrics(userId);
    const earnedAchievements: string[] = [];
    
    if (!metrics) {
      return earnedAchievements;
    }
    
    // Get existing achievement IDs
    const existingAchievementIds = metrics.achievements.map(a => a.id);
    
    // Check for session count achievements
    if (metrics.sessionCount >= 5 && !existingAchievementIds.includes('session-5')) {
      earnedAchievements.push('session-5');
    }
    
    if (metrics.sessionCount >= 10 && !existingAchievementIds.includes('session-10')) {
      earnedAchievements.push('session-10');
    }
    
    if (metrics.sessionCount >= 25 && !existingAchievementIds.includes('session-25')) {
      earnedAchievements.push('session-25');
    }
    
    // Check for improvement achievements
    const weekIds = Object.keys(metrics.weeklyProgress).sort();
    if (weekIds.length >= 2) {
      const lastWeekId = weekIds[weekIds.length - 1];
      const previousWeekId = weekIds[weekIds.length - 2];
      
      const lastWeekData = metrics.weeklyProgress[lastWeekId];
      const previousWeekData = metrics.weeklyProgress[previousWeekId];
      
      // Filler word reduction achievement
      if (lastWeekData.fillerWordPercentage < previousWeekData.fillerWordPercentage * 0.8 && 
          !existingAchievementIds.includes('filler-reduction')) {
        earnedAchievements.push('filler-reduction');
      }
      
      // Word speed improvement achievement
      if (lastWeekData.wordsPerMinute > previousWeekData.wordsPerMinute * 1.2 && 
          !existingAchievementIds.includes('speed-improvement')) {
        earnedAchievements.push('speed-improvement');
      }
      
      // Clarity improvement achievement
      if (lastWeekData.clarityScore > previousWeekData.clarityScore * 1.15 && 
          !existingAchievementIds.includes('clarity-improvement')) {
        earnedAchievements.push('clarity-improvement');
      }
    }
    
    // Check for consistency achievement (practiced every week for 3+ weeks)
    if (weekIds.length >= 3 && !existingAchievementIds.includes('consistency')) {
      // Check if each week had at least one session
      let isConsistent = true;
      for (let i = weekIds.length - 3; i < weekIds.length; i++) {
        if (metrics.weeklyProgress[weekIds[i]].totalSessions === 0) {
          isConsistent = false;
          break;
        }
      }
      
      if (isConsistent) {
        earnedAchievements.push('consistency');
      }
    }
    
    return earnedAchievements;
  } catch (error) {
    console.error("Error detecting achievements:", error);
    throw error;
  }
};

/**
 * Update metrics after a session
 */
export const updateMetricsAfterSession = async (
  userId: string,
  sessionDuration: number, // in seconds
  metrics: {
    wordsPerMinute: number;
    fillerWordPercentage: number;
    clarityScore: number;
  }
): Promise<void> => {
  try {
    // Update weekly progress first
    await updateWeeklyProgress(userId, metrics);
    
    // Update total speaking time
    const userMetrics = await getUserMetrics(userId);
    
    if (userMetrics) {
      await updateUserMetrics({
        userId,
        totalSpeakingTime: userMetrics.totalSpeakingTime + sessionDuration
      });
    }
  } catch (error) {
    console.error("Error updating metrics after session:", error);
    throw error;
  }
};

/**
 * Get comparison between two sessions
 */
export interface SessionComparison {
  wordsPerMinute: {
    current: number;
    previous: number;
    change: number; // Percentage
  };
  fillerWordPercentage: {
    current: number;
    previous: number;
    change: number; // Percentage
  };
  clarityScore: {
    current: number;
    previous: number;
    change: number; // Percentage
  };
  improvement: boolean; // Overall improvement
}

export const compareSessionMetrics = (
  currentSession: {
    wordsPerMinute: number;
    fillerWordPercentage: number;
    clarityScore: number;
  },
  previousSession: {
    wordsPerMinute: number;
    fillerWordPercentage: number;
    clarityScore: number;
  }
): SessionComparison => {
  // Calculate percentage changes
  const wpmChange = previousSession.wordsPerMinute === 0 ? 0 :
    ((currentSession.wordsPerMinute - previousSession.wordsPerMinute) / previousSession.wordsPerMinute) * 100;
    
  const fillerChange = previousSession.fillerWordPercentage === 0 ? 0 :
    ((currentSession.fillerWordPercentage - previousSession.fillerWordPercentage) / previousSession.fillerWordPercentage) * 100;
    
  const clarityChange = previousSession.clarityScore === 0 ? 0 :
    ((currentSession.clarityScore - previousSession.clarityScore) / previousSession.clarityScore) * 100;
    
  // Determine overall improvement (more weight to fillers and clarity)
  const wpmScore = wpmChange > 0 ? 1 : -1;
  const fillerScore = fillerChange < 0 ? 2 : -2; // Lower filler percentage is better
  const clarityScore = clarityChange > 0 ? 2 : -2;
  
  const totalScore = wpmScore + fillerScore + clarityScore;
  const improvement = totalScore > 0;
  
  return {
    wordsPerMinute: {
      current: Math.round(currentSession.wordsPerMinute),
      previous: Math.round(previousSession.wordsPerMinute),
      change: Math.round(wpmChange * 10) / 10,
    },
    fillerWordPercentage: {
      current: Math.round(currentSession.fillerWordPercentage * 100) / 100,
      previous: Math.round(previousSession.fillerWordPercentage * 100) / 100,
      change: Math.round(fillerChange * 10) / 10,
    },
    clarityScore: {
      current: Math.round(currentSession.clarityScore),
      previous: Math.round(previousSession.clarityScore),
      change: Math.round(clarityChange * 10) / 10,
    },
    improvement,
  };
};
