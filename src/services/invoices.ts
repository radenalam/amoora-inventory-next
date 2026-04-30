import { apiGet, apiPost, apiPut, apiDelete, buildQuery } from './api';
import type { Invoice } from '@/store/useStore';

export interface ListInvoicesParams {
  status?: string;
  search?: string;
}

export interface ListInvoicesResult {
  items: Invoice[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

interface RawListResponse {
  data: Invoice[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function listInvoices(params?: ListInvoicesParams): Promise<ListInvoicesResult> {
  const qs = buildQuery({ status: params?.status, search: params?.search });
  const raw = await apiGet<RawListResponse>(`/api/invoices${qs}`);
  return { items: raw.data, pagination: raw.pagination };
}

export async function getInvoice(id: string): Promise<Invoice> {
  return apiGet<Invoice>(`/api/invoices/${id}`);
}

export async function createInvoice(data: unknown): Promise<Invoice> {
  return apiPost<Invoice>('/api/invoices', data);
}

export async function updateInvoice(id: string, data: unknown): Promise<Invoice> {
  return apiPut<Invoice>(`/api/invoices/${id}`, data);
}

export async function deleteInvoice(id: string): Promise<void> {
  return apiDelete(`/api/invoices/${id}`);
}

export async function sendInvoiceEmail(id: string): Promise<{ message: string; recipient: string }> {
  return apiPost(`/api/invoices/${id}/send-email`);
}

export async function getNextInvoiceNo(): Promise<string> {
  const res = await apiGet<{ invoiceNo: string }>('/api/next-invoice-number');
  return res.invoiceNo;
}
