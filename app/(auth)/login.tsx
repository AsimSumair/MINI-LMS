import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { loginUser } from '@/services/auth.service';
import { useAuth } from '@/context/AuthContext';

const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  primaryDark: '#3730A3',
  text: '#0F172A',
  textSub: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

interface FormData {
  username: string;
  password: string;
}

interface FormErrors {
  username?: string;
  password?: string;
}

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const { checkAuth } = useAuth();

  const handleInputChange = (field: keyof FormData, value: string) => {
    const sanitized = field === 'username' ? value.toLowerCase() : value;

    setFormData((prev: FormData) => ({ ...prev, [field]: sanitized }));

    if (errors[field]) {
      setErrors((prev: FormErrors) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await loginUser({
        username: formData.username, 
        password: formData.password,
      });

      if (response.success) {
        await checkAuth();
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      let message = 'Login failed. Please try again.';
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.response?.status === 401) {
        message = 'Invalid username or password';
      } else if (error?.response?.status === 404) {
        message = 'User not found';
      }
      Alert.alert('Login Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <LinearGradient
            colors={[C.primary, C.primaryLight]}
            style={{
              width: 80,
              height: 80,
              borderRadius: 25,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Ionicons name="school" size={40} color={C.white} />
          </LinearGradient>

          <Text style={{
            fontSize: 32,
            fontWeight: '800',
            color: C.text,
            marginBottom: 8,
            letterSpacing: -0.5,
          }}>
            Welcome Back
          </Text>
          <Text style={{
            fontSize: 14,
            color: C.muted,
            textAlign: 'center',
          }}>
            Sign in to continue your learning journey
          </Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: C.textSub,
              marginBottom: 8,
              letterSpacing: 0.5,
            }}>
              USERNAME
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: C.white,
              borderWidth: 1.5,
              borderColor: errors.username ? C.danger : C.border,
              borderRadius: 14,
              paddingHorizontal: 14,
            }}>
              <Ionicons name="person-outline" size={20} color={C.muted} />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingLeft: 10,
                  color: C.text,
                  fontSize: 15,
                }}
                placeholder="Enter your username"
                placeholderTextColor={C.muted}
                autoCapitalize="none"       
                autoCorrect={false}
                keyboardType="default"
                onChangeText={(text) => handleInputChange('username', text)}
                value={formData.username}   
              />
            </View>
            {errors.username && (
              <Text style={{ color: C.danger, fontSize: 11, marginTop: 6 }}>
                {errors.username}
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: C.textSub,
              marginBottom: 8,
              letterSpacing: 0.5,
            }}>
              PASSWORD
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: C.white,
              borderWidth: 1.5,
              borderColor: errors.password ? C.danger : C.border,
              borderRadius: 14,
              paddingHorizontal: 14,
            }}>
              <Ionicons name="lock-closed-outline" size={20} color={C.muted} />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingLeft: 10,
                  color: C.text,
                  fontSize: 15,
                }}
                placeholder="Enter your password"
                placeholderTextColor={C.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onChangeText={(text) => handleInputChange('password', text)}
                value={formData.password}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={C.muted}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={{ color: C.danger, fontSize: 11, marginTop: 6 }}>
                {errors.password}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: C.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 20,
            opacity: isSubmitting ? 0.7 : 1,
          }}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <Text style={{
              color: C.white,
              fontSize: 16,
              fontWeight: '700',
              letterSpacing: 0.5,
            }}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
          <Text style={{ color: C.muted, fontSize: 14 }}>
            Don't have an account?
          </Text>
          <Link href="/(auth)/register">
            <Text style={{ color: C.primary, fontSize: 14, fontWeight: '700' }}>
              Sign Up
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}