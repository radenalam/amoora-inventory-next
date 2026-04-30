import { apiGet, apiPut } from './api';
import type { BusinessSettings } from '@/store/useStore';

export async function getSettings(): Promise<BusinessSettings> {
  return apiGet<BusinessSettings>('/api/settings');
}

export async function updateSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
  return apiPut<BusinessSettings>('/api/settings', data);
}
