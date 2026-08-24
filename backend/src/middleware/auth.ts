import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type AdminTokenPayload = {
  username: string;
  role: 'admin';
};

function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

export function getAdminToken(req: Request) {
  const bearer = req.header('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer) return bearer;

  return getCookieValue(req.header('cookie'), 'admin_token');
}

export function verifyAdminToken(token: string | null | undefined) {
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    if (payload.role !== 'admin' || typeof payload.username !== 'string') return null;
    return { username: payload.username, role: 'admin' as const } satisfies AdminTokenPayload;
  } catch {
    return null;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const admin = verifyAdminToken(getAdminToken(req));
  if (!admin) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  (req as Request & { admin?: AdminTokenPayload }).admin = admin;
  return next();
}
