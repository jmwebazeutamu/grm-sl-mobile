import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  position: string | null;
  organization: { id: number; name: string; acronym: string | null } | null;
  roles: string[];
  is_active: boolean;
}

interface AuthState {
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  clearSession: () => Promise<void>;
  bootstrapped: boolean;
  setBootstrapped: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      bootstrapped: false,
      setSession: async (token, user) => {
        await SecureStore.setItemAsync('auth_token', token);
        set({ user });
      },
      clearSession: async () => {
        await SecureStore.deleteItemAsync('auth_token');
        set({ user: null });
      },
      setBootstrapped: () => set({ bootstrapped: true }),
    }),
    {
      name: 'grm-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.setBootstrapped();
      },
    },
  ),
);
