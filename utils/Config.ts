// utils/Config.ts
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

function get(key: string, fallback = ''): string {
  const envValue = process.env[key];
  if (envValue !== undefined && envValue !== '') return envValue;

  const constantValue = extra[key];
  if (constantValue !== undefined && constantValue !== '') return String(constantValue);

  if (!fallback && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return fallback;
}

export const Config = {
  appEnv: get('EXPO_PUBLIC_APP_ENV', 'development') as 'development' | 'staging' | 'production',
  apiBaseUrl: get('EXPO_PUBLIC_API_BASE_URL', 'https://api.freeapi.app'),
  isDev: get('EXPO_PUBLIC_APP_ENV', 'development') === 'development',
  encryptionSecret: get('ENCRYPTION_SECRET', ''),
  jwtSecret: get('JWT_SECRET', ''),
  certPinHashPrimary: get('CERT_PIN_HASH_PRIMARY', ''),
  certPinHashBackup: get('CERT_PIN_HASH_BACKUP', ''),
  certFileName: get('CERT_FILE_NAME', 'certificate.cer'),
} as const;

if (!__DEV__ && (!Config.encryptionSecret || !Config.jwtSecret)) {
  console.error('CRITICAL: Missing required secrets in production!');
}