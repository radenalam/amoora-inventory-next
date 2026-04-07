import { pgTable, text, timestamp, integer, real } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description').default(''),
  price: real('price').notNull().default(0),
  unit: text('unit').notNull().default('pcs'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceNo: text('invoice_no').notNull(),
  date: timestamp('date').notNull(),
  dueDate: timestamp('due_date'),
  poNumber: text('po_number'),
  paymentMethod: text('payment_method').default('Bank').notNull(),
  invoiceFor: text('invoice_for').notNull(),
  payableTo: text('payable_to').notNull(),
  customerAddress: text('customer_address').default('').notNull(),
  customerPhone: text('customer_phone').default('').notNull(),
  subtotal: real('subtotal').default(0).notNull(),
  discountType: text('discount_type').default('nominal').notNull(),
  discountValue: real('discount_value').default(0).notNull(),
  taxType: text('tax_type').default('nominal').notNull(),
  taxValue: real('tax_value').default(0).notNull(),
  shipping: real('shipping').default(0).notNull(),
  downPayment: real('down_payment').default(0).notNull(),
  total: real('total').default(0).notNull(),
  notes: text('notes').default('').notNull(),
  status: text('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id'),
  description: text('description').notNull(),
  qty: integer('qty').notNull(),
  unitPrice: real('unit_price').notNull(),
  total: real('total').notNull().default(0),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const settings = pgTable('settings', {
  id: text('id').primaryKey().default('default'),
  name: text('name').default('Amoora Couture').notNull(),
  address: text('address').default('').notNull(),
  phone: text('phone').default('').notNull(),
  email: text('email').default('').notNull(),
  logoUrl: text('logo_url').default('').notNull(),
  signatureUrl: text('signature_url').default('').notNull(),
  signerName: text('signer_name').default('').notNull(),
  defaultNotes: text('default_notes').default('').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
export type Settings = typeof settings.$inferSelect;
