import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import {
  useAssignOfficer,
  useCategorize,
  useClassify,
} from '@/hooks/useGrievanceMutations';
import { useOfficers, useOrganisations, useOrgClassifications } from '@/hooks/useReference';

interface GrievanceLike {
  id: number;
  state: string;
  organisation: { id: number; name: string; acronym: string | null } | null;
  org_classification: { id: number; label: string } | null;
  assigned_officer: { id: number; name: string } | null;
  capabilities: Record<string, boolean>;
}

export function WorkflowPanel({ grievance }: { grievance: GrievanceLike }) {
  const [flow, setFlow] = useState<null | 'categorize' | 'classify' | 'assign'>(null);

  const canCategorize = Boolean(grievance.capabilities.can_classify);
  const canSubClassify = Boolean(grievance.capabilities.can_org_classify);
  const canAssign = Boolean(grievance.capabilities.can_assign);

  if (!canCategorize && !canSubClassify && !canAssign) return null;

  return (
    <>
      <Text className="mt-6 mb-2 text-muted text-xs uppercase tracking-wider">Next step</Text>
      <Card>
        {canCategorize ? (
          <Row
            icon="business-outline"
            title="Set organisation & category"
            subtitle="Route this case to the right organisation."
            onPress={() => setFlow('categorize')}
          />
        ) : null}
        {canSubClassify ? (
          <Row
            icon="pricetag-outline"
            title="Set sub-classification"
            subtitle="Tag the case so officers can pick it up."
            onPress={() => setFlow('classify')}
          />
        ) : null}
        {canAssign ? (
          <Row
            icon="person-add-outline"
            title={grievance.assigned_officer ? 'Reassign officer' : 'Assign officer'}
            subtitle={grievance.assigned_officer
              ? `Currently with ${grievance.assigned_officer.name}.`
              : 'Give this case to a specific officer.'}
            onPress={() => setFlow('assign')}
          />
        ) : null}
      </Card>

      <CategorizeModal
        open={flow === 'categorize'}
        grievanceId={grievance.id}
        onClose={() => setFlow(null)}
      />
      <ClassifyModal
        open={flow === 'classify'}
        grievanceId={grievance.id}
        orgId={grievance.organisation?.id ?? null}
        onClose={() => setFlow(null)}
      />
      <AssignModal
        open={flow === 'assign'}
        grievanceId={grievance.id}
        orgId={grievance.organisation?.id ?? null}
        currentOfficerId={grievance.assigned_officer?.id ?? null}
        onClose={() => setFlow(null)}
      />
    </>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-2.5 active:bg-navy/5 rounded-lg"
    >
      <View className="w-10 h-10 rounded-full bg-navy/10 items-center justify-center">
        <Ionicons name={icon} size={20} color="#0f2044" />
      </View>
      <View className="flex-1">
        <Text className="text-navy font-semibold text-sm">{title}</Text>
        <Text className="text-muted text-xs mt-0.5">{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </Pressable>
  );
}

// ─── Categorize ─────────────────────────────────────────────────────────────

function CategorizeModal({
  open,
  grievanceId,
  onClose,
}: {
  open: boolean;
  grievanceId: number;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<'corruption' | 'administrative' | null>(null);
  const [orgId, setOrgId] = useState<number | null>(null);
  const orgs = useOrganisations();
  const categorize = useCategorize(grievanceId);

  function handleClose() {
    setCategory(null);
    setOrgId(null);
    onClose();
  }

  function confirm() {
    if (!category || !orgId) return;
    categorize.mutate(
      { category, classified_organization_id: orgId },
      {
        onSuccess: handleClose,
        onError: (err: any) =>
          Alert.alert(
            'Could not categorize',
            err?.response?.data?.message ?? 'Please try again.',
          ),
      },
    );
  }

  return (
    <FullScreenModal open={open} onClose={handleClose} title="Set organisation & category">
      <Text className="text-muted text-xs uppercase tracking-wider mt-4 mb-2">Category</Text>
      <View className="flex-row gap-2">
        <CategoryButton
          label="Corruption"
          hint="Goes to the Anti-Corruption Commission."
          active={category === 'corruption'}
          onPress={() => setCategory('corruption')}
        />
        <CategoryButton
          label="Administrative"
          hint="Any other implementing organisation."
          active={category === 'administrative'}
          onPress={() => setCategory('administrative')}
        />
      </View>

      <Text className="text-muted text-xs uppercase tracking-wider mt-5 mb-2">
        Implementing organisation
      </Text>
      <PickerList
        loading={orgs.isLoading}
        items={(orgs.data ?? []).map((o) => ({ id: o.id, name: o.acronym ?? o.name }))}
        value={orgId}
        onChange={setOrgId}
        emptyText="No organisations available."
      />

      <ConfirmBar
        disabled={!category || !orgId || categorize.isPending}
        pending={categorize.isPending}
        label="Route this case"
        onConfirm={confirm}
        onCancel={handleClose}
      />
    </FullScreenModal>
  );
}

function CategoryButton({
  label,
  hint,
  active,
  onPress,
}: {
  label: string;
  hint: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 border rounded-xl p-3 ${
        active ? 'border-navy bg-navy/5' : 'border-border bg-white'
      }`}
    >
      <View className="flex-row items-center gap-1.5">
        <Ionicons
          name={active ? 'radio-button-on' : 'radio-button-off'}
          size={18}
          color={active ? '#0f2044' : '#94a3b8'}
        />
        <Text className="text-navy font-bold text-sm">{label}</Text>
      </View>
      <Text className="text-muted text-xs mt-1">{hint}</Text>
    </Pressable>
  );
}

// ─── Classify ───────────────────────────────────────────────────────────────

function ClassifyModal({
  open,
  grievanceId,
  orgId,
  onClose,
}: {
  open: boolean;
  grievanceId: number;
  orgId: number | null;
  onClose: () => void;
}) {
  const [pickedId, setPickedId] = useState<number | null>(null);
  const list = useOrgClassifications(orgId);
  const classify = useClassify(grievanceId);

  function handleClose() {
    setPickedId(null);
    onClose();
  }

  function confirm() {
    if (!pickedId) return;
    classify.mutate(pickedId, {
      onSuccess: handleClose,
      onError: (err: any) =>
        Alert.alert(
          'Could not classify',
          err?.response?.data?.message ?? 'Please try again.',
        ),
    });
  }

  return (
    <FullScreenModal open={open} onClose={handleClose} title="Set sub-classification">
      <Text className="text-muted text-sm mt-3">
        Pick how this case is classified inside your organisation. Case work starts once this is set.
      </Text>
      <Text className="text-muted text-xs uppercase tracking-wider mt-5 mb-2">
        Sub-classification
      </Text>
      <PickerList
        loading={list.isLoading}
        items={list.data ?? []}
        value={pickedId}
        onChange={setPickedId}
        emptyText="Your organisation has no sub-classifications configured."
      />

      <ConfirmBar
        disabled={!pickedId || classify.isPending}
        pending={classify.isPending}
        label="Start case work"
        onConfirm={confirm}
        onCancel={handleClose}
      />
    </FullScreenModal>
  );
}

// ─── Assign ─────────────────────────────────────────────────────────────────

function AssignModal({
  open,
  grievanceId,
  orgId,
  currentOfficerId,
  onClose,
}: {
  open: boolean;
  grievanceId: number;
  orgId: number | null;
  currentOfficerId: number | null;
  onClose: () => void;
}) {
  const [pickedId, setPickedId] = useState<number | null>(currentOfficerId);
  const officers = useOfficers(orgId);
  const assign = useAssignOfficer(grievanceId);

  function handleClose() {
    setPickedId(currentOfficerId);
    onClose();
  }

  function confirm() {
    if (!pickedId) return;
    assign.mutate(pickedId, {
      onSuccess: handleClose,
      onError: (err: any) =>
        Alert.alert(
          'Could not assign',
          err?.response?.data?.message ?? 'Please try again.',
        ),
    });
  }

  return (
    <FullScreenModal open={open} onClose={handleClose} title="Assign officer">
      <Text className="text-muted text-sm mt-3">
        Pick the officer responsible for this case. They will see it in their list and receive updates.
      </Text>
      <Text className="text-muted text-xs uppercase tracking-wider mt-5 mb-2">Officers</Text>
      <PickerList
        loading={officers.isLoading}
        items={officers.data ?? []}
        value={pickedId}
        onChange={setPickedId}
        searchable
        emptyText="No officers are available in this organisation."
      />

      <ConfirmBar
        disabled={!pickedId || pickedId === currentOfficerId || assign.isPending}
        pending={assign.isPending}
        label={currentOfficerId ? 'Reassign' : 'Assign'}
        onConfirm={confirm}
        onCancel={handleClose}
      />
    </FullScreenModal>
  );
}

// ─── Shared primitives ──────────────────────────────────────────────────────

function FullScreenModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
        <View className="bg-navy px-5 pt-4 pb-4 flex-row items-center justify-between">
          <Text className="text-white font-bold text-base flex-1" numberOfLines={1}>{title}</Text>
          <Pressable onPress={onClose} className="p-2 -mr-2">
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>
        <View className="flex-1 px-5">{children}</View>
      </SafeAreaView>
    </Modal>
  );
}

function PickerList({
  items,
  loading,
  value,
  onChange,
  emptyText,
  searchable = false,
}: {
  items: { id: number; name: string }[];
  loading?: boolean;
  value: number | null;
  onChange: (id: number) => void;
  emptyText: string;
  searchable?: boolean;
}) {
  const [q, setQ] = useState('');
  const filtered = q.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()))
    : items;

  return (
    <View className="flex-1 border border-border rounded-xl overflow-hidden bg-white">
      {searchable && items.length > 10 ? (
        <View className="px-3 py-2 border-b border-border flex-row items-center gap-2">
          <Ionicons name="search" size={16} color="#64748b" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search"
            placeholderTextColor="#94a3b8"
            className="flex-1 text-navy text-sm py-1"
          />
        </View>
      ) : null}

      {loading ? (
        <View className="flex-1 items-center justify-center py-8">
          <ActivityIndicator color="#0f2044" />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4 py-8">
          <Text className="text-muted text-sm text-center">{emptyText}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id.toString()}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onChange(item.id)}
              className={`px-4 py-3 border-b border-border flex-row items-center justify-between ${
                value === item.id ? 'bg-gold-light/30' : ''
              }`}
            >
              <Text className="text-navy flex-1 text-sm">{item.name}</Text>
              {value === item.id ? <Ionicons name="checkmark" size={18} color="#22c55e" /> : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function ConfirmBar({
  disabled,
  pending,
  label,
  onConfirm,
  onCancel,
}: {
  disabled: boolean;
  pending: boolean;
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <View className="flex-row gap-2 my-4">
      <Pressable
        onPress={onCancel}
        disabled={pending}
        className="flex-1 border border-border rounded-xl py-3 items-center bg-white"
      >
        <Text className="text-navy font-semibold text-sm">Cancel</Text>
      </Pressable>
      <Pressable
        onPress={onConfirm}
        disabled={disabled}
        className={`flex-1 rounded-xl py-3 items-center ${
          disabled ? 'bg-navy/50' : 'bg-navy'
        }`}
      >
        {pending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text className="text-white font-bold text-sm">{label}</Text>
        )}
      </Pressable>
    </View>
  );
}
