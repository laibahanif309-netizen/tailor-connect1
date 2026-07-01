/**
 * TypeScript types for Dashboard data
 */

export type DashboardRange = '7d' | '30d' | '365d';

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalEarnings: number;
  /** Lifetime counts (not limited to selected range) */
  allTimeOrderCount: number;
  allTimeEarnings: number;
}

export interface ChartDataPoint {
  date: string;
  /** Short label for chart axis */
  label: string;
  value: number;
}

export interface OrderStatusDistribution {
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  count: number;
  percentage: number;
}

export interface StitchingBreakdownItem {
  stitchingType: 'mens' | 'womens' | 'childrens';
  count: number;
  percentage: number;
}

export interface FabricBreakdownItem {
  fabricId: string | null;
  name: string;
  count: number;
  percentage: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  /** Populated for tailor list rows */
  customerName: string;
  /** Populated for customer list rows */
  tailorName?: string;
  customerAvatar?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  /** Display amount in PKR major units (backend totalCents / 100) */
  total: number;
  createdAt: Date | string;
  /** From list API fabric — used for tailor search (e.g. fabric name) */
  fabricName?: string;
  stitchingType?: string;
}

/** Status step for timeline / history */
export type OrderStatusStep =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface OrderStatusHistoryEntry {
  status: OrderStatusStep;
  at: string; // ISO date
}

export interface TailorOrderDetail extends RecentOrder {
  statusHistory: OrderStatusHistoryEntry[];
  measurements: Record<string, string>;
  fabric: { name: string; imageUri?: string; price: number };
  deliveryAddress: string;
  specialInstructions: string;
  priceBreakdown: { fabricPrice: number; expressFee: number; total: number };
  customerPhone: string;
  customerEmail: string;
  /** API deliveryDate */
  scheduledDelivery?: string;
  cancelledAt?: string | null;
  completedAt?: string | null;
}

export interface DashboardResponse {
  range: DashboardRange;
  rangeFrom: string;
  rangeDays: number;
  granularity: 'day' | 'month';
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  chartData: {
    ordersOverTime: ChartDataPoint[];
    earningsOverTime: ChartDataPoint[];
    orderStatusDistribution: OrderStatusDistribution[];
    stitchingBreakdown: StitchingBreakdownItem[];
    fabricBreakdown: FabricBreakdownItem[];
  };
}
