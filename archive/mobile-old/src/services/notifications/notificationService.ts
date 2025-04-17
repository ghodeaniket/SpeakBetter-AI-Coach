import messaging from '@react-native-firebase/messaging';
import PushNotification, { Importance } from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';
import { getStore } from '../../store';
import { userService } from '../user/userService';

// Notification channels
export const CHANNELS = {
  PRACTICE_REMINDERS: 'practice_reminders',
  MILESTONES: 'achievement_milestones',
  FEEDBACK: 'feedback_notifications',
};

// Notification types
export const NOTIFICATION_TYPES = {
  PRACTICE_REMINDER: 'practice_reminder',
  MILESTONE_ACHIEVED: 'milestone_achieved',
  FEEDBACK_READY: 'feedback_ready',
};

class NotificationService {
  constructor() {
    this.initialize();
  }

  initialize = () => {
    // Configure notification channels for Android
    PushNotification.createChannel(
      {
        channelId: CHANNELS.PRACTICE_REMINDERS,
        channelName: 'Practice Reminders',
        channelDescription: 'Notifications for practice session reminders',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`Channel ${CHANNELS.PRACTICE_REMINDERS} created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: CHANNELS.MILESTONES,
        channelName: 'Achievement Milestones',
        channelDescription: 'Notifications for achievement milestones',
        importance: Importance.DEFAULT,
        vibrate: true,
      },
      (created) => console.log(`Channel ${CHANNELS.MILESTONES} created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: CHANNELS.FEEDBACK,
        channelName: 'Feedback Notifications',
        channelDescription: 'Notifications for feedback and analysis',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`Channel ${CHANNELS.FEEDBACK} created: ${created}`)
    );

    // Configure PushNotification
    PushNotification.configure({
      onRegister: this.onRegister,
      onNotification: this.onNotification,
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    // Initialize Firebase Messaging
    this.initializeFirebaseMessaging();
  };

  initializeFirebaseMessaging = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Firebase Messaging authorization status:', authStatus);
        this.getFcmToken();
        this.listenToFcmMessages();
      }
    } catch (error) {
      console.log('Failed to get messaging permission:', error);
    }
  };

  getFcmToken = async () => {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        // Save the token to the user profile
        this.updateTokenInUserProfile(fcmToken);
      }
    } catch (error) {
      console.log('Failed to get FCM token:', error);
    }
  };

  updateTokenInUserProfile = async (token: string) => {
    try {
      const user = getStore().getState().auth.user;
      if (user?.uid) {
        await userService.updateUserNotificationToken(user.uid, token);
      }
    } catch (error) {
      console.log('Error updating notification token:', error);
    }
  };

  listenToFcmMessages = () => {
    // Background/quit state handling
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background:', remoteMessage);
      // Process the FCM message as needed
    });

    // Foreground state handling
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('FCM message received in foreground:', remoteMessage);
      // Display notification while app is in foreground
      this.showNotification(remoteMessage);
    });

    return unsubscribe;
  };

  onRegister = (token: { token: string; os: string }) => {
    console.log('Device registered for notifications:', token);
  };

  onNotification = (notification: any) => {
    console.log('Notification received:', notification);

    // Process the notification based on its type
    const notificationType = notification.data?.type;
    
    if (notificationType) {
      switch (notificationType) {
        case NOTIFICATION_TYPES.PRACTICE_REMINDER:
          // Handle practice reminder logic
          break;
        case NOTIFICATION_TYPES.MILESTONE_ACHIEVED:
          // Handle milestone achieved logic
          break;
        case NOTIFICATION_TYPES.FEEDBACK_READY:
          // Handle feedback ready logic
          break;
      }
    }

    // Required on iOS only
    if (Platform.OS === 'ios') {
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    }
  };

  showNotification = (message: any) => {
    const channelId = this.getChannelForMessageType(message.data?.type);

    PushNotification.localNotification({
      channelId,
      title: message.notification?.title || 'SpeakBetter Coach',
      message: message.notification?.body || '',
      playSound: true,
      soundName: 'default',
      data: message.data,
    });
  };

  getChannelForMessageType = (type: string | undefined): string => {
    if (!type) return CHANNELS.FEEDBACK;

    switch (type) {
      case NOTIFICATION_TYPES.PRACTICE_REMINDER:
        return CHANNELS.PRACTICE_REMINDERS;
      case NOTIFICATION_TYPES.MILESTONE_ACHIEVED:
        return CHANNELS.MILESTONES;
      case NOTIFICATION_TYPES.FEEDBACK_READY:
        return CHANNELS.FEEDBACK;
      default:
        return CHANNELS.FEEDBACK;
    }
  };

  // Schedule a practice reminder
  schedulePracticeReminder = (title: string, message: string, date: Date) => {
    const notificationId = Date.now().toString();
    
    PushNotification.localNotificationSchedule({
      id: notificationId,
      channelId: CHANNELS.PRACTICE_REMINDERS,
      title,
      message,
      date,
      allowWhileIdle: true,
      playSound: true,
      soundName: 'default',
      data: {
        type: NOTIFICATION_TYPES.PRACTICE_REMINDER,
        id: notificationId,
      },
    });

    return notificationId;
  };

  // Show a milestone notification
  showMilestoneNotification = (title: string, message: string, data = {}) => {
    PushNotification.localNotification({
      channelId: CHANNELS.MILESTONES,
      title,
      message,
      playSound: true,
      soundName: 'default',
      data: {
        type: NOTIFICATION_TYPES.MILESTONE_ACHIEVED,
        ...data,
      },
    });
  };

  // Show a feedback ready notification
  showFeedbackNotification = (title: string, message: string, sessionId: string) => {
    PushNotification.localNotification({
      channelId: CHANNELS.FEEDBACK,
      title,
      message,
      playSound: true,
      soundName: 'default',
      data: {
        type: NOTIFICATION_TYPES.FEEDBACK_READY,
        sessionId,
      },
    });
  };

  // Cancel a scheduled notification
  cancelNotification = (id: string) => {
    PushNotification.cancelLocalNotification(id);
  };

  // Cancel all scheduled notifications
  cancelAllNotifications = () => {
    PushNotification.cancelAllLocalNotifications();
  };
}

export const notificationService = new NotificationService();
