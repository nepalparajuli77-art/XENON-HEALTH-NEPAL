import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { securityAuditLogs } from '../db/schema.ts';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  decodedToken?: DecodedIdToken;
}

// In-memory sliding-window rate limiter for sensitive endpoints (login, password reset, AI requests)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

export const rateLimiter = (options: { maxRequests: number; windowMs: number; actionName: string }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const key = `${options.actionName}:${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);
    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (record.count >= options.maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: `Too many requests for ${options.actionName}. Please try again in ${retryAfter} seconds.`,
      });
    }

    record.count += 1;
    next();
  };
};

// Security Audit Logger helper: persists compliance audit logs into Cloud SQL
export async function logSecurityAudit(entry: {
  action: string;
  actorUid?: string;
  actorEmail?: string;
  actorRole?: string;
  targetResource: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'DENIED' | 'ERROR';
  details?: string;
}) {
  try {
    await db.insert(securityAuditLogs).values({
      action: entry.action,
      actorUid: entry.actorUid || 'anonymous',
      actorEmail: entry.actorEmail || 'unknown',
      actorRole: entry.actorRole || 'patient',
      targetResource: entry.targetResource,
      ipAddress: entry.ipAddress || '127.0.0.1',
      status: entry.status,
      details: entry.details || '',
    });
  } catch (err) {
    // Non-blocking log failure
    console.error('Audit log write error:', err);
  }
}

// requireAuth middleware: Validates Firebase ID Token or dev-session header
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const devUserHeader = req.headers['x-user-id'] as string;
  const devRoleHeader = (req.headers['x-user-role'] as string) || 'patient';
  const devEmailHeader = (req.headers['x-user-email'] as string) || '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      req.decodedToken = decoded;
      req.user = {
        uid: decoded.uid,
        email: decoded.email || '',
        role: (decoded.role as any) || (devRoleHeader as any) || 'patient',
      };
      return next();
    } catch (err: any) {
      // If token verify fails, check if dev fallback header is valid for local testing
      if (devUserHeader) {
        req.user = {
          uid: devUserHeader,
          email: devEmailHeader || `${devUserHeader}@xenonaid.np`,
          role: devRoleHeader as any,
        };
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized: Invalid authentication credentials' });
    }
  }

  // Allow x-user-id in dev/applet context
  if (devUserHeader) {
    req.user = {
      uid: devUserHeader,
      email: devEmailHeader || `${devUserHeader}@xenonaid.np`,
      role: devRoleHeader as any,
    };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Authentication required to access clinical and patient records' });
};

// requireRole: Strict server-side RBAC check (P0 Security checklist)
export const requireRole = (allowedRoles: Array<'patient' | 'doctor' | 'admin'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityAudit({
        action: 'RBAC_ACCESS_DENIED',
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        targetResource: req.originalUrl,
        status: 'DENIED',
        details: `Required roles: [${allowedRoles.join(', ')}], found: ${req.user.role}`,
      });
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this clinical action' });
    }

    next();
  };
};

// requireRecordOwnership: Ensures patients can ONLY access their own records (P0 Security checklist)
export const requireRecordOwnership = (getRecordOwnerUid: (req: AuthRequest) => string | undefined) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Not authenticated' });
    }

    // Admins and Doctors can view clinical records
    if (req.user.role === 'admin' || req.user.role === 'doctor') {
      return next();
    }

    const ownerUid = getRecordOwnerUid(req);
    if (!ownerUid || ownerUid !== req.user.uid) {
      logSecurityAudit({
        action: 'PATIENT_RECORD_OWNERSHIP_VIOLATION',
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        targetResource: req.originalUrl,
        status: 'DENIED',
        details: `Attempted access to record belonging to: ${ownerUid}`,
      });
      return res.status(403).json({ error: 'Forbidden: You can only view and update your own patient records' });
    }

    next();
  };
};
