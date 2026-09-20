import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';

export const patientsRouter = Router();

// All patient endpoints require authentication and CSRF protection
patientsRouter.use(requireAuth);
patientsRouter.use(requireCsrf);

/**
 * GET /api/v1/patients
 * List all active patients for authenticated clinic only
 */
patientsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const patients = await prisma.patient.findMany({
      where: {
        clinicId: req.clinicId!,
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(patients);
  } catch (error) {
    console.error('Fetch patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

/**
 * GET /api/v1/patients/search?q=query&filter=Recent|All|Favorites
 * Scoped strictly to caller's clinic
 */
patientsRouter.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const filter = (req.query.filter as string) || 'All';
    const normalizedQ = q.replace(/\s+/g, '');

    const whereClause: any = {
      clinicId: req.clinicId!,
      deletedAt: null,
    };

    if (filter === 'Favorites') {
      whereClause.isFavorite = true;
    }

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { normalizedMobile: { contains: normalizedQ } },
        { uhid: { contains: q, mode: 'insensitive' } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      orderBy: filter === 'Recent' ? { lastVisitDate: 'desc' } : { name: 'asc' },
      take: 50,
    });

    res.json(patients);
  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

/**
 * GET /api/v1/patients/recent?limit=5
 */
patientsRouter.get('/recent', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 20);
    const patients = await prisma.patient.findMany({
      where: {
        clinicId: req.clinicId!,
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    res.json(patients);
  } catch (error) {
    console.error('Recent patients error:', error);
    res.status(500).json({ error: 'Failed to fetch recent patients' });
  }
});

/**
 * GET /api/v1/patients/by-mobile/:mobile
 */
patientsRouter.get('/by-mobile/:mobile', async (req: Request, res: Response): Promise<void> => {
  try {
    const cleanMobile = String(req.params.mobile).replace(/\s+/g, '');
    const patient = await prisma.patient.findFirst({
      where: {
        clinicId: req.clinicId!,
        normalizedMobile: cleanMobile,
        deletedAt: null,
      },
    });
    res.json(patient);
  } catch (error) {
    console.error('Lookup patient by mobile error:', error);
    res.status(500).json({ error: 'Failed to find patient by mobile' });
  }
});

/**
 * GET /api/v1/patients/:id
 * Strict tenant isolation: returns 404 if patient belongs to another clinic
 */
patientsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const patient = await prisma.patient.findFirst({
      where: {
        clinicId: req.clinicId!,
        OR: [{ id }, { uhid: id }],
        deletedAt: null,
      },
    });

    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.json(patient);
  } catch (error) {
    console.error('Fetch patient by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

/**
 * POST /api/v1/patients
 * Create a new patient with auto-generated serial UHID.
 * Strictly binds to authenticated clinicId.
 */
patientsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const cleanMobile = (body.mobile || '').replace(/\s+/g, '');

    // Duplicate check within authenticated clinic
    const existing = await prisma.patient.findFirst({
      where: {
        clinicId: req.clinicId!,
        normalizedMobile: cleanMobile,
        deletedAt: null,
      },
    });

    if (existing) {
      res.status(409).json({ error: 'Patient with this mobile number already exists', existingPatient: existing });
      return;
    }

    // Generate next serial UHID for this clinic
    const count = await prisma.patient.count({ where: { clinicId: req.clinicId! } });
    const uhid = `P-${1000 + count + 1}`;

    const newPatient = await prisma.patient.create({
      data: {
        clinicId: req.clinicId!, // Always authenticated clinicId
        uhid,
        name: body.name.trim(),
        mobile: body.mobile.trim(),
        normalizedMobile: cleanMobile,
        age: Number(body.age),
        gender: body.gender || 'MALE',
        dob: body.dob ? new Date(body.dob) : null,
        address: body.address?.trim() || null,
        emergencyContact: body.emergencyContact?.trim() || null,
        emergencyRelation: body.emergencyRelation?.trim() || null,
        bloodGroup: body.bloodGroup || 'UNKNOWN',
        abhaId: body.abhaId?.trim() || null,
        medicalProfile: body.medicalProfile ?? { allergies: [], chronicConditions: [] },
      },
    });

    // Record AuditLog
    await logAudit({
      clinicId: req.clinicId!,
      doctorId: req.doctor!.id,
      action: 'PATIENT_CREATED',
      entityType: 'Patient',
      entityId: newPatient.id,
      metadata: { uhid: newPatient.uhid, name: newPatient.name },
    });

    res.status(201).json(newPatient);
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

/**
 * PATCH /api/v1/patients/:id
 * Strict tenant isolation: verifies patient belongs to caller's clinic before updating
 */
patientsRouter.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.patient.findFirst({
      where: {
        id,
        clinicId: req.clinicId!,
        deletedAt: null,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const body = req.body;
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.mobile !== undefined) {
      updateData.mobile = body.mobile.trim();
      updateData.normalizedMobile = body.mobile.replace(/\s+/g, '');
    }
    if (body.age !== undefined) updateData.age = Number(body.age);
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.dob !== undefined) updateData.dob = body.dob ? new Date(body.dob) : null;
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup;
    if (body.medicalProfile !== undefined) updateData.medicalProfile = body.medicalProfile;
    if (body.isFavorite !== undefined) updateData.isFavorite = Boolean(body.isFavorite);

    const updated = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    // Record AuditLog
    await logAudit({
      clinicId: req.clinicId!,
      doctorId: req.doctor!.id,
      action: 'PATIENT_UPDATED',
      entityType: 'Patient',
      entityId: updated.id,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

/**
 * POST /api/v1/patients/:id/toggle-favorite
 */
patientsRouter.post('/:id/toggle-favorite', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const current = await prisma.patient.findFirst({
      where: { id, clinicId: req.clinicId!, deletedAt: null },
      select: { id: true, isFavorite: true },
    });

    if (!current) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: { isFavorite: !current.isFavorite },
    });

    res.json({ isFavorite: updated.isFavorite });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite status' });
  }
});
