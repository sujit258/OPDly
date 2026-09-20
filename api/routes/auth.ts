import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.js';
import {
  createSession,
  revokeSession,
  setSessionCookies,
  clearSessionCookies,
  requireAuth,
  getCookies,
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
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

    // If database is completely unseeded (0 doctors), auto-bootstrap initial Aarogyam clinic & doctor
    if (!doctor) {
      const doctorCount = await prisma.doctor.count();
      if (doctorCount === 0) {
        let clinic = await prisma.clinic.findFirst();
        if (!clinic) {
          clinic = await prisma.clinic.create({
            data: {
              name: 'Aarogyam Clinic',
              tagline: 'Simple OPD. For Solo Doctors.',
              address: 'Shop 4, Galaxy Enclave, Paud Road, Kothrud, Pune, Maharashtra 411038',
              city: 'Pune',
              state: 'Maharashtra',
              pincode: '411038',
              phone: '98765 43210',
              email: 'aarogyam@opdly.suvidhatools.in',
              timings: 'Mon - Sat: 9:30 AM - 1:30 PM, 5:30 PM - 9:30 PM',
              consultationFee: 500.0,
              followUpFee: 300.0,
              currency: 'INR',
            },
          });
        }
        doctor = await prisma.doctor.create({
          data: {
            clinicId: clinic.id,
            name: 'Dr. Rajesh Sharma',
            qualifications: 'MBBS, MD (Medicine)',
            registrationNumber: 'MH/MED/2014/1982',
            registrationCouncil: 'Maharashtra Medical Council',
            specialty: 'Consultant Physician',
            phone: '98765 43210',
            email: 'dr.sharma@opdly.suvidhatools.in',
            passwordHash: 'seeded_hashed_password',
            signatureText: 'Dr. Rajesh Sharma, MD',
            role: 'OWNER_DOCTOR',
            isActive: true,
          },
        });
      }
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
  } catch (error: any) {
    console.error('Login error:', error);
    if (error?.message?.includes('does not exist')) {
      res.status(500).json({
        error: 'Database schema not migrated: tables do not exist in Neon PostgreSQL. Please run prisma db push.',
        details: error?.message,
      });
      return;
    }
    res.status(500).json({ error: 'Authentication failed', details: error?.message });
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
 * Returns CSRF token for active authenticated session, or issues a fresh CSRF token
 */
authRouter.get('/csrf', async (req: Request, res: Response): Promise<void> => {
  try {
    const cookies = getCookies(req);
    const rawToken = cookies[SESSION_COOKIE_NAME];

    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const session = await prisma.session.findUnique({
        where: { tokenHash },
      });
      if (session && !session.revokedAt && session.expiresAt > new Date()) {
        res.cookie(CSRF_COOKIE_NAME, session.csrfToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.json({ csrfToken: session.csrfToken });
        return;
      }
    }

    const freshCsrfToken = crypto.randomBytes(32).toString('hex');
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(CSRF_COOKIE_NAME, freshCsrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({ csrfToken: freshCsrfToken });
  } catch (err) {
    const fallbackToken = crypto.randomBytes(32).toString('hex');
    res.json({ csrfToken: fallbackToken });
  }
});
