declare module 'jail-monkey' {
  const JailMonkey: {
    isJailBroken(): boolean;
    jailBrokenMessage(): string;
    canMockLocation(): boolean;
    isDebuggedMode(): boolean;
    isDevelopmentSettingsMode(): boolean | Promise<boolean>;
    hookDetected(): boolean;
    isOnExternalStorage(): boolean;
    AdbEnabled(): boolean;
  };
  export default JailMonkey;
}