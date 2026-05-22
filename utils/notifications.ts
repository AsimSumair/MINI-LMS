import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { AppState, Platform, Alert } from 'react-native';
import { usePreferencesStore } from '@/store/preferencesStore';  


let Notifications: any = null;
let notificationsAvailable = false;

try {
  if (Constants.appOwnership !== 'expo' && Device.isDevice) {
    const notificationsModule = require('expo-notifications');
    Notifications = notificationsModule;
    notificationsAvailable = true;
    console.log('✅ Expo Notifications loaded successfully');
  } else {
    console.log('⚠️ Notifications not available in Expo Go or on emulator');
  }
} catch (error) {
  console.log('❌ Failed to load expo-notifications:', error);
  notificationsAvailable = false;
}

const isExpoGo = Constants.appOwnership === 'expo';

let lastOpenedTime = Date.now();

if (notificationsAvailable && Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:  true,
      shouldPlaySound:  true,
      shouldSetBadge:   false,
      shouldShowBanner: true,
    }),
  });
}

if (notificationsAvailable && Notifications && !isExpoGo && Device.isDevice) {
  AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      lastOpenedTime = Date.now();
      cancel24hrReminder().catch(console.error);
    }
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsAvailable || !Notifications) {
    console.log('Notifications not available');
    return false;
  }

  if (isExpoGo) {
    console.log('Notifications not supported in Expo Go');
    return false;
  }

  if (!Device.isDevice) {
    console.log('Notifications only work on physical devices');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}


export async function scheduleBookmarkNotification(count: number): Promise<void> {

  const { notificationsEnabled, bookmarkNotifications } =
    usePreferencesStore.getState();

  if (!notificationsEnabled || !bookmarkNotifications) {
    console.log('Bookmark notifications disabled by user — skipping');
    if (count >= 5) {
      Alert.alert(
        '🎉 Achievement Unlocked!',
        `You've bookmarked ${count} courses! Keep up the great learning momentum!`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    }
    return;
  }

  if (!notificationsAvailable || !Notifications) {
    console.log('Bookmark notification skipped - expo-notifications not available');
    if (count >= 5) {
      Alert.alert(
        '🎉 Achievement Unlocked!',
        `You've bookmarked ${count} courses! Keep up the great learning momentum!`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    }
    return;
  }

  if (isExpoGo || !Device.isDevice) {
    console.log('Bookmark notification skipped - not available in Expo Go');
    if (count >= 5) {
      Alert.alert(
        '🎉 Achievement Unlocked!',
        `You've bookmarked ${count} courses! Keep learning!`,
        [{ text: 'Great!', style: 'default' }]
      );
    }
    return;
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    Alert.alert(
      '🎉 Achievement Unlocked!',
      `You've bookmarked ${count} courses! Enable notifications to get reminders.`,
      [{ text: 'OK', style: 'default' }]
    );
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Achievement Unlocked!',
        body:  `You've bookmarked ${count} courses! Keep up the great learning momentum!`,
        data:  { screen: 'Bookmarks', bookmarkCount: count },
      },
      trigger: null,   
    });
    console.log(`✅ Bookmark notification sent for ${count} bookmarks`);
  } catch (error) {
    console.error('Error scheduling bookmark notification:', error);
    Alert.alert(
      '🎉 Achievement Unlocked!',
      `You've bookmarked ${count} courses! Great progress!`,
      [{ text: 'Thanks!', style: 'default' }]
    );
  }
}

export async function schedule24hrReminder(): Promise<void> {

  const { notificationsEnabled, reminderNotifications } =
    usePreferencesStore.getState();

  if (!notificationsEnabled || !reminderNotifications) {
    console.log('Reminder notifications disabled by user — skipping');
    return;
  }

  if (!notificationsAvailable || !Notifications) {
    console.log('24-hour reminder skipped - expo-notifications not available');
    return;
  }

  if (isExpoGo || !Device.isDevice) {
    console.log('24-hour reminder skipped - not available in Expo Go');
    return;
  }

  const granted = await requestNotificationPermission();
  if (!granted) return;

  try {
    await cancel24hrReminder();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '👋 Ready to learn?',
        body:  "You haven't opened Mini LMS in a while. Continue your learning journey!",
        data:  { screen: 'Home' },
      },
      trigger: {
        seconds: 24 * 60 * 60, 
        repeats: false,          
      },
    });

    console.log('✅ 24-hour reminder scheduled');
  } catch (error) {
    console.error('Error scheduling 24-hour reminder:', error);
  }
}

export async function cancel24hrReminder(): Promise<void> {
  if (!notificationsAvailable || !Notifications || isExpoGo || !Device.isDevice) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.body?.includes("You haven't opened Mini LMS")) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log('Cancelled existing 24h reminder');
      }
    }
  } catch (error) {
    console.error('Error canceling reminder:', error);
  }
}

export async function initializeNotifications(): Promise<void> {
  if (!notificationsAvailable || !Notifications) {
    console.log('Notifications not initialized - expo-notifications not available');
    console.log('To enable: npx expo run:android or npx expo run:ios');
    return;
  }

  if (isExpoGo || !Device.isDevice) {
    console.log('Notifications not initialized - Expo Go or emulator detected');
    console.log('Tip: Notifications only work in standalone builds');
    return;
  }

  try {
    await requestNotificationPermission();
    await schedule24hrReminder();
    console.log('✅ Notifications initialized successfully');
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}

export function areNotificationsAvailable(): boolean {
  return notificationsAvailable && !isExpoGo && Device.isDevice;
}