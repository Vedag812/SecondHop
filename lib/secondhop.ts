export const TRANSACTION_STATES = [
  'RETURN_REQUESTED',
  'RETURN_REASON_PARSED',
  'RETURN_ELIGIBILITY_CHECKED',
  'SECONDHOP_ELIGIBLE',
  'MATCH_SUGGESTED',
  'MATCH_MERCHANT_APPROVED',
  'BUYER_B_APPROVAL_REQUIRED',
  'BUYER_B_APPROVED',
  'PAYMENT_ORDER_CREATED',
  'PAYMENT_PENDING',
  'PAYMENT_CAPTURED',
  'HANDOFF_SCHEDULED',
  'HANDOFF_VERIFICATION_PENDING',
  'HANDOFF_SUCCEEDED',
  'HANDOFF_FAILED',
  'BUYER_B_REFUND_PENDING',
  'BUYER_B_REFUNDED',
  'BUYER_A_REFUND_PENDING',
  'BUYER_A_REFUNDED',
  'WAREHOUSE_RETURN_RESUMED',
  'MANUAL_REVIEW',
] as const;

export type TransactionState = (typeof TRANSACTION_STATES)[number];

export type MatchInput = {
  merchantMatches: boolean;
  sku: string;
  requiredSku: string;
  model: string;
  requiredModel: string;
  variant: string;
  requiredVariant: string;
  serialVerified: boolean;
  returnWindowOpen: boolean;
  category: string;
  evidenceCount: number;
  offerPaise: number;
  priceCeilingPaise: number;
  distanceKm: number;
  maximumDistanceKm: number;
  beforeDeadline: boolean;
  warranty: string;
  requiredWarranty: string;
  substitutionsAllowed: boolean;
};

const prohibited = new Set([
  'medicine',
  'food',
  'beverage',
  'cosmetics',
  'undergarments',
  'personal-care',
  'safety-equipment',
]);

export function evaluateCompatibility(input: MatchInput) {
  const rules = [
    ['merchant', input.merchantMatches],
    ['exact_sku', input.sku === input.requiredSku],
    ['exact_model', input.model === input.requiredModel],
    ['exact_variant', input.variant === input.requiredVariant],
    ['serial', input.serialVerified],
    ['return_window', input.returnWindowOpen],
    ['category', !prohibited.has(input.category)],
    ['condition_evidence', input.evidenceCount > 0],
    ['price_ceiling', input.offerPaise <= input.priceCeilingPaise],
    ['distance', input.distanceKm <= input.maximumDistanceKm],
    ['deadline', input.beforeDeadline],
    ['warranty', input.warranty === input.requiredWarranty],
    ['substitution', input.substitutionsAllowed === false],
  ].map(([rule, passed]) => ({ rule: String(rule), passed: Boolean(passed) }));
  return { allowed: rules.every((rule) => rule.passed), rules };
}

const transitions: Partial<Record<TransactionState, TransactionState[]>> = {
  BUYER_B_APPROVAL_REQUIRED: ['BUYER_B_APPROVED'],
  BUYER_B_APPROVED: ['PAYMENT_ORDER_CREATED'],
  PAYMENT_ORDER_CREATED: ['PAYMENT_PENDING'],
  PAYMENT_PENDING: ['PAYMENT_CAPTURED', 'MANUAL_REVIEW'],
  PAYMENT_CAPTURED: ['HANDOFF_SCHEDULED', 'BUYER_B_REFUND_PENDING'],
  HANDOFF_SCHEDULED: ['HANDOFF_VERIFICATION_PENDING'],
  HANDOFF_VERIFICATION_PENDING: ['HANDOFF_SUCCEEDED', 'HANDOFF_FAILED'],
  HANDOFF_FAILED: ['BUYER_B_REFUND_PENDING', 'WAREHOUSE_RETURN_RESUMED'],
  BUYER_B_REFUND_PENDING: ['BUYER_B_REFUNDED', 'MANUAL_REVIEW'],
  BUYER_B_REFUNDED: ['WAREHOUSE_RETURN_RESUMED'],
  HANDOFF_SUCCEEDED: ['BUYER_A_REFUND_PENDING'],
  BUYER_A_REFUND_PENDING: ['BUYER_A_REFUNDED', 'MANUAL_REVIEW'],
};

export function canTransition(from: TransactionState, to: TransactionState) {
  return transitions[from]?.includes(to) ?? false;
}

export const DEMO_MATCH: MatchInput = {
  merchantMatches: true,
  sku: 'SND-WH40-BLU-IN',
  requiredSku: 'SND-WH40-BLU-IN',
  model: 'WH40',
  requiredModel: 'WH40',
  variant: 'Midnight Blue',
  requiredVariant: 'Midnight Blue',
  serialVerified: true,
  returnWindowOpen: true,
  category: 'electronics',
  evidenceCount: 2,
  offerPaise: 109900,
  priceCeilingPaise: 115000,
  distanceKm: 2.4,
  maximumDistanceKm: 3,
  beforeDeadline: true,
  warranty: 'full_manufacturer',
  requiredWarranty: 'full_manufacturer',
  substitutionsAllowed: false,
};
