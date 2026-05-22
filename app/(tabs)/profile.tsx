import {
  View, Text, TouchableOpacity,
  ScrollView, Alert, Image,
  TextInput, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useCourses } from '@/store/courseStore';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  primaryDark: '#3730A3',
  primaryLt: '#818CF8',
  text: '#0F172A',
  textSub: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  surface: '#F8FAFC',
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth(); 
  const { state: courseState } = useCourses();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProfileData();
    
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => Alert.alert('Settings', 'Settings coming soon!')}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="settings-outline" size={24} color={C.primary} />
        </TouchableOpacity>
      ),
      headerTitle: 'My Profile',
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
        color: C.text,
      },
    });
  }, [navigation]);

  const loadProfileData = async () => {
    try {
      const savedPicture = await AsyncStorage.getItem('profilePicture');
      if (savedPicture) setProfilePicture(savedPicture);
      
      const savedName = await AsyncStorage.getItem('userName');
      if (savedName && !user?.name) setEditName(savedName);
      
      const savedBio = await AsyncStorage.getItem('userBio');
      if (savedBio) setEditBio(savedBio);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const enrolledCourses = courseState.courses.filter(c => c.isEnrolled);
  const completedCourses = enrolledCourses.filter(c => (c as any).progress === 100);
  const inProgressCourses = enrolledCourses.filter(c => {
    const progress = (c as any).progress;
    return progress && progress > 0 && progress < 100;
  });
  
  const totalProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((sum, c) => sum + ((c as any).progress || 0), 0) / enrolledCourses.length)
    : 0;

  const stats = [
    { label: 'Enrolled', value: enrolledCourses.length, icon: '📚', color: C.primary, bg: C.primaryLight },
    { label: 'Completed', value: completedCourses.length, icon: '✅', color: C.success, bg: '#ECFDF5' },
    { label: 'In Progress', value: inProgressCourses.length, icon: '⚡', color: C.warning, bg: '#FFFBEB' },
    { label: 'Bookmarked', value: courseState.bookmarks.length, icon: '🔖', color: '#EC4899', bg: '#FDF2F8' },
    { label: 'Certificates', value: completedCourses.length, icon: '🏆', color: '#8B5CF6', bg: '#F3E8FF' },
  ];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant gallery access to update profile picture');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setProfilePicture(result.assets[0].uri);
      await AsyncStorage.setItem('profilePicture', result.assets[0].uri);
      Alert.alert('Success', 'Profile picture updated!');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant camera access to take a photo');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setProfilePicture(result.assets[0].uri);
      await AsyncStorage.setItem('profilePicture', result.assets[0].uri);
      Alert.alert('Success', 'Profile picture updated!');
    }
  };

  const handleProfilePictureUpdate = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      if (editName.trim()) {
        await AsyncStorage.setItem('userName', editName);
      }
      if (editBio.trim()) {
        await AsyncStorage.setItem('userBio', editBio);
      }
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log Out', 
        style: 'destructive', 
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        }
      },
    ]);
  };

  const handleMenuPress = (menu: string) => {
    switch(menu) {
      case 'Notifications':
        Alert.alert('🔔 Notifications', 'Notification settings coming soon!');
        break;
      case 'Help & Support':
        Alert.alert('❓ Help & Support', 'Contact us: support@minilms.com\n\nWe\'re here to help 24/7!');
        break;
      case 'Rate the App':
        Alert.alert('⭐ Rate the App', 'Thank you for using Mini LMS!\n\nYour feedback helps us improve.');
        break;
    }
  };

  const menuItems = [
    { icon: '🔔', label: 'Notifications', color: C.primary, gradient: [C.primary, C.primaryLt] },
    { icon: '❓', label: 'Help & Support', color: C.primary, gradient: [C.primary, C.primaryLt] },
    { icon: '⭐', label: 'Rate the App', color: C.warning, gradient: [C.warning, '#FBBF24'] },
  ];

  const getInitials = () => {
    const name = editName || user?.name || 'User';
    return name.charAt(0).toUpperCase();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <LinearGradient
        colors={[C.primary, C.primaryLt] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 20,
          paddingBottom: 32,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <TouchableOpacity
          onPress={handleProfilePictureUpdate}
          style={{
            alignSelf: 'center',
            marginBottom: 16,
          }}
        >
          <View style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: C.white,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 6,
          }}>
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={{ width: 110, height: 110, borderRadius: 55 }}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[C.primaryLight, C.primaryLt] as const}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 48, color: C.primary, fontWeight: '700' }}>
                  {getInitials()}
                </Text>
              </LinearGradient>
            )}
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: C.white,
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: C.white,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <Text style={{ fontSize: 14 }}>📷</Text>
            </View>
          </View>
        </TouchableOpacity>

        {isEditing ? (
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            <TextInput
              style={{
                backgroundColor: C.white,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                fontSize: 16,
                fontWeight: '600',
                color: C.text,
                textAlign: 'center',
              }}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={C.muted}
            />
            <TextInput
              style={{
                backgroundColor: C.white,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                fontSize: 13,
                color: C.text,
                textAlign: 'center',
              }}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Bio (optional)"
              placeholderTextColor={C.muted}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={handleSaveProfile}
                style={{
                  backgroundColor: C.white,
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  borderRadius: 25,
                  minWidth: 100,
                  alignItems: 'center',
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color={C.primary} size="small" />
                ) : (
                  <Text style={{ color: C.primary, fontWeight: '700' }}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsEditing(false);
                  setEditName('');
                  setEditBio('');
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  borderRadius: 25,
                  minWidth: 100,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: C.white, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={{
              fontSize: 24,
              fontWeight: '800',
              color: C.white,
              textAlign: 'center',
              letterSpacing: -0.5,
            }}>
              {editName || user?.name || 'Learner'}
            </Text>
            {editBio ? (
              <Text style={{
                color: `${C.white}CC`,
                fontSize: 13,
                textAlign: 'center',
                marginTop: 4,
                paddingHorizontal: 20,
              }}>
                {editBio}
              </Text>
            ) : (
              <Text style={{
                color: `${C.white}CC`,
                fontSize: 12,
                textAlign: 'center',
                marginTop: 4,
              }}>
                @{user?.email ? user.email.split('@')[0] : 'learner'}
              </Text>
            )}
            <Text style={{
              color: `${C.white}AA`,
              fontSize: 11,
              textAlign: 'center',
              marginTop: 2,
            }}>
              {user?.email ?? ''}
            </Text>
            
            <TouchableOpacity
              onPress={() => {
                setEditName(user?.name || '');
                setIsEditing(true);
              }}
              style={{
                alignSelf: 'center',
                marginTop: 16,
                backgroundColor: 'rgba(255,255,255,0.2)',
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: C.white, fontSize: 12, fontWeight: '600' }}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </>
        )}
      </LinearGradient>

      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 20,
        marginTop: 24,
        marginBottom: 8,
      }}>
        {stats.map((s) => (
          <TouchableOpacity
            key={s.label}
            activeOpacity={0.9}
            style={{
              flex: 1,
              minWidth: width / 2.5,
              backgroundColor: C.white,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: s.bg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 22 }}>{s.icon}</Text>
            </View>
            <Text style={{
              fontSize: 22,
              fontWeight: '800',
              color: s.color,
            }}>
              {s.value}
            </Text>
            <Text style={{
              fontSize: 11,
              color: C.muted,
              marginTop: 4,
              fontWeight: '500',
            }}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {enrolledCourses.length > 0 && (
        <View style={{
          marginHorizontal: 20,
          marginTop: 16,
          backgroundColor: C.white,
          borderRadius: 20,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.text }}>
              Learning Progress
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.primary }}>
              {totalProgress}%
            </Text>
          </View>
          <View style={{
            height: 10,
            backgroundColor: C.primaryLight,
            borderRadius: 5,
            overflow: 'hidden',
            marginBottom: 12,
          }}>
            <LinearGradient
              colors={[C.primary, C.primaryLt] as const}
              style={{ width: `${totalProgress}%`, height: '100%' }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={{ fontSize: 12, color: C.textSub, textAlign: 'center' }}>
            {completedCourses.length} of {enrolledCourses.length} courses completed
          </Text>
        </View>
      )}

      {enrolledCourses.length > 0 && (
        <View style={{ marginHorizontal: 20, marginVertical: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: C.text }}>
              My Courses
            </Text>
            <TouchableOpacity>
              <Text style={{ color: C.primary, fontSize: 12, fontWeight: '600' }}>See All →</Text>
            </TouchableOpacity>
          </View>
          {enrolledCourses.slice(0, 3).map((course, idx) => {
            const progress = (course as any).progress || 0;
            return (
              <View
                key={course.id}
                style={{
                  backgroundColor: C.white,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 10 }}>
                  {course.title}
                </Text>
                <View style={{ marginBottom: 6 }}>
                  <View style={{
                    height: 6,
                    backgroundColor: C.primaryLight,
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}>
                    <LinearGradient
                      colors={progress === 100 ? [C.success, '#34D399'] as const : [C.primary, C.primaryLt] as const}
                      style={{ width: `${progress}%`, height: '100%' }}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: C.muted }}>
                    {progress}% Complete
                  </Text>
                  {progress === 100 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 10 }}>✅</Text>
                      <Text style={{ fontSize: 10, color: C.success, fontWeight: '600' }}>Completed</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
          {enrolledCourses.length > 3 && (
            <TouchableOpacity style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: C.primary, fontSize: 13, fontWeight: '600' }}>
                +{enrolledCourses.length - 3} more courses
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{
        marginHorizontal: 20,
        marginTop: 8,
        marginBottom: 16,
        backgroundColor: C.white,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => handleMenuPress(item.label)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 16,
              gap: 12,
              borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
              borderBottomColor: C.border,
            }}
          >
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: `${item.color}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
            </View>
            <Text style={{
              flex: 1,
              fontSize: 15,
              color: C.text,
              fontWeight: '500',
            }}>
              {item.label}
            </Text>
            <Text style={{ color: C.muted, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        activeOpacity={0.8}
        style={{
          marginHorizontal: 20,
          marginBottom: 20,
          backgroundColor: '#FEF2F2',
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 10,
          borderWidth: 1,
          borderColor: '#FEE2E2',
        }}
      >
        <Text style={{ fontSize: 18 }}>🚪</Text>
        <Text style={{ color: C.danger, fontSize: 15, fontWeight: '600' }}>
          Log Out
        </Text>
      </TouchableOpacity>

      <Text style={{
        textAlign: 'center',
        color: C.muted,
        fontSize: 11,
        marginBottom: 20,
      }}>
        Mini LMS v1.0.0
      </Text>
    </ScrollView>
  );
}