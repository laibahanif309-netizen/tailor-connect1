/**
 * TypeScript types for Tailor data
 */

export interface TailorListItem {
  id: string;
  businessName: string;
  location: string;
  rating: number; // 0-5
  profileImage?: string;
  specializations: string[];
  isAvailable: boolean;
  totalReviews?: number;
  userId: string;
}

export interface TailorProfile {
  id: string;
  userId: string;
  businessName: string;
  location: string;
  phone?: string;
  email: string;
  description?: string;
  specializations: string[];
  experience: number;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  profileImage?: string;
  portfolio: PortfolioItem[];
  fabrics: FabricItem[];
  reviews: ReviewItem[];
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  description?: string;
  createdAt: Date | string;
  tailorId: string;
}

export interface ReviewItem {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  tailorId: string;
  orderId?: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date | string;
}

export interface FabricItem {
  id: string;
  name: string;
  imageUrl?: string;
  price: number;
  description?: string;
  tailorId: string;
  /** Present on tailor self-service fabric list */
  isActive?: boolean;
}

export interface SearchTailorsParams {
  query?: string;
  location?: string;
  minRating?: number;
  specializations?: string[];
  available?: boolean;
  page?: number;
  limit?: number;
}

export interface TailorsResponse {
  tailors: TailorListItem[];
  total: number;
  page: number;
  totalPages: number;
}
