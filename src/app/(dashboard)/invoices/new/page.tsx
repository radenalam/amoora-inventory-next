'use client';

import { useRouter } from 'next/navigation';
import InvoiceForm from '@/components/InvoiceForm';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useToast } from '@/components/ToastProvider';

export default function NewInvoicePage() {
  const router = useRouter();
  const createInvoice = useCreateInvoice();
  const { showToast } = useToast();

  const handleSubmit = async (invoice: any) => {
    await createInvoice.mutateAsync(invoice);
    showToast('Invoice berhasil dibuat');
    router.push('/invoices');
  };

  return (
    <InvoiceForm
      isEdit={false}
      onSubmit={handleSubmit}
      onCancel={() => router.push('/invoices')}
    />
  );
}
