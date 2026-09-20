import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.js';

export interface AuthenticatedDoctor {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      doctor?: AuthenticatedDoctor;
      clinicId?: string;
      sessionId?: string;
      sessionCsrfToken?: string;
    }
  }
}

export const SESSION_COOKIE_NAME = 'opdly_session';
export const CSRF_COOKIE_NAME = 'opdly_csrf';

/**
 * Parses cookies from raw cookie header if not already parsed
 */
export function getCookies(req: Request): Record<string, string> {
  if (req.cookies && Object.keys(req.cookies).length > 0) return req.cookies;
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const key = parts.shift()?.trim();
    if (key) {
      list[key] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
}

/**
 * Creates a server-side revocable session in PostgreSQL with an unguessable CSRF token.
 * Stores SHA-256 hash of token in DB so the database never holds plaintext tokens.
 */
export async function createSession(doctorId: string, clinicId: string) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const session = await prisma.session.create({
    data: {
      doctorId,
      clinicId,
      tokenHash,
      csrfToken,
      expiresAt,
    },
  });

  return { session, rawToken, csrfToken };
}

/**
 * Revokes a session server-side in PostgreSQL
 */
export async function revokeSession(rawToken: string): Promise<void> {
  if (!rawToken) return;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Sets session cookies:
 * - opdly_session: HttpOnly, Secure, SameSite=Lax (the auth credential)
 * - opdly_csrf: readable by frontend client JavaScript for CSRF header injection
 */
export function setSessionCookies(res: Response, rawToken: string, csrfToken: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 30 * 24 * 60 * 60 * 1000;

  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Non-HttpOnly so client JS can read and send in x-csrf-token header
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

/**
 * Clears session cookies on logout
 */
export function clearSessionCookies(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  const clearOpts = {
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
  };

  res.clearCookie(SESSION_COOKIE_NAME, { ...clearOpts, httpOnly: true });
  res.clearCookie(CSRF_COOKIE_NAME, { ...clearOpts, httpOnly: false });
}

/**
 * Authentication Middleware:
 * Resolves doctor and clinic exclusively from server-side session.
 * Never trusts client-supplied clinicId or doctorId.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const cookies = getCookies(req);
  const rawToken = cookies[SESSION_COOKIE_NAME];

  if (!rawToken) {
    // Development fallback if bypass header is explicitly passed
    if (process.env.NODE_ENV !== 'production' && req.headers['x-demo-bypass']) {
      const demoDoctor = await prisma.doctor.findFirst();
      if (demoDoctor) {
        req.doctor = {
          id: demoDoctor.id,
          clinicId: demoDoctor.clinicId,
          name: demoDoctor.name,
          email: demoDoctor.email,
          role: demoDoctor.role,
        };
        req.clinicId = demoDoctor.clinicId;
        req.sessionCsrfToken = 'dev_demo_csrf_token';
        return next();
      }
    }

    res.status(401).json({ error: 'Unauthorized: Session missing or expired' });
    return;
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        doctor: {
          select: {
            id: true,
            clinicId: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session) {
      res.status(401).json({ error: 'Unauthorized: Session not found' });
      return;
    }

    if (session.revokedAt) {
      res.status(401).json({ error: 'Unauthorized: Session has been revoked' });
      return;
    }

    if (new Date() > session.expiresAt) {
      res.status(401).json({ error: 'Unauthorized: Session expired' });
      return;
    }

    if (!session.doctor || !session.doctor.isActive) {
      res.status(401).json({ error: 'Unauthorized: Inactive doctor account' });
      return;
    }

    // MANDATORY TENANT ISOLATION: Derive doctor and clinic exclusively from session
    req.sessionId = session.id;
    req.sessionCsrfToken = session.csrfToken;
    req.clinicId = session.clinicId;
    req.doctor = session.doctor;

    next();
  } catch (err) {
    console.error('Session auth error:', err);
    res.status(401).json({ error: 'Unauthorized: Session verification failed' });
  }
}

/**
 * Explicit CSRF Protection Middleware:
 * Verifies that all state-changing requests (POST, PUT, PATCH, DELETE) carry
 * an x-csrf-token header matching the session's CSRF token.
 */
export function requireCsrf(req: Request, res: Response, next: NextFunction): void {
  // Safe read methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt public login route (since session does not exist prior to login)
  if (req.path === '/api/v1/auth/login' || req.path === '/login' || req.path.endsWith('/auth/login')) {
    return next();
  }

  // Allow bypass in test/dev only if explicitly opted
  if (process.env.NODE_ENV === 'test' && req.headers['x-skip-csrf']) {
    return next();
  }

  const clientCsrfToken = (req.headers['x-csrf-token'] as string) || (req.headers['x-xsrf-token'] as string);
  const serverCsrfToken = req.sessionCsrfToken;

  if (!serverCsrfToken || !clientCsrfToken) {
    res.status(403).json({ error: 'Forbidden: CSRF token missing' });
    return;
  }

  try {
    const clientBuf = Buffer.from(clientCsrfToken, 'utf8');
    const serverBuf = Buffer.from(serverCsrfToken, 'utf8');

    if (clientBuf.length !== serverBuf.length || !crypto.timingSafeEqual(clientBuf, serverBuf)) {
      res.status(403).json({ error: 'Forbidden: Invalid CSRF token' });
      return;
    }
  } catch {
    res.status(403).json({ error: 'Forbidden: CSRF validation error' });
    return;
  }

  next();
}
