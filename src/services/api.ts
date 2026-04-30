import api from '@/lib/api';

export async function apiGet<T>(url: string): Promise<T> {
  const { data } = await api.get<T>(url);
  return data;
}

export async function apiPost<T>(url: string, body?: unknown, config?: unknown): Promise<T> {
  const { data } = await api.post<T>(url, body, config as Parameters<typeof api.post>[2]);
  return data;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.put<T>(url, body);
  return data;
}

export async function apiDelete<T = void>(url: string): Promise<T> {
  const { data } = await api.delete<T>(url);
  return data;
}

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}
