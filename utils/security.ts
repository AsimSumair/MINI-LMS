// utils/security.ts
import JailMonkey from 'jail-monkey';
import * as Device from 'expo-device';
import { Config } from './Config';

export interface SecurityStatus {
  isDeviceSecure: boolean;
  isRootedOrJailbroken: boolean;
  isDebugging: boolean;
  isEmulator: boolean;
  isMockLocation: boolean;
  securityIssues: string[];
}

class SecurityManager {
  private static instance: SecurityManager;

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  async performSecurityCheck(): Promise<SecurityStatus> {
    if (Config.isDev) {
      console.info('[Security] Development mode — security checks bypassed');
      return {
        isDeviceSecure: true,
        isRootedOrJailbroken: false,
        isDebugging: true,
        isEmulator: !Device.isDevice,
        isMockLocation: false,
        securityIssues: [],
      };
    }

    const issues: string[] = [];

    let isRooted = false;
    try {
      isRooted = JailMonkey.isJailBroken();
      if (isRooted) issues.push('Device is rooted or jailbroken');
    } catch (e) {
      console.warn('[Security] isJailBroken() failed:', e);
    }

    let isDebugging = false;
    try {
      isDebugging = JailMonkey.isDebuggedMode();
      if (isDebugging) issues.push('App is running in debug mode');
    } catch (e) {
      console.warn('[Security] isDebuggedMode() failed:', e);
    }

    const isEmulator = !Device.isDevice;
    if (isEmulator) issues.push('Running on emulator or simulator');

    let isMockLocation = false;
    try {
      isMockLocation = JailMonkey.canMockLocation();
      if (isMockLocation) issues.push('Mock location detected');
    } catch (e) {
      console.warn('[Security] canMockLocation() failed:', e);
    }

    let isHooked = false;
    try {
      isHooked = JailMonkey.hookDetected();
      if (isHooked) issues.push('Runtime hooking framework detected');
    } catch (e) {
      console.warn('[Security] hookDetected() failed:', e);
    }

    let isDevSettings = false;
    try {
      isDevSettings = await JailMonkey.isDevelopmentSettingsMode();
      if (isDevSettings) issues.push('Android developer settings enabled');
    } catch (e) {
      console.warn('[Security] isDevelopmentSettingsMode() failed:', e);
    }

    const isDeviceCompromised = isRooted || isDebugging || isEmulator || isMockLocation || isHooked || isDevSettings;

    const result: SecurityStatus = {
      isDeviceSecure: !isDeviceCompromised,
      isRootedOrJailbroken: isRooted,
      isDebugging,
      isEmulator,
      isMockLocation,
      securityIssues: issues,
    };

    this.logViolation(result);

    return result;
  }

  async blockIfCompromised(): Promise<boolean> {
    const status = await this.performSecurityCheck();
    return !status.isDeviceSecure;
  }

  private logViolation(status: SecurityStatus): void {
    if (!status.isDeviceSecure) {
      console.warn('[Security] Violation:', JSON.stringify({
        timestamp: new Date().toISOString(),
        issues: status.securityIssues,
      }, null, 2));
    }
  }
}

export const securityManager = SecurityManager.getInstance();