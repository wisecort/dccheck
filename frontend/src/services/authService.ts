import api from './api';
import type {
  User,
  TokenResponse,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types';

// ─── Response types ───────────────────────────────────────────────────────────

export interface LoginResponse {
  tokens: TokenResponse;
  user: User;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

/**
 * Authenticate user with username/password.
 * Returns tokens + user profile.
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const tokenResponse = await api.post<TokenResponse>('/auth/login', {
    username,
    password,
  });

  // Fetch the authenticated user's profile using the new access token
  const userResponse = await api.get<User>('/auth/me', {
    headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
  });

  return {
    tokens: tokenResponse.data,
    user: userResponse.data,
  };
}

/**
 * Logout — invalidate the session on the server side.
 * Fire-and-forget: we clear the store regardless of the response.
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore errors — the client-side store will be cleared either way
  }
}

/**
 * Request a password reset email.
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const payload: ForgotPasswordRequest = { email };
  const response = await api.post<{ message: string }>('/auth/forgot-password', payload);
  return response.data;
}

/**
 * Set a new password using the token from the reset email.
 */
export async function resetPassword(
  token: string,
  new_password: string,
): Promise<{ message: string }> {
  const payload: ResetPasswordRequest = { token, new_password };
  const response = await api.post<{ message: string }>('/auth/reset-password', payload);
  return response.data;
}

/**
 * Get the currently authenticated user's profile.
 */
export async function getMe(): Promise<User> {
  const response = await api.get<User>('/auth/me');
  return response.data;
}

/**
 * Refresh access token using the stored refresh token.
 */
export async function refreshToken(refreshToken: string): Promise<{ access_token: string }> {
  const response = await api.post<{ access_token: string }>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  return response.data;
}
