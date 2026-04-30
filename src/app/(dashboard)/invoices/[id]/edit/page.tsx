'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';
import { useInvoice, useUpdateInvoice } from '@/hooks/useInvoices';
import { useToast } from '@/components/ToastProvider';

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { data: invoice, isLoading } = useInvoice(id);
  const updateInvoice = useUpdateInvoice();
  const { showToast } = useToast();

  const handleSubmit = async (data: any) => {
    await updateInvoice.mutateAsync({ id, data });
    showToast('Invoice berhasil diperbarui');
    router.push('/invoices');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <InvoiceForm
      isEdit={true}
      initialData={invoice}
      onSubmit={handleSubmit}
      onCancel={() => router.push('/invoices')}
    />
  );
}
