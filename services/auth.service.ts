import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '@/utils/Config';

const API_BASE_URL = `${Config.apiBaseUrl}/api/v1`;

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export const storeTokens = async (accessToken: string, refreshToken: string) => {
  try {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    const decoded    = JSON.parse(atob(accessToken.split('.')[1]));
    const expiryDate = decoded.exp * 1000;
    await SecureStore.setItemAsync('tokenExpiry', expiryDate.toString());
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

export const getTokens = async () => {
  try {
    const accessToken  = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    const tokenExpiry  = await SecureStore.getItemAsync('tokenExpiry');
    return { accessToken, refreshToken, tokenExpiry };
  } catch (error) {
    console.error('Error getting tokens:', error);
    return { accessToken: null, refreshToken: null, tokenExpiry: null };
  }
};

export const removeTokens = async () => {
  try {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('tokenExpiry');
    await SecureStore.deleteItemAsync('userData');
  } catch (error) {
    console.error('Error removing tokens:', error);
  }
};

export const storeUserData = async (user: any) => {
  try {
    await SecureStore.setItemAsync('userData', JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const userData = await SecureStore.getItemAsync('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const isTokenValid = async (): Promise<boolean> => {
  try {
    const { accessToken, tokenExpiry } = await getTokens();
    if (!accessToken || !tokenExpiry) return false;
    return parseInt(tokenExpiry) > Date.now();
  } catch {
    return false;
  }
};

export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const { refreshToken } = await getTokens();

    if (!refreshToken) {
      console.log('No refresh token available');
      return false;
    }

    const response = await axios.post(
      `${API_BASE_URL}/users/refresh-token`,
      {},  
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );

    if (response.data.success && response.data.data?.accessToken) {
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

      await storeTokens(newAccessToken, newRefreshToken);
      console.log('✅ Access token refreshed successfully');
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('❌ Failed to refresh token:', error?.response?.data?.message ?? error.message);
    return false;
  }
};

export const getValidAccessToken = async (): Promise<string | null> => {
  const { accessToken, tokenExpiry } = await getTokens();

  if (!accessToken) return null;

  if (tokenExpiry && parseInt(tokenExpiry) > Date.now()) {
    return accessToken;
  }

  console.log('⚠️ Access token expired, attempting refresh...');
  const refreshed = await refreshAccessToken();

  if (refreshed) {
    const { accessToken: newToken } = await getTokens();
    return newToken;
  }
  return null;
};

export const registerUser = async (data: RegisterData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/users/register`,
      {
        username: data.username.toLowerCase(),
        email:    data.email,
        password: data.password,
        fullName: data.fullName,
      },
      { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
    );

    if (response.data.success && response.data.data?.tokens) {
      await storeTokens(
        response.data.data.tokens.accessToken,
        response.data.data.tokens.refreshToken
      );
      await storeUserData(response.data.data.user);
    }

    return response.data;
  } catch (error: any) {
    if (error.response) throw error;
    if (error.request)  throw new Error('Network error. Please check your connection.');
    throw new Error('An unexpected error occurred.');
  }
};

export const loginUser = async (data: LoginData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/users/login`,
      {
        username: data.username.toLowerCase(),
        password: data.password,
      },
      { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
    );

    if (response.data.success) {
      await storeTokens(
        response.data.data.accessToken,
        response.data.data.refreshToken
      );
      await storeUserData(response.data.data.user);
    }

    return response.data;
  } catch (error: any) {
    if (error.response) throw error;
    if (error.request)  throw new Error('Network error. Please check your connection.');
    throw new Error('An unexpected error occurred.');
  }
};

export const getCurrentUser = async () => {
  try {
    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      throw new Error('No valid access token');
    }

    const response = await axios.get(
      `${API_BASE_URL}/users/current-user`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      }
    );

    if (response.data.success) {
      await storeUserData(response.data.data);
      return response.data.data;
    }

    throw new Error('Failed to get current user');
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      await removeTokens();
    }
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const accessToken = await getValidAccessToken();

    if (accessToken) {
      await axios.post(
        `${API_BASE_URL}/users/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
    }
  } catch (error: any) {
    if (error?.response?.status !== 401) {
      console.error('Logout API error:', error);
    }
  } finally {
    await removeTokens();
  }
};