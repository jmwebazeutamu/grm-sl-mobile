import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';
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

/**
 * Above-the-composer button row. Surfaces the specific decisions that are
 * valid in the current state/role, so the officer doesn't have to guess.
 */
export function DecisionBar({ grievanceId, state, capabilities }: Props) {
  const review = useReview(grievanceId);
  const begin = useBeginClosure(grievanceId);
  const close = useCloseGrievance(grievanceId);
  const escalate = useEscalateGrievance(grievanceId);

  const showReview =
    capabilities.can_review && (state === 'submitted' || state === 'under_review');
  const showBeginClosure =
    capabilities.can_closure_action && state === 'resolved';
  const showCloseOrEscalate =
    capabilities.can_closure_action && state === 'under_admin_review';

  if (!showReview && !showBeginClosure && !showCloseOrEscalate) return null;

  function onReview(decision: 'accept' | 'reject') {
    Alert.prompt?.(
      decision === 'accept' ? 'Accept grievance' : 'Reject grievance',
      decision === 'reject'
        ? 'Reason (optional, visible to the complainant)'
        : 'Comment (optional)',
      (comment?: string) => {
        review.mutate(
          { decision, comment: comment ?? undefined },
          {
            onError: (err: any) =>
              Alert.alert('Error', err?.response?.data?.message ?? 'Please try again.'),
          },
        );
      },
    ) ?? review.mutate({ decision });
  }

  function onBegin() {
    Alert.alert(
      'Begin closure review',
      'Move this case into admin review before closing?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Begin review', onPress: () => begin.mutate() },
      ],
    );
  }

  function onClose() {
    Alert.alert('Close this case?', 'This is a final state.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', onPress: () => close.mutate(undefined) },
    ]);
  }

  function onEscalate() {
    Alert.alert(
      'Escalate and reopen?',
      'The case goes back to In progress for further work.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Escalate', onPress: () => escalate.mutate(undefined) },
      ],
    );
  }

  return (
    <View className="bg-white border-t border-border px-4 py-3">
      <Text className="text-muted text-xs uppercase tracking-wider mb-2">
        Decisions
      </Text>

      {showReview ? (
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => onReview('accept')}
            disabled={review.isPending}
            className="flex-1 bg-state-resolved rounded-xl py-3 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text className="text-white font-bold text-sm">Accept</Text>
          </Pressable>
          <Pressable
            onPress={() => onReview('reject')}
            disabled={review.isPending}
            className="flex-1 bg-state-rejected rounded-xl py-3 flex-row items-center justify-center gap-2"
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
          <Text className="text-white font-bold text-sm">Begin closure review</Text>
        </Pressable>
      ) : null}

      {showCloseOrEscalate ? (
        <View className="flex-row gap-2">
          <Pressable
            onPress={onClose}
            disabled={close.isPending}
            className="flex-1 bg-state-closed rounded-xl py-3 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="archive" size={18} color="#fff" />
            <Text className="text-white font-bold text-sm">Close</Text>
          </Pressable>
          <Pressable
            onPress={onEscalate}
            disabled={escalate.isPending}
            className="flex-1 bg-state-escalated rounded-xl py-3 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="arrow-up-circle" size={18} color="#fff" />
            <Text className="text-white font-bold text-sm">Escalate</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
