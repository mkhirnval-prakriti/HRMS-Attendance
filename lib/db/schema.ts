import {
  pgTable, serial, varchar, text, integer, decimal,
  timestamp, date, boolean, pgEnum, index, uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── Enums ──────────────────────────────────────────────────
export const roleEnum = pgEnum('role', ['Admin', 'User', 'ZM', 'Field'])

export const orderStatusEnum = pgEnum('order_status', [
  'New', 'Confirmed', 'In Transit', 'Delivered', 'Pending', 'Callback',
  'GPO', 'GPO Done', 'GPO Delivered', 'GPO Pending', 'Cancelled',
  'Future Delivery', 'Confirm Pending', 'Final Cancel',
  'Confirm Cancel', 'Cancel Pending', 'UNA', 'Dealer Cancel',
])

export const paymentStatusEnum = pgEnum('payment_status', ['Pending', 'Completed'])

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'Present', 'Absent', 'Half Day', 'Leave', 'Holiday', 'WFH',
])

export const leaveTypeEnum = pgEnum('leave_type', [
  'Casual', 'Sick', 'Earned', 'Maternity', 'Paternity', 'LWP',
])

export const leaveStatusEnum = pgEnum('leave_status', [
  'Pending', 'Approved', 'Rejected', 'Cancelled',
])

// ── Users ──────────────────────────────────────────────────
export const users = pgTable('users', {
  id:          serial('id').primaryKey(),
  supabaseId:  varchar('supabase_id',  { length: 255 }).unique(),
  name:        varchar('name',         { length: 255 }).notNull(),
  email:       varchar('email',        { length: 255 }).notNull().unique(),
  phone:       varchar('phone',        { length: 20 }),
  role:        roleEnum('role').default('User').notNull(),
  zmId:        integer('zm_id'),
  isActive:    boolean('is_active').default(true).notNull(),
  joinDate:    date('join_date'),
  department:  varchar('department', { length: 100 }),
  designation: varchar('designation', { length: 100 }),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  emailIdx:     uniqueIndex('users_email_idx').on(t.email),
  supabaseIdx:  uniqueIndex('users_supabase_idx').on(t.supabaseId),
  roleIdx:      index('users_role_idx').on(t.role),
}))

// ── Orders ─────────────────────────────────────────────────
export const orders = pgTable('orders', {
  id:            serial('id').primaryKey(),
  orderId:       varchar('order_id', { length: 50 }).unique().notNull(),
  name:          varchar('name', { length: 255 }).notNull(),
  phone:         varchar('phone', { length: 20 }).notNull(),
  email:         varchar('email', { length: 255 }),
  address:       text('address'),
  city:          varchar('city', { length: 100 }),
  state:         varchar('state', { length: 100 }),
  pincode:       varchar('pincode', { length: 10 }),
  product:       varchar('product', { length: 255 }),
  quantity:      integer('quantity').default(1).notNull(),
  amount:        decimal('amount', { precision: 10, scale: 2 }),
  status:        orderStatusEnum('status').default('New').notNull(),
  source:        varchar('source', { length: 100 }),
  agentId:       integer('agent_id'),
  dealerId:      integer('dealer_id'),
  notes:         text('notes'),
  trackingId:    varchar('tracking_id', { length: 100 }),
  courier:       varchar('courier', { length: 100 }),
  paymentStatus: paymentStatusEnum('payment_status').default('Pending'),
  paymentId:     varchar('payment_id', { length: 100 }),
  isDeleted:     boolean('is_deleted').default(false).notNull(),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  orderIdIdx: uniqueIndex('orders_order_id_idx').on(t.orderId),
  phoneIdx:   index('orders_phone_idx').on(t.phone),
  statusIdx:  index('orders_status_idx').on(t.status),
  agentIdx:   index('orders_agent_idx').on(t.agentId),
}))

// ── Dealers ────────────────────────────────────────────────
export const dealers = pgTable('dealers', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 255 }).notNull(),
  phone:     varchar('phone', { length: 20 }),
  email:     varchar('email', { length: 255 }),
  city:      varchar('city', { length: 100 }),
  state:     varchar('state', { length: 100 }),
  address:   text('address'),
  isActive:  boolean('is_active').default(true).notNull(),
  notes:     text('notes'),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Attendance ─────────────────────────────────────────────
export const attendance = pgTable('attendance', {
  id:           serial('id').primaryKey(),
  userId:       integer('user_id').notNull(),
  date:         date('date').notNull(),
  status:       attendanceStatusEnum('status').default('Present').notNull(),
  checkIn:      timestamp('check_in'),
  checkOut:     timestamp('check_out'),
  workHours:    decimal('work_hours', { precision: 4, scale: 2 }),
  location:     varchar('location', { length: 255 }),
  latitude:     decimal('latitude',  { precision: 9, scale: 6 }),
  longitude:    decimal('longitude', { precision: 9, scale: 6 }),
  notes:        text('notes'),
  markedBy:     integer('marked_by'),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  userDateIdx: uniqueIndex('attendance_user_date_idx').on(t.userId, t.date),
  dateIdx:     index('attendance_date_idx').on(t.date),
}))

