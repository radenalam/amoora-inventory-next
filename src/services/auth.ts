import { apiPost } from './api';

interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth', { action: 'login', email, password });
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth', { action: 'register', name, email, password });
}
