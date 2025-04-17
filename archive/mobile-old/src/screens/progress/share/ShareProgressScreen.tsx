import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { Card, Button, Divider } from '../../../components/ui';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { sharingService } from '../../../services/device/sharingService';
import { hapticService, HapticPattern } from '../../../services/device/hapticService';
import { useProgress } from '../../../hooks/useProgress';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../../hooks/useToast';

interface ShareOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => Promise<void>;
}

const ShareProgressScreen: React.FC = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { progressData, sessionsData, isLoading, fetchProgressData } = useProgress();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    // Fetch latest progress data if needed
    if (!progressData || !sessionsData) {
      fetchProgressData();
    }
  }, []);

  const handleShareProgress = async (option: ShareOption) => {
    try {
      setSelectedOption(option.id);
      setIsSharing(true);
      hapticService.selection();
      
      await option.action();
      
      hapticService.success();
      showToast({
        type: 'success',
        text1: 'Shared Successfully',
        text2: 'Your progress has been shared',
      });
    } catch (error) {
      console.error('Error sharing progress:', error);
      hapticService.error();
      
      // Only show error toast if the user didn't cancel
      if ((error as any)?.message !== 'User did not share') {
        showToast({
          type: 'error',
          text1: 'Sharing Failed',
          text2: 'An error occurred while sharing your progress',
        });
      }
    } finally {
      setIsSharing(false);
      setSelectedOption(null);
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'summary',
      title: 'Progress Summary',
      description: 'Share your overall progress with key metrics',
      icon: <MaterialIcons name="bar-chart" size={24} color={colors.primary} />,
      action: async () => {
        if (!progressData) {
          throw new Error('Progress data not available');
        }
        
        // Format the data for sharing
        const message = `
My SpeakBetter Progress Summary:

Sessions completed: ${progressData.totalSessions}
Total practice time: ${Math.round(progressData.totalSpeakingTimeMinutes)} minutes
Average speaking rate: ${progressData.avgWordsPerMinute.toFixed(1)} WPM
Average filler word percentage: ${progressData.avgFillerWordPercentage.toFixed(1)}%
Clarity score: ${progressData.avgClarityScore.toFixed(1)}/100

I've been improving my speaking skills with SpeakBetter AI Coach!
        `.trim();
        
        await sharingService.shareProgress({
          title: 'My Speaking Progress',
          message,
        });
      },
    },
    {
      id: 'lastSession',
      title: 'Latest Session',
      description: 'Share your most recent practice session feedback',
      icon: <MaterialIcons name="history" size={24} color={colors.primary} />,
      action: async () => {
        if (!sessionsData || sessionsData.length === 0) {
          throw new Error('No sessions available');
        }
        
        const latestSession = sessionsData[0]; // Assuming sorted by date
        
        await sharingService.shareFeedback({
          sessionId: latestSession.id,
          sessionDate: latestSession.date,
          feedbackText: latestSession.feedback.text || 'Great practice session!',
          metrics: {
            wordsPerMinute: latestSession.metrics.wordsPerMinute,
            fillerWordPercentage: latestSession.metrics.fillerWordPercentage,
            clarityScore: latestSession.metrics.clarityScore,
          },
        });
      },
    },
    {
      id: 'exportData',
      title: 'Export Data (CSV)',
      description: 'Export your practice data as a spreadsheet',
      icon: <MaterialIcons name="file-download" size={24} color={colors.primary} />,
      action: async () => {
        if (!sessionsData || sessionsData.length === 0) {
          throw new Error('No sessions available');
        }
        
        await sharingService.exportProgressData('current-user', sessionsData);
      },
    },
    {
      id: 'shareApp',
      title: 'Recommend App',
      description: 'Share SpeakBetter with friends',
      icon: <FontAwesome name="share-alt" size={24} color={colors.primary} />,
      action: async () => {
        await sharingService.shareApp();
      },
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Share Your Progress
      </Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your progress data...
          </Text>
        </View>
      ) : (
        <>
          <Card style={styles.statsCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Your Progress Stats
            </Text>
            
            {progressData ? (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {progressData.totalSessions}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Sessions
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {Math.round(progressData.totalSpeakingTimeMinutes)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Minutes
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {progressData.avgClarityScore.toFixed(0)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Clarity
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                No progress data available yet. Complete a few practice sessions to see your stats.
              </Text>
            )}
          </Card>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Share Options
          </Text>
          
          {shareOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                { 
                  backgroundColor: colors.card,
                  borderColor: selectedOption === option.id ? colors.primary : colors.border 
                }
              ]}
              onPress={() => handleShareProgress(option)}
              disabled={isSharing}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionIcon}>
                  {option.icon}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {option.description}
                  </Text>
                </View>
                {isSharing && selectedOption === option.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  statsCard: {
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default ShareProgressScreen;
