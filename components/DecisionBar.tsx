import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useBeginClosure,
  useCloseGrievance,
  useEscalateGrievance,
  usePostAction,
  useReview,
} from '@/hooks/useGrievanceMutations';

interface Props {
  grievanceId: number;
  state: string;
  capabilities: Record<string, boolean>;
}

const CLOSURE_MIN_CHARS = 10;

/**
 * Above-the-composer button row. Surfaces the specific decisions that are
 * valid in the current state/role, so the officer doesn't have to guess.
 */
export function DecisionBar({ grievanceId, state, capabilities }: Props) {
  const review = useReview(grievanceId);
  const begin = useBeginClosure(grievanceId);
  const close = useCloseGrievance(grievanceId);
  const escalate = useEscalateGrievance(grievanceId);
  const postAction = usePostAction(grievanceId);

  const [reviewing, setReviewing] = useState<null | 'accept' | 'reject'>(null);
  const [reviewComment, setReviewComment] = useState('');

  const [closureOpen, setClosureOpen] = useState(false);
  const [closureKind, setClosureKind] = useState<null | 'close' | 'escalate'>(null);
  const [closureComment, setClosureComment] = useState('');

  const [resolving, setResolving] = useState(false);
  const [resolveComment, setResolveComment] = useState('');

  const showReview =
    capabilities.can_review && (state === 'submitted' || state === 'under_review');
  const showResolve =
    capabilities.can_edit && state === 'in_progress';
  const showBeginClosure =
    capabilities.can_closure_action && state === 'resolved';
  const showCloseOrEscalate =
    capabilities.can_closure_action && state === 'under_admin_review';

  if (!showReview && !showResolve && !showBeginClosure && !showCloseOrEscalate) return null;

  function openReview(decision: 'accept' | 'reject') {
    setReviewComment('');
    setReviewing(decision);
  }

  function confirmReview() {
    const decision = reviewing;
    const comment = reviewComment.trim() || undefined;
    if (!decision) return;
    setReviewing(null);
    review.mutate(
      { decision, comment },
      {
        onError: (err: any) =>
          Alert.alert('Error', err?.response?.data?.message ?? 'Please try again.'),
      },
    );
  }

  function onBegin() {
    Alert.alert(
      'Send for closure approval',
      'The supervisor will review before this case can be closed. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => begin.mutate() },
      ],
    );
  }

  function openResolve() {
    setResolveComment('');
    setResolving(true);
  }

  function confirmResolve() {
    const body = resolveComment.trim();
    if (body.length < CLOSURE_MIN_CHARS) return;
    setResolving(false);
    postAction.mutate(
      { type: 'resolve', body },
      {
        onError: (err: any) =>
          Alert.alert(
            'Could not resolve',
            err?.response?.data?.message ?? 'Please try again.',
          ),
      },
    );
  }

  function openClosure() {
    setClosureComment('');
    setClosureKind(null);
    setClosureOpen(true);
  }

  function confirmClosure() {
    const comment = closureComment.trim();
    if (comment.length < CLOSURE_MIN_CHARS || !closureKind) return;
    const kind = closureKind;
    setClosureOpen(false);
    const mut = kind === 'close' ? close : escalate;
    mut.mutate(comment, {
      onError: (err: any) =>
        Alert.alert(
          kind === 'close' ? 'Could not close case' : 'Could not send back',
          err?.response?.data?.message ?? 'Please try again.',
        ),
    });
  }

  return (
    <View className="bg-white border-t border-border px-4 py-3">
      <Text className="text-muted text-xs uppercase tracking-wider mb-2">Decisions</Text>

      {showReview ? (
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => openReview('accept')}
            disabled={review.isPending}
            className="flex-1 bg-state-resolved rounded-xl py-3 flex-row items-center justify-center gap-2"
            accessibilityLabel="Accept this grievance"
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text className="text-white font-bold text-sm">Accept</Text>
          </Pressable>
          <Pressable
            onPress={() => openReview('reject')}
            disabled={review.isPending}
            className="flex-1 bg-state-rejected rounded-xl py-3 flex-row items-center justify-center gap-2"
            accessibilityLabel="Reject this grievance"
          >
            <Ionicons name="close-circle" size={18} color="#fff" />
            <Text className="text-white font-bold text-sm">Reject</Text>
          </Pressable>
        </View>
      ) : null}

      {showResolve ? (
        <Pressable
          onPress={openResolve}
          disabled={postAction.isPending}
          className="bg-state-resolved rounded-xl py-3 flex-row items-center justify-center gap-2"
          accessibilityLabel="Mark this grievance as resolved"
        >
          <Ionicons name="checkmark-done-circle" size={18} color="#fff" />
          <Text className="text-white font-bold text-sm">Mark as resolved</Text>
        </Pressable>
      ) : null}

      {showBeginClosure ? (
        <Pressable
          onPress={onBegin}
          disabled={begin.isPending}
          className="bg-navy rounded-xl py-3 flex-row items-center justify-center gap-2"
        >
          <Ionicons name="clipboard" size={18} color="#fff" />
          <Text className="text-white font-bold text-sm">Send for closure approval</Text>
        </Pressable>
      ) : null}

      {showCloseOrEscalate ? (
        <Pressable
          onPress={openClosure}
          disabled={close.isPending || escalate.isPending}
          className="bg-navy rounded-xl py-3 flex-row items-center justify-center gap-2"
          accessibilityLabel="Review closure with complainant satisfaction"
        >
          <Ionicons name="clipboard-outline" size={18} color="#fff" />
          <Text className="text-white font-bold text-sm">Closure review</Text>
        </Pressable>
      ) : null}

      <ReviewModal
        open={reviewing !== null}
        decision={reviewing ?? 'accept'}
        comment={reviewComment}
        onChangeComment={setReviewComment}
        onCancel={() => setReviewing(null)}
        onConfirm={confirmReview}
        pending={review.isPending}
      />

      <ResolveModal
        open={resolving}
        comment={resolveComment}
        onChangeComment={setResolveComment}
        onCancel={() => setResolving(false)}
        onConfirm={confirmResolve}
        pending={postAction.isPending}
      />

      <ClosureModal
        open={closureOpen}
        kind={closureKind}
        onChangeKind={setClosureKind}
        comment={closureComment}
        onChangeComment={setClosureComment}
        onCancel={() => setClosureOpen(false)}
        onConfirm={confirmClosure}
        pending={close.isPending || escalate.isPending}
      />
    </View>
  );
}

