import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/stores/authStore';

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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 py-8 justify-between">
          <Link href="/" asChild>
            <Pressable className="flex-row items-center gap-2">
              <Ionicons name="chevron-back" size={20} color="#e8c97a" />
              <Text className="text-gold-light text-sm">Back</Text>
            </Pressable>
          </Link>

          <View>
            <Text className="text-white text-3xl font-bold">Staff sign in</Text>
            <Text className="text-gold-light mt-1">Use your GRM account credentials.</Text>

            {error ? (
              <View className="mt-5 rounded-xl bg-red-500/20 border border-red-400 p-3">
                <Text className="text-red-100 text-sm">{error}</Text>
              </View>
            ) : null}

            <View className="mt-6 gap-3">
              <View className="bg-white/10 rounded-xl border border-white/20 px-4 py-3">
                <Text className="text-white/60 text-xs uppercase tracking-wider">Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  placeholder="e.g. mlebbie"
                  placeholderTextColor="#94a3b8"
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

          <Text className="text-white/40 text-xs text-center">
            Trouble signing in? Ask your GRM administrator.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
