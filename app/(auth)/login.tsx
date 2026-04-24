import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiErrorMessage } from '@/lib/api';
import { registerForPush } from '@/lib/push';
import { useAuthStore, type AuthUser } from '@/stores/authStore';

const ACC_LOGO = require('@/assets/images/acc-logo.png');

export default function Login() {
  const setSession = useAuthStore((s) => s.setSession);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
        username: username.trim(),
        password,
      });
      await setSession(data.token, data.user);
      // Fire-and-forget — push registration shouldn't block sign-in.
      registerForPush().catch(() => {});
      router.replace('/(staff)/dashboard');
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-navy">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* ScrollView wraps the form so the keyboard can push content up
            and the user can still reach the Sign-in button when focus
            is on the password field. */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Link href="/" asChild>
            <Pressable className="flex-row items-center gap-2 py-2">
              <Ionicons name="chevron-back" size={20} color="#e8c97a" />
              <Text className="text-gold-light text-sm">Back</Text>
            </Pressable>
          </Link>

          <View className="mt-8">
            <View className="items-center mb-6">
              <Image
                source={ACC_LOGO}
                resizeMode="contain"
                accessibilityLabel="Anti-Corruption Commission Sierra Leone crest"
                style={{ width: 84, height: 70 }}
              />
            </View>
            <Text className="text-white text-3xl font-bold">Staff sign in</Text>
            <Text className="text-gold-light mt-1">Use your GRM account credentials.</Text>

            {error ? (
              <View className="mt-5 rounded-xl bg-red-500/20 border border-red-400 p-3">
                <Text className="text-red-100 text-sm">{error}</Text>
              </View>
            ) : null}

            <View className="mt-6 gap-3">
              <View className="bg-white/10 rounded-xl border border-white/20 px-4 py-3">
                <Text className="text-white/60 text-xs uppercase tracking-wider">Username or email</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  placeholder="e.g. mlebbie or you@example.com"
                  placeholderTextColor="#94a3b8"
                  returnKeyType="next"
                  className="text-white text-base py-1"
                />
              </View>

              <View className="bg-white/10 rounded-xl border border-white/20 px-4 py-3">
                <Text className="text-white/60 text-xs uppercase tracking-wider">Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  returnKeyType="go"
                  onSubmitEditing={() => username && password ? submit() : null}
                  className="text-white text-base py-1"
                />
              </View>
            </View>

            <View className="mt-6">
              <Pressable
                disabled={loading || !username || !password}
                onPress={submit}
                className="bg-gold rounded-xl py-4 items-center disabled:opacity-50"
              >
                <Text className="text-navy font-bold text-base">
                  {loading ? 'Signing in…' : 'Sign in'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          <Text className="text-white/40 text-xs text-center mt-6">
            Trouble signing in? Ask your GRM administrator.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
