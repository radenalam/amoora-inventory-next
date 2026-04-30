import { z } from 'zod/v4';

export const loginFormSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const clientFormSchema = z.object({
  name: z.string().min(1, 'Nama client wajib diisi'),
  email: z.string().email('Email tidak valid').or(z.literal('')),
  phone: z.string(),
  address: z.string(),
  notes: z.string(),
});

export const productFormSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  description: z.string(),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  unit: z.string().min(1, 'Satuan wajib diisi'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type ClientFormValues = z.infer<typeof clientFormSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
