export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  id?: string;
  productId?: string;
  description: string;
  qty: number;
  unitPrice: number;
  total?: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate?: string | null;
  poNumber?: string | null;
  paymentMethod: string;
  clientId: string;
  invoiceFor: string;
  payableTo: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'nominal' | 'percent';
  discountValue: number;
  taxType: 'nominal' | 'percent';
  taxValue: number;
  shipping: number;
  downPayment: number;
  total: number;
  notes: string;
  status: InvoiceStatus;
  createdAt?: string;
  updatedAt?: string;
  client?: any;
}

export interface BusinessSettings {
  id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  signatureUrl: string;
  signerName: string;
  defaultNotes: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}
