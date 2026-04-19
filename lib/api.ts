import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const baseURL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://104.225.218.102:8081/api/v1/mobile';

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Mobile-App': 'grm-sl-mobile/0.1',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    // 401 → drop the token so the auth guard can redirect.
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Record<string, unknown> | undefined;
    if (typeof data?.message === 'string') return data.message;
    if (err.response?.status === 0 || err.code === 'ERR_NETWORK') {
      return 'No network connection.';
    }
    return `Server error (${err.response?.status ?? '?'})`;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}
