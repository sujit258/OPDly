import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';

export const clinicRouter = Router();

clinicRouter.use(requireAuth);
clinicRouter.use(requireCsrf);

/**
 * GET /api/v1/clinic/doctor
 */
clinicRouter.get('/doctor', async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.doctor!.id },
    });
    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    const { passwordHash: _, ...safeDoctor } = doctor;
    res.json(safeDoctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
});

/**
 * PATCH /api/v1/clinic/doctor
 */
clinicRouter.patch('/doctor', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const updated = await prisma.doctor.update({
      where: { id: req.doctor!.id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        qualifications: body.qualifications !== undefined ? body.qualifications.trim() : undefined,
        registrationNumber: body.registrationNumber !== undefined ? body.registrationNumber.trim() : undefined,
        registrationCouncil: body.registrationCouncil !== undefined ? body.registrationCouncil.trim() : undefined,
        specialty: body.specialty !== undefined ? body.specialty.trim() : undefined,
        phone: body.phone !== undefined ? body.phone.trim() : undefined,
        signatureText: body.signatureText !== undefined ? body.signatureText.trim() : undefined,
      },
    });

    await logAudit({
      clinicId: req.clinicId!,
      doctorId: req.doctor!.id,
      action: 'DOCTOR_PROFILE_UPDATED',
      entityType: 'Doctor',
      entityId: updated.id,
      metadata: { updatedFields: Object.keys(body) },
    });

    const { passwordHash: _, ...safeDoctor } = updated;
    res.json(safeDoctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update doctor profile' });
  }
});

/**
 * GET /api/v1/clinic/profile
 */
clinicRouter.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: req.clinicId! },
    });
    if (!clinic) {
      res.status(404).json({ error: 'Clinic not found' });
      return;
    }
    res.json(clinic);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clinic profile' });
  }
});

/**
 * PATCH /api/v1/clinic/profile
 */
clinicRouter.patch('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const updated = await prisma.clinic.update({
      where: { id: req.clinicId! },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        tagline: body.tagline !== undefined ? body.tagline.trim() : undefined,
        address: body.address !== undefined ? body.address.trim() : undefined,
        city: body.city !== undefined ? body.city.trim() : undefined,
        state: body.state !== undefined ? body.state.trim() : undefined,
        pincode: body.pincode !== undefined ? body.pincode.trim() : undefined,
        phone: body.phone !== undefined ? body.phone.trim() : undefined,
        email: body.email !== undefined ? body.email.trim() : undefined,
        timings: body.timings !== undefined ? body.timings.trim() : undefined,
        consultationFee: body.consultationFee !== undefined ? Number(body.consultationFee) : undefined,
        followUpFee: body.followUpFee !== undefined ? Number(body.followUpFee) : undefined,
      },
    });

    await logAudit({
      clinicId: req.clinicId!,
      doctorId: req.doctor!.id,
      action: 'CLINIC_PROFILE_UPDATED',
      entityType: 'Clinic',
      entityId: updated.id,
      metadata: { updatedFields: Object.keys(body) },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update clinic profile' });
  }
});

/**
 * GET /api/v1/clinic/templates
 */
clinicRouter.get('/templates', async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await prisma.prescriptionTemplate.findMany({
      where: { clinicId: req.clinicId! },
      orderBy: { usageCount: 'desc' },
    });

    res.json(
      templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description || undefined,
        medicines: t.medicines,
        advices: t.advices,
        investigations: t.investigations,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescription templates' });
  }
});

/**
 * POST /api/v1/clinic/templates
 */
