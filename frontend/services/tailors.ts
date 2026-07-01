/**
 * Tailors API — list, search, profile (backend GET /api/tailors, /api/search/tailors)
 */

import { apiGet, ApiException } from './api';
import type {
  TailorProfile,
  SearchTailorsParams,
  TailorsResponse
} from '../types/tailor';

function buildTailorsQuery(params: SearchTailorsParams = {}): string {
  const q = new URLSearchParams();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  q.set('page', String(page));
  q.set('limit', String(limit));

  if (params.query?.trim()) q.set('query', params.query.trim());
  if (params.location?.trim()) q.set('location', params.location.trim());
  if (params.minRating != null && params.minRating > 0) {
    q.set('minRating', String(params.minRating));
  }
  if (params.specializations?.length) {
    q.set('specializations', params.specializations.join(','));
  }
  if (params.available === true) {
    q.set('available', 'true');
  }

  const s = q.toString();
  return s ? `?${s}` : '';
}

/**
 * List / search tailors (same backend handler as GET /api/search/tailors)
 */
export async function searchTailors(
  params: SearchTailorsParams = {}
): Promise<TailorsResponse> {
  const { data } = await apiGet<TailorsResponse>(`/tailors${buildTailorsQuery(params)}`);
  return data;
}

/**
 * Full tailor profile for detail screen
 */
export async function getTailorById(id: string): Promise<TailorProfile | null> {
  try {
    const { data } = await apiGet<{ tailor: TailorProfile }>(
      `/tailors/${encodeURIComponent(id)}`
    );
    return data.tailor ?? null;
  } catch (error) {
    if (error instanceof ApiException && error.status === 404) {
    return null;
  }
    throw error;
  }
}
