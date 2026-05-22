import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CourseProvider } from '@/store/courseStore';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { initializeNotifications } from '@/utils/notifications';
import { usePreferencesStore } from '@/store/preferencesStore';  

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useAuth();
  const loadPreferences = usePreferencesStore((s) => s.loadPreferences);
  
  useEffect(() => {
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