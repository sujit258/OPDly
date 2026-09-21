import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';

export const consultationsRouter = Router();


// Safe Enum Normalizers to bridge frontend DTO types with Prisma PostgreSQL enums.
// Returns normalized enum string or null if the value is invalid.
function normalizeSeverity(severity?: string | null): 'MILD' | 'MODERATE' | 'SEVERE' | null {
  if (!severity) return 'MODERATE';
  const upper = severity.trim().toUpperCase();
  if (upper === 'MILD' || upper === 'MODERATE' || upper === 'SEVERE') {
    return upper;
  }
  return null;
}

function normalizeMedicineForm(form?: string | null): 'TABLET' | 'SYRUP' | 'CAPSULE' | 'INJECTION' | 'DROPS' | 'OINTMENT' | 'OTHER' | null {
  if (!form) return 'TABLET';
  const upper = form.trim().toUpperCase();
  const valid = ['TABLET', 'SYRUP', 'CAPSULE', 'INJECTION', 'DROPS', 'OINTMENT', 'OTHER'] as const;
  return valid.includes(upper as any) ? (upper as any) : null;
}

function normalizeMedicineTiming(timing?: string | null): 'AFTER_FOOD' | 'BEFORE_FOOD' | 'WITH_FOOD' | 'AT_NIGHT' | 'EMPTY_STOMACH' | null {
  if (!timing) return 'AFTER_FOOD';
  const normalized = timing.trim().toUpperCase().replace(/\s+/g, '_');
  const valid = ['AFTER_FOOD', 'BEFORE_FOOD', 'WITH_FOOD', 'AT_NIGHT', 'EMPTY_STOMACH'] as const;
  return valid.includes(normalized as any) ? (normalized as any) : null;
}

function normalizePaymentMethod(method?: string | null): 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'OTHER' | null {
  if (!method) return 'UPI';
  const upper = method.trim().toUpperCase();
  const valid = ['CASH', 'UPI', 'CARD', 'NET_BANKING', 'OTHER'] as const;
  return valid.includes(upper as any) ? (upper as any) : null;
}

consultationsRouter.use(requireAuth);
consultationsRouter.use(requireCsrf);

/**
 * GET /api/v1/consultations/patients/:patientId/visits
 * List all past visits for patient, strictly clinic-scoped
 */
