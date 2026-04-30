import { z } from 'zod/v4';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Deskripsi item wajib diisi'),
  qty: z.coerce.number().positive('Qty harus lebih dari 0'),
  unitPrice: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  productId: z.string().uuid().optional().nullable(),
});

export const createInvoiceSchema = z.object({
  invoiceNo: z.string().min(1, 'Nomor invoice wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  clientId: z.string().uuid().optional().nullable(),
  invoiceFor: z.string().optional(),
  dueDate: z.string().optional(),
  poNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Minimal 1 item invoice'),
  discountType: z.enum(['nominal', 'percent']).optional(),
  discountValue: z.coerce.number().min(0).optional(),
  taxType: z.enum(['nominal', 'percent']).optional(),
  taxValue: z.coerce.number().min(0).optional(),
  shipping: z.coerce.number().min(0).optional(),
  downPayment: z.coerce.number().min(0).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
