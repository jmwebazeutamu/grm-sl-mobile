import '@/global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerForPush } from '@/lib/push';
import { useAuthStore } from '@/stores/authStore';

// Foreground behavior: show a heads-up banner even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function RootLayout() {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (bootstrapped) setReady(true);
  }, [bootstrapped]);

  // Re-register on launch if the user is already signed in. No-op when
  // the token hasn't changed since last /push/register.
  useEffect(() => {
    if (ready && user) {
      registerForPush().catch(() => {});
    }
  }, [ready, user]);

  // Tap-to-navigate: if a notification carries a grievance_id, open the detail.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | { grievance_id?: number | string }
        | undefined;
      const id = data?.grievance_id;
      if (id !== undefined && id !== null && String(id).length > 0) {
        router.push(`/(staff)/grievances/${id}`);
      }
    });
    return () => sub.remove();
  }, []);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(public)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(staff)" />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
