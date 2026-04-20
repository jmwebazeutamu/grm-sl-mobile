import { Text, View } from 'react-native';

export function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full flex-1 ${i <= current ? 'bg-gold' : 'bg-white/20'}`}
        />
      ))}
    </View>
  );
}

export function StepHeader({ step, total, title, subtitle }: { step: number; total: number; title: string; subtitle?: string }) {
  return (
    <View className="mb-6">
      <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
        Step {step + 1} of {total}
      </Text>
      <Text className="text-white text-2xl font-bold">{title}</Text>
      {subtitle ? <Text className="text-gold-light text-sm mt-1">{subtitle}</Text> : null}
    </View>
  );
}
