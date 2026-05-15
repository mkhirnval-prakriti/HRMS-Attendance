/**
 * Audit Logging — Prakriti Herbs CRM
 * Logs all sensitive actions to DB + console
 */
import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'

export type AuditAction =
  | 'login' | 'logout' | 'login_failed'
  | 'order_create' | 'order_update' | 'order_delete'
  | 'user_create' | 'user_update' | 'user_delete'
  | 'dealer_create' | 'dealer_update' | 'dealer_delete'
  | 'bulk_upload' | 'bulk_action'
  | 'export_data'
  | 'settings_update'
  | 'password_change'

export interface AuditContext {
  userId:     string
  userEmail?: string
  action:     AuditAction
  resource?:  string
  resourceId?: string | number
  details?:   Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(ctx: AuditContext): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId:     ctx.userId,
      userEmail:  ctx.userEmail ?? null,
      action:     ctx.action,
      resource:   ctx.resource ?? null,
      resourceId: ctx.resourceId ? String(ctx.resourceId) : null,
      details:    ctx.details ? JSON.stringify(ctx.details) : null,
      ipAddress:  ctx.ipAddress ?? null,
      userAgent:  ctx.userAgent ?? null,
      createdAt:  new Date(),
    })
  } catch (err) {
    // Never let audit logging break the main flow
    console.error('[Audit] Failed to log:', err)
  }
}

// Extract IP from request
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

// Extract user agent
export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') ?? 'unknown'
}