function ReviewModal({
  open,
  decision,
  comment,
  onChangeComment,
  onCancel,
  onConfirm,
  pending,
}: {
  open: boolean;
  decision: 'accept' | 'reject';
  comment: string;
  onChangeComment: (s: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  const title = decision === 'accept' ? 'Accept grievance' : 'Reject grievance';
  const hint =
    decision === 'reject'
      ? 'Reason (visible to the complainant — optional).'
      : 'Comment for the timeline — optional.';
  const confirmLabel = decision === 'accept' ? 'Accept' : 'Reject';
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onCancel}>
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className="bg-white rounded-t-3xl px-5 pt-5"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <Text className="text-navy font-bold text-lg">{title}</Text>
          <Text className="text-muted text-sm mt-1">{hint}</Text>

          <TextInput
            value={comment}
            onChangeText={onChangeComment}
            placeholder={decision === 'reject' ? 'Why was this rejected?' : 'Add a note'}
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={500}
            className="mt-4 bg-surface border border-border rounded-xl px-3 py-3 text-navy"
            style={{ minHeight: 96, textAlignVertical: 'top' }}
            autoFocus
          />

          <View className="flex-row gap-2 mt-5">
            <Pressable
              onPress={onCancel}
              disabled={pending}
              className="flex-1 border border-border rounded-xl py-3 items-center"
            >
              <Text className="text-navy font-semibold text-sm">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={pending}
              className={`flex-1 rounded-xl py-3 items-center ${
                decision === 'accept' ? 'bg-state-resolved' : 'bg-state-rejected'
              } ${pending ? 'opacity-50' : ''}`}
            >
              <Text className="text-white font-bold text-sm">
                {pending ? 'Saving…' : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ClosureModal({
  open,
  kind,
  onChangeKind,
  comment,
  onChangeComment,
  onCancel,
  onConfirm,
  pending,
}: {
  open: boolean;
  kind: 'close' | 'escalate' | null;
  onChangeKind: (k: 'close' | 'escalate') => void;
  comment: string;
  onChangeComment: (s: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  const placeholder =
    kind === 'escalate'
      ? 'More investigation needed because…'
      : 'Resolution confirmed. Complainant notified…';
  const confirmLabel = kind === 'escalate' ? 'Escalate and reopen' : 'Close grievance';
  const charsShort = Math.max(0, CLOSURE_MIN_CHARS - comment.trim().length);
  const canConfirm = kind !== null && comment.trim().length >= CLOSURE_MIN_CHARS && !pending;
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onCancel}>
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className="bg-white rounded-t-3xl px-5 pt-5"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <Text className="text-navy font-bold text-lg">Closure review</Text>
          <Text className="text-muted text-sm mt-1">
            Record the complainant's feedback and outcome. Closing is final; escalating sends the case back for more work.
          </Text>

          <Text className="text-navy font-semibold text-sm mt-4 mb-2">
            Was the complainant satisfied?
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => onChangeKind('close')}
              disabled={pending}
              className={`flex-1 border-2 rounded-xl p-3 ${
                kind === 'close' ? 'border-state-resolved bg-emerald-50' : 'border-border bg-white'
              }`}
              accessibilityRole="radio"
              accessibilityState={{ selected: kind === 'close' }}
            >
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="checkmark-circle" size={18} color="#047857" />
                <Text className="text-emerald-900 font-bold text-sm">Satisfied</Text>
              </View>
              <Text className="text-muted text-xs">Close — no further action.</Text>
            </Pressable>
            <Pressable
              onPress={() => onChangeKind('escalate')}
              disabled={pending}
              className={`flex-1 border-2 rounded-xl p-3 ${
                kind === 'escalate' ? 'border-state-escalated bg-rose-50' : 'border-border bg-white'
              }`}
              accessibilityRole="radio"
              accessibilityState={{ selected: kind === 'escalate' }}
            >
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="alert-circle" size={18} color="#be123c" />
                <Text className="text-rose-900 font-bold text-sm">Dissatisfied</Text>
              </View>
              <Text className="text-muted text-xs">Escalate and reopen.</Text>
            </Pressable>
          </View>

          <Text className="text-navy font-semibold text-sm mt-4 mb-1">Closure notes</Text>
          <TextInput
            value={comment}
            onChangeText={onChangeComment}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={2000}
            className="bg-surface border border-border rounded-xl px-3 py-3 text-navy"
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />
          <Text className="text-muted text-xs mt-2">
            {kind === null
              ? 'Select an outcome above to continue.'
              : charsShort > 0
                ? `Needs at least ${charsShort} more character${charsShort === 1 ? '' : 's'}.`
                : 'Ready to send.'}
          </Text>

          <View className="flex-row gap-2 mt-5">
            <Pressable
              onPress={onCancel}
              disabled={pending}
              className="flex-1 border border-border rounded-xl py-3 items-center"
            >
              <Text className="text-navy font-semibold text-sm">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={!canConfirm}
              className={`flex-1 rounded-xl py-3 items-center ${
                kind === 'escalate' ? 'bg-state-escalated' : 'bg-state-closed'
              } ${!canConfirm ? 'opacity-50' : ''}`}
            >
              <Text className="text-white font-bold text-sm">
                {pending ? 'Saving…' : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ResolveModal({
  open,
  comment,
  onChangeComment,
  onCancel,
  onConfirm,
  pending,
}: {
  open: boolean;
  comment: string;
  onChangeComment: (s: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  const charsShort = Math.max(0, CLOSURE_MIN_CHARS - comment.trim().length);
  const canConfirm = comment.trim().length >= CLOSURE_MIN_CHARS && !pending;
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onCancel}>
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className="bg-white rounded-t-3xl px-5 pt-5"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <Text className="text-navy font-bold text-lg">Mark as resolved</Text>
          <Text className="text-muted text-sm mt-1">
            Summarise what you did to resolve the case. The complainant will be
            invited to confirm the outcome; your summary is recorded on the
            timeline.
          </Text>

          <TextInput
            value={comment}
            onChangeText={onChangeComment}
            placeholder="Payment delivered, issue resolved…"
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={2000}
            className="mt-4 bg-surface border border-border rounded-xl px-3 py-3 text-navy"
            style={{ minHeight: 120, textAlignVertical: 'top' }}
            autoFocus
          />

          <Text className="text-muted text-xs mt-2">
            {charsShort > 0
              ? `Needs at least ${charsShort} more character${charsShort === 1 ? '' : 's'}.`
              : 'Ready to send.'}
          </Text>

          <View className="flex-row gap-2 mt-5">
            <Pressable
              onPress={onCancel}
              disabled={pending}
              className="flex-1 border border-border rounded-xl py-3 items-center"
            >
              <Text className="text-navy font-semibold text-sm">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={!canConfirm}
              className={`flex-1 rounded-xl py-3 items-center bg-state-resolved ${
                !canConfirm ? 'opacity-50' : ''
              }`}
            >
              <Text className="text-white font-bold text-sm">
                {pending ? 'Saving…' : 'Mark as resolved'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
