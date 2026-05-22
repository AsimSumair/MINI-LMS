// app/(tabs)/index.tsx — Course Catalog
import {
  View, Text, TextInput, TouchableOpacity,
  RefreshControl, ActivityIndicator,
  StatusBar, Platform, StatusBar as RNStatusBar,
  Animated, Dimensions, ScrollView, Alert,
} from 'react-native';
import { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import { LegendList } from '@legendapp/list';
import { useCourses } from '@/store/courseStore';
import { useAuth } from '@/context/AuthContext';
import { fetchCourses } from '@/services/courses.service';
import { scheduleBookmarkNotification, initializeNotifications } from '@/utils/notifications';
import CourseCard from '@/components/CourseCard';
import OfflineBanner from '@/components/OfflineBanner';
import type { Course } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const SB_HEIGHT = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0;

/* ─── Design Tokens ───────────────────────────────────────────────────────── */
const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  primary: '#4F46E5',
  primaryDk: '#3730A3',
  primaryLt: '#818CF8',
  primaryBg: '#EEF2FF',
  secondary: '#10B981',
  accent: '#F59E0B',
  dark: '#0F172A',
  text: '#0F172A',
  textSub: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
};

/* ─── Categories ──────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'All', label: 'All', emoji: '🎯', query: undefined },
  { id: 'mens-watches', label: 'Men Watch', emoji: '⌚', query: 'mens-watches' },
  { id: 'womens-watches', label: 'Women', emoji: '💎', query: 'womens-watches' },
  { id: 'smartphones', label: 'Tech', emoji: '📱', query: 'smartphones' },
  { id: 'laptops', label: 'Laptops', emoji: '💻', query: 'laptops' },
  { id: 'fragrances', label: 'Beauty', emoji: '🌸', query: 'fragrances' },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatNumber(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getUserDisplayName(user: any): string {
  if (user?.fullName?.trim()) return user.fullName.split(' ')[0];
  if (user?.name?.trim()) return user.name.split(' ')[0];
  if (user?.email?.trim()) {
    const n = user.email.split('@')[0].split(/[._-]/)[0];
    return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
  }
  return 'Learner';
}

/* ─── HeroSection ─────────────────────────────────────────────────────────── */
interface HeroProps {
  firstName: string;
  search: string;
  onSearchChange: (v: string) => void;
  onNotificationPress: () => void;
}

