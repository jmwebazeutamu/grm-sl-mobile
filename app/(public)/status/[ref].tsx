import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { StateBadge } from '@/components/StateBadge';
import { stateColor } from '@/constants/states';
import { useTrack } from '@/hooks/useTrack';

export default function Status() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const { data, isLoading, isError, error, refetch, isFetching } = useTrack(ref ?? null);

  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const isNetwork = axios.isAxiosError(error) && (status === undefined || error.code === 'ERR_NETWORK');
  const isNotFound = status === 404;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-6 pt-4">
        <Link href="/(public)/track" asChild>
          <Pressable className="flex-row items-center gap-2">
            <Ionicons name="chevron-back" size={20} color="#0f2044" />
            <Text className="text-navy text-sm font-medium">Back</Text>
          </Pressable>
        </Link>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0f2044" />
        </View>
      ) : isError || !data ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons
            name={isNetwork ? 'cloud-offline-outline' : 'alert-circle-outline'}
            size={48}
            color={isNetwork ? '#64748b' : '#ef4444'}
          />
          <Text className="text-navy font-bold text-lg mt-3 text-center">
            {isNetwork
              ? 'Cannot reach the server'
              : isNotFound
                ? 'No case with that number'
                : 'Something went wrong'}
          </Text>
          <Text className="text-muted text-sm text-center mt-1 max-w-xs">
            {isNetwork
              ? 'Check your internet connection and try again.'
              : isNotFound
                ? `We couldn't find a case with reference "${ref}". Please check the number.`
                : 'Please try again in a moment.'}
          </Text>

          <View className="flex-row gap-3 mt-5">
            <Pressable
              onPress={() => refetch()}
              disabled={isFetching}
              className={`bg-navy rounded-xl px-5 py-3 flex-row items-center gap-2 ${isFetching ? 'opacity-60' : ''}`}
            >
              {isFetching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="refresh" size={18} color="#fff" />
              )}
              <Text className="text-white font-semibold text-sm">Try again</Text>
            </Pressable>

            <Pressable
              onPress={() => router.replace('/(public)/track')}
              className="bg-white border border-border rounded-xl px-5 py-3 flex-row items-center gap-2"
            >
              <Ionicons name="create-outline" size={18} color="#0f2044" />
              <Text className="text-navy font-semibold text-sm">Check the number</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          <Text className="text-muted text-xs uppercase tracking-wider">Reference</Text>
          <Text className="text-navy text-2xl font-bold font-mono mt-1">{data.grm_number}</Text>

          <View className="mt-3">
            <StateBadge state={data.state_value} size="md" />
          </View>

          <Card className="mt-6">
            <Text className="font-bold text-navy text-base">{data.summary}</Text>

            <View className="mt-4 gap-2.5">
              {data.assigned_org ? (
                <Row label="Assigned to" value={data.assigned_org} />
              ) : null}
              {data.submitted_at ? <Row label="Submitted" value={data.submitted_at} /> : null}
              {data.last_updated ? <Row label="Last updated" value={data.last_updated} /> : null}
              {data.resolved_at ? <Row label="Resolved" value={data.resolved_at} /> : null}
              {data.closed_at ? <Row label="Closed" value={data.closed_at} /> : null}
            </View>
          </Card>

          <Text className="text-muted text-xs uppercase tracking-wider mt-8 mb-3">Timeline</Text>
          <Card>
            {data.timeline.map((t, i) => (
              <View key={i} className="flex-row items-start py-2">
                <View
                  className="w-2.5 h-2.5 rounded-full mt-1.5 mr-3"
                  style={{ backgroundColor: stateColor(t.state_value) }}
                />
                <View className="flex-1">
                  <Text className="text-navy font-semibold text-sm">{t.state}</Text>
                  <Text className="text-muted text-xs">{t.date}</Text>
                </View>
              </View>
            ))}
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-muted text-sm">{label}</Text>
      <Text className="text-navy text-sm font-medium">{value}</Text>
    </View>
  );
}
