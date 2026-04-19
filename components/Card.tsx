import { View, type ViewProps } from 'react-native';

export function Card({ className = '', ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={`bg-white rounded-2xl p-4 border border-border ${className}`}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
      {...rest}
    />
  );
}
