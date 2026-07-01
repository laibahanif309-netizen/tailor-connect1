/**
 * Authentication Service
 * 
 * This module provides authentication-related API functions.
 * Structured for easy backend integration.
 */

import { apiGet, apiPatch, apiPost, ApiException, getErrorMessage } from './api';
import * as SecureStore from 'expo-secure-store';
import { useNotificationBadgeStore } from '../store/notificationBadge';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: 'customer' | 'tailor';
}

export type CustomerProfileStored = {
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  notes: string | null;
};

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'tailor' | 'admin';
    phone?: string;
    username?: string | null;
    fullName?: string | null;
    profileImageUrl?: string | null;
    customerProfile?: CustomerProfileStored | null;
  };
}

export interface AuthError {
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface ForgotPasswordResult {
  resetToken?: string;
  expiresAt?: string;
}

// Token storage keys
const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

type BackendAuthPayload = {
  token: string;
  user: {
    id: string;
    username?: string | null;
    fullName?: string | null;
    email: string;
    role: 'customer' | 'tailor' | 'admin';
    phone?: string | null;
    profileImageUrl?: string | null;
  };
};

export type MeApiUser = {
  id: string;
  username: string | null;
  email: string;
  role: string;
  fullName: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  customerProfile: CustomerProfileStored | null;
};

export function mapMeApiUserToStored(me: MeApiUser): AuthResponse['user'] {
  return {
    id: me.id,
    name: me.fullName || me.username || me.email.split('@')[0],
    email: me.email,
    role: me.role as AuthResponse['user']['role'],
    phone: me.phone ?? undefined,
    username: me.username ?? undefined,
    fullName: me.fullName ?? undefined,
    profileImageUrl: me.profileImageUrl ?? undefined,
    customerProfile: me.customerProfile ?? undefined,
  };
}

const normalizeAuthPayload = (payload: BackendAuthPayload): AuthResponse => ({
  token: payload.token,
  user: {
    id: payload.user.id,
    name: payload.user.fullName || payload.user.username || payload.user.email.split('@')[0],
    email: payload.user.email,
    role: payload.user.role,
    phone: payload.user.phone ?? undefined,
    username: payload.user.username ?? undefined,
    fullName: payload.user.fullName ?? undefined,
    profileImageUrl: payload.user.profileImageUrl ?? undefined,
  },
});

/**
 * Store authentication token
 */
export async function storeAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing auth token:', error);
    throw new Error('Failed to store authentication token');
  }
}

/**
 * Get stored authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
}

/**
 * Store user data
 */
export async function storeUserData(user: AuthResponse['user']): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
}

/**
 * Get stored user data
 */
export async function getUserData(): Promise<AuthResponse['user'] | null> {
  try {
    const userData = await SecureStore.getItemAsync(USER_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
}

/**
 * Clear authentication data
 */
export async function clearAuthData(): Promise<void> {
  useNotificationBadgeStore.getState().setNotificationUnreadCount(0);
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

/**
 * Login user
 * 
 * @param credentials - Login credentials
 * @returns Auth response with token and user data
 * @throws AuthError if login fails
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await apiPost<BackendAuthPayload>('/auth/login', credentials);
    const normalized = normalizeAuthPayload(response.data);
    await storeAuthToken(normalized.token);
    await storeUserData(normalized.user);
    return normalized;
  } catch (error) {
    const message = getErrorMessage(error);
    const fieldErrors = error instanceof ApiException && error.errors
      ? Object.fromEntries(
          Object.entries(error.errors).map(([key, values]) => [
            key,
            values[0] || message,
          ])
        )
      : undefined;

    throw {
      message,
      fieldErrors,
    } as AuthError;
  }
}

/**
 * Register new user
 *
 * @param data - Registration data
 * @returns Auth response with token and user data
 * @throws AuthError if registration fails
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  try {
    const response = await apiPost<BackendAuthPayload>('/auth/register', data);
    const normalized = normalizeAuthPayload(response.data);
    await storeAuthToken(normalized.token);
    await storeUserData(normalized.user);
    return normalized;
  } catch (error) {
    const message = getErrorMessage(error);
    const fieldErrors =
      error instanceof ApiException && error.errors
        ? Object.fromEntries(
            Object.entries(error.errors).map(([key, values]) => [key, values[0] || message])
          )
        : undefined;

    throw {
      message,
      fieldErrors,
    } as AuthError;
  }
}

/**
 * Request password reset email (backend may return resetToken in non-production for app flow without SMTP).
 */
export async function requestPasswordReset(email: string): Promise<ForgotPasswordResult> {
  try {
    const response = await apiPost<{
      requested: boolean;
      resetToken?: string;
      expiresAt?: string;
    }>('/auth/forgot-password', { email });
    const d = response.data;
    return {
      resetToken: d.resetToken,
      expiresAt: d.expiresAt,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    const fieldErrors =
      error instanceof ApiException && error.errors
        ? Object.fromEntries(
            Object.entries(error.errors).map(([key, values]) => [key, values[0] || message])
          )
        : undefined;
    throw { message, fieldErrors } as AuthError;
  }
}

/**
 * Complete password reset with token from email (or dev API response).
 */
export async function resetPasswordWithToken(token: string, password: string): Promise<void> {
  try {
    await apiPost('/auth/reset-password', { token, password });
  } catch (error) {
    const message = getErrorMessage(error);
    const fieldErrors =
      error instanceof ApiException && error.errors
        ? Object.fromEntries(
            Object.entries(error.errors).map(([key, values]) => [key, values[0] || message])
          )
        : undefined;
    throw { message, fieldErrors } as AuthError;
  }
}

/**
 * While signed in: set a new password after confirming the current one (no reset link).
 */
export async function changePasswordWithCurrent(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    await apiPost<{ ok?: boolean }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    const fieldErrors =
      error instanceof ApiException && error.errors
        ? Object.fromEntries(
            Object.entries(error.errors).map(([key, values]) => [key, values[0] || message])
          )
        : undefined;
    throw { message, fieldErrors } as AuthError;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    // TODO: Call logout API endpoint when backend is ready
    // await apiPost('/auth/logout');
    await clearAuthData();
  } catch (error) {
    console.error('Error during logout:', error);
    // Clear local data even if API call fails
    await clearAuthData();
  }
}

/**
 * Load the signed-in user from the API and refresh SecureStore (full profile + customer fields).
 */
export async function fetchMeFromApi(): Promise<AuthResponse['user']> {
  const { data } = await apiGet<{ user: MeApiUser }>('/auth/me');
  const user = mapMeApiUserToStored(data.user);
  await storeUserData(user);
  return user;
}

/**
 * PATCH /api/auth/me — updates User (+ CustomerProfile for customers). Refreshes local user cache.
 */
export async function patchMyAccount(payload: {
  fullName?: string;
  username?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  notes?: string;
}): Promise<AuthResponse['user']> {
  const { data } = await apiPatch<{ user: MeApiUser }>('/auth/me', payload);
  const user = mapMeApiUserToStored(data.user);
  await storeUserData(user);
  return user;
}

/**
 * Get current user — prefers live API when a token exists, falls back to cached SecureStore.
 */
export async function getCurrentUser(): Promise<AuthResponse['user'] | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return await getUserData();
    }
    try {
      return await fetchMeFromApi();
    } catch {
      return await getUserData();
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

