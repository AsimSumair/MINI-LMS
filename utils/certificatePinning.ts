import { Config } from './Config';

const EXPECTED_PINNED_KEYS = [
  Config.certPinHashPrimary ? `sha256/${Config.certPinHashPrimary}` : '',
  Config.certPinHashBackup  ? `sha256/${Config.certPinHashBackup}`  : '',
].filter(Boolean);

export async function validateCertificate(serverCertHash: string): Promise<boolean> {
  try {
    const isValid = EXPECTED_PINNED_KEYS.some(key =>
      key.includes(serverCertHash)
    );

    if (!isValid) {
      console.error('Certificate pinning validation failed');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Certificate validation error:', error);
    return false;
  }
}

export function addCertificatePinning(apiClient: any) {
  apiClient.interceptors.request.use(async (config: any) => {
    config.sslPinning = {
      certs: [Config.certFileName],
    };
    return config;
  });
}