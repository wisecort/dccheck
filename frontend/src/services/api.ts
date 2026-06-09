import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios';
import { useAuthStore } from '../store/authStore';

// ─── Axios instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
});

// ─── Request interceptor — attach Bearer token ────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Token refresh queue (prevents multiple concurrent refresh calls) ─────────

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshSuccess(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

// ─── Response interceptor — handle 401 / token refresh ───────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Only handle 401 errors that haven't already been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refresh attempt for auth endpoints to avoid infinite loops
    const url = originalRequest.url ?? '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Wait for the ongoing refresh to complete
      return new Promise<AxiosResponse>((resolve, reject) => {
        subscribeTokenRefresh((newToken: string) => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          } else {
            originalRequest.headers = { Authorization: `Bearer ${newToken}` };
          }
          resolve(api(originalRequest));
        });
        // Reject if refresh ultimately fails (handled below)
        setTimeout(() => reject(error), 15_000);
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<{ access_token: string }>(
        '/api/auth/refresh',
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );

      const newAccessToken = response.data.access_token;

      // Update store and notify all queued requests
      useAuthStore.getState().updateAccessToken(newAccessToken);
      onRefreshSuccess(newAccessToken);

      // Retry the original request with the new token
      if (originalRequest.headers) {
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
      } else {
        originalRequest.headers = { Authorization: `Bearer ${newAccessToken}` };
      }

      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed — log out and redirect
      useAuthStore.getState().clearAuth();
      refreshSubscribers = [];
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
