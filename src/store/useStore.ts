'use client';

import { create } from 'zustand';

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

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('amoora_token');
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

interface AppState {
  isAuthenticated: boolean;
  user: { id: string; name: string; email: string } | null;
  products: Product[];
  invoices: Invoice[];
  settings: BusinessSettings;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;

  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  fetchInvoices: (params?: { status?: string; search?: string }) => Promise<any>;
  fetchInvoice: (id: string) => Promise<Invoice | null>;
  addInvoice: (invoice: any) => Promise<void>;
  updateInvoice: (id: string, invoice: any) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<BusinessSettings>) => Promise<void>;

  clients: Client[];
  fetchClients: () => Promise<void>;
  addClient: (client: any) => Promise<void>;
  updateClient: (id: string, client: any) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  fetchNextInvoiceNo: () => Promise<string>;
  uploadFile: (file: File, type: 'logo' | 'signature') => Promise<string>;
}

export const useStore = create<AppState>()((set, get) => ({
  isAuthenticated: false,
  user: null,
  products: [],
  invoices: [],
  settings: {
    name: 'Amoora Couture',
    address: 'Jl. Kaliurang, Tambakan, Sinduharjo, Kec. Sleman, Kabupaten Sleman, DIY 55581',
    phone: '0813-9201-3855',
    email: 'hello@amooracouture.com',
    logoUrl: '',
    signatureUrl: '',
    signerName: 'Amoora Admin',
    defaultNotes: 'Pembayaran dapat ditransfer ke rekening BCA 1234567890 a.n Amoora Couture. Terima kasih atas kepercayaan Anda.',
  },
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');
      localStorage.setItem('amoora_token', data.token);
      localStorage.setItem('amoora_user', JSON.stringify(data.user));
      set({ isAuthenticated: true, user: data.user, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registrasi gagal');
      localStorage.setItem('amoora_token', data.token);
      localStorage.setItem('amoora_user', JSON.stringify(data.user));
      set({ isAuthenticated: true, user: data.user, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('amoora_token');
    localStorage.removeItem('amoora_user');
    set({ isAuthenticated: false, user: null, invoices: [], products: [] });
  },

  checkAuth: () => {
    const token = localStorage.getItem('amoora_token');
    try {
      const user = JSON.parse(localStorage.getItem('amoora_user') || 'null');
      set({ isAuthenticated: !!token, user });
    } catch {
      set({ isAuthenticated: !!token, user: null });
    }
  },

  fetchProducts: async () => {
    try {
      const h = headers();
      if (!h['Authorization']) return;
      const res = await fetch('/api/products', { headers: h });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ products: data });
    } catch (err: any) {
      console.error('Fetch products error:', err);
    }
  },

  addProduct: async (product) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    set((s) => ({ products: [data, ...s.products] }));
  },

  updateProduct: async (id, product) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    set((s) => ({ products: s.products.map((p) => (p.id === id ? data : p)) }));
  },

  deleteProduct: async (id) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) throw new Error('Gagal menghapus produk');
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
  },

  fetchInvoices: async (params) => {
    try {
      const h = headers();
      if (!h['Authorization']) return;
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.search) query.set('search', params.search);
      const qs = query.toString();
      const res = await fetch(`/api/invoices${qs ? '?' + qs : ''}`, { headers: h });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ invoices: data.invoices });
      return data;
    } catch (err: any) {
      console.error('Fetch invoices error:', err);
    }
  },

  fetchInvoice: async (id) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) return null;
      return data;
    } catch {
      return null;
    }
  },

  addInvoice: async (invoice) => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(invoice),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    set((s) => ({ invoices: [data, ...s.invoices] }));
  },

  updateInvoice: async (id, invoice) => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(invoice),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? data : i)) }));
  },

  deleteInvoice: async (id) => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) throw new Error('Gagal menghapus invoice');
    set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) }));
  },

  fetchSettings: async () => {
    try {
      const res = await fetch('/api/settings', { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ settings: data });
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
  },

  updateSettings: async (settings) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    set({ settings: data });
  },

  clients: [],

  fetchClients: async () => {
    try {
      const res = await fetch('/api/clients', { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ clients: data });
    } catch (err) { console.error('Fetch clients error:', err); }
  },

  addClient: async (client) => {
    const res = await fetch('/api/clients', { method: 'POST', headers: headers(), body: JSON.stringify(client) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    set((s) => ({ clients: [data, ...s.clients] }));
  },

  updateClient: async (id, client) => {
    const res = await fetch(`/api/clients/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(client) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? data : c)) }));
  },

  deleteClient: async (id) => {
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE', headers: headers() });
    if (!res.ok) throw new Error('Gagal menghapus client');
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
  },

  fetchNextInvoiceNo: async () => {
    const res = await fetch('/api/next-invoice-number', { headers: headers() });
    const data = await res.json();
    return data.invoiceNo;
  },

  uploadFile: async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.url;
  },
}));
