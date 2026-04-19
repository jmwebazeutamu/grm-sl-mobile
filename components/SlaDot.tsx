import { View } from 'react-native';
import { slaColor } from '@/constants/states';

export function SlaDot({ status }: { status: string | null | undefined }) {
  return (
    <View
      className="w-2 h-2 rounded-full"
      style={{ backgroundColor: slaColor(status) }}
    />
  );
}
