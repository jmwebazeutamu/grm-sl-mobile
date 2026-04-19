import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props extends Omit<PressableProps, 'children'> {
  label: string;
  loading?: boolean;
  variant?: Variant;
  icon?: React.ReactNode;
}

export function Button({ label, loading, variant = 'primary', icon, disabled, ...rest }: Props) {
  const base = 'flex-row items-center justify-center gap-2 rounded-xl px-5 py-4';
  const style =
    variant === 'primary'
      ? 'bg-navy active:bg-navy-light'
      : variant === 'secondary'
      ? 'bg-white border border-border active:bg-surface'
      : 'bg-transparent';
  const text =
    variant === 'primary' ? 'text-white' : variant === 'secondary' ? 'text-navy' : 'text-navy';

  return (
    <Pressable
      disabled={disabled || loading}
      className={`${base} ${style} ${disabled || loading ? 'opacity-60' : ''}`}
      {...rest}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#fff' : '#0f2044'} /> : icon}
      <Text className={`text-base font-semibold ${text}`}>{label}</Text>
    </Pressable>
  );
}
