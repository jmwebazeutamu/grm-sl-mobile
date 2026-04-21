import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import {
  useBeginClosure,
  useCloseGrievance,
  useEscalateGrievance,
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

  const [reviewing, setReviewing] = useState<null | 'accept' | 'reject'>(null);
  const [reviewComment, setReviewComment] = useState('');

  const [closureKind, setClosureKind] = useState<null | 'close' | 'escalate'>(null);
  const [closureComment, setClosureComment] = useState('');

  const showReview =
    capabilities.can_review && (state === 'submitted' || state === 'under_review');
  const showBeginClosure =
    capabilities.can_closure_action && state === 'resolved';
  const showCloseOrEscalate =
    capabilities.can_closure_action && state === 'under_admin_review';

  if (!showReview && !showBeginClosure && !showCloseOrEscalate) return null;

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

  function openClosure(kind: 'close' | 'escalate') {
    setClosureComment('');
    setClosureKind(kind);
  }

  function confirmClosure() {
    const comment = closureComment.trim();
    if (comment.length < CLOSURE_MIN_CHARS || !closureKind) return;
    const kind = closureKind;
    setClosureKind(null);
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
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => openClosure('close')}
            disabled={close.isPending}
            className="flex-1 bg-state-closed rounded-xl py-3 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="archive" size={18} color="#fff" />
            <Text className="text-white font-bold text-sm">Close case</Text>
          </Pressable>
          <Pressable
            onPress={() => openClosure('escalate')}
            disabled={escalate.isPending}
            className="flex-1 bg-state-escalated rounded-xl py-3 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="arrow-up-circle" size={18} color="#fff" />
            <Text className="text-white font-bold text-sm">Send back</Text>
          </Pressable>
        </View>
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

      <ClosureModal
        open={closureKind !== null}
        kind={closureKind ?? 'close'}
        comment={closureComment}
        onChangeComment={setClosureComment}
        onCancel={() => setClosureKind(null)}
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

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onCancel}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8">
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
  comment,
  onChangeComment,
  onCancel,
  onConfirm,
  pending,
}: {
  open: boolean;
  kind: 'close' | 'escalate';
  comment: string;
  onChangeComment: (s: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  const title = kind === 'close' ? 'Close this case' : 'Send the case back';
  const body =
    kind === 'close'
      ? 'Explain briefly why this case is being closed. This is the final state — it cannot be reopened later.'
      : 'Explain briefly what more needs to be done. The case returns to In progress for further work.';
  const placeholder =
    kind === 'close'
      ? 'Resolution confirmed. Complainant notified…'
      : 'More investigation needed because…';
  const confirmLabel = kind === 'close' ? 'Close case' : 'Send back';
  const charsShort = Math.max(0, CLOSURE_MIN_CHARS - comment.trim().length);
  const canConfirm = comment.trim().length >= CLOSURE_MIN_CHARS && !pending;

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onCancel}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8">
          <Text className="text-navy font-bold text-lg">{title}</Text>
          <Text className="text-muted text-sm mt-1">{body}</Text>

          <TextInput
            value={comment}
            onChangeText={onChangeComment}
            placeholder={placeholder}
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
              className={`flex-1 rounded-xl py-3 items-center ${
                kind === 'close' ? 'bg-state-closed' : 'bg-state-escalated'
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
