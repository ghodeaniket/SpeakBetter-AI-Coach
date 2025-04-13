import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useStyles } from '../../theme/useStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

export const PracticeScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('freestyle');

  const styles = useStyles(theme => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.lg,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.xl,
    },
    tab: {
      flex: 1,
      padding: theme.spacing.md,
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
      marginHorizontal: theme.spacing.xs,
    },
    tabActive: {
      backgroundColor: theme.colors.primary,
    },
    tabInactive: {
      backgroundColor: theme.colors.lightBg,
    },
    tabTextActive: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    tabTextInactive: {
      color: theme.colors.primary,
    },
    instruction: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
    },
    suggestionContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.xl,
    },
    suggestionButton: {
      backgroundColor: theme.colors.lightBg,
      borderRadius: theme.borderRadius.round,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    suggestionText: {
      color: theme.colors.primary,
      fontSize: theme.typography.fontSize.sm,
    },
    recorderContainer: {
      backgroundColor: theme.colors.lightBg,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    timerText: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.lg,
    },
    waveformPlaceholder: {
      width: '100%',
      height: 60,
      backgroundColor: '#E0E4E8',
      borderRadius: theme.borderRadius.md,
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: theme.spacing.md,
    },
    recordButton: {
      backgroundColor: theme.colors.primary,
    },
    stopButton: {
      backgroundColor: '#E0E4E8',
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: theme.typography.fontSize.lg,
    },
    stopButtonText: {
      color: theme.colors.textPrimary,
    },
    helpText: {
      marginTop: theme.spacing.lg,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  }));

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'freestyle':
        return (
          <>
            <Text style={styles.instruction}>Choose a topic and speak for 1-3 minutes</Text>
            <View style={styles.suggestionContainer}>
              <TouchableOpacity style={styles.suggestionButton}>
                <Text style={styles.suggestionText}>My Professional Goals</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton}>
                <Text style={styles.suggestionText}>Recent Challenge</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton}>
                <Text style={styles.suggestionText}>Introduction</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton}>
                <Text style={styles.suggestionText}>Leadership Experience</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case 'guided':
        return (
          <>
            <Text style={styles.instruction}>Read the provided text aloud</Text>
            <View style={styles.suggestionContainer}>
              <TouchableOpacity style={styles.suggestionButton}>
                <Text style={styles.suggestionText}>Professional Introduction</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton}>
                <Text style={styles.suggestionText}>Elevator Pitch</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton}>
                <Text style={styles.suggestionText}>Project Presentation</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case 'qa':
        return (
          <>
            <Text style={styles.instruction}>Practice answering interview questions</Text>
            <View style={styles.suggestionContainer}>
              <TouchableOpacity style={styles.suggestionButton}>
                <Text style={styles.suggestionText}>Tell me about yourself</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton}>
                <Text style={styles.suggestionText}>Your greatest strength</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton}>
                <Text style={styles.suggestionText}>Handling conflicts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestionButton}>
                <Text style={styles.suggestionText}>Why this role?</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'freestyle' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setSelectedTab('freestyle')}
          >
            <Text
              style={selectedTab === 'freestyle' ? styles.tabTextActive : styles.tabTextInactive}
            >
              Freestyle
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'guided' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setSelectedTab('guided')}
          >
            <Text
              style={selectedTab === 'guided' ? styles.tabTextActive : styles.tabTextInactive}
            >
              Guided
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'qa' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setSelectedTab('qa')}
          >
            <Text
              style={selectedTab === 'qa' ? styles.tabTextActive : styles.tabTextInactive}
            >
              Q&A
            </Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}

        <View style={styles.recorderContainer}>
          <Text style={styles.timerText}>00:00</Text>
          <View style={styles.waveformPlaceholder} />
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity style={[styles.controlButton, styles.recordButton]}>
            <Text style={styles.buttonText}>▶</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.stopButton]}>
            <Text style={styles.stopButtonText}>■</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.submitButton]}>
            <Text style={styles.buttonText}>✓</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.helpText}>
          Tap the play button to start recording. Recording will stop automatically after 3 minutes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};
