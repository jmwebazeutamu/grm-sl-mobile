import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { ACTION_TYPES, type ActionTypeValue } from '@/constants/actions';
import { usePostAction } from '@/hooks/useGrievanceMutations';

interface Props {
  grievanceId: number;
  /** null while unknown; "investigate" if parent wants a default. */
  defaultType?: ActionTypeValue;
}

export function ActionComposer({ grievanceId, defaultType = 'update' }: Props) {
  const [type, setType] = useState<ActionTypeValue>(defaultType);
  const [body, setBody] = useState('');
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const post = usePostAction(grievanceId);

  const selected = ACTION_TYPES.find((a) => a.value === type)!;

  async function submit() {
    if (!body.trim()) return;

    const confirm = (type === 'resolve' || type === 'escalate')
      ? await new Promise<boolean>((resolve) =>
          Alert.alert(
            type === 'resolve' ? 'Mark as resolved?' : 'Escalate this case?',
            type === 'resolve'
              ? 'This will move the case to Resolved and invite feedback from the complainant.'
              : 'This will escalate the case for further action.',
            [
              { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Confirm', onPress: () => resolve(true) },
            ],
          ),
        )
      : true;

    if (!confirm) return;

    post.mutate(
      { type, body: body.trim() },
      {
        onSuccess: () => {
          setBody('');
          setType('update');
        },
        onError: (err: any) => {
          Alert.alert('Could not post action', err?.response?.data?.message ?? 'Please try again.');
        },
      },
    );
  }

  return (
    <View className="bg-white border-t border-border px-4 py-3">
      {/* Type picker */}
      <Pressable
        onPress={() => setTypeMenuOpen((v) => !v)}
        className="flex-row items-center justify-between py-2"
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name={selected.icon as any} size={18} color="#0f2044" />
          <Text className="text-navy font-semibold text-sm">{selected.label}</Text>
        </View>
        <Ionicons name={typeMenuOpen ? 'chevron-down' : 'chevron-up'} size={16} color="#94a3b8" />
      </Pressable>

      {typeMenuOpen ? (
        <View className="mb-2 border border-border rounded-xl overflow-hidden bg-surface">
          {ACTION_TYPES.map((a) => (
            <Pressable
              key={a.value}
              onPress={() => {
                setType(a.value);
                setTypeMenuOpen(false);
              }}
              className={`px-3 py-2.5 flex-row items-center gap-2 border-b border-border ${
                a.value === type ? 'bg-gold-light/40' : ''
              }`}
            >
              <Ionicons name={a.icon as any} size={18} color="#0f2044" />
              <View className="flex-1">
                <Text className="text-navy font-semibold text-sm">{a.label}</Text>
                <Text className="text-muted text-xs">{a.hint}</Text>
              </View>
              {a.value === type ? <Ionicons name="checkmark" size={16} color="#22c55e" /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Body */}
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder={
          type === 'resolve'
            ? 'Summarise the resolution…'
            : type === 'escalate'
            ? 'Why are you escalating this?'
            : 'Add a note…'
        }
        placeholderTextColor="#94a3b8"
        multiline
        maxLength={10000}
        className="bg-surface rounded-xl px-3 py-2.5 text-navy min-h-[60px]"
        style={{ textAlignVertical: 'top' }}
      />

      {/* Submit */}
      <Pressable
        onPress={submit}
        disabled={post.isPending || !body.trim()}
        className={`mt-3 rounded-xl py-3 items-center flex-row justify-center gap-2 ${
          type === 'resolve'
            ? 'bg-state-resolved'
            : type === 'escalate'
            ? 'bg-state-escalated'
            : 'bg-navy'
        } ${post.isPending || !body.trim() ? 'opacity-50' : ''}`}
      >
        {post.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name={selected.icon as any} size={16} color="#fff" />
        )}
        <Text className="text-white font-bold text-sm">
          {post.isPending ? 'Posting…' : `Post ${selected.label.toLowerCase()}`}
        </Text>
      </Pressable>
    </View>
  );
}
