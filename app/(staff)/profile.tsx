import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  async function logout() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try { await api.post('/auth/logout'); } catch { /* fall through */ }
          await clearSession();
          router.replace('/');
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView className="flex-1">
        <View className="bg-navy px-6 pt-6 pb-10 rounded-b-3xl items-center">
          <View className="w-16 h-16 rounded-full bg-gold items-center justify-center mb-3">
            <Text className="text-navy text-2xl font-bold">
              {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('') ?? '?'}
            </Text>
          </View>
          <Text className="text-white text-xl font-bold">{user?.name}</Text>
          <Text className="text-gold-light text-sm mt-0.5">{user?.roles[0] ?? 'user'}</Text>
          {user?.organization ? (
            <Text className="text-white/70 text-xs mt-0.5">
              {user.organization.name}
            </Text>
          ) : null}
        </View>

        <View className="px-6 -mt-6">
          <Card>
            <Row label="Username" value={user?.username ?? '—'} />
            <Divider />
            <Row label="Email" value={user?.email ?? '—'} />
            {user?.phone_number ? <><Divider /><Row label="Phone" value={user.phone_number} /></> : null}
            {user?.position ? <><Divider /><Row label="Position" value={user.position} /></> : null}
          </Card>

          <Pressable onPress={logout} className="mt-6">
            <Card className="flex-row items-center gap-3">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="text-red-600 font-semibold">Sign out</Text>
            </Card>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="py-2 flex-row justify-between">
      <Text className="text-muted text-sm">{label}</Text>
      <Text className="text-navy text-sm font-medium">{value}</Text>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-border" />;
}
