import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useStyles } from '../../theme/useStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

export const DashboardScreen: React.FC = () => {
  const styles = useStyles(theme => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.lg,
    },
    welcomeSection: {
      marginBottom: theme.spacing.xl,
    },
    welcomeText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
    },
    nameText: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    statsContainer: {
      backgroundColor: theme.colors.lightBg,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    statsTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.md,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    statBox: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginHorizontal: theme.spacing.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    statNumber: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    practiceButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.round,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    practiceButtonText: {
      color: '#FFFFFF',
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    sessionCard: {
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
    sessionTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    sessionInfo: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    sessionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: theme.borderRadius.round,
      backgroundColor: theme.colors.success,
      marginRight: theme.spacing.xs,
    },
    statusText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.success,
    },
  }));

  // Placeholder data
  const recentSessions = [
    { id: '1', title: 'Freestyle Practice', date: 'Today, 2:30 PM', duration: '2 min' },
    { id: '2', title: 'Interview Prep', date: 'Yesterday, 10:15 AM', duration: '3 min' },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>Alex</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>15%</Text>
              <Text style={styles.statLabel}>Filler Words ↓</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>85</Text>
              <Text style={styles.statLabel}>Clarity Score</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.practiceButton}>
          <Text style={styles.practiceButtonText}>Start New Practice</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        
        {recentSessions.map(session => (
          <TouchableOpacity key={session.id} style={styles.sessionCard}>
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <Text style={styles.sessionInfo}>{session.date} • {session.duration}</Text>
            <View style={styles.sessionStatus}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusText}>Pace Improved</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
