import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { secureStorage, STORAGE_KEYS } from '@/utils/storage';
import { Config } from '@/utils/Config';

const BASE_URL = Config.apiBaseUrl;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await secureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error) => {
    const config = error.config as RetryConfig;

    if (error.response?.status === 401 && !config._retryCount) {
      try {
        const refreshToken = await secureStorage.get(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const { data } = await axios.post(
            `${BASE_URL}/api/v1/users/refresh-token`,
            { refreshToken }
          );
          const newToken: string = data.data.accessToken;
          await secureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, newToken);
          if (config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(config);
        }
      } catch {
        await secureStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        await secureStorage.remove(STORAGE_KEYS.REFRESH_TOKEN);
      }
    }

    const shouldRetry = !error.response || error.response.status >= 500;
    config._retryCount = config._retryCount ?? 0;

    if (shouldRetry && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;
      const delay = RETRY_DELAY_MS * Math.pow(2, config._retryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

export default apiClient;