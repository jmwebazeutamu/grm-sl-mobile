import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubmitSuccess() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (!ref) return;
    await Clipboard.setStringAsync(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function onShare() {
    if (!ref) return;
    try {
      await Share.share({
        message: `My GRM Sierra Leone grievance reference: ${ref}\n\nI can use this to check status in the app.`,
      });
    } catch (e) {
      Alert.alert('Could not open share', 'Try the Copy button instead.');
    }
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

          <Text className="text-white/60 text-xs uppercase tracking-wider mt-10 mb-2">
            Reference number
          </Text>
          <View className="bg-white/10 border border-gold rounded-2xl px-6 py-4">
            <Text className="text-gold text-3xl font-bold font-mono">{ref}</Text>
          </View>
          <Text className="text-red-300 text-sm text-center mt-4 px-4 font-semibold">
            Save this number now — we cannot recover it later.
          </Text>
          <Text className="text-white/60 text-xs text-center mt-2 px-4">
            You'll need it to check the status of your case.
          </Text>
        </View>

        <View className="gap-3">
          <View className="flex-row gap-3">
            <Pressable
              onPress={onCopy}
              accessibilityLabel="Copy reference number to clipboard"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={18}
                color={copied ? '#22c55e' : '#c9a84c'}
              />
              <Text className="text-gold-light font-semibold text-sm">
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>

            <Pressable
              onPress={onShare}
              accessibilityLabel="Share reference number with a contact"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="share-social-outline" size={18} color="#c9a84c" />
              <Text className="text-gold-light font-semibold text-sm">Share</Text>
            </Pressable>
          </View>

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
