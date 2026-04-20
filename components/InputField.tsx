import { Text, TextInput, type TextInputProps, View } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export function InputField({ label, error, hint, multiline, ...rest }: Props) {
  return (
    <View>
      <View className={`bg-white/10 rounded-xl border px-4 py-3 ${error ? 'border-red-400' : 'border-white/20'}`}>
        <Text className="text-white/60 text-xs uppercase tracking-wider">{label}</Text>
        <TextInput
          placeholderTextColor="#94a3b8"
          {...rest}
          multiline={multiline}
          className="text-white text-base py-1"
          style={multiline ? { minHeight: 80, textAlignVertical: 'top' } : undefined}
        />
      </View>
      {error ? <Text className="text-red-300 text-xs mt-1 ml-1">{error}</Text> : null}
      {hint && !error ? <Text className="text-white/40 text-xs mt-1 ml-1">{hint}</Text> : null}
    </View>
  );
}
