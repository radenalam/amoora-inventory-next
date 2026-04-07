import jwt from 'jsonwebtoken';
import { getTokenFromHeaders } from './utils';

const JWT_SECRET = process.env.JWT_SECRET || 'amoora_dev_secret';

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

export function getAuthUser(headers: Headers): { userId: string; email: string } | null {
  const token = getTokenFromHeaders(headers);
  if (!token) return null;
  return verifyToken(token);
}
