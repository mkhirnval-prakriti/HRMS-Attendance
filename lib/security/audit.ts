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
  | 'attendance_create' | 'attendance_update'
  | 'leave_create' | 'leave_approve' | 'leave_reject'
  | 'payroll_create' | 'payroll_approve'

export interface AuditContext {
  userId:      string
  userEmail?:  string
  action:      AuditAction
  resource?:   string
  resourceId?: string | number
  details?:    Record<string, unknown>
  ipAddress?:  string
  userAgent?:  string
}

export async function logAudit(ctx: AuditContext): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId:     ctx.userId,
      userEmail:  ctx.userEmail ?? null,
      action:     ctx.action,
      resource:   ctx.resource ?? null,
      resourceId: ctx.resourceId != null ? String(ctx.resourceId) : null,
      details:    ctx.details ?? null,
      ipAddress:  ctx.ipAddress ?? null,
      userAgent:  ctx.userAgent ?? null,
      createdAt:  new Date(),
    })
  } catch (err) {
    // Never throw — audit failure should not break the request
    console.error('[Audit] Failed to log action:', ctx.action, err)
  }
}

/** Fire-and-forget audit — does not await */
export function auditBackground(ctx: AuditContext): void {
  logAudit(ctx).catch(() => {})
}
