import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { StateBadge } from '@/components/StateBadge';
import { stateColor } from '@/constants/states';
import { useTrack } from '@/hooks/useTrack';

export default function Status() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const { data, isLoading, isError, error } = useTrack(ref ?? null);

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
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-navy font-bold text-lg mt-3 text-center">Grievance not found</Text>
          <Text className="text-muted text-sm text-center mt-1">
            No grievance with reference "{ref}". Check the number and try again.
          </Text>
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
