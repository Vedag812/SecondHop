import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
};
export const rescueWorkspaces = sqliteTable('rescue_workspaces', {
  id: text('id').primaryKey(),
  payload: text('payload').notNull(),
  revision: integer('revision').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
});
export const rescueWebhookReceipts = sqliteTable('rescue_webhooks', {
  id: text('id').primaryKey(),
  processedAt: text('processed_at').notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  role: text('role').notNull(),
  displayName: text('display_name').notNull(),
  ...timestamps,
});
export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    merchantId: text('merchant_id').notNull(),
    sku: text('sku').notNull(),
    model: text('model').notNull(),
    variant: text('variant').notNull(),
    category: text('category').notNull(),
    warranty: text('warranty').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_products_merchant_sku').on(table.merchantId, table.sku),
  ],
);
export const originalOrders = sqliteTable(
  'original_orders',
  {
    id: text('id').primaryKey(),
    buyerId: text('buyer_id').notNull(),
    productId: text('product_id').notNull(),
    serialNumber: text('serial_number').notNull(),
    amountPaise: integer('amount_paise').notNull(),
    razorpayPaymentId: text('razorpay_payment_id'),
    status: text('status').notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex('idx_orders_serial').on(table.serialNumber)],
);
export const returns = sqliteTable('returns', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  reasonOriginal: text('reason_original').notNull(),
  claimedCondition: text('claimed_condition').notNull(),
  state: text('state').notNull(),
  eligibility: integer('eligibility', { mode: 'boolean' }).notNull(),
  ...timestamps,
});
export const purchaseIntents = sqliteTable('purchase_intents', {
  id: text('id').primaryKey(),
  buyerId: text('buyer_id').notNull(),
  originalInput: text('original_input').notNull(),
  structuredJson: text('structured_json').notNull(),
  priceCeilingPaise: integer('price_ceiling_paise').notNull(),
  maximumDistanceKm: integer('maximum_distance_km').notNull(),
  expiresAt: text('expires_at').notNull(),
  ...timestamps,
});
export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  returnId: text('return_id').notNull(),
  intentId: text('intent_id').notNull(),
  exactSku: integer('exact_sku', { mode: 'boolean' }).notNull(),
  rulesJson: text('rules_json').notNull(),
  approved: integer('approved', { mode: 'boolean' }).notNull(),
  ...timestamps,
});
export const offers = sqliteTable('offers', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull(),
  amountPaise: integer('amount_paise').notNull(),
  radiusKm: integer('radius_km').notNull(),
  expiresAt: text('expires_at').notNull(),
  ...timestamps,
});
export const mandates = sqliteTable('mandates', {
  id: text('id').primaryKey(),
  offerId: text('offer_id').notNull(),
  snapshotJson: text('snapshot_json').notNull(),
  maximumChargePaise: integer('maximum_charge_paise').notNull(),
  approvedAt: text('approved_at'),
  expiresAt: text('expires_at').notNull(),
  ...timestamps,
});
export const payments = sqliteTable(
  'payments',
  {
    id: text('id').primaryKey(),
    transactionId: text('transaction_id').notNull(),
    razorpayOrderId: text('razorpay_order_id').notNull(),
    razorpayPaymentId: text('razorpay_payment_id'),
    amountPaise: integer('amount_paise').notNull(),
    status: text('status').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex('idx_payments_idempotency').on(table.idempotencyKey)],
);
export const webhookEvents = sqliteTable('webhook_events', {
  eventId: text('event_id').primaryKey(),
  eventType: text('event_type').notNull(),
  payloadHash: text('payload_hash').notNull(),
  processedAt: text('processed_at').notNull(),
});
export const handoffs = sqliteTable('handoffs', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  conditionConfirmed: integer('condition_confirmed', { mode: 'boolean' }),
  status: text('status').notNull(),
  ...timestamps,
});
export const refunds = sqliteTable(
  'refunds',
  {
    id: text('id').primaryKey(),
    transactionId: text('transaction_id').notNull(),
    beneficiary: text('beneficiary').notNull(),
    razorpayRefundId: text('razorpay_refund_id'),
    amountPaise: integer('amount_paise').notNull(),
    status: text('status').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex('idx_refunds_idempotency').on(table.idempotencyKey)],
);
export const auditEvents = sqliteTable('audit_events', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  occurredAt: text('occurred_at').notNull(),
  previousState: text('previous_state'),
  newState: text('new_state').notNull(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  detailJson: text('detail_json').notNull(),
  previousHash: text('previous_hash'),
  currentHash: text('current_hash').notNull(),
});
export const idempotencyRecords = sqliteTable('idempotency_records', {
  key: text('key').primaryKey(),
  operation: text('operation').notNull(),
  resultJson: text('result_json').notNull(),
  createdAt: text('created_at').notNull(),
});
