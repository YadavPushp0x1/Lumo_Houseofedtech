import { create } from 'zustand';

import {
  freeapiLogin,
  freeapiMe,
  freeapiRefresh,
  freeapiRegister,
  type FreeApiUser,
  type LoginPayload,
  type RegisterPayload,
} from '@/lib/api/freeapi';
import { STORAGE_KEYS } from '@/lib/config';
import { asyncStore } from '@/lib/storage/async-store';
import { secureStore } from '@/lib/storage/secure-store';

type AuthStatus = 'booting' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  user: FreeApiUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;

  bootstrap: () => Promise<void>;
  revalidate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (uri: string) => Promise<void>;
};

async function persistTokens(accessToken: string, refreshToken?: string) {
  await secureStore.setItem(STORAGE_KEYS.authToken, accessToken);
  if (refreshToken) {
    await secureStore.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  }
}

async function persistUser(user: FreeApiUser) {
  await asyncStore.setJson(STORAGE_KEYS.user, user);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'booting',
  user: null,
  accessToken: null,
  refreshToken: null,
  error: null,

  bootstrap: async () => {
    set({ status: 'booting', error: null });

    const [accessToken, refreshToken, cachedUser] = await Promise.all([
      secureStore.getItem(STORAGE_KEYS.authToken),
      secureStore.getItem(STORAGE_KEYS.refreshToken),
      asyncStore.getJson<FreeApiUser>(STORAGE_KEYS.user),
    ]);

    if (!accessToken) {
      if (refreshToken) {
        try {
          const tokens = await freeapiRefresh(refreshToken);
          await persistTokens(tokens.accessToken, tokens.refreshToken ?? refreshToken);
          const user = await freeapiMe(tokens.accessToken);
          await persistUser(user);
          set({
            status: 'signedIn',
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken ?? refreshToken,
            error: null,
          });
          return;
        } catch {
          // ignore and sign out
        }
      }

      set({ status: 'signedOut', user: cachedUser, accessToken: null, refreshToken: refreshToken ?? null });
      return;
    }

    try {
      const user = await freeapiMe(accessToken);
      await persistUser(user);
      set({ status: 'signedIn', user, accessToken, refreshToken: refreshToken ?? null });
    } catch {
      if (refreshToken) {
        try {
          const tokens = await freeapiRefresh(refreshToken);
          await persistTokens(tokens.accessToken, tokens.refreshToken ?? refreshToken);
          const user = await freeapiMe(tokens.accessToken);
          await persistUser(user);
          set({
            status: 'signedIn',
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken ?? refreshToken,
            error: null,
          });
          return;
        } catch {
          // ignore and sign out
        }
      }

      await get().logout();
    }
  },

  revalidate: async () => {
    const { status, accessToken, refreshToken } = get();
    if (status !== 'signedIn') return;
    if (!accessToken) {
      await get().logout();
      return;
    }

    try {
      const user = await freeapiMe(accessToken);
      await persistUser(user);
      set({ user, error: null });
      return;
    } catch {
      // fallthrough
    }

    if (!refreshToken) {
      await get().logout();
      return;
    }

    try {
      const tokens = await freeapiRefresh(refreshToken);
      await persistTokens(tokens.accessToken, tokens.refreshToken ?? refreshToken);
      const user = await freeapiMe(tokens.accessToken);
      await persistUser(user);
      set({
        status: 'signedIn',
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? refreshToken,
        error: null,
      });
    } catch {
      await get().logout();
    }
  },

  login: async (payload) => {
    set({ error: null });
    const { user, tokens } = await freeapiLogin(payload);
    await persistTokens(tokens.accessToken, tokens.refreshToken);
    await persistUser(user);
    set({
      status: 'signedIn',
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? null,
    });
  },

  register: async (payload) => {
    try {
      set({ error: null });
  
      const res = await freeapiRegister(payload);
  
      if (!res.user) {
        throw new Error('Invalid register response');
      }
  
      // 🔥 reuse your already correct login function
      const loginRes = await freeapiLogin({
        usernameOrEmail: payload.email || payload.username,
        password: payload.password,
      });
  
      await persistTokens(
        loginRes.tokens.accessToken,
        loginRes.tokens.refreshToken
      );
  
      await persistUser(loginRes.user);
  
      set({
        status: 'signedIn',
        user: loginRes.user,
        accessToken: loginRes.tokens.accessToken,
        refreshToken: loginRes.tokens.refreshToken ?? null,
      });
    } catch (err: any) {
      set({ error: err.message || 'Register failed' });
    }
  },

  logout: async () => {
    await Promise.all([
      secureStore.deleteItem(STORAGE_KEYS.authToken),
      secureStore.deleteItem(STORAGE_KEYS.refreshToken),
    ]);
    set({ status: 'signedOut', user: null, accessToken: null, refreshToken: null, error: null });
  },

  updateAvatar: async (uri) => {
    const user = get().user;
    if (!user) return;
    const next = { ...user, avatar: uri };
    await asyncStore.setJson(STORAGE_KEYS.user, next);
    set({ user: next });
  },
}));
