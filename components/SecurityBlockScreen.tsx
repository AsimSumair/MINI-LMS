import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, useRef } from 'react';
import { securityManager, SecurityStatus } from '@/utils/security';

const C = {
  primary: '#4F46E5',
  primaryDk: '#3730A3',
  danger: '#EF4444',
  white: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#475569',
};

export default function SecurityBlockScreen() {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const referenceId = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const loadSecurityStatus = async () => {
    const status = await securityManager.performSecurityCheck();
    setSecurityStatus(status);
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@minilms.com?subject=Security%20Violation%20Report');
  };

  const handleExitApp = () => {};

  if (!securityStatus) return null;

  return (
    <LinearGradient
      colors={[C.danger, '#DC2626']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔒</Text>
        </View>

        <Text style={styles.title}>Security Violation Detected</Text>

        <Text style={styles.description}>
          This app cannot run on a rooted or jailbroken device for security reasons.
          Please ensure your device is secure and try again.
        </Text>

        <View style={styles.issuesContainer}>
          <Text style={styles.issuesTitle}>Detected Issues:</Text>
          {securityStatus.securityIssues.map((issue, index) => (
            <View key={index} style={styles.issueItem}>
              <Text style={styles.issueBullet}>•</Text>
              <Text style={styles.issueText}>{issue}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactSupport}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitButton}
            onPress={handleExitApp}
          >
            <Text style={styles.exitButtonText}>Close App</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Reference ID: {referenceId.current}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: C.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  issuesContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
    marginBottom: 12,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueBullet: {
    color: C.white,
    fontSize: 12,
    marginRight: 8,
  },
  issueText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contactButton: {
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
  },
  contactButtonText: {
    color: C.danger,
    fontWeight: '700',
    textAlign: 'center',
  },
  exitButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
  },
  exitButtonText: {
    color: C.white,
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});