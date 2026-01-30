import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  varchar,
  integer,
  pgEnum,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { agencies, tenants } from "./core";

// ============================================================================
// ENUMS
// ============================================================================

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
]);

export const billingIntervalEnum = pgEnum("billing_interval", [
  "monthly",
  "quarterly",
  "yearly",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "refunded",
  "partially_refunded",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "void",
  "uncollectible",
]);

// ============================================================================
// PRICING PLANS (Agency-level plan definitions)
// ============================================================================

export const pricingPlans = pgTable("pricing_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),

  // Plan details
  name: text("name").notNull(),
  description: text("description"),

  // Pricing
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  billingInterval: billingIntervalEnum("billing_interval").notNull().default("monthly"),

  // Usage-based pricing
  pricePerSeat: decimal("price_per_seat", { precision: 10, scale: 2 }),
  includedSeats: integer("included_seats").default(0),

  // Features
  features: jsonb("features").default([]),
  /*
    Example structure:
    [
      { "name": "Programs", "limit": 10 },
      { "name": "Storage", "limit": "10GB" },
      { "name": "Assessments", "limit": "unlimited" },
      { "name": "Custom Branding", "included": true }
    ]
  */

  // Limits
  maxUsers: integer("max_users"),
  maxPrograms: integer("max_programs"),
  maxStorageGb: integer("max_storage_gb"),

  // Trial
  trialDays: integer("trial_days").default(14),

  // Status
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true), // Show on pricing page

  // Ordering
  displayOrder: integer("display_order").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// SUBSCRIPTIONS (Tenant subscriptions)
// ============================================================================

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").notNull().references(() => pricingPlans.id),

  // Stripe references
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),

  // Status
  status: subscriptionStatusEnum("status").notNull().default("trialing"),

  // Billing period
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),

  // Trial
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),

  // Cancellation
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),
  cancellationReason: text("cancellation_reason"),

  // Usage tracking
  currentSeats: integer("current_seats").default(0),

  // Metadata
  metadata: jsonb("metadata").default({}),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// INVOICES
// ============================================================================

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),

  // Stripe reference
  stripeInvoiceId: text("stripe_invoice_id"),

  // Invoice details
  invoiceNumber: varchar("invoice_number", { length: 50 }),

  // Amounts
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  amountDue: decimal("amount_due", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),

  // Status
  status: invoiceStatusEnum("status").notNull().default("draft"),

  // Dates
  invoiceDate: timestamp("invoice_date").defaultNow(),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),

  // PDF
  invoicePdfUrl: text("invoice_pdf_url"),
  hostedInvoiceUrl: text("hosted_invoice_url"),

  // Line items
  lineItems: jsonb("line_items").default([]),
  /*
    Example structure:
    [
      {
        description: "Pro Plan - Monthly",
        quantity: 1,
        unitPrice: 99.00,
        amount: 99.00
      },
      {
        description: "Additional Seats (5)",
        quantity: 5,
        unitPrice: 10.00,
        amount: 50.00
      }
    ]
  */

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// PAYMENTS
// ============================================================================

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").references(() => invoices.id),

  // Stripe reference
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeChargeId: text("stripe_charge_id"),

  // Amount
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),

  // Status
  status: paymentStatusEnum("status").notNull().default("pending"),

  // Payment method
  paymentMethod: varchar("payment_method", { length: 50 }), // card, bank_transfer, etc.
  last4: varchar("last_4", { length: 4 }),
  cardBrand: varchar("card_brand", { length: 20 }),

  // Refund tracking
  refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 }).default("0"),
  refundReason: text("refund_reason"),

  // Failure info
  failureCode: varchar("failure_code", { length: 100 }),
  failureMessage: text("failure_message"),

  // Metadata
  metadata: jsonb("metadata").default({}),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// PAYMENT METHODS (Stored payment methods)
// ============================================================================

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // Stripe reference
  stripePaymentMethodId: text("stripe_payment_method_id").notNull(),

  // Type
  type: varchar("type", { length: 50 }).notNull(), // card, bank_account

  // Card details (if card)
  cardBrand: varchar("card_brand", { length: 20 }),
  last4: varchar("last_4", { length: 4 }),
  expMonth: integer("exp_month"),
  expYear: integer("exp_year"),

  // Bank details (if bank_account)
  bankName: varchar("bank_name", { length: 100 }),
  bankLast4: varchar("bank_last_4", { length: 4 }),

  // Billing address
  billingName: text("billing_name"),
  billingEmail: text("billing_email"),
  billingAddress: jsonb("billing_address").default({}),

  // Status
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// USAGE RECORDS (For usage-based billing)
// ============================================================================

export const usageRecords = pgTable("usage_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),

  // Usage type
  usageType: varchar("usage_type", { length: 50 }).notNull(), // seats, storage, api_calls, etc.

  // Quantity
  quantity: integer("quantity").notNull(),

  // Period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),

  // Billing
  reportedToStripe: boolean("reported_to_stripe").default(false),
  stripeUsageRecordId: text("stripe_usage_record_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// BILLING EVENTS (Webhook events log)
// ============================================================================

export const billingEvents = pgTable("billing_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "set null" }),

  // Stripe reference
  stripeEventId: text("stripe_event_id").notNull().unique(),
  eventType: varchar("event_type", { length: 100 }).notNull(),

  // Payload
  payload: jsonb("payload").notNull(),

  // Processing
  processedAt: timestamp("processed_at"),
  processingError: text("processing_error"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const pricingPlansRelations = relations(pricingPlans, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [pricingPlans.agencyId],
    references: [agencies.id],
  }),
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [subscriptions.tenantId],
    references: [tenants.id],
  }),
  plan: one(pricingPlans, {
    fields: [subscriptions.planId],
    references: [pricingPlans.id],
  }),
  invoices: many(invoices),
  usageRecords: many(usageRecords),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [invoices.tenantId],
    references: [tenants.id],
  }),
  subscription: one(subscriptions, {
    fields: [invoices.subscriptionId],
    references: [subscriptions.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  tenant: one(tenants, {
    fields: [paymentMethods.tenantId],
    references: [tenants.id],
  }),
}));

export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  tenant: one(tenants, {
    fields: [usageRecords.tenantId],
    references: [tenants.id],
  }),
  subscription: one(subscriptions, {
    fields: [usageRecords.subscriptionId],
    references: [subscriptions.id],
  }),
}));
