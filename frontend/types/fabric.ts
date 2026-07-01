/**
 * TypeScript types for Fabric data
 */

export interface FabricItem {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  description?: string;
  tailorId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface FabricsResponse {
  fabrics: FabricItem[];
  total: number;
}

export interface CreateFabricRequest {
  name: string;
  imageUrl: string;
  price: number;
  description?: string;
}

export interface UpdateFabricRequest {
  name?: string;
  imageUrl?: string;
  price?: number;
  description?: string;
}
