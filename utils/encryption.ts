import * as ExpoCrypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import { Config } from './Config';

let _derivedKey: CryptoJS.lib.WordArray | null = null;

async function getDerivedKey(): Promise<CryptoJS.lib.WordArray> {
  if (_derivedKey) return _derivedKey;

  const secret = Config.encryptionSecret;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET is not configured in environment variables');
  }

  const hashHex = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    secret,
    { encoding: ExpoCrypto.CryptoEncoding.HEX }
  );

  _derivedKey = CryptoJS.enc.Hex.parse(hashHex);
  return _derivedKey;
}

export async function encryptData(plaintext: string): Promise<string> {
  try {
    const key = await getDerivedKey();

    const ivHex = await ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      `${Date.now()}-${Math.random()}`,
      { encoding: ExpoCrypto.CryptoEncoding.HEX }
    );
    const iv = CryptoJS.enc.Hex.parse(ivHex.slice(0, 32));

    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return `${ivHex.slice(0, 32)}:${encrypted.toString()}`;
  } catch (error) {
    console.error('[Encryption] encryptData failed:', error);
    throw new Error('Encryption failed');
  }
}

export async function decryptData(ciphertext: string): Promise<string> {
  try {
    const [ivHex, encryptedBase64] = ciphertext.split(':');
    if (!ivHex || !encryptedBase64) throw new Error('Invalid ciphertext format');

    const key = await getDerivedKey();
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    const decrypted = CryptoJS.AES.decrypt(encryptedBase64, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plaintext) throw new Error('Decryption failed');

    return plaintext;
  } catch (error) {
    console.error('[Encryption] decryptData failed:', error);
    throw new Error('Decryption failed');
  }
}

export async function sha256(input: string): Promise<string> {
  return ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    input,
    { encoding: ExpoCrypto.CryptoEncoding.HEX }
  );
}

export async function storeSecureData(key: string, value: string): Promise<void> {
  const encrypted = await encryptData(value);
  await SecureStore.setItemAsync(key, encrypted);
}

export async function getSecureData(key: string): Promise<string | null> {
  const encrypted = await SecureStore.getItemAsync(key);
  if (!encrypted) return null;
  return decryptData(encrypted);
}

export async function deleteSecureData(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}