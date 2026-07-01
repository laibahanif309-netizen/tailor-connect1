/**
 * Mock Fabrics Service
 * Provides mock data for fabric operations
 * All data stored in memory (lost on app restart)
 */

import type {
  FabricItem,
  FabricsResponse,
  CreateFabricRequest,
  UpdateFabricRequest,
} from '../types/fabric';
import { fabricStore } from './tailors';

/**
 * Get fabrics by tailor ID
 */
export async function getFabricsByTailorId(
  tailorId: string
): Promise<FabricsResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const fabrics = fabricStore.filter((fabric) => fabric.tailorId === tailorId);

  return {
    fabrics,
    total: fabrics.length,
  };
}

/**
 * Create fabric
 */
export async function createFabric(
  tailorId: string,
  data: CreateFabricRequest
): Promise<FabricItem> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newFabric: FabricItem = {
    id: `fabric-${Date.now()}`,
    name: data.name,
    imageUrl: data.imageUrl,
    price: data.price,
    description: data.description,
    tailorId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  fabricStore.push(newFabric);

  return newFabric;
}

/**
 * Update fabric
 */
export async function updateFabric(
  fabricId: string,
  data: UpdateFabricRequest
): Promise<FabricItem | null> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const fabric = fabricStore.find((f) => f.id === fabricId);
  if (!fabric) {
    return null;
  }

  if (data.name !== undefined) fabric.name = data.name;
  if (data.imageUrl !== undefined) fabric.imageUrl = data.imageUrl;
  if (data.price !== undefined) fabric.price = data.price;
  if (data.description !== undefined) fabric.description = data.description;
  fabric.updatedAt = new Date();

  return fabric;
}

/**
 * Delete fabric
 */
export async function deleteFabric(fabricId: string): Promise<boolean> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const index = fabricStore.findIndex((f) => f.id === fabricId);
  if (index === -1) {
    return false;
  }

  fabricStore.splice(index, 1);
  return true;
}

/**
 * Get fabric by ID
 */
export async function getFabricById(
  fabricId: string
): Promise<FabricItem | null> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  return fabricStore.find((f) => f.id === fabricId) || null;
}
