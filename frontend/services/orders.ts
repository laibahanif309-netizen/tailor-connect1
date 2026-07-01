import { apiGet, apiPatch, apiPost } from './api';
import type { CreateOrderPayload, OrderDetailApi, OrderListItemApi, OrdersListApiData } from '../types/order';
import type { RecentOrder, TailorOrderDetail } from '../types/dashboard';
import type { OrderStatusHistoryEntry, OrderStatusStep } from '../types/dashboard';

const CENTS_PER_UNIT = 100;

export function centsToMajor(cents: number): number {
  return cents / CENTS_PER_UNIT;
}

function buildOrdersQuery(params?: { page?: number; limit?: number; status?: string }): string {
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.status) q.set('status', params.status);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function fetchOrdersList(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<OrdersListApiData> {
  const { data } = await apiGet<OrdersListApiData>(`/orders${buildOrdersQuery(params)}`);
  return data;
}

export async function fetchOrderById(orderId: string): Promise<OrderDetailApi> {
  const { data } = await apiGet<OrderDetailApi>(`/orders/${orderId}`);
  return data;
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderDetailApi> {
  const { data } = await apiPost<OrderDetailApi>('/orders', payload);
  return data;
}

export async function updateOrderStatus(
  orderId: string,
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
): Promise<OrderDetailApi> {
  const { data } = await apiPatch<OrderDetailApi>(`/orders/${orderId}/status`, { status });
  return data;
}

export function listItemToRecentOrder(item: OrderListItemApi): RecentOrder {
  return {
    id: item.id,
    orderNumber: item.orderNumber,
    customerId: item.customerId ?? '',
    customerName: item.customerName ?? '',
    tailorName: item.tailorName ?? undefined,
    status: item.status,
    total: centsToMajor(item.totalCents),
    createdAt: item.createdAt,
    fabricName: item.fabric?.name ?? '',
    stitchingType: item.stitchingType,
  };
}

/** @deprecated use fetchOrdersList — kept for tailor orders tab */
export async function getTailorOrders(): Promise<RecentOrder[]> {
  const data = await fetchOrdersList({ page: 1, limit: 50 });
  return data.orders.map(listItemToRecentOrder);
}

function measurementsFromApi(m: OrderDetailApi['measurements']): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = m?.measurementsJson;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw)) {
      out[k] = v == null ? '' : String(v);
    }
  }
  return out;
}

function historyFromApi(history: OrderDetailApi['statusHistory']): OrderStatusHistoryEntry[] {
  return (history ?? []).map((h) => ({
    status: h.status as OrderStatusStep,
    at: h.createdAt,
  }));
}

export function apiOrderToTailorOrderDetail(o: OrderDetailApi): TailorOrderDetail {
  const customer = o.customer;
  const name = customer.fullName || customer.username || customer.email.split('@')[0] || 'Customer';
  const fabricPrice = centsToMajor(o.fabricPriceCents);
  const expressFee = centsToMajor(o.expressFeeCents);
  const total = centsToMajor(o.totalCents);

  return {
    id: o.id,
    orderNumber: o.orderNumber,
    customerId: customer.id,
    customerName: name,
    status: o.status,
    total,
    createdAt: o.createdAt,
    fabricName: o.fabric?.name ?? '',
    stitchingType: o.stitchingType,
    statusHistory: historyFromApi(o.statusHistory),
    measurements: measurementsFromApi(o.measurements),
    fabric: {
      name: o.fabric?.name ?? 'Fabric',
      imageUri: o.fabric?.imageUrl ?? undefined,
      price: o.fabric?.priceCents != null ? centsToMajor(o.fabric.priceCents) : fabricPrice,
    },
    deliveryAddress: o.deliveryAddress,
    specialInstructions: o.specialInstructions ?? '',
    priceBreakdown: {
      fabricPrice,
      expressFee,
      total,
    },
    customerPhone: customer.phone ?? '',
    customerEmail: customer.email,
    scheduledDelivery: o.deliveryDate,
    cancelledAt: o.cancelledAt ?? undefined,
    completedAt: o.completedAt ?? undefined,
  };
}
