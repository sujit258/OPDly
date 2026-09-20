import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

/**
 * GET /api/v1/reports?range=Today|Week|Month|Custom
 * Aggregate practice analytics strictly scoped to authenticated clinic
 */
reportsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const range = (req.query.range as string) || 'Today';
    const now = new Date();
    let startDate: Date;

    if (range === 'Today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'Week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const visits = await prisma.visit.findMany({
      where: {
        clinicId: req.clinicId!,
        date: { gte: startDate },
        status: 'COMPLETED',
        deletedAt: null,
      },
      include: {
        diagnoses: true,
        bill: true,
      },
    });

    const totalPatients = visits.length;
    const newPatients = visits.filter((v) => v.visitType === 'NEW').length;
    const followUpPatients = visits.filter((v) => v.visitType === 'FOLLOW_UP').length;
    const totalRevenue = visits.reduce((acc, v) => acc + (v.bill ? Number(v.bill.totalAmount) : 0), 0);

    // Calculate top diagnoses for this clinic
    const diagMap = new Map<string, number>();
    for (const v of visits) {
      for (const d of v.diagnoses) {
        diagMap.set(d.name, (diagMap.get(d.name) || 0) + 1);
      }
    }

    const topDiagnoses = Array.from(diagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Daily breakdown for 7-day trend
    const dailyMap = new Map<string, { count: number; revenue: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { count: 0, revenue: 0 });
    }

    for (const v of visits) {
      const key = v.date.toISOString().split('T')[0];
      if (dailyMap.has(key)) {
        const item = dailyMap.get(key)!;
        item.count += 1;
        item.revenue += v.bill ? Number(v.bill.totalAmount) : 0;
      }
    }

    const recentVisitsCountByDay = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      revenue: data.revenue,
    }));

    res.json({
      range,
      totalPatients,
      newPatients,
      followUpPatients,
      totalRevenue,
      topDiagnoses,
      recentVisitsCountByDay,
    });
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ error: 'Failed to calculate practice reports' });
  }
});
