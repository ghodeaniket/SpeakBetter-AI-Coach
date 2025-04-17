import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, StyleSheet } from 'react-native';
import { useStyles } from '../../../theme/useStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings, useProfile } from '../../../contexts';
import { useNavigation } from '@react-navigation/native';
import { UserSettings } from '../../../adapters';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { 
    settings: appSettings, 
    updateThemeMode, 
    updateFontSize,
    toggleSystemVoice, 
    toggleHapticFeedback,
    toggleAutoPlayFeedback,
    resetSettings 
  } = useSettings();
  
  const { userProfile, updateSettings } = useProfile();
  
  const styles = useStyles(theme => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.sm,
    },
    backButtonText: {
      color: theme.colors.primary,
      fontSize: theme.typography.fontSize.md,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: theme.typography.fontSize.lg,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    content: {
      padding: theme.spacing.lg,
    },
    sectionContainer: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    card: {
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
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    settingLabel: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textPrimary,
    },
    settingDescription: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    valueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    valueText: {
      color: theme.colors.primary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: 'bold',
      marginRight: theme.spacing.sm,
    },
    resetButton: {
      backgroundColor: '#F3F4F6',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    resetButtonText: {
      color: theme.colors.error,
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
    },
    optionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.sm,
    },
    optionButton: {
      flex: 1,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    optionButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    optionButtonInactive: {
      backgroundColor: theme.colors.border,
    },
    optionText: {
      fontSize: theme.typography.fontSize.sm,
    },
    optionTextActive: {
      color: '#FFFFFF',
    },
    optionTextInactive: {
      color: theme.colors.textPrimary,
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.sm,
    },
  }));
  
  const handleBackPress = () => {
    navigation.goBack();
  };
  
  const handleThemeModeSelection = async (mode: 'light' | 'dark' | 'system') => {
    await updateThemeMode(mode);
  };
  
  const handleFontSizeSelection = async (size: 'small' | 'medium' | 'large') => {
    await updateFontSize(size);
  };
  
  const handlePracticeDaysChange = async (day: string) => {
    if (!userProfile?.settings?.notificationPreferences) return;
    
    const currentDays = [...userProfile.settings.notificationPreferences.practiceDays];
    const dayIndex = currentDays.indexOf(day);
    
    if (dayIndex >= 0) {
      // Remove day if already selected
      currentDays.splice(dayIndex, 1);
    } else {
      // Add day if not already selected
      currentDays.push(day);
    }
    
    const updatedSettings: UserSettings = {
      ...userProfile.settings,
      notificationPreferences: {
        ...userProfile.settings.notificationPreferences,
        practiceDays: currentDays
      }
    };
    
    await updateSettings(updatedSettings);
  };
  
  const handlePersonalityChange = async (personality: string) => {
    if (!userProfile) return;
    
    const updatedSettings: UserSettings = {
      ...userProfile.settings,
      coachPersonality: personality
    };
    
    await updateSettings(updatedSettings);
  };
  
  const handleResetSettings = async () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            await resetSettings();
            Alert.alert('Settings Reset', 'Your settings have been reset to default values');
          }
        }
      ]
    );
  };
  
  // Get days of the week for practice reminder settings
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const isDaySelected = (day: string) => {
    return userProfile?.settings?.notificationPreferences?.practiceDays?.includes(day) || false;
  };
  
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.card}>
            <View>
              <Text style={styles.settingLabel}>Theme Mode</Text>
              <View style={styles.optionContainer}>
                {(['light', 'dark', 'system'] as const).map((mode) => (
                  <TouchableOpacity 
                    key={mode}
                    style={[
                      styles.optionButton,
                      appSettings.themeMode === mode ? styles.optionButtonActive : styles.optionButtonInactive
                    ]}
                    onPress={() => handleThemeModeSelection(mode)}
                  >
                    <Text 
                      style={[
                        styles.optionText,
                        appSettings.themeMode === mode ? styles.optionTextActive : styles.optionTextInactive
                      ]}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View>
              <Text style={styles.settingLabel}>Font Size</Text>
              <View style={styles.optionContainer}>
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <TouchableOpacity 
                    key={size}
                    style={[
                      styles.optionButton,
                      appSettings.fontSize === size ? styles.optionButtonActive : styles.optionButtonInactive
                    ]}
                    onPress={() => handleFontSizeSelection(size)}
                  >
                    <Text 
                      style={[
                        styles.optionText,
                        appSettings.fontSize === size ? styles.optionTextActive : styles.optionTextInactive
                      ]}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Coach Settings</Text>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>System Voice</Text>
                <Text style={styles.settingDescription}>Use your device's text-to-speech voice</Text>
              </View>
              <Switch
                value={appSettings.useSystemVoice}
                onValueChange={toggleSystemVoice}
                trackColor={{ false: '#E0E4E8', true: '#4A55A2' }}
              />
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Auto-Play Feedback</Text>
                <Text style={styles.settingDescription}>Automatically play voice feedback</Text>
              </View>
              <Switch
                value={appSettings.autoPlayFeedback}
                onValueChange={toggleAutoPlayFeedback}
                trackColor={{ false: '#E0E4E8', true: '#4A55A2' }}
              />
            </View>
            
            <View style={styles.separator} />
            
            <View>
              <Text style={styles.settingLabel}>Coach Personality</Text>
              <View style={styles.optionContainer}>
                {(['supportive', 'direct', 'analytical'] as const).map((personality) => (
                  <TouchableOpacity 
                    key={personality}
                    style={[
                      styles.optionButton,
                      userProfile?.settings?.coachPersonality === personality ? styles.optionButtonActive : styles.optionButtonInactive
                    ]}
                    onPress={() => handlePersonalityChange(personality)}
                  >
                    <Text 
                      style={[
                        styles.optionText,
                        userProfile?.settings?.coachPersonality === personality ? styles.optionTextActive : styles.optionTextInactive
                      ]}
                    >
                      {personality.charAt(0).toUpperCase() + personality.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>Receive reminders via email</Text>
              </View>
              <Switch
                value={userProfile?.settings?.notificationPreferences?.email || false}
                onValueChange={(value) => {
                  if (!userProfile) return;
                  
                  const updatedSettings: UserSettings = {
                    ...userProfile.settings,
                    notificationPreferences: {
                      ...userProfile.settings.notificationPreferences,
                      email: value
                    }
                  };
                  
                  updateSettings(updatedSettings);
                }}
                trackColor={{ false: '#E0E4E8', true: '#4A55A2' }}
              />
            </View>
            
            <View style={styles.separator} />
            
            <View>
              <Text style={styles.settingLabel}>Practice Reminder Days</Text>
              <Text style={styles.settingDescription}>Days to receive practice reminders</Text>
              
              <View style={styles.optionContainer}>
                {daysOfWeek.map((day, index) => (
                  <TouchableOpacity 
                    key={day}
                    style={[
                      styles.optionButton,
                      { borderRadius: 20, width: 40, height: 40 },
                      isDaySelected(day) ? styles.optionButtonActive : styles.optionButtonInactive
                    ]}
                    onPress={() => handlePracticeDaysChange(day)}
                  >
                    <Text 
                      style={[
                        styles.optionText,
                        isDaySelected(day) ? styles.optionTextActive : styles.optionTextInactive
                      ]}
                    >
                      {dayLabels[index]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Additional Settings</Text>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <Text style={styles.settingDescription}>Enable vibration for interactions</Text>
              </View>
              <Switch
                value={appSettings.hapticFeedback}
                onValueChange={toggleHapticFeedback}
                trackColor={{ false: '#E0E4E8', true: '#4A55A2' }}
              />
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
          <Text style={styles.resetButtonText}>Reset Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};