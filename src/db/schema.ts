import { pgTable, uuid, text, numeric, timestamp, varchar, index } from 'drizzle-orm/pg-core';

// ==================== USERS ====================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('users_email_idx').on(table.email),
]);

// ==================== CLIENTS ====================
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').default(''),
  phone: text('phone').default(''),
  address: text('address').default(''),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('clients_name_idx').on(table.name),
  index('clients_email_idx').on(table.email),
]);

// ==================== PRODUCTS ====================
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').default(''),
  price: numeric('price', { precision: 15, scale: 2 }).notNull().default('0'),
  unit: text('unit').default('pcs'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('products_name_idx').on(table.name),
]);

// ==================== INVOICES ====================
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  invoiceFor: text('invoice_for').default(''),
  invoiceNo: varchar('invoice_no', { length: 50 }).notNull().unique(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  poNumber: text('po_number').default(''),
  paymentMethod: varchar('payment_method', { length: 20 }).default('Bank'),
  notes: text('notes').default(''),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull().default('0'),
  discountType: varchar('discount_type', { length: 10 }).default('nominal').notNull(),
  discountValue: numeric('discount_value', { precision: 15, scale: 2 }).default('0').notNull(),
  taxType: varchar('tax_type', { length: 10 }).default('nominal').notNull(),
  taxValue: numeric('tax_value', { precision: 15, scale: 2 }).default('0').notNull(),
  shipping: numeric('shipping', { precision: 15, scale: 2 }).default('0').notNull(),
  downPayment: numeric('down_payment', { precision: 15, scale: 2 }).default('0').notNull(),
  total: numeric('total', { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('invoices_client_id_idx').on(table.clientId),
  index('invoices_invoice_no_idx').on(table.invoiceNo),
  index('invoices_status_idx').on(table.status),
  index('invoices_date_idx').on(table.date),
]);

// ==================== INVOICE ITEMS ====================
export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  qty: numeric('qty', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('invoice_items_invoice_id_idx').on(table.invoiceId),
  index('invoice_items_product_id_idx').on(table.productId),
]);

// ==================== SETTINGS (single row) ====================
export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').default('Amoora Couture'),
  address: text('address').default(''),
  phone: text('phone').default(''),
  email: text('email').default(''),
  signerName: text('signer_name').default(''),
  defaultNotes: text('default_notes').default(''),
  logoUrl: text('logo_url').default(''),
  signatureUrl: text('signature_url').default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==================== EMAIL LOGS ====================
export const emailLogs = pgTable('email_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  recipientEmail: text('recipient_email').notNull(),
  subject: text('subject').default(''),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  errorMessage: text('error_message').default(''),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('email_logs_invoice_id_idx').on(table.invoiceId),
  index('email_logs_status_idx').on(table.status),
]);
