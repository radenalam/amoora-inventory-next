import jwt from 'jsonwebtoken';
import { getTokenFromHeaders } from './utils';

const _jwtSecret = process.env.JWT_SECRET;
if (!_jwtSecret) {
  throw new Error('JWT_SECRET environment variable is not set');
}
const jwtSecret: string = _jwtSecret;

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, jwtSecret) as { userId: string; email: string };
  } catch {
    return null;
  }
}

export function getAuthUser(headers: Headers): { userId: string; email: string } | null {
  const token = getTokenFromHeaders(headers);
  if (!token) return null;
  return verifyToken(token);
}
