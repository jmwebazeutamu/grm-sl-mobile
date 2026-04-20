import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubmitSuccess() {
  const { ref } = useLocalSearchParams<{ ref: string }>();

  function copy() {
    // expo-clipboard is an optional install; falling back to an Alert that
    // shows the number for manual copy keeps this screen zero-dep.
    Alert.alert(
      'Your reference number',
      ref ?? '—',
      [{ text: 'OK' }],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-navy">
      <View className="flex-1 px-6 py-10 justify-between">
        <View className="items-center mt-12">
          <View className="w-24 h-24 rounded-full bg-state-resolved/20 items-center justify-center mb-6">
            <Ionicons name="checkmark-circle" size={72} color="#22c55e" />
          </View>
          <Text className="text-white text-2xl font-bold text-center">Grievance received</Text>
          <Text className="text-gold-light text-base mt-2 text-center">
            Thank you. The review team has been notified.
          </Text>

          <Text className="text-white/60 text-xs uppercase tracking-wider mt-10 mb-2">Reference number</Text>
          <View className="bg-white/10 border border-gold rounded-2xl px-6 py-4">
            <Text className="text-gold text-3xl font-bold font-mono">{ref}</Text>
          </View>
          <Text className="text-white/60 text-xs text-center mt-3 px-4">
            Write this number down. You'll need it to check status.
          </Text>
        </View>

        <View className="gap-3">
          <Pressable onPress={copy} className="bg-white/10 border border-white/20 rounded-xl py-3 flex-row items-center justify-center gap-2">
            <Ionicons name="copy" size={18} color="#c9a84c" />
            <Text className="text-gold-light font-semibold text-sm">Show reference number</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace({ pathname: '/(public)/status/[ref]', params: { ref: ref! } })}
            className="bg-gold rounded-xl py-4 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="search" size={18} color="#0f2044" />
            <Text className="text-navy font-bold text-sm">Check status now</Text>
          </Pressable>

          <Pressable onPress={() => router.replace('/')} className="py-3 items-center">
            <Text className="text-white/60 text-sm">Back to home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
