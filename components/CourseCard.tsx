import React, { memo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { Course } from '@/types';

const C = {
  white: '#FFFFFF',
  primary: '#4F46E5',
  primaryLt: '#818CF8',
  primaryBg: '#EEF2FF',
  amberBg: '#FFF7ED',
  amberText: '#B45309',
  green: '#059669',
  text: '#0F172A',
  textSub: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  surface: '#F8FAFC',
};

const CATEGORY_CONFIG: Record<
  string,
  {
    bg: string;
    text: string;
    gradientA: string;
    gradientB: string;
  }
> = {
  'mens-watches': {
    bg: '#DBEAFE',
    text: '#1E40AF',
    gradientA: '#3B82F6',
    gradientB: '#6366F1',
  },
  'womens-watches': {
    bg: '#FDF4FF',
    text: '#7E22CE',
    gradientA: '#C084FC',
    gradientB: '#EC4899',
  },
  smartphones: {
    bg: '#DBEAFE',
    text: '#1E40AF',
    gradientA: '#3B82F6',
    gradientB: '#6366F1',
  },
  laptops: {
    bg: '#F0FDF4',
    text: '#166534',
    gradientA: '#22C55E',
    gradientB: '#0EA5E9',
  },
  fragrances: {
    bg: '#FFF7ED',
    text: '#9A3412',
    gradientA: '#FB923C',
    gradientB: '#F43F5E',
  },
  groceries: {
    bg: '#F0FDF4',
    text: '#166534',
    gradientA: '#4ADE80',
    gradientB: '#22C55E',
  },
  default: {
    bg: '#EEF2FF',
    text: '#4338CA',
    gradientA: '#4F46E5',
    gradientB: '#818CF8',
  },
};

function getCat(category: string) {
  const key = (category ?? '').toLowerCase().trim();
  return CATEGORY_CONFIG[key] ?? CATEGORY_CONFIG.default;
}

function getInitials(name: string): string {
  return (name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface Props {
  course: Course;
  isBookmarked: boolean;
  onBookmark: (id: string) => void;
  featured?: boolean;
}

function CourseCard({
  course,
  isBookmarked,
  onBookmark,
  featured = false,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;

  const cat = getCat(course.category);

  const imgHeight = featured ? 160 : 130;

  const instructorName =
    course.instructor?.name ?? 'Instructor';

  const thumbnailUri =
    course.thumbnail?.trim() ?? '';

  const avatarUri =
    course.instructor?.picture?.trim() ?? '';

  const progress =
    course.isEnrolled ? 0.42 : 0;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 28,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
    }).start();
  };

  const handleBookmark = () => {
    Animated.sequence([
      Animated.spring(bookmarkScale, {
        toValue: 1.35,
        useNativeDriver: true,
        speed: 30,
        bounciness: 16,
      }),
      Animated.spring(bookmarkScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
      }),
    ]).start();

    onBookmark(course.id);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ scale }],
          marginBottom: featured ? 0 : 12,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() =>
          router.push(`/course/${course.id}`)
        }
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        style={styles.touchable}
      >
        <View
          style={{
            width: '100%',
            height: imgHeight,
            backgroundColor: cat.bg,
          }}
        >
          <LinearGradient
            colors={[
              cat.gradientA,
              cat.gradientB,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {thumbnailUri !== '' && (
            <Image
              source={{
                uri: thumbnailUri,
              }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          )}

          <LinearGradient
            colors={[
              'transparent',
              'rgba(0,0,0,0.08)',
              'rgba(0,0,0,0.42)',
            ]}
            style={StyleSheet.absoluteFillObject}
          />

          <View
            style={[
              styles.chip,
              {
                backgroundColor:
                  cat.bg + 'EE',
                borderColor: cat.bg,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: cat.text,
                },
              ]}
            >
              {course.category ??
                'Course'}
            </Text>
          </View>

          <Animated.View
            style={[
              styles.bookmarkWrap,
              {
                transform: [
                  {
                    scale:
                      bookmarkScale,
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleBookmark}
              hitSlop={{
                top: 8,
                bottom: 8,
                left: 8,
                right: 8,
              }}
              style={[
                styles.bookmarkBtn,
                {
                  backgroundColor:
                    isBookmarked
                      ? C.primary
                      : 'rgba(255,255,255,0.92)',
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 13,
                }}
              >
                {isBookmarked
                  ? '🔖'
                  : '🤍'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.imgBottom}>
            {course.isEnrolled ? (
              <View style={styles.enrolledBadge}>
                <Text
                  style={{
                    fontSize: 9,
                    color: C.white,
                    fontWeight: '800',
                  }}
                >
                  ✓ Enrolled
                </Text>
              </View>
            ) : (
              <View style={styles.durationBadge}>
                <Text
                  style={{
                    color: '#FFFFFFCC',
                    fontSize: 9,
                    fontWeight: '600',
                  }}
                >
                  {(course as any)
                    .duration ?? '4h 30m'}
                </Text>
              </View>
            )}

            <LinearGradient
              colors={[
                C.primary,
                C.primaryLt,
              ]}
              style={styles.priceBadge}
            >
              <Text
                style={{
                  color: C.white,
                  fontSize: 13,
                  fontWeight: '800',
                }}
              >
                ${course.price ?? '0'}
              </Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.body}>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              {
                fontSize: featured
                  ? 14.5
                  : 13.5,
              },
            ]}
          >
            {course.title ??
              'Untitled Course'}
          </Text>

          {!!course.description && (
            <Text
              numberOfLines={2}
              style={
                styles.description
              }
            >
              {
                course.description
              }
            </Text>
          )}

          <View style={styles.divider} />

          <View
            style={
              styles.instructorRow
            }
          >
            <View
              style={
                styles.instructorLeft
              }
            >
              {avatarUri ? (
                <Image
                  source={{
                    uri:
                      avatarUri,
                  }}
                  style={
                    styles.avatar
                  }
                />
              ) : (
                <LinearGradient
                  colors={[
                    cat.gradientA,
                    cat.gradientB,
                  ]}
                  style={[
                    styles.avatar,
                    {
                      justifyContent:
                        'center',
                      alignItems:
                        'center',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 8,
                      fontWeight:
                        '800',
                      color:
                        C.white,
                    }}
                  >
                    {getInitials(
                      instructorName
                    )}
                  </Text>
                </LinearGradient>
              )}

              <Text
                style={
                  styles.instructorName
                }
                numberOfLines={
                  1
                }
              >
                {
                  instructorName
                }
              </Text>
            </View>

            {course.rating !=
              null && (
              <View
                style={
                  styles.ratingBadge
                }
              >
                <Text>
                  ⭐
                </Text>

                <Text
                  style={
                    styles.ratingText
                  }
                >
                  {
                    course.rating
                  }
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  touchable: {
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },

  chip: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },

  chipText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  bookmarkWrap: {
    position: 'absolute',
    top: 8,
    right: 9,
  },

  bookmarkBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  imgBottom: {
    position: 'absolute',
    bottom: 9,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  enrolledBadge: {
    backgroundColor: '#059669',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  durationBadge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  priceBadge: {
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  body: {
    paddingHorizontal: 13,
    paddingTop: 11,
    paddingBottom: 12,
  },

  title: {
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 6,
  },

  description: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 10,
  },

  divider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginBottom: 9,
  },

  instructorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  instructorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    marginRight: 8,
  },

  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },

  instructorName: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  ratingText: {
    fontSize: 11,
    fontWeight: '800',
  },
});

export default memo(CourseCard);