const HeroSection = ({
  firstName, search, onSearchChange, onNotificationPress,
}: HeroProps) => (
  <LinearGradient
    colors={[C.primaryDk, C.primary, C.primaryLt] as const}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      paddingTop: SB_HEIGHT + 16,
      paddingHorizontal: 18,
      paddingBottom: 34,
      borderBottomLeftRadius: 26,
      borderBottomRightRadius: 26,
    }}
  >
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, lineHeight: 20 }}>🚀</Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: '#FFFFFFCC', fontWeight: '800', letterSpacing: 2 }}>MINI LMS</Text>
          <Text style={{ fontSize: 9.5, color: '#FFFFFF70', letterSpacing: 0.4 }}>Master New Skills</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onNotificationPress}
        style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
        activeOpacity={0.75}
      >
        <Text style={{ fontSize: 14, lineHeight: 18 }}>🔔</Text>
        <View style={{ position: 'absolute', top: -1, right: -1, width: 9, height: 9, borderRadius: 5, backgroundColor: C.accent, borderWidth: 1.5, borderColor: C.primary }} />
      </TouchableOpacity>
    </View>

    <Text style={{ fontSize: 12, color: '#FFFFFFB0', fontWeight: '500', marginBottom: 3, letterSpacing: 0.3 }}>{getGreeting()},</Text>
    <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4, marginBottom: 20 }}>{firstName} 👋</Text>

    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.white, borderRadius: 13,
      paddingHorizontal: 13, paddingVertical: 10, gap: 9,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12, shadowRadius: 10, elevation: 5,
    }}>
      <Text style={{ fontSize: 15, opacity: 0.5 }}>🔍</Text>
      <TextInput
        style={{ flex: 1, fontSize: 14, color: C.text, fontWeight: '500' }}
        placeholder="Search courses..."
        placeholderTextColor={C.textMuted}
        value={search}
        onChangeText={onSearchChange}
        autoCorrect={false}
        returnKeyType="search"
      />
      {search.length > 0 && (
        <TouchableOpacity
          onPress={() => onSearchChange('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ backgroundColor: C.border, borderRadius: 6, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '800' }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  </LinearGradient>
);

/* ─── StatsSection ────────────────────────────────────────────────────────── */
const StatsSection = ({
  courseCount, totalItems,
}: { courseCount: number; totalItems: number }) => {
  const stats = [
    { label: 'Learners', value: formatNumber(2480), icon: '👥', colors: [C.primary, C.primaryLt] as const },
    { label: 'Courses', value: formatNumber(totalItems), icon: '📚', colors: [C.secondary, '#34D399'] as const },
    { label: 'Success', value: '95%', icon: '🏆', colors: [C.accent, '#FBBF24'] as const },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 18, marginTop: -20, marginBottom: 24 }}>
      {stats.map((stat) => (
        <View key={stat.label} style={{
          flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 11, alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        }}>
          <LinearGradient colors={stat.colors} style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 17 }}>{stat.icon}</Text>
          </LinearGradient>
          <Text style={{ fontSize: 16, fontWeight: '800', color: C.dark, marginBottom: 1 }}>{stat.value}</Text>
          <Text style={{ fontSize: 9, color: C.textMuted, fontWeight: '500', textAlign: 'center' }}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

/* ─── FeaturedSection ─────────────────────────────────────────────────────── */
const FeaturedSection = ({
  courses, bookmarks, onBookmark,
}: { courses: Course[]; bookmarks: string[]; onBookmark: (id: string) => void }) => (
  <View style={{ marginBottom: 26 }}>
    <View style={{ paddingHorizontal: 18, marginBottom: 13 }}>
      <Text style={{ fontSize: 17, fontWeight: '800', color: C.dark, letterSpacing: -0.3 }}>Featured Courses</Text>
      <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Top picks curated for you</Text>
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: 18, gap: 13, paddingRight: 18 }}
      decelerationRate="fast"
      snapToInterval={width - 62}
    >
      {courses.map((course) => (
        <View key={course.id} style={{ width: width - 78 }}>
          <CourseCard
            course={course}
            isBookmarked={bookmarks.includes(course.id)}
            onBookmark={onBookmark}
            featured
          />
        </View>
      ))}
    </ScrollView>
  </View>
);

/* ─── CategoriesSection ───────────────────────────────────────────────────── */
const CategoriesSection = ({
  selected, onSelect, courseCount,
}: { selected: string; onSelect: (id: string) => void; courseCount: number }) => (
  <View style={{ marginBottom: 16 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginBottom: 11 }}>
      <Text style={{ fontSize: 17, fontWeight: '800', color: C.dark, letterSpacing: -0.3 }}>Categories</Text>
      <Text style={{ fontSize: 11, color: C.textMuted }}>{courseCount} course{courseCount !== 1 ? 's' : ''}</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 7 }}>
      {CATEGORIES.map((item) => {
        const active = selected === item.id;
        return (
          <TouchableOpacity key={item.id} onPress={() => onSelect(item.id)} activeOpacity={0.75}>
            {active ? (
              <LinearGradient
                colors={[C.primary, C.primaryLt] as const}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 5 }}
              >
                <Text style={{ fontSize: 12 }}>{item.emoji}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>{item.label}</Text>
              </LinearGradient>
            ) : (
              <View style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 30, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={{ fontSize: 12 }}>{item.emoji}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.textSub }}>{item.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

/* ─── LoadMoreFooter ──────────────────────────────────────────────────────── */
const LoadMoreFooter = ({
  isLoadingMore, hasNextPage,
}: { isLoadingMore: boolean; hasNextPage: boolean }) => {
  if (!hasNextPage && !isLoadingMore) return null;
  return (
    <View style={{ paddingVertical: 24, alignItems: 'center' }}>
      {isLoadingMore
        ? <ActivityIndicator size="small" color={C.primary} />
        : <Text style={{ fontSize: 12, color: C.textMuted }}>Scroll up to refresh</Text>
      }
    </View>
  );
};

/* ─── CourseItem — memoised render wrapper ──────────────────────────────────── */
interface CourseItemProps {
  course: Course;
  onBookmark: (id: string) => void;
}

// FIX 1: CourseItem reads bookmarks live from the store instead of receiving
// isBookmarked as a prop. This means LegendList's recycleItems can't serve a
// stale icon — each item re-renders independently whenever bookmarks change.
const CourseItem = memo(({ course, onBookmark }: CourseItemProps) => {
  const { state } = useCourses();
  return (
    <View style={{ paddingHorizontal: 18 }}>
      <CourseCard
        course={course}
        isBookmarked={state.bookmarks.includes(course.id)}
        onBookmark={onBookmark}
      />
    </View>
  );
});

/* ─── Main Screen ─────────────────────────────────────────────────────────── */
export default function CoursesCatalog() {
  const {
    state,
    setCourses,
    appendCourses,
    toggleBookmark,
    loadBookmarks,
    setLoading,
    setLoadingMore,
    setError,
    setPagination,
  } = useCourses();

  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // ref guard — prevents duplicate infinite-scroll fetches
  const isFetchingMore = useRef(false);

  // ref to the LegendList for programmatic scroll-to-top
  const listRef = useRef<any>(null);

  const scrollY = useRef(new Animated.Value(0)).current;

  /* ── Initial load ── */
  useEffect(() => {
    loadData(1, true);
    loadBookmarks();
    initializeNotifications();
  }, []);

  /* ── Reload when category changes ── */
  useEffect(() => {
    loadData(1, true);
  }, [selectedCategory]);

  /* ── Core fetch ── */
  const loadData = useCallback(async (page: number, replace: boolean) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);

    try {
      const category = CATEGORIES.find((c) => c.id === selectedCategory);
      const result = await fetchCourses({ page, limit: 10, query: category?.query });

      if (replace) setCourses(result.courses);
      else appendCourses(result.courses);

      setPagination({
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Unable to load courses. Check your connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingMore.current = false;
    }
  }, [selectedCategory]);

  /* ── Pull-to-refresh ── */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(1, true);
    setRefreshing(false);
  }, [loadData]);

  /* ── Infinite scroll ── */
  const onEndReached = useCallback(() => {
    if (isFetchingMore.current || !state.hasNextPage || state.isLoadingMore) return;
    isFetchingMore.current = true;
    loadData(state.currentPage + 1, false);
  }, [state.hasNextPage, state.isLoadingMore, state.currentPage, loadData]);

  /* ── Bookmark handler ───────────────────────────────────────────────────── */
  const bookmarksRef = useRef(state.bookmarks);
  useEffect(() => { bookmarksRef.current = state.bookmarks; }, [state.bookmarks]);

  // FIX 2: Keep a ref to toggleBookmark so handleBookmark (which is itself a
  // stable ref) always calls the latest version of toggleBookmark — never a
  // stale closure captured at mount time.
  const toggleBookmarkRef = useRef(toggleBookmark);
  useEffect(() => { toggleBookmarkRef.current = toggleBookmark; }, [toggleBookmark]);

  const handleBookmark = useRef(async (courseId: string) => {
    const wasBookmarked = bookmarksRef.current.includes(courseId);
    const newCount = wasBookmarked
      ? bookmarksRef.current.length - 1
      : bookmarksRef.current.length + 1;

    await toggleBookmarkRef.current(courseId); // always calls the latest toggleBookmark

    if (newCount >= 5) await scheduleBookmarkNotification(newCount);
  }).current;

  /* ── Scroll to top ── */
  const handleScrollTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleNotificationPress = useCallback(() => {
    Alert.alert('Notifications', 'You have no new notifications at this time.', [{ text: 'OK' }]);
  }, []);

  /* ── Filtered list ── */
  const filteredCourses = useMemo(() => {
    if (!search.trim()) return state.courses;
    const q = search.toLowerCase();
    return state.courses.filter((course) =>
      (course.title ?? '').toLowerCase().includes(q) ||
      (course.instructor?.name ?? '').toLowerCase().includes(q) ||
      (course.category ?? '').toLowerCase().includes(q)
    );
  }, [state.courses, search]);

  const featuredCourses = useMemo(() => state.courses.slice(0, 5), [state.courses]);
  const firstName = getUserDisplayName(user);
  const showFeatured = !search && selectedCategory === 'All' && featuredCourses.length > 0;

  /* ── keyExtractor ── */
  const keyExtractor = useCallback((item: Course) => item.id, []);

  /* ── renderItem — stable; no longer depends on state.bookmarks ── */
  const renderItem = useCallback(({ item }: { item: Course }) => (
    <CourseItem
      course={item}
      onBookmark={handleBookmark}
    />
  ), [handleBookmark]);

  /* ── List header ── */
  const ListHeader = useMemo(() => (
    <View>
      <HeroSection
        firstName={firstName}
        search={search}
        onSearchChange={setSearch}
        onNotificationPress={handleNotificationPress}
      />
      <StatsSection
        courseCount={state.courses.length}
        totalItems={state.courses.length}
      />
      {showFeatured && (
        <FeaturedSection
          courses={featuredCourses}
          bookmarks={state.bookmarks}
          onBookmark={handleBookmark}
        />
      )}
      <CategoriesSection
        selected={selectedCategory}
        onSelect={(id) => { setSelectedCategory(id); setSearch(''); }}
        courseCount={filteredCourses.length}
      />
      <View style={{ paddingHorizontal: 18, marginBottom: 12 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: C.dark, letterSpacing: -0.3 }}>All Courses</Text>
        <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
        </Text>
      </View>
    </View>
  ), [firstName, search, state.courses.length, state.bookmarks, showFeatured,
    featuredCourses, selectedCategory, filteredCourses.length, handleNotificationPress]);

  /* ── Scroll-to-top opacity ── */
  const scrollTopOpacity = scrollY.interpolate({
    inputRange: [200, 300], outputRange: [0, 1], extrapolate: 'clamp',
  });

  /* ── Loading state ── */
  if (state.isLoading && state.courses.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.primary} />
        <LinearGradient colors={[C.primaryDk, C.primary] as const} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            backgroundColor: C.white, borderRadius: 24, padding: 36, alignItems: 'center', width: width - 60,
            shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 8,
          }}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={{ color: C.text, marginTop: 18, fontSize: 17, fontWeight: '800' }}>Loading Courses</Text>
            <Text style={{ color: C.textMuted, marginTop: 6, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
              Preparing your learning journey...
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  /* ── Error state ── */
  if (state.error && state.courses.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.primary} />
        <LinearGradient colors={[C.primaryDk, C.primary] as const} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{
            backgroundColor: C.white, borderRadius: 24, padding: 36, alignItems: 'center', width: width - 48,
            shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 8,
          }}>
            <Text style={{ fontSize: 52, marginBottom: 18 }}>😕</Text>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>Connection Failed</Text>
            <Text style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 26, lineHeight: 20 }}>{state.error}</Text>
            <TouchableOpacity
              onPress={() => loadData(1, true)}
              style={{ backgroundColor: C.primary, borderRadius: 13, paddingHorizontal: 32, paddingVertical: 14, width: '100%', alignItems: 'center' }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  /* ── Main render ── */
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} translucent={false} />
      <OfflineBanner />

      <LegendList
        ref={listRef}
        data={filteredCourses}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        recycleItems
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          <LoadMoreFooter
            isLoadingMore={state.isLoadingMore}
            hasNextPage={state.hasNextPage}
          />
        }
        ListEmptyComponent={!state.isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
            </View>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>No Results Found</Text>
            <Text style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              Try adjusting your search or browse different categories
            </Text>
            {(search || selectedCategory !== 'All') && (
              <TouchableOpacity
                onPress={() => { setSearch(''); setSelectedCategory('All'); }}
                style={{ marginTop: 18, paddingHorizontal: 22, paddingVertical: 10, backgroundColor: C.primaryBg, borderRadius: 12 }}
              >
                <Text style={{ color: C.primary, fontWeight: '700', fontSize: 13 }}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      {/* ── Scroll-to-top FAB ── */}
      <Animated.View style={{
        position: 'absolute', bottom: 24, right: 18,
        opacity: scrollTopOpacity,
        transform: [{ scale: scrollTopOpacity }],
        pointerEvents: 'box-none',
      }}>
        <TouchableOpacity
          onPress={handleScrollTop}
          activeOpacity={0.85}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: C.primary,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.38, shadowRadius: 10, elevation: 6,
          }}
        >
          <Text style={{ fontSize: 18, color: '#FFFFFF' }}>↑</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}