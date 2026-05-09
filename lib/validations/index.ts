import { z } from 'zod'
import { ORDER_STATUSES } from '@/lib/utils'

// ── Auth ──────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// ── Orders ────────────────────────────────────────────────────────────────
export const createOrderSchema = z.object({
  patientName: z.string().min(2, 'Name must be at least 2 characters').max(255),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  altMobile: z.string().regex(/^\d{10}$/).optional().or(z.literal('')),
  address: z.string().min(5, 'Address too short').optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  pincode: z.string().regex(/^\d{6}$/).optional().or(z.literal('')),
  stateId: z.number({ coerce: true }).positive('State is required'),
  districtId: z.number({ coerce: true }).optional(),
  sourceId: z.number({ coerce: true }).optional(),
  amount: z.number({ coerce: true }).min(0).optional(),
  quantity: z.number({ coerce: true }).min(1).default(1),
  status: z.enum(ORDER_STATUSES).default('New'),
  followUpDate: z.string().optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  dealerId: z.number({ coerce: true }).optional(),
  leadOwnerId: z.number({ coerce: true }).optional(),
})

export const updateOrderSchema = createOrderSchema.partial().extend({
  reason: z.string().optional(),
})

export const bulkStatusSchema = z.object({
  ids: z.array(z.number()).min(1, 'Select at least one order'),
  status: z.enum(ORDER_STATUSES),
  reason: z.string().optional(),
})

// ── Users ─────────────────────────────────────────────────────────────────
export const createUserSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/).optional().or(z.literal('')),
  role: z.enum(['Admin', 'User', 'ZM', 'Field']),
  zmId: z.number({ coerce: true }).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const updateUserSchema = createUserSchema.omit({ password: true, email: true }).partial()

// ── Dealers ───────────────────────────────────────────────────────────────
export const createDealerSchema = z.object({
  name: z.string().min(2).max(255),
  contactPerson: z.string().optional().or(z.literal('')),
  mobile: z.string().regex(/^\d{10}$/).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  stateId: z.number({ coerce: true }).optional(),
  districtId: z.number({ coerce: true }).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional().or(z.literal('')),
})

export const updateDealerSchema = createDealerSchema.partial()

// ── Invoices ──────────────────────────────────────────────────────────────
export const createInvoiceSchema = z.object({
  dealerId: z.number({ coerce: true }).positive('Dealer is required'),
  invoiceDate: z.string().min(1, 'Invoice date required'),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(z.object({
    itemId: z.number({ coerce: true }).optional(),
    itemName: z.string().min(1),
    skuCode: z.string().optional().or(z.literal('')),
    qty: z.number({ coerce: true }).min(1),
    rate: z.number({ coerce: true }).min(0),
    discount: z.number({ coerce: true }).min(0).default(0),
  })).min(1, 'At least one item required').optional(),
})

// ── Sources ───────────────────────────────────────────────────────────────
export const createSourceSchema = z.object({
  name: z.string().min(1).max(100),
})

// ── Payments ──────────────────────────────────────────────────────────────
export const createPaymentSchema = z.object({
  dealerId: z.number({ coerce: true }).positive('Dealer is required'),
  invoiceId: z.number({ coerce: true }).optional(),
  amount: z.number({ coerce: true }).positive('Amount must be positive'),
  paymentDate: z.string().min(1, 'Payment date required'),
  paymentMode: z.enum(['Cash', 'NEFT', 'RTGS', 'Cheque', 'UPI', 'Other']).optional(),
  reference: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

// ── Items ─────────────────────────────────────────────────────────────────
export const createItemSchema = z.object({
  skuCode: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  uom: z.string().default('Pcs'),
  stock: z.number({ coerce: true }).min(0).default(0),
  price: z.number({ coerce: true }).min(0).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreateDealerInput = z.infer<typeof createDealerSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type CreateItemInput = z.infer<typeof createItemSchema>
