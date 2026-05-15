/**
 * Input Validation & Sanitization — Prakriti Herbs CRM
 * Wraps zod validation with sanitization
 */
import { z } from 'zod'
import { NextResponse } from 'next/server'

// ── Sanitizers ──────────────────────────────────────────────
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')          // strip HTML tags
    .replace(/javascript:/gi, '')   // strip JS injection
    .replace(/on\w+=/gi, '')        // strip event handlers
    .substring(0, 10_000)           // max length
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9+\- ]/g, '').trim().substring(0, 20)
}

export function sanitizePincode(pin: string): string {
  return pin.replace(/[^0-9]/g, '').substring(0, 6)
}

// ── Zod schemas (extended with sanitization) ────────────────
export const safeString = z.string()
  .min(1, 'Required')
  .max(1000)
  .transform(sanitizeString)

export const safePhone = z.string()
  .transform(sanitizePhone)
  .refine(v => v.length >= 10, 'Invalid phone')

export const safePincode = z.string()
  .transform(sanitizePincode)
  .refine(v => v.length === 6, 'Pincode must be 6 digits')

export const safeEmail = z.string()
  .email('Invalid email')
  .toLowerCase()
  .max(254)

// ── Pagination validator ─────────────────────────────────────
export const paginationSchema = z.object({
  page:     z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

// ── API response helpers ─────────────────────────────────────
export function validationError(errors: z.ZodError) {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: errors.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    },
    { status: 400 }
  )
}

export function parseBody<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: NextResponse } {
  const result = schema.safeParse(data)
  if (!result.success) {
    return { success: false, error: validationError(result.error) }
  }
  return { success: true, data: result.data }
}
