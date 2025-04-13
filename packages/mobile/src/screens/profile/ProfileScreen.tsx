import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useStyles } from '../../theme/useStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useProfile, useSettings } from '../../contexts';
import { UserSettings, UserGoal } from '../../adapters';
import { useNavigation } from '@react-navigation/native';

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const { userProfile, loading: profileLoading, updateSettings } = useProfile();
  const { 
    settings: appSettings, 
    updateThemeMode, 
    toggleSystemVoice, 
    toggleHapticFeedback 
  } = useSettings();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    userProfile?.settings?.notificationPreferences?.inApp || true
  );
  
  const navigation = useNavigation();

  useEffect(() => {
    if (userProfile?.settings?.notificationPreferences) {
      setNotificationsEnabled(userProfile.settings.notificationPreferences.inApp);
    }
  }, [userProfile]);

  const styles = useStyles(theme => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.lg,
    },
    profileHeader: {
      alignItems: 'center',
      marginVertical: theme.spacing.xl,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 36,
      fontWeight: 'bold',
    },
    name: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    email: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    editButton: {
      marginTop: theme.spacing.md,
    },
    editButtonText: {
      color: theme.colors.primary,
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
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
    goalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    goalText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textPrimary,
    },
    goalTarget: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingLabel: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textPrimary,
    },
    settingValue: {
      color: theme.colors.primary,
      fontSize: theme.typography.fontSize.sm,
    },
    actionButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
    },
    logoutButton: {
      backgroundColor: '#F3F4F6',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    logoutButtonText: {
      color: '#EF4444',
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  }));

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleEditProfile = () => {
    // Navigate to EditProfile screen - this would be created in a real implementation
    Alert.alert('Edit Profile', 'Edit profile functionality will be implemented in a future phase');
  };
  
  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    
    if (!userProfile) return;
    
    const updatedSettings: UserSettings = {
      ...userProfile.settings,
      notificationPreferences: {
        ...userProfile.settings.notificationPreferences,
        inApp: value
      }
    };
    
    await updateSettings(updatedSettings);
  };
  
  const handleDarkModeToggle = async (value: boolean) => {
    await updateThemeMode(value ? 'dark' : 'light');
  };
  
  const handleSystemVoiceToggle = async (value: boolean) => {
    await toggleSystemVoice();
  };
  
  const handleCoachVoicePress = () => {
    // Navigate to voice selection screen - this would be created in a real implementation
    Alert.alert('Coach Voice', 'Voice selection will be implemented in a future phase');
  };
  
  const handleHelpFAQPress = () => {
    // Navigate to Help/FAQ screen - this would be created in a real implementation
    Alert.alert('Help & FAQ', 'Help & FAQ screen will be implemented in a future phase');
  };
  
  const handleContactSupportPress = () => {
    // Navigate to Contact Support screen - this would be created in a real implementation
    Alert.alert('Contact Support', 'Contact Support screen will be implemented in a future phase');
  };
  
  const handlePrivacyPolicyPress = () => {
    // Navigate to Privacy Policy screen - this would be created in a real implementation
    Alert.alert('Privacy Policy', 'Privacy Policy screen will be implemented in a future phase');
  };
  
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A55A2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(userProfile?.displayName)}</Text>
          </View>
          <Text style={styles.name}>{userProfile?.displayName || 'User'}</Text>
          <Text style={styles.email}>{userProfile?.email || user?.email || 'No email'}</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>My Goals</Text>
          
          {userProfile?.goals && userProfile.goals.length > 0 ? (
            userProfile.goals.map((goal: UserGoal, index: number) => (
              <View key={index} style={styles.card}>
                <View style={styles.goalCard}>
                  <Text style={styles.goalText}>{goal.type === 'presentation' 
                    ? 'Presentation Skills' 
                    : goal.type === 'interview' 
                      ? 'Interview Preparation' 
                      : 'Everyday Speech'}</Text>
                  <Text style={styles.goalTarget}>
                    {goal.weeklySessionTarget} sessions/week
                  </Text>
                </View>
                <Text style={[styles.settingLabel, { marginTop: 8, fontSize: 14 }]}>
                  Focus: {goal.focus.join(', ')}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.card}>
              <Text style={styles.goalText}>No goals set</Text>
              <TouchableOpacity onPress={() => Alert.alert('Goals', 'Goal setting will be implemented in a future phase')}>
                <Text style={styles.editButtonText}>Set Goals</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#E0E4E8', true: '#4A55A2' }}
              />
            </View>
          </View>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Switch
                value={appSettings.themeMode === 'dark'}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#E0E4E8', true: '#4A55A2' }}
              />
            </View>
          </View>
          
          <View style={styles.card}>
            <TouchableOpacity onPress={handleCoachVoicePress}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Coach Voice</Text>
                <Text style={styles.settingValue}>
                  {userProfile?.settings?.selectedVoice === 'default' ? 'Female' : userProfile?.settings?.selectedVoice || 'Female'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Use System Voice</Text>
              <Switch
                value={appSettings.useSystemVoice}
                onValueChange={handleSystemVoiceToggle}
                trackColor={{ false: '#E0E4E8', true: '#4A55A2' }}
              />
            </View>
          </View>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
              <Switch
                value={appSettings.hapticFeedback}
                onValueChange={toggleHapticFeedback}
                trackColor={{ false: '#E0E4E8', true: '#4A55A2' }}
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity onPress={handleHelpFAQPress}>
            <View style={styles.card}>
              <Text style={styles.settingLabel}>Help & FAQ</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleContactSupportPress}>
            <View style={styles.card}>
              <Text style={styles.settingLabel}>Contact Support</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handlePrivacyPolicyPress}>
            <View style={styles.card}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#EF4444" size="small" />
          ) : (
            <Text style={styles.logoutButtonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};