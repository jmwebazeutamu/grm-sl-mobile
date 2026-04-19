import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { SlaDot } from '@/components/SlaDot';
import { StateBadge } from '@/components/StateBadge';
import { useGrievances, type GrievanceListItem } from '@/hooks/useGrievances';

const STATES = [
  { key: '', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

export default function GrievancesList() {
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const filters = useMemo(() => ({ search: search.trim() || undefined, state: state || undefined }), [search, state]);
  const q = useGrievances(filters);

  const flat = q.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="bg-white px-6 pt-4 pb-3 border-b border-border">
        <Text className="text-navy text-xl font-bold">Grievances</Text>

        <View className="mt-3 bg-surface rounded-xl flex-row items-center px-3">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search ref or summary"
            placeholderTextColor="#94a3b8"
            className="flex-1 py-3 px-2 text-navy"
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} className="p-1">
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          {STATES.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setState(s.key)}
              className={`px-3 py-1.5 mr-2 rounded-full border ${
                state === s.key ? 'bg-navy border-navy' : 'border-border bg-white'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  state === s.key ? 'text-white' : 'text-navy'
                }`}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={flat}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <GrievanceRow item={item} />}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerStyle={{ padding: 16 }}
        onEndReachedThreshold={0.5}
        onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor="#0f2044" />}
        ListEmptyComponent={
          q.isLoading ? (
            <View className="py-20 items-center">
              <ActivityIndicator color="#0f2044" />
            </View>
          ) : (
            <View className="py-20 items-center px-8">
              <Ionicons name="document-text-outline" size={40} color="#94a3b8" />
              <Text className="text-muted mt-2 text-sm text-center">
                No grievances match the filters.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          q.isFetchingNextPage ? (
            <View className="py-6 items-center">
              <ActivityIndicator color="#0f2044" />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function GrievanceRow({ item }: { item: GrievanceListItem }) {
  return (
    <Pressable onPress={() => router.push({ pathname: '/(staff)/grievances/[id]', params: { id: item.id } })}>
      <Card>
        <View className="flex-row items-start justify-between gap-3">
          <Text className="text-navy font-bold font-mono text-xs">{item.g_number}</Text>
          <StateBadge state={item.state} />
        </View>
        <Text className="text-navy text-sm mt-2" numberOfLines={2}>
          {item.summary}
        </Text>
        <View className="flex-row items-center gap-2 mt-3">
          {item.organisation ? (
            <Text className="text-muted text-xs">{item.organisation}</Text>
          ) : null}
          {item.programme ? (
            <>
              <Text className="text-muted text-xs">·</Text>
              <Text className="text-muted text-xs">{item.programme}</Text>
            </>
          ) : null}
        </View>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-muted text-xs">{item.district ?? '—'}</Text>
          <View className="flex-row items-center gap-1.5">
            {item.days_open != null ? (
              <Text className="text-muted text-xs">{item.days_open}d open</Text>
            ) : null}
            <SlaDot status={item.sla_status} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
