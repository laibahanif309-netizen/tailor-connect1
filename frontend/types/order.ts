/**
 * API-aligned order types (backend /api/orders)
 */

export type OrderStatusApi = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type StitchingTypeApi = 'mens' | 'womens' | 'childrens';

export interface OrderFabricApi {
  id: string;
  name: string;
  imageUrl?: string | null;
  priceCents?: number;
  description?: string | null;
  tailorId?: string;
  isActive?: boolean;
}

export interface OrderListItemApi {
  id: string;
  orderNumber: string;
  status: OrderStatusApi;
  stitchingType: StitchingTypeApi;
  totalCents: number;
  fabricPriceCents: number;
  expressFeeCents: number;
  isExpress: boolean;
  deliveryDate: string;
  createdAt: string;
  fabric: { id: string; name: string; imageUrl?: string | null } | null;
  tailorName?: string | null;
  tailorId?: string | null;
  customerName?: string | null;
  customerId?: string | null;
}

export interface OrdersListApiData {
  orders: OrderListItemApi[];
  total: number;
  page: number;
  totalPages: number;
}

export interface OrderUserBriefApi {
  id: string;
  fullName?: string | null;
  email: string;
  username?: string | null;
  phone?: string | null;
}

export interface OrderTailorBriefApi {
  id: string;
  businessName: string;
  location?: string;
  description?: string | null;
  userId: string;
  user?: { email?: string; phone?: string | null; fullName?: string | null };
}

export interface OrderMeasurementApi {
  id: string;
  orderId: string;
  unit: string;
  measurementsJson: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderStatusHistoryApi {
  id: string;
  orderId: string;
  status: OrderStatusApi;
  note?: string | null;
  createdAt: string;
}

/** Present when the customer has submitted a review for this order */
export interface OrderReviewBriefApi {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface OrderDetailApi {
  id: string;
  orderNumber: string;
  status: OrderStatusApi;
  stitchingType: StitchingTypeApi;
  deliveryAddress: string;
  deliveryDate: string;
  specialInstructions?: string | null;
  isExpress: boolean;
  fabricPriceCents: number;
  expressFeeCents: number;
  totalCents: number;
  cancelledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tailor: OrderTailorBriefApi;
  fabric: OrderFabricApi | null;
  customer: OrderUserBriefApi;
  measurements: OrderMeasurementApi | null;
  statusHistory: OrderStatusHistoryApi[];
  /** Omitted on older API responses; treat as no review */
  review?: OrderReviewBriefApi | null;
}

export interface CreateOrderPayload {
  tailorId: string;
  fabricId: string;
  stitchingType: StitchingTypeApi;
  deliveryAddress: string;
  deliveryDate: string;
  specialInstructions?: string;
  isExpress?: boolean;
  measurements: Record<string, unknown>;
}
