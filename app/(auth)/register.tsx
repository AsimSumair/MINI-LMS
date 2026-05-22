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
  Modal,
  StyleSheet,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { registerUser } from '@/services/auth.service';


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
};

interface RegisterFormData {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Weak', color: C.danger, width: 25 };
    if (score === 2) return { label: 'Fair', color: C.warning, width: 50 };
    if (score === 3) return { label: 'Good', color: C.primary, width: 75 };
    return { label: 'Strong', color: C.success, width: 100 };
  };

  if (!password) return null;

  const strength = getStrength();

  return (
    <View style={{ marginTop: 8 }}>
      <View style={styles.strengthBarContainer}>
        <View style={[
          styles.strengthBarFill,
          { width: `${strength.width}%`, backgroundColor: strength.color }
        ]} />
      </View>
      <Text style={[styles.strengthText, { color: strength.color }]}>
        {strength.label} password
      </Text>
    </View>
  );
}

function PasswordRequirements({ password }: { password: string }) {
  const requirements = [
    { label: 'At least 8 characters', test: password.length >= 8 },
    { label: 'One uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'One number', test: /[0-9]/.test(password) },
  ];

  return (
    <View style={styles.requirementsContainer}>
      {requirements.map((req) => (
        <View key={req.label} style={styles.requirementItem}>
          <View style={[
            styles.requirementDot,
            { backgroundColor: req.test ? C.success : C.border }
          ]}>
            {req.test && (
              <Ionicons name="checkmark" size={10} color={C.white} />
            )}
          </View>
          <Text style={[
            styles.requirementText,
            { color: req.test ? C.textSub : C.muted }
          ]}>
            {req.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    username: '',
    email: '',
    password: '',
  });

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (data: RegisterFormData): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};

    if (!data.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (data.fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!data.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (data.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (data.username.length > 20) {
      newErrors.username = 'Username too long';
    } else if (!/^[a-z0-9_]+$/.test(data.username)) {
      newErrors.username = 'Only lowercase letters, numbers, underscores';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (data.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      const response = await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      });

      if (response.success) {
        setShowSuccessModal(true);
        Alert.alert(
          'Verification Email Sent',
          'Please check your email to verify your account before logging in.',
          [{ text: 'OK' }]
        );
        setTimeout(() => {
          setShowSuccessModal(false);
          router.replace('/(auth)/login');
        }, 2000);
      } else {
        Alert.alert('Registration Failed', response.message || 'Something went wrong');
      }
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 409) {
        errorMessage = 'User already exists with this email or username';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid input data. Please check your information.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Registration Failed', errorMessage);
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
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={[C.success, C.success]}
              style={styles.modalContent}
            >
              <Ionicons name="checkmark-circle" size={64} color={C.white} />
              <Text style={styles.modalTitle}>Success!</Text>
              <Text style={styles.modalText}>
                Account created successfully{'\n'}
                Verification email sent!
              </Text>
            </LinearGradient>
          </View>
        </Modal>

        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[C.primary, C.primaryLt]}
            style={styles.logoGradient}
          >
            <Ionicons name="school" size={32} color={C.white} />
          </LinearGradient>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Mini LMS and start learning today
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={[
              styles.inputWrapper,
              errors.fullName && styles.inputError
            ]}>
              <Ionicons name="person-outline" size={20} color={C.muted} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={C.muted}
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={(text) => handleInputChange('fullName', text)}
                value={formData.fullName}
              />
            </View>
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={[
              styles.inputWrapper,
              errors.username && styles.inputError
            ]}>
              <Ionicons name="at-outline" size={20} color={C.muted} />
              <TextInput
                style={styles.input}
                placeholder="john_doe"
                placeholderTextColor={C.muted}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(text) => handleInputChange('username', text.toLowerCase())}
                value={formData.username}
              />
            </View>
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[
              styles.inputWrapper,
              errors.email && styles.inputError
            ]}>
              <Ionicons name="mail-outline" size={20} color={C.muted} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={C.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(text) => handleInputChange('email', text)}
                value={formData.email}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[
              styles.inputWrapper,
              errors.password && styles.inputError
            ]}>
              <Ionicons name="lock-closed-outline" size={20} color={C.muted} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={C.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onChangeText={(text) => handleInputChange('password', text)}
                value={formData.password}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={C.muted}
                />
              </TouchableOpacity>
            </View>

            <PasswordStrengthIndicator password={formData.password} />
            <PasswordRequirements password={formData.password} />

            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
            onPress={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.submitText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <Link href="/(auth)/login">
              <Text style={styles.loginLink}>Sign In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 280,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.white,
    marginTop: 12,
  },
  modalText: {
    fontSize: 13,
    color: `${C.white}CC`,
    textAlign: 'center',
    marginTop: 8,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: C.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: C.textSub,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: C.danger,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 10,
    color: C.text,
    fontSize: 15,
  },
  errorText: {
    color: C.danger,
    fontSize: 11,
    marginTop: 4,
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  requirementsContainer: {
    marginTop: 8,
    gap: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementText: {
    fontSize: 11,
  },
  submitButton: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    color: C.muted,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  linkText: {
    color: C.primary,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  loginText: {
    color: C.muted,
    fontSize: 14,
  },
  loginLink: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});