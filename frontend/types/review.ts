import type { ReviewItem } from './tailor';

export interface TailorReviewsPage {
  reviews: ReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
