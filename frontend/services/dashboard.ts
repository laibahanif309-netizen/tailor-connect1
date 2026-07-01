import type { DashboardRange, DashboardResponse } from '../types/dashboard';
import { apiGet } from './api';

/**
 * Tailor analytics dashboard — GET /api/tailors/me/dashboard (JWT).
 * Data is scoped to the signed-in tailor and the selected time range.
 */
export async function getTailorDashboard(range: DashboardRange = '30d'): Promise<DashboardResponse> {
  const { data } = await apiGet<DashboardResponse>(`/tailors/me/dashboard?range=${encodeURIComponent(range)}`);
  return data;
}
