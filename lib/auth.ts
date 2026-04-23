import { router } from 'expo-router';
import { api } from '@/lib/api';
import { unregisterFromPush } from '@/lib/push';
import { useAuthStore } from '@/stores/authStore';

export async function performSignOut() {
  await unregisterFromPush();
  try {
    await api.post('/auth/logout');
  } catch {
    // Network failure on server-side logout is non-fatal — the client
    // still wipes its own session below.
  }
  await useAuthStore.getState().clearSession();
  router.replace('/');
}
