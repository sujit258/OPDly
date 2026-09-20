import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';

export const billingRouter = Router();

billingRouter.use(requireAuth);
billingRouter.use(requireCsrf);

/**
 * GET /api/v1/billing/bills/:billId
 * Strict tenant isolation: returns 404 if bill does not belong to authenticated clinic
 */
billingRouter.get('/bills/:billId', async (req: Request, res: Response): Promise<void> => {
  try {
    const billId = String(req.params.billId);
    const bill = await prisma.bill.findFirst({
      where: {
        id: billId,
        clinicId: req.clinicId!,
      },
      include: {
        payments: true,
        patient: true,
      },
    });

    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    res.json(bill);
  } catch (error) {
    console.error('Fetch bill error:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

/**
 * GET /api/v1/billing/patients/:patientId/bills
 * Scoped to authenticated clinic
 */
billingRouter.get('/patients/:patientId/bills', async (req: Request, res: Response): Promise<void> => {
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

    const bills = await prisma.bill.findMany({
      where: {
        clinicId: req.clinicId!,
        patientId,
      },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(bills);
  } catch (error) {
    console.error('Fetch patient bills error:', error);
    res.status(500).json({ error: 'Failed to fetch bills for patient' });
  }
});

/**
 * GET /api/v1/billing/daily-summary?date=YYYY-MM-DD
 * Scoped strictly to authenticated clinic
 */
billingRouter.get('/daily-summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const payments = await prisma.payment.findMany({
      where: {
        bill: {
          clinicId: req.clinicId!,
        },
        paidAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'PAID',
      },
    });

    let totalRevenue = 0;
    let cashAmount = 0;
    let upiAmount = 0;
    let cardAmount = 0;

    for (const p of payments) {
      const amt = Number(p.amount);
      totalRevenue += amt;
      if (p.method === 'CASH') cashAmount += amt;
      else if (p.method === 'UPI') upiAmount += amt;
      else if (p.method === 'CARD') cardAmount += amt;
    }

    const completedVisits = await prisma.visit.count({
      where: {
        clinicId: req.clinicId!,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
    });

    res.json({
      totalRevenue,
      completedCount: completedVisits,
      cashAmount,
      upiAmount,
      cardAmount,
    });
  } catch (error) {
    console.error('Fetch daily summary error:', error);
    res.status(500).json({ error: 'Failed to fetch billing summary' });
  }
});
