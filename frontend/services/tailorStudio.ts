/**
 * Authenticated tailor studio API — GET/PATCH /api/tailors/me, portfolio, fabrics
 */

import { apiDelete, apiGet, apiPatch, getApiBaseUrl, getAuthToken, ApiException } from './api';
import type { TailorProfile, PortfolioItem, FabricItem } from '../types/tailor';

export async function fetchMyTailorProfile(): Promise<TailorProfile> {
  const { data } = await apiGet<{ tailor: TailorProfile }>('/tailors/me');
  return data.tailor;
}

export type UpdateTailorProfilePayload = {
  businessName?: string;
  location?: string;
  description?: string | null;
  yearsOfExperience?: number;
  specializations?: string[];
  isAvailable?: boolean;
  phone?: string | null;
};

export async function updateMyTailorProfile(
  payload: UpdateTailorProfilePayload
): Promise<TailorProfile> {
  const { data } = await apiPatch<{ tailor: TailorProfile }>('/tailors/me', payload);
  return data.tailor;
}

async function parseSuccessResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: { success?: boolean; message?: string; data?: T } = {};
  if (text) {
    try {
      body = JSON.parse(text) as { success?: boolean; message?: string; data?: T };
    } catch {
      throw new ApiException('Invalid server response', response.status);
    }
  }
  if (!response.ok) {
    throw new ApiException(
      typeof body.message === 'string' ? body.message : 'Request failed',
      response.status
    );
  }
  if (body.success === true && body.data !== undefined) {
    return body.data;
  }
  throw new ApiException('Unexpected response', response.status);
}

export async function uploadMyProfileImage(localUri: string, mimeType = 'image/jpeg'): Promise<string> {
  const token = await getAuthToken();
  if (!token) throw new ApiException('Not signed in', 401);
  const form = new FormData();
  const name = localUri.split('/').pop() || 'profile.jpg';
  form.append('image', { uri: localUri, name, type: mimeType } as unknown as Blob);
  const res = await fetch(`${getApiBaseUrl()}/tailors/me/profile-image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await parseSuccessResponse<{ profileImageUrl: string }>(res);
  return data.profileImageUrl;
}

export async function addPortfolioItem(
  localUri: string,
  options?: { description?: string; mimeType?: string }
): Promise<PortfolioItem> {
  const token = await getAuthToken();
  if (!token) throw new ApiException('Not signed in', 401);
  const form = new FormData();
  const name = localUri.split('/').pop() || 'photo.jpg';
  form.append('image', { uri: localUri, name, type: options?.mimeType ?? 'image/jpeg' } as unknown as Blob);
  if (options?.description?.trim()) {
    form.append('description', options.description.trim());
  }
  const res = await fetch(`${getApiBaseUrl()}/tailors/me/portfolio`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await parseSuccessResponse<{ item: PortfolioItem }>(res);
  return data.item;
}

export async function deletePortfolioItem(itemId: string): Promise<void> {
  await apiDelete<{ id: string }>(`/tailors/me/portfolio/${encodeURIComponent(itemId)}`);
}

export async function fetchMyFabrics(): Promise<FabricItem[]> {
  const { data } = await apiGet<{ fabrics: FabricItem[] }>('/tailors/me/fabrics');
  return data.fabrics ?? [];
}

export async function createFabric(params: {
  name: string;
  price: number;
  description?: string;
  localImageUri?: string;
  /** MIME type for `localImageUri` (RN FormData `type`) */
  imageMimeType?: string;
}): Promise<FabricItem> {
  const token = await getAuthToken();
  if (!token) throw new ApiException('Not signed in', 401);
  const form = new FormData();
  form.append('name', params.name.trim());
  form.append('price', String(params.price));
  if (params.description?.trim()) {
    form.append('description', params.description.trim());
  }
  if (params.localImageUri) {
    const name = params.localImageUri.split('/').pop() || 'fabric.jpg';
    form.append(
      'image',
      {
        uri: params.localImageUri,
        name,
        type: params.imageMimeType ?? 'image/jpeg',
      } as unknown as Blob
    );
  }
  const res = await fetch(`${getApiBaseUrl()}/tailors/me/fabrics`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await parseSuccessResponse<{ fabric: FabricItem }>(res);
  return data.fabric;
}

export type PatchFabricPayload = {
  name?: string;
  price?: number;
  description?: string | null;
  isActive?: boolean;
};

export async function updateFabric(fabricId: string, payload: PatchFabricPayload): Promise<FabricItem> {
  const { data } = await apiPatch<{ fabric: FabricItem }>(
    `/tailors/me/fabrics/${encodeURIComponent(fabricId)}`,
    payload
  );
  return data.fabric;
}

/** Replace fabric photo (multipart). Call after metadata patch or alone. */
export async function uploadFabricPhoto(
  fabricId: string,
  localUri: string,
  imageMimeType = 'image/jpeg'
): Promise<FabricItem> {
  const token = await getAuthToken();
  if (!token) throw new ApiException('Not signed in', 401);
  const form = new FormData();
  const name = localUri.split('/').pop() || 'fabric.jpg';
  form.append(
    'image',
    { uri: localUri, name, type: imageMimeType } as unknown as Blob
  );
  const res = await fetch(
    `${getApiBaseUrl()}/tailors/me/fabrics/${encodeURIComponent(fabricId)}/image`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );
  const data = await parseSuccessResponse<{ fabric: FabricItem }>(res);
  return data.fabric;
}

export async function deactivateFabric(fabricId: string): Promise<void> {
  await apiDelete(`/tailors/me/fabrics/${encodeURIComponent(fabricId)}`);
}
