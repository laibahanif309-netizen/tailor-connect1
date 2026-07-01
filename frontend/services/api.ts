/**
 * Base API Client
 *
 * Backend base URL must include `/api`.
 *
 * - Physical device: `localhost` is the phone itself — set `EXPO_PUBLIC_API_URL` to your
 *   computer's LAN IP, e.g. `http://192.168.1.10:3001/api` (same Wi‑Fi as the phone).
 * - Android emulator: defaults to `http://10.0.2.2:3001/api` (host loopback).
 * - Expo Go: we try to infer the Metro host from `expo-constants` so API hits the same machine.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'authToken';

const BACKEND_PORT = process.env.EXPO_PUBLIC_API_PORT || '3001';

function getHostnameFromExpoConstants(): string | null {
  try {
    // Bundled with Expo; optional require avoids hard dependency at type level
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants') as {
      default?: {
        expoGoConfig?: { debuggerHost?: string };
        expoConfig?: { hostUri?: string };
        manifest?: { debuggerHost?: string };
      };
    };
    const c = Constants.default;
    if (!c) return null;

    const debuggerHost =
      c.expoGoConfig?.debuggerHost ??
      (c.manifest && typeof c.manifest === 'object' && 'debuggerHost' in c.manifest
        ? (c.manifest as { debuggerHost?: string }).debuggerHost
        : undefined);

    if (debuggerHost && typeof debuggerHost === 'string') {
      const host = debuggerHost.split(':')[0];
      return host && host.length > 0 ? host : null;
    }

    const hostUri = c.expoConfig?.hostUri;
    if (hostUri && typeof hostUri === 'string') {
      const host = hostUri.split(':')[0];
      return host && host.length > 0 ? host : null;
    }
  } catch {
    /* expo-constants unavailable */
  }
  return null;
}

/**
 * Resolved API origin (for debugging and error messages).
 */
export function getApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicit) return explicit;

  const expoHost = getHostnameFromExpoConstants();
  if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
    return `http://${expoHost}:${BACKEND_PORT}/api`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${BACKEND_PORT}/api`;
  }

  return `http://localhost:${BACKEND_PORT}/api`;
}

/** Origin for Socket.io (no `/api` suffix). */
export function getSocketBaseUrl(): string {
  let base = getApiBaseUrl().replace(/\/+$/, '');
  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }
  return base;
}

/** Absolute URL for `/uploads/...` paths returned by the API. */
export function resolveMediaUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const base = getSocketBaseUrl().replace(/\/+$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Custom error class for API errors
 */
export class ApiException extends Error {
  status?: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.errors = errors;
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const extra = options.headers;
  if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
    if (extra instanceof Headers) {
      extra.forEach((value, key) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, extra as Record<string, string>);
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const text = await response.text();
    let body: unknown = {};
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        throw new ApiException(
          `Invalid response from server (${response.status}). Is the API URL correct?`,
          response.status
        );
      }
    }

    if (!response.ok) {
      const b = body as { message?: string; error?: string; errors?: Record<string, string[]> };
      const errorMessage = b.message || b.error || 'An error occurred';
      const errors = b.errors || undefined;
      throw new ApiException(errorMessage, response.status, errors);
    }

    if (body && typeof body === 'object' && 'success' in body && body.success === true && 'data' in body) {
      const b = body as { data: T; message?: string };
      return {
        data: b.data,
        message: typeof b.message === 'string' ? b.message : undefined,
      };
    }

    return body as ApiResponse<T>;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    // Network or other errors
    if (error instanceof TypeError && error.message === 'Network request failed') {
      const hint =
        Platform.OS !== 'web'
          ? ` Cannot reach ${getApiBaseUrl()}. On a real device use your computer's LAN IP: set EXPO_PUBLIC_API_URL=http://<YOUR_IP>:${BACKEND_PORT}/api in frontend/.env`
          : '';
      throw new ApiException(
        `Network error. Check that the backend is running on port ${BACKEND_PORT} and the app can reach it.${hint}`,
        0
      );
    }

    throw new ApiException(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'GET',
  });
}

/**
 * POST request
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
  });
}

/**
 * Helper to extract error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiException) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Helper to extract field-specific errors from API error
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiException && error.errors) {
    const fieldErrors: Record<string, string> = {};
    Object.keys(error.errors).forEach((key) => {
      const messages = error.errors![key];
      if (messages && messages.length > 0) {
        fieldErrors[key] = messages[0]; // Take first error message
      }
    });
    return fieldErrors;
  }
  return {};
}

