/**
 * Portfolio API — GET /api/tailors/:id/portfolio
 */

import { apiGet } from './api';
import type { PortfolioItem, PortfolioResponse } from '../types/portfolio';

export async function getPortfolioByTailorId(
  tailorId: string
): Promise<PortfolioResponse> {
  const { data } = await apiGet<PortfolioResponse>(
    `/tailors/${encodeURIComponent(tailorId)}/portfolio`
  );
  return data;
}
