import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

/**
 * Fetches an Expo push token and syncs it with the backend. Called after
 * successful staff login, and on app start if a session is already active.
 *
 * Skips silently when:
 * - running on an emulator/simulator (Expo push doesn't work there)
 * - the user hasn't granted permission and won't (we ask once; if they deny,
 *   we don't pester on every launch)
 * - the token hasn't changed since the last successful /push/register
 */
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#c9a84c',
    });
  }

  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.status === 'granted';
  if (!granted && settings.canAskAgain) {
    const ask = await Notifications.requestPermissionsAsync();
    granted = ask.status === 'granted';
  }
  if (!granted) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId;
  if (!projectId) return null;

  const res = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = res.data;

  const { pushToken: previous, setPushToken } = useAuthStore.getState();
  if (token === previous) return token;

  try {
    await api.post('/push/register', { token });
    setPushToken(token);
    return token;
  } catch {
    // Non-fatal — user just won't get pushes until the next login attempt.
    return null;
  }
}

export async function unregisterFromPush(): Promise<void> {
  const { pushToken, setPushToken } = useAuthStore.getState();
  if (!pushToken) return;
  try {
    await api.post('/push/unregister');
  } catch {
    // Non-fatal — token will be wiped locally regardless.
  }
  setPushToken(null);
}
