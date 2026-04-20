import { pgTable, uuid, text, numeric, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').default(''),
  phone: text('phone').default(''),
  address: text('address').default(''),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').default(''),
  price: numeric('price', { precision: 15, scale: 2 }).notNull().default('0'),
  unit: text('unit').default('pcs'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id'),
  invoiceNo: varchar('invoice_no', { length: 50 }).notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  poNumber: text('po_number').default(''),
  paymentMethod: text('payment_method').default('Bank'),
  invoiceFor: text('invoice_for').notNull(),
  payableTo: text('payable_to').default(''),
  notes: text('notes').default(''),
  status: text('status').default('draft'),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull().default('0'),
  discountType: text('discount_type').default('nominal'),
  discountValue: numeric('discount_value', { precision: 15, scale: 2 }).default('0'),
  taxType: text('tax_type').default('nominal'),
  taxValue: numeric('tax_value', { precision: 15, scale: 2 }).default('0'),
  shipping: numeric('shipping', { precision: 15, scale: 2 }).default('0'),
  downPayment: numeric('down_payment', { precision: 15, scale: 2 }).default('0'),
  total: numeric('total', { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: uuid('product_id'),
  description: text('description').notNull(),
  qty: numeric('qty', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

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

export const emailLogs = pgTable('email_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id'),
  recipientEmail: text('recipient_email').notNull(),
  subject: text('subject').default(''),
  status: text('status').default('pending'),
  errorMessage: text('error_message').default(''),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
