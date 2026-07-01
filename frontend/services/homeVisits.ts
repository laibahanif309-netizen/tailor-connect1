import { apiGet, apiPatch, apiPost } from './api';
import type { HomeVisitItem, HomeVisitsListResponse, HomeVisitStatusApi } from '../types/homeVisit';

function buildQuery(params?: { page?: number; limit?: number; status?: string }): string {
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.status) q.set('status', params.status);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function fetchHomeVisits(params?: {
  page?: number;
  limit?: number;
  status?: HomeVisitStatusApi;
}): Promise<HomeVisitsListResponse> {
  const { data } = await apiGet<HomeVisitsListResponse>(`/home-visits${buildQuery(params)}`);
  return data;
}

export async function bookHomeVisit(payload: {
  tailorId: string;
  requestedDate: string;
  timeSlot: string;
  address: string;
  phone: string;
  purpose?: string;
}): Promise<HomeVisitItem> {
  const { data } = await apiPost<{ homeVisit: HomeVisitItem }>('/home-visits', payload);
  return data.homeVisit;
}

export async function updateHomeVisitStatus(
  id: string,
  status: 'confirmed' | 'completed' | 'cancelled'
): Promise<HomeVisitItem> {
  const { data } = await apiPatch<{ homeVisit: HomeVisitItem }>(`/home-visits/${encodeURIComponent(id)}/status`, {
    status
  });
  return data.homeVisit;
}
