/**
 * TypeScript types for Portfolio data
 */

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  description?: string;
  createdAt: Date | string;
  tailorId: string;
}

export interface PortfolioResponse {
  portfolio: PortfolioItem[];
  total: number;
}
