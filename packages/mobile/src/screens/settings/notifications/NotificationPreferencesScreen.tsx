import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { Card, Button, Divider } from '../../../components/ui';
import { format } from 'date-fns';
import { notificationService } from '../../../services/notifications/notificationService';
import { useUserPreferences } from '../../../hooks/useUserPreferences';
import { useToast } from '../../../hooks/useToast';

const NotificationPreferencesScreen: React.FC = () => {
  const { theme, colors } = useTheme();
  const { showToast } = useToast();
  const { 
    preferences, 
    updateNotificationPreferences,
    isLoading 
  } = useUserPreferences();
  
  const [notificationSettings, setNotificationSettings] = useState({
    practiceReminders: true,
    milestones: true,
    feedbackNotifications: true,
  });
  
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Monday, Wednesday, Friday
  
  useEffect(() => {
    if (preferences?.notifications) {
      setNotificationSettings({
        practiceReminders: preferences.notifications.practiceReminders ?? true,
        milestones: preferences.notifications.milestones ?? true,
        feedbackNotifications: preferences.notifications.feedbackNotifications ?? true,
      });
      
      if (preferences.notifications.reminderTime) {
        const timeComponents = preferences.notifications.reminderTime.split(':');
        const newDate = new Date();
        newDate.setHours(parseInt(timeComponents[0]), parseInt(timeComponents[1]));
        setReminderTime(newDate);
      }
      
      if (preferences.notifications.reminderDays) {
        setSelectedDays(preferences.notifications.reminderDays);
      }
    }
  }, [preferences]);

  const handleToggleChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const getDayName = (day: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day % 7];
  };

  const handleSavePreferences = async () => {
    try {
      // Format time as HH:MM
      const formattedTime = format(reminderTime, 'HH:mm');
      
      await updateNotificationPreferences({
        practiceReminders: notificationSettings.practiceReminders,
        milestones: notificationSettings.milestones,
        feedbackNotifications: notificationSettings.feedbackNotifications,
        reminderTime: formattedTime,
        reminderDays: selectedDays,
      });
      
      // Schedule or cancel notifications based on the settings
      if (notificationSettings.practiceReminders) {
        // Cancel previous reminders first
        notificationService.cancelAllNotifications();
        
        // Schedule new reminders for the selected days
        scheduleWeeklyReminders();
      } else {
        notificationService.cancelAllNotifications();
      }
      
      showToast({
        type: 'success',
        text1: 'Preferences Saved',
        text2: 'Your notification preferences have been updated',
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      showToast({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update notification preferences',
      });
    }
  };
  
  const scheduleWeeklyReminders = () => {
    // Cancel any existing reminders
    notificationService.cancelAllNotifications();
    
    if (!notificationSettings.practiceReminders) return;
    
    // Get the current date
    const now = new Date();
    
    // Schedule reminders for each selected day for the next 4 weeks
    selectedDays.forEach(day => {
      for (let week = 0; week < 4; week++) {
        const reminderDate = new Date();
        
        // Set day of week (0 = Sunday, 1 = Monday, etc.)
        const currentDay = reminderDate.getDay();
        const daysToAdd = (day - currentDay + 7) % 7 + (week * 7);
        
        reminderDate.setDate(now.getDate() + daysToAdd);
        reminderDate.setHours(reminderTime.getHours());
        reminderDate.setMinutes(reminderTime.getMinutes());
        reminderDate.setSeconds(0);
        
        // Only schedule if it's in the future
        if (reminderDate > now) {
          notificationService.schedulePracticeReminder(
            'Time to Practice',
            `It's time for your scheduled practice session`,
            reminderDate
          );
        }
      }
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Notification Preferences
      </Text>
      
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Enable Notifications
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Practice Reminders
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Get reminders for your scheduled practice sessions
            </Text>
          </View>
          <Switch
            value={notificationSettings.practiceReminders}
            onValueChange={() => handleToggleChange('practiceReminders')}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={notificationSettings.practiceReminders ? colors.primary : '#f4f3f4'}
          />
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Milestone Achievements
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Receive notifications when you reach a milestone
            </Text>
          </View>
          <Switch
            value={notificationSettings.milestones}
            onValueChange={() => handleToggleChange('milestones')}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={notificationSettings.milestones ? colors.primary : '#f4f3f4'}
          />
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Feedback Ready
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Get notified when your speech analysis is complete
            </Text>
          </View>
          <Switch
            value={notificationSettings.feedbackNotifications}
            onValueChange={() => handleToggleChange('feedbackNotifications')}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={notificationSettings.feedbackNotifications ? colors.primary : '#f4f3f4'}
          />
        </View>
      </Card>
      
      {notificationSettings.practiceReminders && (
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Practice Reminder Schedule
          </Text>
          
          <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
            Reminder Time
          </Text>
          
          <TouchableOpacity 
            style={[styles.timeSelector, { borderColor: colors.border }]} 
            onPress={() => setShowTimePicker(true)}
          >
            <MaterialIcons name="access-time" size={24} color={colors.primary} />
            <Text style={[styles.timeText, { color: colors.text }]}>
              {format(reminderTime, 'h:mm a')}
            </Text>
          </TouchableOpacity>
          
          {showTimePicker && (
            <DateTimePicker
              value={reminderTime}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={handleTimeChange}
            />
          )}
          
          <Text style={[styles.subsectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>
            Practice Days
          </Text>
          
          <View style={styles.daysContainer}>
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day) ? 
                    { backgroundColor: colors.primary } : 
                    { backgroundColor: 'transparent', borderColor: colors.border }
                ]}
                onPress={() => toggleDay(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: selectedDays.includes(day) ? '#fff' : colors.text }
                  ]}
                >
                  {getDayName(day)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      )}
      
      <Button
        title="Save Preferences"
        onPress={handleSavePreferences}
        loading={isLoading}
        style={styles.saveButton}
      />
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
  section: {
    marginBottom: 20,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    marginVertical: 8,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 16,
    marginLeft: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  dayButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    marginVertical: 20,
  },
});

export default NotificationPreferencesScreen;
