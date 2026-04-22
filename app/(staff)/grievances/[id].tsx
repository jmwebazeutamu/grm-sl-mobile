import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionComposer } from '@/components/ActionComposer';
import { AttachmentsPanel } from '@/components/AttachmentsPanel';
import { Card } from '@/components/Card';
import { DecisionBar } from '@/components/DecisionBar';
import { SlaDot } from '@/components/SlaDot';
import { StateBadge } from '@/components/StateBadge';
import { WorkflowPanel } from '@/components/WorkflowPanel';
import { stateColor } from '@/constants/states';
import { useGrievanceDetail } from '@/hooks/useGrievances';

export default function GrievanceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = id ? Number(id) : null;
  const { data, isLoading, isError } = useGrievanceDetail(numericId);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="bg-white px-6 pt-3 pb-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
          <Ionicons name="chevron-back" size={20} color="#0f2044" />
          <Text className="text-navy text-sm font-medium">Back</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0f2044" />
        </View>
      ) : isError || !data ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
          <Text className="text-navy font-bold text-base mt-2">Unable to load case</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-muted text-xs uppercase tracking-wider">Reference</Text>
              <Text className="text-navy text-2xl font-bold font-mono">{data.g_number}</Text>
            </View>
            <StateBadge state={data.state} size="md" />
          </View>

          <Card className="mt-4">
            <Text className="text-navy font-bold text-base">{data.summary}</Text>
            {data.description ? (
              <Text className="text-navy/80 text-sm mt-2">{data.description}</Text>
            ) : null}

            <View className="mt-4 gap-2">
              {data.grievance_type ? <Row label="Type" value={data.grievance_type.name} /> : null}
              {data.organisation ? (
                <Row label="Organisation" value={data.organisation.acronym ?? data.organisation.name} />
              ) : null}
              {data.programme ? <Row label="Programme" value={data.programme.name} /> : null}
              {data.org_classification ? (
                <Row label="Sub-classification" value={data.org_classification.label} />
              ) : null}
              {data.assigned_officer ? (
                <Row label="Assigned officer" value={data.assigned_officer.name} />
              ) : null}
            </View>

            <View className="mt-4 flex-row items-center gap-2">
              <SlaDot status={data.sla_status} />
              <Text className="text-muted text-xs">
                {data.days_open != null ? `${data.days_open} days open` : 'Day unknown'} · SLA {data.sla_days}d
              </Text>
            </View>
          </Card>

          {/* Location */}
          {Object.values(data.location).some(Boolean) ? (
            <>
              <Text className="mt-6 mb-2 text-muted text-xs uppercase tracking-wider">Location</Text>
              <Card>
                {Object.entries(data.location).map(([k, v]) =>
                  v ? <Row key={k} label={cap(k)} value={v} /> : null,
                )}
              </Card>
            </>
          ) : null}

          {/* Complainer */}
          {data.complainer && !data.is_anonymous ? (
            <>
              <Text className="mt-6 mb-2 text-muted text-xs uppercase tracking-wider">Complainer</Text>
              <Card>
                <Text className="text-navy font-semibold">
                  {data.complainer.first_name} {data.complainer.last_name}
                </Text>
                {data.complainer.phone_number ? (
                  <Text className="text-muted text-sm mt-0.5">{data.complainer.phone_number}</Text>
                ) : null}
                {data.complainer.email ? (
                  <Text className="text-muted text-sm">{data.complainer.email}</Text>
                ) : null}
              </Card>
            </>
          ) : null}

          {/* Workflow — categorize / classify / assign */}
          <WorkflowPanel grievance={data} />

          {/* Attachments */}
          <AttachmentsPanel
            grievanceId={data.id}
            attachments={data.attachments}
            canUpload={Boolean(data.capabilities.can_upload_attachment)}
          />

          {/* Timeline */}
          <Text className="mt-6 mb-2 text-muted text-xs uppercase tracking-wider">Timeline</Text>
          <Card>
            {data.timeline.length === 0 ? (
              <Text className="text-muted text-sm">No timeline entries.</Text>
            ) : (
              data.timeline.map((t, i) => <TimelineEntry key={i} entry={t} />)
            )}
          </Card>
        </ScrollView>

        {/* Decisions (review, closure) — above the free-form composer */}
        <DecisionBar
          grievanceId={data.id}
          state={data.state}
          capabilities={data.capabilities}
        />

        {/* Action composer — only on states where posting an action is a
            legal workflow move. Super-admin's Gate::before bypass on the API
            side means can_edit can be true even on closed/rejected/etc.; this
            client guard stops the UI offering the composer when the server
            would reject the transition. */}
        {data.capabilities.can_edit &&
          ['in_progress', 'reopened', 'org_classified'].includes(data.state) ? (
          <ActionComposer grievanceId={data.id} />
        ) : null}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-muted text-sm">{label}</Text>
      <Text className="text-navy text-sm font-medium flex-shrink text-right" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function TimelineEntry({ entry }: { entry: { kind: string; occurred_at: string; actor: { name: string } | null; data: Record<string, unknown> } }) {
  const stateVal = (entry.data?.to_state ?? entry.data?.state) as string | undefined;
  const color = stateVal ? stateColor(stateVal) : '#c9a84c';
  const title =
    entry.kind === 'state'
      ? `Moved to ${String(entry.data?.to_state_label ?? stateVal ?? 'new state')}`
      : entry.kind === 'action'
      ? String(entry.data?.type_label ?? 'Action')
      : entry.kind === 'feedback'
      ? 'Feedback received'
      : 'Submitted';
  const date = new Date(entry.occurred_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View className="flex-row items-start py-2">
      <View className="w-2.5 h-2.5 rounded-full mt-1.5 mr-3" style={{ backgroundColor: color }} />
      <View className="flex-1">
        <Text className="text-navy font-semibold text-sm">{title}</Text>
        <Text className="text-muted text-xs mt-0.5">
          {date}
          {entry.actor ? ` · ${entry.actor.name}` : ''}
        </Text>
        {entry.data?.body ? (
          <Text className="text-navy/80 text-sm mt-1">{String(entry.data.body)}</Text>
        ) : null}
      </View>
    </View>
  );
}
