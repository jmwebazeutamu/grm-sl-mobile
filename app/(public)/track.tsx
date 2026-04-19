import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Track() {
  const [ref, setRef] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-1 px-6 py-6">
          <Link href="/" asChild>
            <Pressable className="flex-row items-center gap-2 mb-6">
              <Ionicons name="chevron-back" size={20} color="#0f2044" />
              <Text className="text-navy text-sm font-medium">Back</Text>
            </Pressable>
          </Link>

          <View className="flex-1 justify-center">
            <Text className="text-navy text-3xl font-bold">Track your grievance</Text>
            <Text className="text-muted mt-2 text-base">
              Enter the reference number you received when you submitted.
            </Text>

            <View className="mt-8 bg-white rounded-2xl border border-border px-4 py-3">
              <Text className="text-muted text-xs uppercase tracking-wider">Reference number</Text>
              <TextInput
                value={ref}
                onChangeText={setRef}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="e.g. 2026/8904"
                placeholderTextColor="#94a3b8"
                className="text-navy text-lg py-1 font-mono"
              />
            </View>

            <Pressable
              disabled={!ref.trim()}
              onPress={() => router.push({ pathname: '/(public)/status/[ref]', params: { ref: ref.trim() } })}
              className="mt-6 bg-navy rounded-xl py-4 items-center disabled:opacity-50"
            >
              <Text className="text-white font-bold text-base">Check status</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
