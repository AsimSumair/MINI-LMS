import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, Share, Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCourses } from '@/store/courseStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { scheduleBookmarkNotification } from '@/utils/notifications';

const C = {
  primary:   '#4F46E5',
  primaryDk: '#3730A3',
  primaryLt: '#818CF8',
  primaryBg: '#EEF2FF',
  white:     '#FFFFFF',
  text:      '#0F172A',
  textSub:   '#475569',
  textMuted: '#94A3B8',
  border:    '#E2E8F0',
  bg:        '#F8FAFC',
  success:   '#10B981',
  warning:   '#F59E0B',
};

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const { state, toggleBookmark, toggleEnroll, loadEnrolled } = useCourses();

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isEnrolling, setIsEnrolling]                 = useState(false);
  const [justEnrolled, setJustEnrolled]               = useState(false);

  const bookmarkScale = useRef(new Animated.Value(1)).current;
  const enrollScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadEnrolled();
  }, []);

  const course       = state.courses.find((c) => c.id === id);
  const isBookmarked = (state.bookmarks ?? []).includes(id as string);
  const isEnrolled   = (state.enrolled  ?? []).includes(id as string);

  if (!course) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[C.primary, C.primaryLt] as const} style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Course Not Found</Text>
          <Text style={styles.errorText}>The course you're looking for doesn't exist.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const handleBookmark = async () => {
    Animated.sequence([
      Animated.spring(bookmarkScale, { toValue: 1.4, useNativeDriver: true, speed: 30, bounciness: 18 }),
      Animated.spring(bookmarkScale, { toValue: 1,   useNativeDriver: true, speed: 30 }),
    ]).start();

    const wasBookmarked = (state.bookmarks ?? []).includes(course.id);
    const newCount = wasBookmarked
      ? (state.bookmarks ?? []).length - 1
      : (state.bookmarks ?? []).length + 1;

    await toggleBookmark(course.id);

    if (!wasBookmarked && newCount >= 5) {
      await scheduleBookmarkNotification(newCount);
    }
  };

  const handleEnroll = async () => {
    if (isEnrolled) {
      Alert.alert(
        'Unenroll?',
        `Are you sure you want to unenroll from "${course.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unenroll', style: 'destructive', onPress: () => toggleEnroll(course.id) },
        ]
      );
      return;
    }

    setIsEnrolling(true);
    Animated.spring(enrollScale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();

    await new Promise((r) => setTimeout(r, 1200));
    await toggleEnroll(course.id);

    Animated.sequence([
      Animated.spring(enrollScale, { toValue: 1.04, useNativeDriver: true, speed: 20 }),
      Animated.spring(enrollScale, { toValue: 1,    useNativeDriver: true, speed: 20 }),
    ]).start();

    setIsEnrolling(false);
    setJustEnrolled(true);

    Alert.alert(
      '🎉 Enrolled Successfully!',
      `You're now enrolled in "${course.title}". Start learning today!`,
      [{ text: "Let's Go!", style: 'default' }]
    );

    setTimeout(() => setJustEnrolled(false), 3000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${course.title}" on Mini LMS!\n\n${course.description}`,
        title: course.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const courseDuration = (course as any).duration || '4h 30m';
  const courseProgress = isEnrolled ? 42 : 0;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: course.thumbnail }} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)'] as const}
          style={StyleSheet.absoluteFillObject}
        />

        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.white} />
        </TouchableOpacity>

        <View style={styles.actionIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={C.white} />
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
            <TouchableOpacity
              style={[styles.iconButton, isBookmarked && styles.iconButtonActive]}
              onPress={handleBookmark}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isBookmarked ? C.warning : C.white}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{course.category || 'Course'}</Text>
        </View>

        {isEnrolled && (
          <View style={styles.enrolledHeroBadge}>
            <Ionicons name="checkmark-circle" size={14} color={C.white} />
            <Text style={styles.enrolledHeroText}>Enrolled</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{course.title}</Text>

        <View style={styles.instructorRow}>
          <View style={styles.instructorInfo}>
            {course.instructor?.picture ? (
              <Image source={{ uri: course.instructor.picture }} style={styles.instructorAvatar} />
            ) : (
              <View style={[styles.instructorAvatar, styles.instructorAvatarFallback]}>
                <Text style={styles.instructorInitial}>
                  {course.instructor?.name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.instructor}>By {course.instructor?.name || 'Expert Instructor'}</Text>
          </View>
          <View style={styles.rating}>
            <Text style={styles.ratingStar}>⭐</Text>
            <Text style={styles.ratingText}>{course.rating || 4.5}</Text>
          </View>
        </View>

        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardIcon}>💰</Text>
            <Text style={styles.infoCardLabel}>Price</Text>
            <Text style={styles.infoCardValue}>${course.price}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardIcon}>⏱️</Text>
            <Text style={styles.infoCardLabel}>Duration</Text>
            <Text style={styles.infoCardValue}>{courseDuration}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardIcon}>📊</Text>
            <Text style={styles.infoCardLabel}>Level</Text>
            <Text style={styles.infoCardValue}>{isEnrolled ? 'In Progress' : 'Beginner'}</Text>
          </View>
        </View>

        {isEnrolled && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressPercent}>{courseProgress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[C.primary, C.primaryLt] as const}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${courseProgress}%` }]}
              />
            </View>
            <TouchableOpacity style={styles.continueButton}>
              <LinearGradient
                colors={[C.primary, C.primaryLt] as const}
                style={styles.continueGradient}
              >
                <Text style={styles.continueText}>Continue Learning →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>About this course</Text>
        <Text style={styles.description} numberOfLines={showFullDescription ? undefined : 3}>
          {course.description}
        </Text>
        <TouchableOpacity
          onPress={() => setShowFullDescription(!showFullDescription)}
          style={styles.readMoreButton}
        >
          <Text style={styles.readMoreText}>
            {showFullDescription ? 'Show Less ↑' : 'Read More ↓'}
          </Text>
        </TouchableOpacity>

        <View style={styles.learnSection}>
          <Text style={styles.sectionTitle}>What You'll Learn</Text>
          {[
            'Master core concepts and techniques',
            'Build real-world projects',
            'Get certified upon completion',
            'Access downloadable resources',
          ].map((item) => (
            <View key={item} style={styles.learnItem}>
              <View style={styles.learnIconWrap}>
                <Ionicons name="checkmark" size={12} color={C.white} />
              </View>
              <Text style={styles.learnText}>{item}</Text>
            </View>
          ))}
        </View>

        <Animated.View style={[styles.enrollButton, { transform: [{ scale: enrollScale }] }]}>
          <TouchableOpacity onPress={handleEnroll} activeOpacity={0.9} disabled={isEnrolling}>
            <LinearGradient
              colors={
                isEnrolled || justEnrolled
                  ? [C.success, '#34D399'] as const
                  : [C.primary, C.primaryLt] as const
              }
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.enrollGradient}
            >
              {isEnrolling ? (
                <>
                  <Ionicons name="hourglass-outline" size={22} color={C.white} />
                  <Text style={styles.enrollText}>Enrolling...</Text>
                </>
              ) : isEnrolled ? (
                <>
                  <Ionicons name="checkmark-circle" size={22} color={C.white} />
                  <Text style={styles.enrollText}>Enrolled ✓</Text>
                  <Text style={styles.enrollSubtext}>Tap to unenroll</Text>
                </>
              ) : (
                <>
                  <Ionicons name="rocket-outline" size={22} color={C.white} />
                  <Text style={styles.enrollText}>Enroll Now</Text>
                  <Text style={styles.enrollSubtext}>${course.price} · Lifetime Access</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.includesSection}>
          <Text style={styles.sectionTitle}>This Course Includes</Text>
          <View style={styles.includesGrid}>
            {[
              { icon: '🎥', label: 'Video Lectures' },
              { icon: '📝', label: 'Articles' },
              { icon: '📋', label: 'Assignments' },
              { icon: '🏆', label: 'Certificate' },
            ].map((item) => (
              <View key={item.label} style={styles.includesItem}>
                <Text style={styles.includesIcon}>{item.icon}</Text>
                <Text style={styles.includesText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: C.bg },
  contentContainer: { paddingBottom: 40 },
  errorContainer:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorEmoji:       { fontSize: 64, marginBottom: 16 },
  errorTitle:       { fontSize: 24, fontWeight: '800', color: C.white, marginBottom: 8 },
  errorText:        { fontSize: 14, color: `${C.white}CC`, textAlign: 'center', marginBottom: 24 },
  backButton:       { backgroundColor: C.white, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backButtonText:   { color: C.primary, fontWeight: '700' },
  imageContainer:   { position: 'relative', width: '100%', height: 300 },
  image:            { width: '100%', height: '100%' },
  backIcon: {
    position: 'absolute', top: 48, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionIcons:      { position: 'absolute', top: 48, right: 16, flexDirection: 'row', gap: 12 },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconButtonActive:    { backgroundColor: 'rgba(0,0,0,0.75)' },
  categoryBadge: {
    position: 'absolute', bottom: 16, left: 16,
    backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  categoryText:        { color: C.white, fontSize: 12, fontWeight: '700' },
  enrolledHeroBadge: {
    position: 'absolute', bottom: 16, right: 16,
    backgroundColor: C.success, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  enrolledHeroText:    { color: C.white, fontSize: 12, fontWeight: '700' },
  content: {
    padding: 20, marginTop: -20,
    backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  title:             { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 14, lineHeight: 32 },
  instructorRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  instructorInfo:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  instructorAvatar:  { width: 34, height: 34, borderRadius: 17 },
  instructorAvatarFallback: { backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center' },
  instructorInitial: { fontSize: 14, fontWeight: '700', color: C.primary },
  instructor:        { fontSize: 13, color: C.textSub, fontWeight: '500' },
  rating:            { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingStar:        { fontSize: 14 },
  ratingText:        { fontSize: 14, fontWeight: '700', color: C.text },
  infoCards:         { flexDirection: 'row', gap: 10, marginBottom: 24 },
  infoCard: {
    flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  infoCardIcon:      { fontSize: 22, marginBottom: 4 },
  infoCardLabel:     { fontSize: 10, color: C.textMuted, marginBottom: 2 },
  infoCardValue:     { fontSize: 13, fontWeight: '700', color: C.text },
  progressSection: {
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: C.border,
  },
  progressHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle:     { fontSize: 14, fontWeight: '600', color: C.text },
  progressPercent:   { fontSize: 16, fontWeight: '800', color: C.primary },
  progressBar:       { height: 8, backgroundColor: C.primaryBg, borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  progressFill:      { height: '100%', borderRadius: 4 },
  continueButton:    { borderRadius: 12, overflow: 'hidden' },
  continueGradient:  { paddingVertical: 12, alignItems: 'center' },
  continueText:      { color: C.white, fontSize: 14, fontWeight: '600' },
  divider:           { height: 1, backgroundColor: C.border, marginVertical: 20 },
  sectionTitle:      { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 12 },
  description:       { fontSize: 14, color: C.textSub, lineHeight: 22, marginBottom: 6 },
  readMoreButton:    { alignSelf: 'flex-start', marginBottom: 20 },
  readMoreText:      { color: C.primary, fontSize: 13, fontWeight: '600' },
  learnSection:      { marginBottom: 24 },
  learnItem:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  learnIconWrap: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.success, alignItems: 'center', justifyContent: 'center',
  },
  learnText:  { flex: 1, fontSize: 14, color: C.textSub },
  enrollButton: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 24,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 7,
  },
  enrollGradient:  { paddingVertical: 18, alignItems: 'center', gap: 4 },
  enrollText:      { color: C.white, fontSize: 18, fontWeight: '800' },
  enrollSubtext:   { color: `${C.white}BB`, fontSize: 12 },
  includesSection: { marginBottom: 24 },
  includesGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  includesItem: {
    flex: 1, minWidth: '45%', backgroundColor: C.white,
    borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  includesIcon: { fontSize: 24, marginBottom: 6 },
  includesText: { fontSize: 12, color: C.textSub, fontWeight: '500' },
});