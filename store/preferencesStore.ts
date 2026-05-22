// store/preferencesStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppTheme    = 'light' | 'dark' | 'system';
export type AppLanguage = 'en' | 'hi' | 'fr' | 'de';

interface UserPreferences {
  theme:                  AppTheme;
  language:               AppLanguage;
  notificationsEnabled:   boolean;
  bookmarkNotifications:  boolean;
  reminderNotifications:  boolean;
  autoPlayVideos:         boolean;
  showProgressBadges:     boolean;
}

interface PreferencesState extends UserPreferences {
  isLoaded: boolean;

  // Actions
  loadPreferences:  () => Promise<void>;
  setTheme:         (theme: AppTheme) => Promise<void>;
  setLanguage:      (language: AppLanguage) => Promise<void>;
  toggleNotifications:         () => Promise<void>;
  toggleBookmarkNotifications: () => Promise<void>;
  toggleReminderNotifications: () => Promise<void>;
  toggleAutoPlay:              () => Promise<void>;
  toggleProgressBadges:        () => Promise<void>;
  resetPreferences:            () => Promise<void>;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'lms:userPreferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme:                 'system',
  language:              'en',
  notificationsEnabled:  true,
  bookmarkNotifications: true,
  reminderNotifications: true,
  autoPlayVideos:        false,
  showProgressBadges:    true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Persist the full preferences object to AsyncStorage in one write
async function persist(prefs: UserPreferences) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...DEFAULT_PREFERENCES,
  isLoaded: false,

  // ── Load from AsyncStorage on app start ──────────────────────────────────
  loadPreferences: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const saved = JSON.parse(json) as Partial<UserPreferences>;
        // Merge with defaults so new keys added later always have a value
        set({ ...DEFAULT_PREFERENCES, ...saved, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      set({ isLoaded: true });
    }
  },

  // ── Theme ─────────────────────────────────────────────────────────────────
  setTheme: async (theme) => {
    set({ theme });
    await persist({ ...get(), theme });
  },

  // ── Language ──────────────────────────────────────────────────────────────
  setLanguage: async (language) => {
    set({ language });
    await persist({ ...get(), language });
  },

  // ── Notifications master toggle ───────────────────────────────────────────
  toggleNotifications: async () => {
    const notificationsEnabled = !get().notificationsEnabled;
    set({ notificationsEnabled });
    await persist({ ...get(), notificationsEnabled });
  },

  // ── Bookmark notifications ────────────────────────────────────────────────
  toggleBookmarkNotifications: async () => {
    const bookmarkNotifications = !get().bookmarkNotifications;
    set({ bookmarkNotifications });
    await persist({ ...get(), bookmarkNotifications });
  },

  // ── 24-hour reminder notifications ───────────────────────────────────────
  toggleReminderNotifications: async () => {
    const reminderNotifications = !get().reminderNotifications;
    set({ reminderNotifications });
    await persist({ ...get(), reminderNotifications });
  },

  // ── Auto-play videos ──────────────────────────────────────────────────────
  toggleAutoPlay: async () => {
    const autoPlayVideos = !get().autoPlayVideos;
    set({ autoPlayVideos });
    await persist({ ...get(), autoPlayVideos });
  },

  // ── Progress badges ───────────────────────────────────────────────────────
  toggleProgressBadges: async () => {
    const showProgressBadges = !get().showProgressBadges;
    set({ showProgressBadges });
    await persist({ ...get(), showProgressBadges });
  },

  // ── Reset to defaults ─────────────────────────────────────────────────────
  resetPreferences: async () => {
    set({ ...DEFAULT_PREFERENCES });
    await persist(DEFAULT_PREFERENCES);
  },
}));