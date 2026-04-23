import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountAvatarMenu } from '@/components/AccountAvatarMenu';
import { Card } from '@/components/Card';
import { StateBadge } from '@/components/StateBadge';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuthStore } from '@/stores/authStore';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, refetch, isRefetching } = useDashboard();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0f2044" />}
      >
        {/* Header */}
        <View className="bg-navy px-6 pt-4 pb-8 rounded-b-3xl">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-gold-light text-sm">{greeting},</Text>
              <Text className="text-white text-2xl font-bold">{user?.name?.split(' ')[0] ?? 'there'}</Text>
              {user?.organization ? (
                <Text className="text-white/70 text-sm mt-1">
                  {user.organization.acronym ?? user.organization.name}
                </Text>
              ) : null}
            </View>
            <AccountAvatarMenu theme="dark" />
          </View>
        </View>

        {isLoading || !data ? (
          <View className="py-20 items-center">
            <ActivityIndicator color="#0f2044" />
          </View>
        ) : (
          <View className="px-6 -mt-5">
            {/* Stat cards */}
            <View className="flex-row flex-wrap gap-3">
              <StatCard label="Active" value={data.active_cases} accent="#0f2044" />
              <StatCard label="SLA breached" value={data.sla_breached} accent="#ef4444" />
              <StatCard label="Approaching" value={data.sla_approaching} accent="#f59e0b" />
              <StatCard label="Resolved (mo)" value={data.resolved_this_month} accent="#22c55e" />
            </View>

            {/* Resolution rate */}
            <Card className="mt-4">
              <Text className="text-muted text-xs uppercase tracking-wider">Resolution rate</Text>
              <View className="flex-row items-baseline gap-2 mt-1">
                <Text className="text-navy text-4xl font-bold">
                  {data.resolution_rate == null ? '—' : `${data.resolution_rate}%`}
                </Text>
                <Text className="text-muted text-xs">within SLA</Text>
              </View>
            </Card>

            {/* My assigned */}
            <Pressable
              onPress={() => router.push('/(staff)/grievances')}
              className="mt-4"
            >
              <Card className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-muted text-xs uppercase tracking-wider">
                    My assigned cases
                  </Text>
                  <Text className="text-navy text-2xl font-bold mt-1">{data.my_assigned}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
              </Card>
            </Pressable>

            {/* Recent activity */}
            <Text className="mt-6 mb-2 text-muted text-xs uppercase tracking-wider">Recent activity</Text>
            <Card>
              {data.recent_activity.length === 0 ? (
                <Text className="text-muted text-sm py-2">No recent activity.</Text>
              ) : (
                data.recent_activity.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => router.push({ pathname: '/(staff)/grievances/[id]', params: { id: r.id } })}
                    className="py-2.5 flex-row items-center gap-3"
                  >
                    <View className="flex-1">
                      <Text className="text-navy font-semibold text-sm" numberOfLines={1}>
                        {r.g_number}
                      </Text>
                      <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                        {r.summary}
                      </Text>
                    </View>
                    <StateBadge state={r.state} />
                  </Pressable>
                ))
              )}
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View
      className="bg-white rounded-2xl p-4 border border-border flex-1 min-w-[46%]"
      style={{ borderLeftColor: accent, borderLeftWidth: 4 }}
    >
      <Text className="text-navy text-2xl font-bold">{value}</Text>
      <Text className="text-muted text-xs font-semibold uppercase tracking-wider mt-1">{label}</Text>
    </View>
  );
}
