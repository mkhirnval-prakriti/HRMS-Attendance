import {
  pgTable, serial, varchar, text, integer, decimal,
  timestamp, date, boolean, pgEnum, index, uniqueIndex
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const roleEnum = pgEnum('role', ['Admin', 'User', 'ZM', 'Field'])
export const orderStatusEnum = pgEnum('order_status', [
  'New','Confirmed','In Transit','Delivered','Pending','Callback',
  'GPO','GPO Done','GPO Delivered','GPO Pending','Cancelled',
  'Future Delivery','Confirm Pending','Final Cancel',
  'Confirm Cancel','Cancel Pending','UNA','Dealer Cancel'
])
export const paymentStatusEnum = pgEnum('payment_status', ['Pending','Completed'])

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  supabaseId: varchar('supabase_id', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  role: roleEnum('role').default('User').notNull(),
  zmId: integer('zm_id'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  emailIdx: uniqueIndex('users_email_idx').on(t.email),
  roleIdx: index('users_role_idx').on(t.role),
}))

export const states = pgTable('states', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
})

export const districts = pgTable('districts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  stateId: integer('state_id').notNull().references(() => states.id),
}, (t) => ({ stateIdx: index('districts_state_idx').on(t.stateId) }))

export const sources = pgTable('sources', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  isActive: boolean('is_active').default(true),
})

export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  skuCode: varchar('sku_code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  uom: varchar('uom', { length: 50 }).default('Pcs'),
  stock: integer('stock').default(0),
  price: decimal('price', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const dealers = pgTable('dealers', {
  id: serial('id').primaryKey(),
  dealerCode: varchar('dealer_code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  mobile: varchar('mobile', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  stateId: integer('state_id').references(() => states.id),
  districtId: integer('district_id').references(() => districts.id),
  pincode: varchar('pincode', { length: 10 }),
  isActive: boolean('is_active').default(true),
  balance: decimal('balance', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  codeIdx: uniqueIndex('dealers_code_idx').on(t.dealerCode),
  stateIdx: index('dealers_state_idx').on(t.stateId),
}))

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderId: varchar('order_id', { length: 30 }).notNull().unique(),
  dateTime: timestamp('date_time').defaultNow().notNull(),
  customerName: varchar('customer_name', { length: 255 }),
  contactNumber: varchar('contact_number', { length: 20 }).notNull(),
  productName: varchar('product_name', { length: 255 }),
  itemId: integer('item_id').references(() => items.id),
  quantity: integer('quantity').default(1),
  price: decimal('price', { precision: 10, scale: 2 }),
  paymentStatus: paymentStatusEnum('payment_status').default('Pending'),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  tehsil: varchar('tehsil', { length: 100 }),
  stateId: integer('state_id').references(() => states.id),
  districtId: integer('district_id').references(() => districts.id),
  pincode: varchar('pincode', { length: 10 }),
  status: orderStatusEnum('status').default('New').notNull(),
  reason: varchar('reason', { length: 100 }),
  remark: text('remark'),
  followUpDate: date('follow_up_date'),
  sourceId: integer('source_id').references(() => sources.id),
  leadOwnerId: integer('lead_owner_id').references(() => users.id),
  zmId: integer('zm_id').references(() => users.id),
  dealerId: integer('dealer_id').references(() => dealers.id),
  agentAssignDate: date('agent_assign_date'),
  dealerAssignDate: date('dealer_assign_date'),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  orderIdIdx: uniqueIndex('orders_order_id_idx').on(t.orderId),
  statusIdx: index('orders_status_idx').on(t.status),
  contactIdx: index('orders_contact_idx').on(t.contactNumber),
  ownerIdx: index('orders_owner_idx').on(t.leadOwnerId),
  dealerIdx: index('orders_dealer_idx').on(t.dealerId),
  sourceIdx: index('orders_source_idx').on(t.sourceId),
  dateIdx: index('orders_date_idx').on(t.dateTime),
  followUpIdx: index('orders_followup_idx').on(t.followUpDate),
}))

export const orderHistory = pgTable('order_history', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  status: varchar('status', { length: 50 }).notNull(),
  remark: text('remark'),
  reason: varchar('reason', { length: 100 }),
  followUpDate: date('follow_up_date'),
  addedById: integer('added_by_id').references(() => users.id),
  addedByName: varchar('added_by_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  orderIdx: index('history_order_idx').on(t.orderId),
  dateIdx: index('history_date_idx').on(t.createdAt),
}))

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNo: varchar('invoice_no', { length: 30 }).notNull().unique(),
  dealerId: integer('dealer_id').notNull().references(() => dealers.id),
  invoiceDate: date('invoice_date').notNull(),
  grandTotal: decimal('grand_total', { precision: 12, scale: 2 }).default('0'),
  paid: decimal('paid', { precision: 12, scale: 2 }).default('0'),
  balance: decimal('balance', { precision: 12, scale: 2 }).default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({ dealerIdx: index('invoices_dealer_idx').on(t.dealerId) }))

export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id),
  itemId: integer('item_id').references(() => items.id),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  rate: decimal('rate', { precision: 10, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
})

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  dealerId: integer('dealer_id').notNull().references(() => dealers.id),
  invoiceId: integer('invoice_id').references(() => invoices.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  paymentDate: date('payment_date').notNull(),
  paymentMode: varchar('payment_mode', { length: 50 }),
  reference: varchar('reference', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entity: varchar('entity', { length: 50 }).notNull(),
  entityId: integer('entity_id'),
  details: text('details'),
  ip: varchar('ip', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({ userIdx: index('audit_user_idx').on(t.userId), dateIdx: index('audit_date_idx').on(t.createdAt) }))

// Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  state: one(states, { fields: [orders.stateId], references: [states.id] }),
  district: one(districts, { fields: [orders.districtId], references: [districts.id] }),
  source: one(sources, { fields: [orders.sourceId], references: [sources.id] }),
  leadOwner: one(users, { fields: [orders.leadOwnerId], references: [users.id] }),
  zm: one(users, { fields: [orders.zmId], references: [users.id] }),
  dealer: one(dealers, { fields: [orders.dealerId], references: [dealers.id] }),
  history: many(orderHistory),
  item: one(items, { fields: [orders.itemId], references: [items.id] }),
}))
export const orderHistoryRelations = relations(orderHistory, ({ one }) => ({
  order: one(orders, { fields: [orderHistory.orderId], references: [orders.id] }),
  addedBy: one(users, { fields: [orderHistory.addedById], references: [users.id] }),
}))
export const dealersRelations = relations(dealers, ({ one, many }) => ({
  state: one(states, { fields: [dealers.stateId], references: [states.id] }),
  district: one(districts, { fields: [dealers.districtId], references: [districts.id] }),
  invoices: many(invoices),
  payments: many(payments),
  orders: many(orders),
}))
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  dealer: one(dealers, { fields: [invoices.dealerId], references: [dealers.id] }),
  items: many(invoiceItems),
  payments: many(payments),
}))
export const districtsRelations = relations(districts, ({ one }) => ({
  state: one(states, { fields: [districts.stateId], references: [states.id] }),
}))
