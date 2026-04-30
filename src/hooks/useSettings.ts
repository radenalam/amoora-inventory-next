import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as settingsService from '@/services/settings';
import type { BusinessSettings } from '@/types';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BusinessSettings>) =>
      settingsService.updateSettings(data),
    onSuccess: (data) => queryClient.setQueryData(['settings'], data),
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'logo' | 'signature' }) => {
      const { uploadFile } = await import('@/services/upload');
      return uploadFile(file, type);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}
