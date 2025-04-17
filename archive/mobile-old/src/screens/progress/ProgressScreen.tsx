import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useStyles } from '../../theme/useStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ProgressScreen: React.FC = () => {
  const styles = useStyles(theme => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    chartContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    chartTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    chartPlaceholder: {
      height: 200,
      backgroundColor: theme.colors.lightBg,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chartLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: theme.spacing.xs,
    },
    legendText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    metricsContainer: {
      marginBottom: theme.spacing.xl,
    },
    metricTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    metricCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metricName: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textPrimary,
    },
    metricValue: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    metricChange: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.success,
      marginTop: theme.spacing.xs,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.lightBg,
      borderRadius: theme.borderRadius.round,
      marginTop: theme.spacing.sm,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: theme.borderRadius.round,
    },
    chartMessage: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.md,
    },
    achievementsContainer: {
      marginBottom: theme.spacing.xl,
    },
    achievementCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    achievementIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.lightBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    achievementDescription: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  }));

  // Placeholder data for metrics
  const metrics = [
    { name: 'Filler Words', value: '8.2%', change: '-15% from last week', progress: 0.65 },
    { name: 'Speaking Pace', value: '135 WPM', change: '+5% from last week', progress: 0.75 },
    { name: 'Clarity Score', value: '85/100', change: '+10 points from last week', progress: 0.85 },
  ];

  // Placeholder data for achievements
  const achievements = [
    { 
      title: 'Consistent Practice', 
      description: 'Completed 5 practice sessions', 
      iconText: '🔥'
    },
    { 
      title: 'Filler Word Master', 
      description: 'Reduced filler words by 15%', 
      iconText: '💬'
    },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>Track your improvement over time</Text>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Speaking Improvement</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartMessage}>Chart visualization will appear here</Text>
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.legendText}>Filler Words</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
              <Text style={styles.legendText}>Pace</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsContainer}>
          <Text style={styles.metricTitle}>Key Metrics</Text>
          
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={styles.metricRow}>
                <Text style={styles.metricName}>{metric.name}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
              </View>
              <Text style={styles.metricChange}>{metric.change}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${metric.progress * 100}%`,
                      backgroundColor: theme.colors.primary
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.achievementsContainer}>
          <Text style={styles.metricTitle}>Your Achievements</Text>
          
          {achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Text style={{ fontSize: 20 }}>{achievement.iconText}</Text>
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
