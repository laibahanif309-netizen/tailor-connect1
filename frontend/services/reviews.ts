import { apiGet, apiPost } from './api';
import type { ReviewItem } from '../types/tailor';
import type { TailorReviewsPage } from '../types/review';

function buildReviewsQuery(tailorId: string, params?: { page?: number; limit?: number }): string {
  const q = new URLSearchParams();
  q.set('tailorId', tailorId);
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  return `?${q.toString()}`;
}

export async function fetchTailorReviewsPage(
  tailorId: string,
  params?: { page?: number; limit?: number }
): Promise<TailorReviewsPage> {
  const { data } = await apiGet<TailorReviewsPage>(`/reviews${buildReviewsQuery(tailorId, params)}`);
  return data;
}

export async function submitOrderReview(payload: {
  orderId: string;
  rating: number;
  comment: string;
}): Promise<ReviewItem> {
  const { data } = await apiPost<{ review: ReviewItem }>('/reviews', payload);
  return data.review;
}
