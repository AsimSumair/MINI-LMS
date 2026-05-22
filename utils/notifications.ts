import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { AppState, Platform, Alert } from 'react-native';
import { usePreferencesStore } from '@/store/preferencesStore';   // ← NEW

// ─── Safe import of expo-notifications ───────────────────────────────────────
// expo-notifications crashes in Expo Go so we load it conditionally.
// If it fails, notificationsAvailable stays false and every function
// gracefully falls back to an in-app Alert instead.

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

// lastOpenedTime tracks when the app last came to foreground.
// Used to decide whether 24 hours have passed.
let lastOpenedTime = Date.now();

// ─── Notification handler (what happens when a notification arrives) ──────────
// shouldShowAlert  → show the notification banner
// shouldPlaySound  → play the default sound
// shouldSetBadge   → don't change the app icon badge number
// shouldShowBanner → show it as a banner (iOS specific)

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

// ─── AppState listener ────────────────────────────────────────────────────────
// AppState fires 'active' every time the user brings the app to the foreground.
// We use it to:
//   1. Update lastOpenedTime so the 24h gap calculation stays accurate
//   2. Cancel any pending reminder because the user just opened the app

if (notificationsAvailable && Notifications && !isExpoGo && Device.isDevice) {
  AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      lastOpenedTime = Date.now();
      cancel24hrReminder().catch(console.error);
    }
  });
}

// ─── 1. Request permission ────────────────────────────────────────────────────
// Always call this before scheduling any notification.
// Returns true  → permission granted, safe to proceed
// Returns false → denied or unavailable, show fallback

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

// ─── 2. Bookmark notification ─────────────────────────────────────────────────
// Called from [id].tsx every time a user bookmarks a course.
// Fires when count reaches 5 or more.
//
// NEW: reads notificationsEnabled + bookmarkNotifications from preferencesStore
// using getState() — this is the Zustand way to read state OUTSIDE a component.
// If the user has turned off bookmark notifications in settings, we skip silently.

export async function scheduleBookmarkNotification(count: number): Promise<void> {

  // ── NEW: check user preferences before doing anything ───────────────────
  // getState() is a Zustand method — works outside React components.
  // Inside a component you'd use the hook: usePreferencesStore(s => s.notificationsEnabled)
  // Outside (like here in a utility file) you must use getState() instead.
  const { notificationsEnabled, bookmarkNotifications } =
    usePreferencesStore.getState();

  if (!notificationsEnabled || !bookmarkNotifications) {
    console.log('Bookmark notifications disabled by user — skipping');
    // Still show in-app alert even if push notifications are off
    if (count >= 5) {
      Alert.alert(
        '🎉 Achievement Unlocked!',
        `You've bookmarked ${count} courses! Keep up the great learning momentum!`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    }
    return;
  }

  // ── Expo Go / no notifications available → in-app alert fallback ─────────
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

  // ── Real device + notifications available ─────────────────────────────────
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
      trigger: null,   // null = fire immediately
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

// ─── 3. Schedule 24-hour reminder ────────────────────────────────────────────
// Schedules a notification 24 hours in the future.
// Called from initializeNotifications() on every app launch.
// If the user opens the app again before 24h, cancel24hrReminder() wipes it.
//
// NEW: checks reminderNotifications preference before scheduling.

export async function schedule24hrReminder(): Promise<void> {

  // ── NEW: check user preferences ──────────────────────────────────────────
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
    // Cancel any existing reminder first so we don't stack duplicates
    await cancel24hrReminder();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '👋 Ready to learn?',
        body:  "You haven't opened Mini LMS in a while. Continue your learning journey!",
        data:  { screen: 'Home' },
      },
      trigger: {
        seconds: 24 * 60 * 60,  // 24 hours in seconds
        repeats: false,          // fire once, not on a repeat
      },
    });

    console.log('✅ 24-hour reminder scheduled');
  } catch (error) {
    console.error('Error scheduling 24-hour reminder:', error);
  }
}

// ─── 4. Cancel 24-hour reminder ──────────────────────────────────────────────
// Finds any scheduled notification whose body contains our identifier text
// and cancels it. Called when the app comes back to foreground (AppState listener
// above) so a user who returns within 24h never sees a stale reminder.

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

// ─── 5. Initialize (called once on app launch from _layout.tsx) ───────────────
// Entry point for the entire notification system.
// loadPreferences() must run BEFORE this so getState() reads correct values.

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

// ─── 6. Helper ────────────────────────────────────────────────────────────────

export function areNotificationsAvailable(): boolean {
  return notificationsAvailable && !isExpoGo && Device.isDevice;
}