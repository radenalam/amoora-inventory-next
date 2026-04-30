'use client';

import { create } from 'zustand';
import * as authService from '@/services/auth';

export type { Product, Invoice, InvoiceItem, InvoiceStatus, Client, BusinessSettings } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; name: string; email: string } | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('amoora_token', data.token);
      localStorage.setItem('amoora_user', JSON.stringify(data.user));
      set({ isAuthenticated: true, user: data.user, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message || 'Login gagal', loading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.register(name, email, password);
      localStorage.setItem('amoora_token', data.token);
      localStorage.setItem('amoora_user', JSON.stringify(data.user));
      set({ isAuthenticated: true, user: data.user, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message || 'Registrasi gagal', loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('amoora_token');
    localStorage.removeItem('amoora_user');
    set({ isAuthenticated: false, user: null });
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
}));
