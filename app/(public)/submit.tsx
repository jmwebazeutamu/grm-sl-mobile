import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder — multi-step submit is Phase 3. For now, this screen informs
// the user and links back.
export default function Submit() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-6 pt-4">
        <Link href="/" asChild>
          <Pressable className="flex-row items-center gap-2">
            <Ionicons name="chevron-back" size={20} color="#0f2044" />
            <Text className="text-navy text-sm font-medium">Back</Text>
          </Pressable>
        </Link>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-16 h-16 rounded-full bg-gold/20 items-center justify-center">
          <Ionicons name="construct" size={28} color="#c9a84c" />
        </View>
        <Text className="text-navy text-xl font-bold text-center mt-4">Coming soon</Text>
        <Text className="text-muted text-sm text-center mt-2">
          The mobile submission flow is under development. For now, please use the web form at
          grm.gov.sl/submit-grievance or visit a GRM office.
        </Text>
      </View>
    </SafeAreaView>
  );
}
