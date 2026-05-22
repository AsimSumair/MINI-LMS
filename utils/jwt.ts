import * as ExpoCrypto from 'expo-crypto';
import { Config } from './Config';
import { storeSecureData, getSecureData, deleteSecureData } from './encryption';

export interface JWTPayload {
  sub:   string;
  email: string;
  name?: string;
  iat:   number;
  exp:   number;
  [key: string]: unknown;
}

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}

const KEY_ACCESS  = 'jwt_access_token';
const KEY_REFRESH = 'jwt_refresh_token';

function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  const padded = str + '==='.slice(0, (4 - (str.length % 4)) % 4);
  return decodeURIComponent(
    escape(atob(padded.replace(/-/g, '+').replace(/_/g, '/')))
  );
}

function hexToUint8Array(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}


async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();

  const keyBytes = encoder.encode(secret.padEnd(64, '\0').slice(0, 64));
  const msgBytes = encoder.encode(message);

  const ipad = new Uint8Array(64).map((_, i) => (keyBytes[i] ?? 0) ^ 0x36);
  const opad = new Uint8Array(64).map((_, i) => (keyBytes[i] ?? 0) ^ 0x5c);

  const innerInput = new Uint8Array([...ipad, ...msgBytes]);
  const innerHex = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    String.fromCharCode(...innerInput),
    { encoding: ExpoCrypto.CryptoEncoding.HEX }
  );

  const innerBytes = hexToUint8Array(innerHex);
  const outerInput = new Uint8Array([...opad, ...innerBytes]);
  const outerHex = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    String.fromCharCode(...outerInput),
    { encoding: ExpoCrypto.CryptoEncoding.HEX }
  );

  return uint8ArrayToBase64Url(hexToUint8Array(outerHex));
}


export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1])) as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenValid(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload?.exp) return false;
  return payload.exp > Math.floor(Date.now() / 1000) + 30;
}

export function tokenExpiresIn(token: string): number {
  const payload = decodeToken(token);
  if (!payload?.exp) return -1;
  return payload.exp - Math.floor(Date.now() / 1000);
}

export async function signToken(
  payload: Omit<JWTPayload, 'iat'>,
  expirySeconds = 7 * 24 * 60 * 60
): Promise<string> {
  const secret = Config.jwtSecret;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = base64UrlEncode(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })
  );
  const sig = await hmacSha256(`${header}.${body}`, secret);

  return `${header}.${body}.${sig}`;
}

export async function saveTokens(tokens: TokenPair): Promise<void> {
  await Promise.all([
    storeSecureData(KEY_ACCESS,  tokens.accessToken),
    storeSecureData(KEY_REFRESH, tokens.refreshToken),
  ]);
}

export async function loadTokens(): Promise<TokenPair | null> {
  const [access, refresh] = await Promise.all([
    getSecureData(KEY_ACCESS),
    getSecureData(KEY_REFRESH),
  ]);
  if (!access || !refresh) return null;
  return { accessToken: access, refreshToken: refresh };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    deleteSecureData(KEY_ACCESS),
    deleteSecureData(KEY_REFRESH),
  ]);
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;
  if (isTokenValid(tokens.accessToken)) return tokens.accessToken;
  return null;
}