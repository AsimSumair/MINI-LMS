// app/bookmarks.tsx or BookmarksScreen.tsx
import { View, Text, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { useCourses } from '@/store/courseStore';
import { fetchCourses } from '@/services/courses.service';
import CourseCard from '@/components/CourseCard';
import { scheduleBookmarkNotification } from '@/utils/notifications';

const C = {
  bg: '#F5F7FF',
  white: '#FFFFFF',
  primary: '#6366f1',
  primaryDk: '#4f46e5',
  primaryLt: '#818cf8',
  text: '#1e1b4b',
  muted: '#9ca3af',
  border: '#e5e7eb',
};

export default function BookmarksScreen() {
  const { state, toggleBookmark, loadBookmarks, setCourses } = useCourses();
  const [hasTriggeredNotification, setHasTriggeredNotification] = useState(false);

  useEffect(() => {
    loadBookmarks();

    // FIX: if courses haven't been loaded yet (e.g. user navigated here directly),
    // fetch them so bookmarkedCourses is never an empty list despite saved bookmark IDs.
    if (state.courses.length === 0) {
      fetchCourses({ page: 1, limit: 30 })
        .then((result) => setCourses(result.courses))
        .catch(() => {/* silently ignore — UI still shows empty state */});
    }
  }, []);

  const handleBookmarkToggle = async (courseId: string) => {
    const wasBookmarked = state.bookmarks.includes(courseId);

    // FIX: compute newCount BEFORE the async toggleBookmark call so we
    // never read a stale closure value of state.bookmarks after the await.
    const newCount = wasBookmarked
      ? state.bookmarks.length - 1
      : state.bookmarks.length + 1;

    await toggleBookmark(courseId);

    // Trigger notification when reaching 5 or more bookmarks
    if (newCount >= 5 && !hasTriggeredNotification) {
      await scheduleBookmarkNotification(newCount);
      setHasTriggeredNotification(true);
    } else if (newCount < 5) {
      setHasTriggeredNotification(false);
    }
  };

  const bookmarkedCourses = state.courses.filter((c) =>
    state.bookmarks.includes(c.id)
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{
        backgroundColor: C.white,
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        <Text style={{
          fontSize: 11, color: C.primary, fontWeight: '600',
          letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
        }}>
          Saved
        </Text>
        <Text style={{
          fontSize: 24, fontWeight: '700', color: C.text,
        }}>
          My Bookmarks
        </Text>
        <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>
          {bookmarkedCourses.length} saved course
          {bookmarkedCourses.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {bookmarkedCourses.length === 0 ? (
        <View style={{
          flex: 1, justifyContent: 'center',
          alignItems: 'center', padding: 32,
        }}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🔖</Text>
          <Text style={{
            fontSize: 18, fontWeight: '700',
            color: C.text, marginBottom: 8,
          }}>
            No bookmarks yet
          </Text>
          <Text style={{
            fontSize: 13, color: C.muted, textAlign: 'center',
          }}>
            Tap the bookmark icon on any course to save it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarkedCourses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CourseCard
              course={item}
              isBookmarked={true}
              onBookmark={handleBookmarkToggle}
            />
          )}
        />
      )}
    </View>
  );
}