consultationsRouter.get('/patients/:patientId/visits', async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = String(req.params.patientId);
    // Verify patient belongs to caller's clinic
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: req.clinicId!, deletedAt: null },
    });

    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const visits = await prisma.visit.findMany({
      where: {
        clinicId: req.clinicId!,
        patientId,
        deletedAt: null,
      },
      include: {
        vitals: true,
        symptoms: true,
        diagnoses: true,
        investigations: true,
        prescription: {
          include: { medicines: true },
        },
        bill: {
          include: { payments: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(visits);
  } catch (error) {
    console.error('Fetch patient visits error:', error);
    res.status(500).json({ error: 'Failed to fetch patient visits' });
  }
});

/**
 * GET /api/v1/consultations/patients/:patientId/previous-prescription
 * 1-click previous prescription query, strictly clinic-scoped
 */
consultationsRouter.get('/patients/:patientId/previous-prescription', async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = String(req.params.patientId);
    const prevRx = await prisma.prescription.findFirst({
      where: {
        clinicId: req.clinicId!,
        patientId,
      },
      include: {
        medicines: { orderBy: { sortOrder: 'asc' } },
        visit: {
          include: { diagnoses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!prevRx) {
      res.json(null);
      return;
    }

    res.json({
      id: prevRx.id,
      visitId: prevRx.visitId,
      patientId: prevRx.patientId,
      date: prevRx.date.toISOString().split('T')[0],
      diagnoses: prevRx.visit?.diagnoses || [],
      medicines: prevRx.medicines.map((m) => ({
        id: m.id,
        medicineName: m.medicineName,
        genericName: m.genericName || undefined,
        form: m.form,
        dosage: m.dosage,
        frequency: m.frequency,
        timing: m.timing,
        duration: m.duration,
        instructions: m.instructions || undefined,
      })),
      advices: (prevRx.generalAdvice as string[]) || [],
      followUpText: prevRx.followUpText,
      instructions: prevRx.instructions,
      createdAt: prevRx.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Fetch previous prescription error:', error);
    res.status(500).json({ error: 'Failed to fetch previous prescription' });
  }
});

/**
 * GET /api/v1/consultations/visits/:visitId
 * Strict tenant isolation: returns 404 if visit belongs to another clinic
 */
consultationsRouter.get('/visits/:visitId', async (req: Request, res: Response): Promise<void> => {
  try {
    const visitId = String(req.params.visitId);
    const visit = await prisma.visit.findFirst({
      where: {
        id: visitId,
        clinicId: req.clinicId!,
        deletedAt: null,
      },
      include: {
        vitals: true,
        symptoms: true,
        diagnoses: true,
        investigations: true,
        prescription: {
          include: { medicines: true },
        },
        bill: {
          include: { payments: true },
        },
      },
    });

    if (!visit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }

    res.json(visit);
  } catch (error) {
    console.error('Fetch visit by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch visit' });
  }
});

/**
 * POST /api/v1/consultations/complete
 * Atomic consultation completion single transaction:
 * If any of Visit, Vitals, Symptoms, Diagnoses, Investigations, Prescription,
 * PrescriptionMedicines, Bill, Payment, patient statistics update, or AuditLog fails,
 * the entire transaction rolls back and the consultation draft remains intact and recoverable.
 */
consultationsRouter.post('/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patientId,
      symptoms = [],
      clinicalNotes,
      vitals,
      diagnoses = [],
      medicines = [],
      investigations = [],
      advices = [],
      followUp = 'After 7 days',
      consultationFee = 500,
      discount = 0,
      paymentMethod = 'UPI',
      markAsPaid = true,
      billingNotes,
    } = req.body;

    // Strict tenant isolation: Ensure patient belongs to caller's clinic
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: req.clinicId!, deletedAt: null },
    });
    if (!patient) {
      res.status(404).json({ error: 'Patient not found in this clinic' });
      return;
    }

    // Validate Symptoms
    for (const s of symptoms) {
      if (s.severity && !normalizeSeverity(s.severity)) {
        res.status(400).json({ error: `Invalid symptom severity: '${s.severity}'. Expected Mild, Moderate, or Severe.` });
        return;
      }
    }

    // Validate Medicines
    for (const m of medicines) {
      if (m.form && !normalizeMedicineForm(m.form)) {
        res.status(400).json({ error: `Invalid medicine form: '${m.form}'.` });
        return;
      }
      if (m.timing && !normalizeMedicineTiming(m.timing)) {
        res.status(400).json({ error: `Invalid medicine timing: '${m.timing}'.` });
        return;
      }
    }

    // Validate Payment Method
    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
    if (!normalizedPaymentMethod) {
      res.status(400).json({ error: `Invalid payment method: '${paymentMethod}'.` });
      return;
    }

    // Determine visit number & type
    const totalExisting = await prisma.visit.count({ where: { clinicId: req.clinicId! } });
    const visitNumber = `V-${new Date().getFullYear()}-${String(totalExisting + 1).padStart(4, '0')}`;
    const visitType: 'NEW' | 'FOLLOW_UP' = patient.totalVisitsCount > 0 ? 'FOLLOW_UP' : 'NEW';

    const totalBill = Math.max(0, consultationFee - discount);
    const primaryDiagName = diagnoses[0]?.name || 'Clinical Evaluation';

    // Execute atomic Prisma transaction
    const completedVisitId = await prisma.$transaction(async (tx) => {
      // 1. Create Visit Record
      const visit = await tx.visit.create({
        data: {
          clinicId: req.clinicId!,
          doctorId: req.doctor!.id,
          patientId,
          visitNumber,
          visitType,
          status: 'COMPLETED',
          clinicalNotes: clinicalNotes || null,
          followUpText: followUp,
          completedAt: new Date(),
        },
      });

      // 2. Create Vitals if provided
      if (vitals && Object.keys(vitals).length > 0) {
        await tx.vital.create({
          data: {
            visitId: visit.id,
            bpSystolic: vitals.bpSystolic ? Number(vitals.bpSystolic) : null,
            bpDiastolic: vitals.bpDiastolic ? Number(vitals.bpDiastolic) : null,
            pulse: vitals.pulse ? Number(vitals.pulse) : null,
            temperature: vitals.temperature ? Number(vitals.temperature) : null,
            spO2: vitals.spO2 ? Number(vitals.spO2) : null,
            weight: vitals.weight ? Number(vitals.weight) : null,
          },
        });
      }

      // 3. Create Symptoms
      for (const s of symptoms) {
        await tx.visitSymptom.create({
          data: {
            visitId: visit.id,
            name: s.name,
            duration: s.duration,
            severity: normalizeSeverity(s.severity) || "MODERATE",
            notes: s.notes || null,
          },
        });
      }

      // 4. Create Diagnoses
      for (const d of diagnoses) {
        await tx.visitDiagnosis.create({
          data: {
            visitId: visit.id,
            name: d.name,
            code: d.code || null,
            isPrimary: d.isPrimary !== undefined ? d.isPrimary : true,
          },
        });
      }

      // 5. Create Investigations
      for (const inv of investigations) {
        await tx.visitInvestigation.create({
          data: {
            visitId: visit.id,
            testName: inv.testName,
            instructions: inv.instructions || null,
            cost: inv.cost ? Number(inv.cost) : 0,
          },
        });
      }

      // 6. Create Prescription (if medicines prescribed or advice provided)
      const rxCount = await tx.prescription.count({ where: { clinicId: req.clinicId! } });
      const prescriptionNumber = `RX-${new Date().getFullYear()}-${String(rxCount + 1).padStart(4, '0')}`;

      const prescription = await tx.prescription.create({
        data: {
          clinicId: req.clinicId!,
          doctorId: req.doctor!.id,
          patientId,
          visitId: visit.id,
          prescriptionNumber,
          date: new Date(),
          generalAdvice: advices,
          followUpText: followUp,
          signatureApplied: true,
          signedAt: new Date(),
        },
      });

      for (let i = 0; i < medicines.length; i++) {
        const m = medicines[i];
        await tx.prescriptionMedicine.create({
          data: {
            prescriptionId: prescription.id,
            medicineName: m.medicineName,
            genericName: m.genericName || null,
            form: normalizeMedicineForm(m.form) || "TABLET",
            dosage: m.dosage || '1 tablet',
            frequency: m.frequency || '1-0-1',
            timing: normalizeMedicineTiming(m.timing) || "AFTER_FOOD",
            duration: m.duration || '5 days',
            instructions: m.instructions || null,
            sortOrder: i,
          },
        });
      }

      // 7. Create Bill & Payment
      const billCount = await tx.bill.count({ where: { clinicId: req.clinicId! } });
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(billCount + 1).padStart(4, '0')}`;

      const bill = await tx.bill.create({
        data: {
          clinicId: req.clinicId!,
          visitId: visit.id,
          patientId,
          invoiceNumber,
          consultationFee,
          discount,
          totalAmount: totalBill,
          paidAmount: markAsPaid ? totalBill : 0,
          status: markAsPaid ? 'PAID' : 'PENDING',
          notes: billingNotes || null,
        },
      });

      if (markAsPaid && totalBill > 0) {
        await tx.payment.create({
          data: {
            billId: bill.id,
            amount: totalBill,
            method: normalizedPaymentMethod,
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      }

      // 8. Update Patient Summary Stats
      await tx.patient.update({
        where: { id: patientId },
        data: {
          totalVisitsCount: { increment: 1 },
          lastVisitDate: new Date(),
          lastDiagnosis: primaryDiagName,
        },
      });

      // 9. Required AuditLog inside transaction:
      // If audit logging fails, transaction will rollback
      await tx.auditLog.create({
        data: {
          clinicId: req.clinicId!,
          doctorId: req.doctor!.id,
          action: 'VISIT_COMPLETED',
          entityType: 'Visit',
          entityId: visit.id,
          metadata: { patientId, visitNumber, totalBill, primaryDiagName },
        },
      });

      // 10. Delete transient draft ONLY after all clinical and billing items have successfully written
      await tx.consultationDraft.deleteMany({
        where: {
          doctorId: req.doctor!.id,
          patientId,
        },
      });

      return visit.id;
    });

    // Return complete visit with all relations
    const fullResult = await prisma.visit.findUnique({
      where: { id: completedVisitId },
      include: {
        vitals: true,
        symptoms: true,
        diagnoses: true,
        investigations: true,
        prescription: {
          include: { medicines: true },
        },
        bill: {
          include: { payments: true },
        },
      },
    });

    const formattedResult = fullResult
      ? {
          ...fullResult,
          bill: fullResult.bill
            ? {
                ...fullResult.bill,
                payment: fullResult.bill.payments?.[0] || null,
              }
            : null,
        }
      : null;

    res.status(201).json(formattedResult);
  } catch (error: any) {
    console.error('Complete consultation error (rolled back):', error);
    // Draft remains intact and recoverable in PostgreSQL
    res.status(500).json({
      error: 'Failed to complete consultation. Clinical records were rolled back; consultation draft was preserved.',
      details: error?.message,
    });
  }
});

/**
 * Transient Consultation Draft Endpoints
 * GET /api/v1/consultations/draft
 */
consultationsRouter.get('/draft', async (req: Request, res: Response): Promise<void> => {
  try {
    const draft = await prisma.consultationDraft.findFirst({
      where: { doctorId: req.doctor!.id, clinicId: req.clinicId! },
      orderBy: { updatedAt: 'desc' },
    });

    if (!draft) {
      res.json(null);
      return;
    }

    // Fetch patient display info scoped to authenticated clinic
    const patient = await prisma.patient.findFirst({
      where: {
        id: draft.patientId,
        clinicId: req.clinicId!,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
      },
    });

    const draftData =
      draft.draftData && typeof draft.draftData === 'object'
        ? {
            ...draft.draftData,
            patientName: patient?.name || (draft.draftData as any).patientName || 'this patient',
            patient: patient || null,
          }
        : draft.draftData;

    res.json(draftData);
  } catch (error) {
    console.error('Fetch draft error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation draft' });
  }
});

/**
 * PUT /api/v1/consultations/draft
 */
consultationsRouter.put('/draft', async (req: Request, res: Response): Promise<void> => {
  try {
    const draftData = req.body;
    if (!draftData || !draftData.patientId) {
      res.status(400).json({ error: 'patientId is required in draft' });
      return;
    }

    // Verify patient belongs to caller's clinic
    const patient = await prisma.patient.findFirst({
      where: { id: draftData.patientId, clinicId: req.clinicId!, deletedAt: null },
    });
    if (!patient) {
      res.status(404).json({ error: 'Patient does not belong to clinic' });
      return;
    }

    await prisma.consultationDraft.upsert({
      where: {
        doctorId_patientId: {
          doctorId: req.doctor!.id,
          patientId: draftData.patientId,
        },
      },
      create: {
        clinicId: req.clinicId!,
        doctorId: req.doctor!.id,
        patientId: draftData.patientId,
        draftData,
      },
      update: {
        draftData,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ error: 'Failed to save consultation draft' });
  }
});

/**
 * DELETE /api/v1/consultations/draft
 */
consultationsRouter.delete('/draft', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.consultationDraft.deleteMany({
      where: { doctorId: req.doctor!.id, clinicId: req.clinicId! },
    });
    res.status(204).end();
  } catch (error) {
    console.error('Clear draft error:', error);
    res.status(500).json({ error: 'Failed to clear consultation draft' });
  }
});

/**
 * GET /api/v1/consultations/visits
 * All completed visits for authenticated clinic
 */
consultationsRouter.get('/visits', async (req: Request, res: Response): Promise<void> => {
  try {
    const visits = await prisma.visit.findMany({
      where: {
        clinicId: req.clinicId!,
        status: 'COMPLETED',
        deletedAt: null,
      },
      include: {
        diagnoses: true,
        prescription: true,
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
    res.json(visits);
  } catch (error) {
    console.error('Fetch all visits error:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});
