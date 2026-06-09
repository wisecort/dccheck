import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';

// ─── State shape ─────────────────────────────────────────────────────────────

interface AuthStoreState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

// ─── Actions shape ────────────────────────────────────────────────────────────

interface AuthStoreActions {
  /** Set all auth data after a successful login */
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  /** Clear all auth data (logout) */
  clearAuth: () => void;
  /** Replace only the access token (used after token refresh) */
  updateAccessToken: (accessToken: string) => void;
  /** Update user profile in store */
  updateUser: (user: User) => void;
}

type AuthStore = AuthStoreState & AuthStoreActions;

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: AuthStoreState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          ...initialState,
        }),

      updateAccessToken: (accessToken) =>
        set({ accessToken }),

      updateUser: (user) =>
        set({ user }),
    }),
    {
      name: 'dccheck-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist the token/user data, not transient state
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// ─── Selectors (for convenience) ─────────────────────────────────────────────

export const selectUser = (state: AuthStore) => state.user;
export const selectAccessToken = (state: AuthStore) => state.accessToken;
export const selectRefreshToken = (state: AuthStore) => state.refreshToken;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectUserRole = (state: AuthStore) => state.user?.role ?? null;
