import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CourseProvider } from '@/store/courseStore';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { initializeNotifications } from '@/utils/notifications';
import { usePreferencesStore } from '@/store/preferencesStore';   // ← NEW

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useAuth();

  // ── NEW: pull loadPreferences action from the store ──────────────────────
  // usePreferencesStore is a Zustand store — (s) => s.loadPreferences
  // is a selector that grabs only the loadPreferences function.
  // This avoids re-rendering this component when other preferences change.
  const loadPreferences = usePreferencesStore((s) => s.loadPreferences);

  useEffect(() => {
    // Runs once on app mount.
    // Order matters:
    //   1. loadPreferences first — so notification toggles are ready
    //   2. initializeNotifications second — so it can read those toggles
    loadPreferences();
    initializeNotifications();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CourseProvider>
        <RootLayoutNav />
      </CourseProvider>
    </AuthProvider>
  );
}