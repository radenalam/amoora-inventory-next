import { apiGet, apiPost, apiPut, apiDelete, buildQuery } from './api';
import type { Client } from '@/store/useStore';

export interface ListClientsParams {
  search?: string;
  limit?: number;
}

export interface ListClientsResult {
  items: Client[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

interface RawListResponse {
  data: Client[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function listClients(params?: ListClientsParams): Promise<ListClientsResult> {
  const qs = buildQuery({ search: params?.search, limit: params?.limit });
  const raw = await apiGet<RawListResponse>(`/api/clients${qs}`);
  return { items: raw.data, pagination: raw.pagination };
}

export async function getClient(id: string): Promise<Client> {
  return apiGet<Client>(`/api/clients/${id}`);
}

export async function createClient(data: Partial<Client>): Promise<Client> {
  return apiPost<Client>('/api/clients', data);
}

export async function updateClient(id: string, data: Partial<Client>): Promise<Client> {
  return apiPut<Client>(`/api/clients/${id}`, data);
}

export async function deleteClient(id: string): Promise<void> {
  return apiDelete(`/api/clients/${id}`);
}
