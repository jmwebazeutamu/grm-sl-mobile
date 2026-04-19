import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';

export default function Landing() {
  const user = useAuthStore((s) => s.user);

  // Staff who are already signed in skip the public landing.
  if (user) return <Redirect href="/(staff)/dashboard" />;

  return (
    <SafeAreaView className="flex-1 bg-navy">
      <View className="flex-1 justify-between px-6 py-10">
        <View className="items-center mt-8">
          <View className="w-20 h-20 rounded-full bg-gold items-center justify-center mb-6">
            <Ionicons name="shield-checkmark" size={44} color="#0f2044" />
          </View>
          <Text className="text-white text-2xl font-bold text-center">
            Grievance Redress Mechanism
          </Text>
          <Text className="text-gold-light text-base mt-1 text-center">
            Anti-Corruption Commission · Sierra Leone
          </Text>
        </View>

        <View className="gap-4">
          <Link href="/(public)/submit" asChild>
            <Pressable className="bg-white rounded-2xl p-5 flex-row items-center gap-4 active:bg-surface">
              <View className="w-12 h-12 rounded-xl bg-navy items-center justify-center">
                <Ionicons name="create" size={22} color="#c9a84c" />
              </View>
              <View className="flex-1">
                <Text className="text-navy font-bold text-lg">Submit a grievance</Text>
                <Text className="text-muted text-sm mt-0.5">
                  Report a concern anonymously
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
            </Pressable>
          </Link>

          <Link href="/(public)/track" asChild>
            <Pressable className="bg-white rounded-2xl p-5 flex-row items-center gap-4 active:bg-surface">
              <View className="w-12 h-12 rounded-xl bg-gold items-center justify-center">
                <Ionicons name="search" size={22} color="#0f2044" />
              </View>
              <View className="flex-1">
                <Text className="text-navy font-bold text-lg">Track your grievance</Text>
                <Text className="text-muted text-sm mt-0.5">
                  Check status with your reference number
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
            </Pressable>
          </Link>
        </View>

        <View className="items-center">
          <Link href="/(auth)/login" asChild>
            <Pressable className="py-3 px-5">
              <Text className="text-gold-light text-sm font-medium">
                Staff login →
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
