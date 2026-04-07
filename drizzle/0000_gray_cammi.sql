CREATE TABLE "invoice_items" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text,
	"description" text NOT NULL,
	"qty" integer NOT NULL,
	"unit_price" real NOT NULL,
	"total" real DEFAULT 0 NOT NULL,
	"invoice_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_no" text NOT NULL,
	"date" timestamp NOT NULL,
	"due_date" timestamp,
	"po_number" text,
	"payment_method" text DEFAULT 'Bank' NOT NULL,
	"invoice_for" text NOT NULL,
	"payable_to" text NOT NULL,
	"customer_address" text DEFAULT '' NOT NULL,
	"customer_phone" text DEFAULT '' NOT NULL,
	"subtotal" real DEFAULT 0 NOT NULL,
	"discount_type" text DEFAULT 'nominal' NOT NULL,
	"discount_value" real DEFAULT 0 NOT NULL,
	"tax_type" text DEFAULT 'nominal' NOT NULL,
	"tax_value" real DEFAULT 0 NOT NULL,
	"shipping" real DEFAULT 0 NOT NULL,
	"down_payment" real DEFAULT 0 NOT NULL,
	"total" real DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"price" real DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"name" text DEFAULT 'Amoora Couture' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"logo_url" text DEFAULT '' NOT NULL,
	"signature_url" text DEFAULT '' NOT NULL,
	"signer_name" text DEFAULT '' NOT NULL,
	"default_notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;