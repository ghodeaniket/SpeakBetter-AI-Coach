import { useState, useEffect, useCallback } from 'react';
import { getUserMetrics, getWeeklyProgress, addAchievement } from '../../../services/firebase/userMetrics';
import { calculateAggregatedMetrics, detectAchievements, AggregatedMetrics } from '../services/metricsAggregationService';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Achievement } from '../../../services/firebase/userMetrics';

/**
 * Hook to get and manage progress data
 */
export const useProgressData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  // Achievement definitions
  const achievementDefinitions = {
    'session-5': {
      id: 'session-5',
      title: 'Getting Started',
      description: 'Completed 5 practice sessions',
      iconPath: '/icons/achievements/session-5.svg',
    },
    'session-10': {
      id: 'session-10',
      title: 'Regular Practice',
      description: 'Completed 10 practice sessions',
      iconPath: '/icons/achievements/session-10.svg',
    },
    'session-25': {
      id: 'session-25',
      title: 'Dedication',
      description: 'Completed 25 practice sessions',
      iconPath: '/icons/achievements/session-25.svg',
    },
    'filler-reduction': {
      id: 'filler-reduction',
      title: 'Filler Eliminator',
      description: 'Reduced filler words by 20% in a week',
      iconPath: '/icons/achievements/filler-reduction.svg',
    },
    'speed-improvement': {
      id: 'speed-improvement',
      title: 'Speed Master',
      description: 'Improved speaking pace by 20% in a week',
      iconPath: '/icons/achievements/speed-improvement.svg',
    },
    'clarity-improvement': {
      id: 'clarity-improvement',
      title: 'Crystal Clear',
      description: 'Improved clarity score by 15% in a week',
      iconPath: '/icons/achievements/clarity-improvement.svg',
    },
    'consistency': {
      id: 'consistency',
      title: 'Consistent Practice',
      description: 'Practiced every week for 3 consecutive weeks',
      iconPath: '/icons/achievements/consistency.svg',
    },
  };

  // Load user metrics and achievements
  useEffect(() => {
    const loadUserMetrics = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load user metrics
        const aggregatedMetrics = await calculateAggregatedMetrics(user.uid);
        setMetrics(aggregatedMetrics);
        
        // Load user achievements
        const userMetricsData = await getUserMetrics(user.uid);
        if (userMetricsData) {
          setAchievements(userMetricsData.achievements || []);
        }
        
        // Check for new achievements
        const newAchievementIds = await detectAchievements(user.uid);
        setNewAchievements(newAchievementIds);
        
        // Add new achievements to user profile
        await Promise.all(newAchievementIds.map(id => {
          const achievement = achievementDefinitions[id as keyof typeof achievementDefinitions];
          return addAchievement(user.uid, achievement);
        }));
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading progress data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load progress data'));
        setLoading(false);
      }
    };

    loadUserMetrics();
  }, [user]);

  // Refresh metrics data
  const refreshData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const aggregatedMetrics = await calculateAggregatedMetrics(user.uid);
      setMetrics(aggregatedMetrics);
      
      // Refresh achievements
      const userMetricsData = await getUserMetrics(user.uid);
      if (userMetricsData) {
        setAchievements(userMetricsData.achievements || []);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing progress data:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh progress data'));
      setLoading(false);
    }
  }, [user]);

  // Clear new achievements notification
  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  return {
    loading,
    error,
    metrics,
    achievements,
    newAchievements,
    refreshData,
    clearNewAchievements,
    achievementDefinitions,
  };
};
