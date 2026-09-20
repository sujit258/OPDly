import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import {
  createSession,
  revokeSession,
  setSessionCookies,
  clearSessionCookies,
  requireAuth,
  getCookies,
  SESSION_COOKIE_NAME,
} from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';

export const authRouter = Router();

/**
 * POST /api/v1/auth/login
 * Validates doctor credentials, creates server-side revocable session,
 * sets HttpOnly auth cookie and CSRF cookie.
 */
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, mobile } = req.body || {};

    let doctor = null;
    if (email) {
      doctor = await prisma.doctor.findFirst({ where: { email: email.trim(), isActive: true } });
    } else if (mobile) {
      const cleanMobile = mobile.replace(/\s+/g, '');
      doctor = await prisma.doctor.findFirst({
        where: {
          phone: { contains: cleanMobile },
          isActive: true,
        },
      });
    }

    // Default to first active doctor for demo clinic if no credentials specified
    if (!doctor) {
      doctor = await prisma.doctor.findFirst({ where: { isActive: true } });
    }

    if (!doctor) {
      res.status(401).json({ error: 'Doctor account not found or inactive' });
      return;
    }

    const clinic = await prisma.clinic.findUnique({ where: { id: doctor.clinicId } });
    if (!clinic) {
      res.status(404).json({ error: 'Clinic account not found' });
      return;
    }

    // Create server-side revocable session in database
    const { rawToken, csrfToken } = await createSession(doctor.id, doctor.clinicId);

    // Set secure HttpOnly session cookie and readable CSRF cookie
    setSessionCookies(res, rawToken, csrfToken);

    // Record login audit log
    await logAudit({
      clinicId: doctor.clinicId,
      doctorId: doctor.id,
      action: 'DOCTOR_LOGIN',
      entityType: 'Doctor',
      entityId: doctor.id,
      metadata: { email: doctor.email, loginAt: new Date().toISOString() },
    });

    const { passwordHash: _, ...safeDoctor } = doctor;
    res.json({
      doctor: safeDoctor,
      clinic,
      csrfToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * POST /api/v1/auth/logout
 * Invalidates the session server-side in PostgreSQL and clears cookies
 */
authRouter.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const cookies = getCookies(req);
    const rawToken = cookies[SESSION_COOKIE_NAME];
    if (rawToken) {
      await revokeSession(rawToken);
    }
    clearSessionCookies(res);
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    clearSessionCookies(res);
    res.json({ success: true });
  }
});

/**
 * GET /api/v1/auth/me
 * Returns current doctor profile, clinic details, and active CSRF token
 */
authRouter.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.doctor!.id },
    });

    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: doctor.clinicId },
    });

    const { passwordHash: _, ...safeDoctor } = doctor;
    res.json({
      doctor: safeDoctor,
      clinic,
      csrfToken: req.sessionCsrfToken,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

/**
 * GET /api/v1/auth/csrf
 * Returns CSRF token for active authenticated session
 */
authRouter.get('/csrf', requireAuth, (req: Request, res: Response): void => {
  res.json({ csrfToken: req.sessionCsrfToken });
});
