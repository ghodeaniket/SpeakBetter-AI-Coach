import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator,
  Alert,
  Switch
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card, Button, Divider, Input } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addMinutes } from 'date-fns';
import { calendarService } from '../../services/device/calendarService';
import { notificationService } from '../../services/notifications/notificationService';
import { hapticService, HapticPattern } from '../../services/device/hapticService';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../hooks/useToast';

const SchedulePracticeScreen: React.FC = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation();
  const { showToast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [calendarAuthorized, setCalendarAuthorized] = useState(false);
  const [practiceTitle, setPracticeTitle] = useState('SpeakBetter Practice Session');
  const [practiceNotes, setPracticeNotes] = useState('');
  const [practiceDate, setPracticeDate] = useState(new Date());
  const [practiceDuration, setPracticeDuration] = useState(30); // in minutes
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [enableReminder, setEnableReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState(15); // minutes before
  
  // Initialize calendar service
  useEffect(() => {
    const checkCalendarPermissions = async () => {
      try {
        const isAuthorized = await calendarService.initialize();
        setCalendarAuthorized(isAuthorized);
      } catch (error) {
        console.error('Error checking calendar permissions:', error);
        setCalendarAuthorized(false);
      }
    };
    
    checkCalendarPermissions();
  }, []);
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      // Preserve the time from the current practiceDate
      const newDate = new Date(selectedDate);
      newDate.setHours(practiceDate.getHours(), practiceDate.getMinutes());
      setPracticeDate(newDate);
    }
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      // Preserve the date from the current practiceDate
      const newDate = new Date(practiceDate);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setPracticeDate(newDate);
    }
  };
  
  const handleDurationSelect = (minutes: number) => {
    setPracticeDuration(minutes);
    hapticService.selection();
  };
  
  const handleReminderSelect = (minutes: number) => {
    setReminderTime(minutes);
    hapticService.selection();
  };
  
  const handleSchedulePractice = async () => {
    try {
      setIsLoading(true);
      
      // Check if the selected date is in the past
      const now = new Date();
      if (practiceDate < now) {
        hapticService.error();
        Alert.alert(
          'Invalid Date',
          'Please select a future date and time for your practice session.'
        );
        return;
      }
      
      if (!calendarAuthorized) {
        const isAuthorized = await calendarService.initialize();
        if (!isAuthorized) {
          hapticService.error();
          Alert.alert(
            'Calendar Permission Required',
            'Please allow access to your calendar to schedule practice sessions.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => {
                  // This would open app settings, but just show an alert for now
                  Alert.alert('Please open Settings and enable Calendar access.');
                }
              }
            ]
          );
          return;
        }
        setCalendarAuthorized(true);
      }
      
      // Calculate end time based on duration
      const endDate = addMinutes(practiceDate, practiceDuration);
      
      // Prepare alarms/reminders if enabled
      const alarms = enableReminder ? [{ date: -reminderTime }] : [];
      
      // Schedule in calendar
      const eventId = await calendarService.schedulePracticeSession({
        title: practiceTitle,
        startDate: practiceDate,
        endDate: endDate,
        notes: practiceNotes || 'Practice session scheduled by SpeakBetter AI Coach',
        alarms,
      });
      
      if (!eventId) {
        throw new Error('Failed to schedule in calendar');
      }
      
      // Also schedule a notification if reminders are enabled
      if (enableReminder) {
        // Create reminder date by subtracting reminder minutes from practice date
        const reminderDate = new Date(practiceDate);
        reminderDate.setMinutes(reminderDate.getMinutes() - reminderTime);
        
        // Only schedule if reminder time is in the future
        if (reminderDate > now) {
          notificationService.schedulePracticeReminder(
            'Practice Session Reminder',
            `Your practice session "${practiceTitle}" is starting in ${reminderTime} minutes`,
            reminderDate
          );
        }
      }
      
      hapticService.success();
      showToast({
        type: 'success',
        text1: 'Session Scheduled',
        text2: 'Your practice session has been added to your calendar',
      });
      
      // Navigate back or to calendar view
      navigation.goBack();
    } catch (error) {
      console.error('Error scheduling practice:', error);
      hapticService.error();
      showToast({
        type: 'error',
        text1: 'Scheduling Failed',
        text2: 'An error occurred while scheduling your practice session',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const requestCalendarPermission = async () => {
    try {
      const isAuthorized = await calendarService.initialize();
      setCalendarAuthorized(isAuthorized);
      
      if (!isAuthorized) {
        Alert.alert(
          'Permission Required',
          'Calendar access is needed to schedule practice sessions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                // This would open app settings, but just show an alert for now
                Alert.alert('Please open Settings and enable Calendar access.');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting calendar permission:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Schedule Practice Session
      </Text>
      
      {!calendarAuthorized && (
        <Card style={styles.permissionCard}>
          <MaterialIcons name="event-busy" size={40} color={colors.warning} style={styles.permissionIcon} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Calendar Access Required
          </Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            To schedule practice sessions in your calendar, please grant calendar access permission.
          </Text>
          <Button
            title="Grant Permission"
            onPress={requestCalendarPermission}
            style={styles.permissionButton}
          />
        </Card>
      )}
      
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Session Details
        </Text>
        
        <Input
          label="Title"
          value={practiceTitle}
          onChangeText={setPracticeTitle}
          placeholder="Enter a title for your practice session"
          containerStyle={styles.inputContainer}
        />
        
        <Input
          label="Notes"
          value={practiceNotes}
          onChangeText={setPracticeNotes}
          placeholder="Add any notes for this session (optional)"
          multiline
          numberOfLines={3}
          containerStyle={styles.inputContainer}
        />
      </Card>
      
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Date & Time
        </Text>
        
        <TouchableOpacity 
          style={[styles.dateSelector, { borderColor: colors.border }]} 
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialIcons name="calendar-today" size={24} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {format(practiceDate, 'EEEE, MMMM d, yyyy')}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={practiceDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
        
        <TouchableOpacity 
          style={[styles.dateSelector, { borderColor: colors.border, marginTop: 12 }]} 
          onPress={() => setShowTimePicker(true)}
        >
          <MaterialIcons name="access-time" size={24} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {format(practiceDate, 'h:mm a')}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        {showTimePicker && (
          <DateTimePicker
            value={practiceDate}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </Card>
      
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Session Duration
        </Text>
        
        <View style={styles.durationContainer}>
          {[15, 30, 45, 60].map(minutes => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.durationButton,
                practiceDuration === minutes
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: 'transparent', borderColor: colors.border }
              ]}
              onPress={() => handleDurationSelect(minutes)}
            >
              <Text
                style={[
                  styles.durationText,
                  { color: practiceDuration === minutes ? '#fff' : colors.text }
                ]}
              >
                {minutes} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
      
      <Card style={styles.section}>
        <View style={styles.reminderHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reminder
          </Text>
          <Switch
            value={enableReminder}
            onValueChange={setEnableReminder}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={enableReminder ? colors.primary : '#f4f3f4'}
          />
        </View>
        
        {enableReminder && (
          <View style={styles.reminderContainer}>
            <Text style={[styles.reminderText, { color: colors.textSecondary }]}>
              Remind me before session:
            </Text>
            
            <View style={styles.durationContainer}>
              {[5, 15, 30, 60].map(minutes => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.reminderButton,
                    reminderTime === minutes
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: 'transparent', borderColor: colors.border }
                  ]}
                  onPress={() => handleReminderSelect(minutes)}
                >
                  <Text
                    style={[
                      styles.reminderButtonText,
                      { color: reminderTime === minutes ? '#fff' : colors.text }
                    ]}
                  >
                    {minutes} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </Card>
      
      <Button
        title="Schedule Practice Session"
        onPress={handleSchedulePractice}
        loading={isLoading}
        disabled={!calendarAuthorized || isLoading}
        style={styles.scheduleButton}
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
  permissionCard: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  permissionIcon: {
    marginBottom: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionButton: {
    width: '100%',
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  durationButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
    marginBottom: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '500',
  },
  reminderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: enableReminder ? 16 : 0,
  },
  reminderContainer: {
    marginTop: 8,
  },
  reminderText: {
    fontSize: 16,
    marginBottom: 12,
  },
  reminderButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  reminderButtonText: {
    fontSize: 14,
  },
  scheduleButton: {
    marginVertical: 20,
  },
});

export default SchedulePracticeScreen;
