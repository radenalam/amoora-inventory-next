import { apiGet, apiPost, apiPut, apiDelete, buildQuery } from './api';
import type { Product } from '@/store/useStore';

export interface ListProductsResult {
  items: Product[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

interface RawListResponse {
  data: Product[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function listProducts(params?: { search?: string; page?: number; limit?: number }): Promise<ListProductsResult> {
  const qs = buildQuery({ search: params?.search, page: params?.page, limit: params?.limit });
  const raw = await apiGet<RawListResponse>(`/api/products${qs}`);
  return { items: raw.data, pagination: raw.pagination };
}

export async function getProduct(id: string): Promise<Product> {
  return apiGet<Product>(`/api/products/${id}`);
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  return apiPost<Product>('/api/products', data);
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  return apiPut<Product>(`/api/products/${id}`, data);
}

export async function deleteProduct(id: string): Promise<void> {
  return apiDelete(`/api/products/${id}`);
}
