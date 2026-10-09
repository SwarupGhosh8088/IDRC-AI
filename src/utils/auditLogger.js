import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({ actorId, action, entityType, entityId, changes, req }) => {
  try {
    // Sanitize changes (never log passwords/tokens)
    const sanitizedChanges = { ...changes };
    if (sanitizedChanges.passwordHash) delete sanitizedChanges.passwordHash;
    if (sanitizedChanges.tokenHash) delete sanitizedChanges.tokenHash;
    if (sanitizedChanges.before?.passwordHash) delete sanitizedChanges.before.passwordHash;
    if (sanitizedChanges.after?.passwordHash) delete sanitizedChanges.after.passwordHash;

    await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      changes: sanitizedChanges,
      requestId: req?.id || null, // Assuming request ID middleware
      ip: req?.ip || null
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
