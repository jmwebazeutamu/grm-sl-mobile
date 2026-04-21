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
  /** Last Expo push token we sent to the server. Cached so we skip a
   *  redundant /push/register on every launch. Cleared on logout. */
  pushToken: string | null;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  clearSession: () => Promise<void>;
  setPushToken: (token: string | null) => void;
  bootstrapped: boolean;
  setBootstrapped: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      pushToken: null,
      bootstrapped: false,
      setSession: async (token, user) => {
        await SecureStore.setItemAsync('auth_token', token);
        set({ user });
      },
      clearSession: async () => {
        await SecureStore.deleteItemAsync('auth_token');
        set({ user: null, pushToken: null });
      },
      setPushToken: (token) => set({ pushToken: token }),
      setBootstrapped: () => set({ bootstrapped: true }),
    }),
    {
      name: 'grm-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user, pushToken: s.pushToken }),
      onRehydrateStorage: () => (state) => {
        state?.setBootstrapped();
      },
    },
  ),
);
