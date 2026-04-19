import { Text, View } from 'react-native';
import { STATE_LABELS, stateColor } from '@/constants/states';

export function StateBadge({ state, size = 'sm' }: { state: string; size?: 'sm' | 'md' }) {
  const color = stateColor(state);
  const label = STATE_LABELS[state] ?? state;
  const padding = size === 'md' ? 'px-3 py-1.5' : 'px-2 py-1';
  const font = size === 'md' ? 'text-xs' : 'text-[10px]';

  return (
    <View className={`rounded-full ${padding}`} style={{ backgroundColor: color + '22' }}>
      <Text className={`${font} font-bold uppercase tracking-wider`} style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
