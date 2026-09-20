import express from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.js';
import { patientsRouter } from './routes/patients.js';
import { consultationsRouter } from './routes/consultations.js';
import { billingRouter } from './routes/billing.js';
import { reportsRouter } from './routes/reports.js';
import { clinicRouter } from './routes/clinic.js';

export const app = express();

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get(['/api/v1/health', '/health'], (_req, res) => {
  res.json({
    status: 'healthy',
    app: 'OPDly Serverless Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Create API v1 Router
const v1Router = express.Router();
v1Router.use('/auth', authRouter);
v1Router.use('/patients', patientsRouter);
v1Router.use('/consultations', consultationsRouter);
v1Router.use('/billing', billingRouter);
v1Router.use('/reports', reportsRouter);
v1Router.use('/clinic', clinicRouter);

// Mount under both /api/v1 and root for Vercel Serverless Function compatibility
app.use('/api/v1', v1Router);
app.use(v1Router);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[UNHANDLED_SERVERLESS_ERROR]', err);
  res.status(500).json({ error: 'Internal server error', message: err?.message });
});

export default app;