clinicRouter.post('/templates', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, medicines = [], advices = [], investigations = [] } = req.body;

    const created = await prisma.prescriptionTemplate.create({
      data: {
        clinicId: req.clinicId!,
        doctorId: req.doctor!.id,
        name: name.trim(),
        description: description?.trim() || null,
        medicines,
        advices,
        investigations,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

/**
 * PATCH /api/v1/clinic/templates/:id
 */
clinicRouter.patch('/templates/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.prescriptionTemplate.findFirst({
      where: { id, clinicId: req.clinicId! },
    });

    if (!existing) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const { name, description, medicines, advices, investigations } = req.body;
    const updated = await prisma.prescriptionTemplate.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        medicines: medicines !== undefined ? medicines : undefined,
        advices: advices !== undefined ? advices : undefined,
        investigations: investigations !== undefined ? investigations : undefined,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

/**
 * DELETE /api/v1/clinic/templates/:id
 */
clinicRouter.delete('/templates/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.prescriptionTemplate.findFirst({
      where: { id, clinicId: req.clinicId! },
    });

    if (!existing) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    await prisma.prescriptionTemplate.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

/**
 * GET /api/v1/clinic/export
 * Full JSON export of practice data, strictly scoped to caller's clinic
 */
clinicRouter.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const [clinic, doctor, patients, visits, bills, templates] = await Promise.all([
      prisma.clinic.findUnique({ where: { id: req.clinicId! } }),
      prisma.doctor.findUnique({ where: { id: req.doctor!.id } }),
      prisma.patient.findMany({ where: { clinicId: req.clinicId!, deletedAt: null } }),
      prisma.visit.findMany({
        where: { clinicId: req.clinicId!, deletedAt: null },
        include: { symptoms: true, diagnoses: true, prescription: true, bill: true },
      }),
      prisma.bill.findMany({ where: { clinicId: req.clinicId! }, include: { payments: true } }),
      prisma.prescriptionTemplate.findMany({ where: { clinicId: req.clinicId! } }),
    ]);

    await logAudit({
      clinicId: req.clinicId!,
      doctorId: req.doctor!.id,
      action: 'CLINIC_DATA_EXPORTED',
      entityType: 'Clinic',
      entityId: req.clinicId!,
      metadata: {
        patientsCount: patients.length,
        visitsCount: visits.length,
        exportedAt: new Date().toISOString(),
      },
    });

    const backupDump = {
      app: 'OPDly',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      clinic,
      doctor: doctor ? { ...doctor, passwordHash: undefined } : null,
      patients,
      visits,
      bills,
      templates,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=opdly-backup-${new Date().toISOString().split('T')[0]}.json`);
    res.send(JSON.stringify(backupDump, null, 2));
  } catch (error) {
    res.status(500).json({ error: 'Failed to export backup data' });
  }
});

/**
 * POST /api/v1/clinic/import
 * Transaction-based, validated, strictly maps records to authenticated clinic.
 * Cross-clinic ID adoption is completely prevented.
 */
clinicRouter.post('/import', async (req: Request, res: Response): Promise<void> => {
  try {
    const dump = req.body;

    if (!dump || typeof dump !== 'object' || !Array.isArray(dump.patients)) {
      res.status(400).json({ error: 'Invalid backup file format: missing patients array' });
      return;
    }

    if (dump.patients.length > 5000) {
      res.status(413).json({ error: 'Payload exceeds maximum import limit (5000 patients)' });
      return;
    }

    let importedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const p of dump.patients) {
        if (!p.name || !p.mobile) continue;
        const cleanMobile = p.mobile.replace(/\s+/g, '');

        // Check if patient already exists in caller's clinic
        const existing = await tx.patient.findFirst({
          where: {
            clinicId: req.clinicId!,
            normalizedMobile: cleanMobile,
            deletedAt: null,
          },
        });

        if (!existing) {
          const count = await tx.patient.count({ where: { clinicId: req.clinicId! } });
          const uhid = `P-${1000 + count + 1}`;

          await tx.patient.create({
            data: {
              clinicId: req.clinicId!, // Strictly current clinic
              uhid,
              name: String(p.name).trim(),
              mobile: String(p.mobile).trim(),
              normalizedMobile: cleanMobile,
              age: Number(p.age) || 30,
              gender: p.gender || 'MALE',
              bloodGroup: p.bloodGroup || 'UNKNOWN',
              medicalProfile: p.medicalProfile ?? { allergies: [], chronicConditions: [] },
              totalVisitsCount: 0,
            },
          });
          importedCount++;
        }
      }

      // Record AuditLog
      await tx.auditLog.create({
        data: {
          clinicId: req.clinicId!,
          doctorId: req.doctor!.id,
          action: 'CLINIC_DATA_IMPORTED',
          entityType: 'Clinic',
          entityId: req.clinicId!,
          metadata: { importedPatientsCount: importedCount, sourceDate: dump.exportedAt },
        },
      });
    });

    res.json({ success: true, importedPatientsCount: importedCount });
  } catch (error: any) {
    console.error('Import failed:', error);
    res.status(500).json({ error: 'Failed to import clinic data', details: error?.message });
  }
});
