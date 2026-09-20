import { prisma } from '../db.js';

export interface LogAuditParams {
  clinicId: string;
  doctorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Lightweight, non-blocking audit logging for key clinical and financial events.
 * Failures in audit writing are safely caught to avoid failing primary medical workflows.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        clinicId: params.clinicId,
        doctorId: params.doctorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error(`[AUDIT_ERROR] Failed to record ${params.action} on ${params.entityType}:`, error);
  }
}
