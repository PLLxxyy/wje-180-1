import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jubensha-platform-secret-key-2024';

export function generateToken(payload: { id: string; username: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { id: string; username: string; role: string } {
  return jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
}
