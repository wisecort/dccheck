import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import * as authService from '../services/authService';
import type { UserRole } from '../types';

// ─── useAuth hook ─────────────────────────────────────────────────────────────

export interface UseAuthReturn {
  /** Whether the user is logged in */
  isAuthenticated: boolean;
  /** The authenticated user, or null */
  user: import('../types').User | null;
  /** The user's role, or null if not authenticated */
  role: UserRole | null;
  /** Log in with username + password; throws on failure */
  login: (username: string, password: string) => Promise<void>;
  /** Log out and redirect to /login */
  logout: () => Promise<void>;
  /** Returns true if the current user's role is in the provided list */
  hasRole: (roles: UserRole[]) => boolean;
  /** True if the user is an admin */
  isAdmin: boolean;
  /** True if the user is a gestor or admin */
  isGestor: boolean;
  /** True if the user is a tecnico */
  isTecnico: boolean;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const { isAuthenticated, user, setAuth, clearAuth } = useAuthStore();

  const role = user?.role ?? null;

  // ─── login ─────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (username: string, password: string): Promise<void> => {
      const { tokens, user: loggedUser } = await authService.login(username, password);
      setAuth(loggedUser, tokens.access_token, tokens.refresh_token);
    },
    [setAuth],
  );

  // ─── logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
    clearAuth();
    navigate('/login', { replace: true });
  }, [clearAuth, navigate]);

  // ─── hasRole ───────────────────────────────────────────────────────────────

  const hasRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  return {
    isAuthenticated,
    user: user as UseAuthReturn['user'],
    role,
    login,
    logout,
    hasRole,
    isAdmin: role === 'admin',
    isGestor: role === 'gestor' || role === 'admin',
    isTecnico: role === 'tecnico',
  };
}
