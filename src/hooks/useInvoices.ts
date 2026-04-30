import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as invoiceService from '@/services/invoices';

export function useInvoices(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoiceService.listInvoices(params),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoiceService.getInvoice(id),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => invoiceService.createInvoice(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      invoiceService.updateInvoice(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceService.deleteInvoice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useSendInvoiceEmail() {
  return useMutation({
    mutationFn: (id: string) => invoiceService.sendInvoiceEmail(id),
  });
}

export function useNextInvoiceNo() {
  return useQuery({
    queryKey: ['nextInvoiceNo'],
    queryFn: () => invoiceService.getNextInvoiceNo(),
    staleTime: 0,
  });
}