// ── Leaves ─────────────────────────────────────────────────
export const leaves = pgTable('leaves', {
  id:          serial('id').primaryKey(),
  userId:      integer('user_id').notNull(),
  type:        leaveTypeEnum('type').notNull(),
  status:      leaveStatusEnum('status').default('Pending').notNull(),
  fromDate:    date('from_date').notNull(),
  toDate:      date('to_date').notNull(),
  days:        decimal('days', { precision: 4, scale: 1 }).notNull(),
  reason:      text('reason'),
  approvedBy:  integer('approved_by'),
  approvedAt:  timestamp('approved_at'),
  rejectedReason: text('rejected_reason'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  userIdx:   index('leaves_user_idx').on(t.userId),
  statusIdx: index('leaves_status_idx').on(t.status),
}))

// ── Payroll ────────────────────────────────────────────────
export const payroll = pgTable('payroll', {
  id:            serial('id').primaryKey(),
  userId:        integer('user_id').notNull(),
  month:         integer('month').notNull(),        // 1-12
  year:          integer('year').notNull(),
  basicSalary:   decimal('basic_salary',    { precision: 10, scale: 2 }).notNull(),
  allowances:    decimal('allowances',      { precision: 10, scale: 2 }).default('0'),
  deductions:    decimal('deductions',      { precision: 10, scale: 2 }).default('0'),
  netSalary:     decimal('net_salary',      { precision: 10, scale: 2 }).notNull(),
  workingDays:   integer('working_days').notNull(),
  presentDays:   integer('present_days').notNull(),
  paidLeaves:    integer('paid_leaves').default(0),
  status:        varchar('status', { length: 20 }).default('Draft').notNull(),
  approvedBy:    integer('approved_by'),
  approvedAt:    timestamp('approved_at'),
  notes:         text('notes'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  userMonthYearIdx: uniqueIndex('payroll_user_month_year_idx').on(t.userId, t.month, t.year),
}))

// ── Audit Logs ─────────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id:         serial('id').primaryKey(),
  userId:     varchar('user_id',    { length: 255 }).notNull(),
  userEmail:  varchar('user_email', { length: 255 }),
  action:     varchar('action',     { length: 100 }).notNull(),
  resource:   varchar('resource',   { length: 100 }),
  resourceId: varchar('resource_id',{ length: 100 }),
  details:    jsonb('details'),
  ipAddress:  varchar('ip_address', { length: 45 }),
  userAgent:  text('user_agent'),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  userIdIdx:  index('audit_user_idx').on(t.userId),
  actionIdx:  index('audit_action_idx').on(t.action),
  createdIdx: index('audit_created_idx').on(t.createdAt),
}))

// ── Follow-ups ─────────────────────────────────────────────
export const followUps = pgTable('follow_ups', {
  id:          serial('id').primaryKey(),
  orderId:     integer('order_id').notNull(),
  userId:      integer('user_id').notNull(),
  notes:       text('notes').notNull(),
  followUpAt:  timestamp('follow_up_at'),
  isDone:      boolean('is_done').default(false).notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

// ── Invoices ───────────────────────────────────────────────
export const invoices = pgTable('invoices', {
  id:          serial('id').primaryKey(),
  invoiceNo:   varchar('invoice_no', { length: 50 }).unique().notNull(),
  orderId:     integer('order_id').notNull(),
  amount:      decimal('amount', { precision: 10, scale: 2 }).notNull(),
  tax:         decimal('tax',    { precision: 10, scale: 2 }).default('0'),
  total:       decimal('total',  { precision: 10, scale: 2 }).notNull(),
  status:      varchar('status', { length: 20 }).default('Pending').notNull(),
  dueDate:     date('due_date'),
  paidAt:      timestamp('paid_at'),
  notes:       text('notes'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})


// ── Sources (Lead sources) ─────────────────────────────────
export const sources = pgTable('sources', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 100 }).notNull().unique(),
  isActive:  boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Relations ──────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  orders:     many(orders),
  attendance: many(attendance),
  leaves:     many(leaves),
  payroll:    many(payroll),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  agent:     one(users, { fields: [orders.agentId], references: [users.id] }),
  dealer:    one(dealers, { fields: [orders.dealerId], references: [dealers.id] }),
  followUps: many(followUps),
  invoices:  many(invoices),
}))
