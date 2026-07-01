export type HomeVisitStatusApi = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface HomeVisitCustomerBrief {
  id: string;
  name: string;
  phone?: string;
  profileImageUrl?: string;
}

export interface HomeVisitTailorBrief {
  id: string;
  businessName: string;
  location?: string;
}

export interface HomeVisitItem {
  id: string;
  status: HomeVisitStatusApi;
  requestedDate: string;
  timeSlot: string;
  address: string;
  phone: string;
  purpose?: string;
  createdAt: string;
  updatedAt: string;
  tailor: HomeVisitTailorBrief | null;
  customer: HomeVisitCustomerBrief | null;
}

export interface HomeVisitsListResponse {
  homeVisits: HomeVisitItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
