import { PRODUCTS } from './products.ts';
export type Rail = 'simulation' | 'razorpay_test';
export type CaseState =
  | 'RESERVED'
  | 'ORDER_CREATING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_REVIEW'
  | 'PAID'
  | 'COURIER_VERIFIED'
  | 'DELIVERED'
  | 'REFUND_PENDING'
  | 'REFUND_SUBMITTING'
  | 'REFUNDED'
  | 'REFUND_REVIEW'
  | 'EXPIRED';
export type Economics = {
  localPricePaise: number;
  warehouseResalePaise: number;
  reverseFreightPaise: number;
  warehouseHandlingPaise: number;
  warehouseSellingFeePaise: number;
  courierPaise: number;
  inspectionPaise: number;
  localSellingFeePaise: number;
  riskReservePaise: number;
};
export type Parcel = {
  id: string;
  productId: string;
  sku: string;
  title: string;
  variant: string;
  serial: string;
  retailPaise: number;
  buyer: string;
  buyerArea: string;
  buyerIntent: string;
  budgetPaise: number;
  requestedVariant: string;
  distanceKm: number;
  radiusKm: number;
  etaMinutes: number;
  reason: string;
  category: string;
  economics: Economics;
};
export const HUB = 'City Return Hub';
export const MERCHANT = 'SoundWave Retail';
export const PARCELS: Parcel[] = [
  {
    id: 'parcel-blue',
    productId: 'prod_wh40_blue',
    sku: 'SND-WH40-BLU-IN',
    title: 'SoundWave WH40',
    variant: 'Midnight Blue',
    serial: 'WH40-IN-884921',
    retailPaise: 129900,
    buyer: 'Arjun',
    buyerArea: 'North Zone',
    buyerIntent:
      'Midnight Blue WH40, unopened, under ₹1,150. Deliver within 3 km today.',
    budgetPaise: 115000,
    requestedVariant: 'Midnight Blue',
    distanceKm: 2.4,
    radiusKm: 3,
    etaMinutes: 18,
    category: 'Headphones',
    reason: 'Colour preference changed · unopened return approved',
    economics: {
      localPricePaise: 109900,
      warehouseResalePaise: 119900,
      reverseFreightPaise: 18000,
      warehouseHandlingPaise: 9000,
      warehouseSellingFeePaise: 3000,
      courierPaise: 6000,
      inspectionPaise: 2000,
      localSellingFeePaise: 3500,
      riskReservePaise: 3000,
    },
  },
  {
    id: 'parcel-silver',
    productId: 'prod_sony_xm5',
    sku: 'SNY-WH1000XM5-SLV',
    title: 'Sony WH-1000XM5',
    variant: 'Platinum Silver',
    serial: 'SNY-XM5-992104',
    retailPaise: 2699000,
    buyer: 'Rohan',
    buyerArea: 'South Zone',
    buyerIntent: 'Silver Sony WH-1000XM5, sealed, under ₹19,500. Within 5 km.',
    budgetPaise: 1950000,
    requestedVariant: 'Platinum Silver',
    distanceKm: 3.1,
    radiusKm: 5,
    etaMinutes: 22,
    category: 'Headphones',
    reason: 'Duplicate gift · unopened return approved',
    economics: {
      localPricePaise: 1849900,
      warehouseResalePaise: 2499000,
      reverseFreightPaise: 30000,
      warehouseHandlingPaise: 15000,
      warehouseSellingFeePaise: 62500,
      courierPaise: 9000,
      inspectionPaise: 3000,
      localSellingFeePaise: 46250,
      riskReservePaise: 15000,
    },
  },
  {
    id: 'parcel-grey',
    productId: 'prod_wh40_blue',
    sku: 'SND-WH40-GRY-IN',
    title: 'SoundWave WH40',
    variant: 'Stone Grey',
    serial: 'WH40-IN-884922',
    retailPaise: 129900,
    buyer: 'Meera',
    buyerArea: 'Central Zone',
    buyerIntent:
      'Midnight Blue WH40 only, sealed, under ₹1,150. No colour substitutions.',
    budgetPaise: 115000,
    requestedVariant: 'Midnight Blue',
    distanceKm: 1.2,
    radiusKm: 3,
    etaMinutes: 14,
    category: 'Headphones',
    reason: 'Ordered twice · unopened return approved',
    economics: {
      localPricePaise: 109900,
      warehouseResalePaise: 119900,
      reverseFreightPaise: 18000,
      warehouseHandlingPaise: 9000,
      warehouseSellingFeePaise: 3000,
      courierPaise: 5000,
      inspectionPaise: 2000,
      localSellingFeePaise: 3500,
      riskReservePaise: 3000,
    },
  },
];
// Merchant-assessed recovery fixtures; retail discount is never counted as merchant profit.
export const CATALOG_PARCELS: Parcel[] = PRODUCTS.map((p) => {
  if (p.id === 'prod_wh40_blue') return PARCELS[0];
  const price = Math.round(p.redirectPrice * 100);
  const warehouseEstimate = Math.round(price * 0.97);
  return {
    id: `catalog-${p.id}`,
    productId: p.id,
    sku: p.sku,
    title: `${p.brand} ${p.model}`,
    variant: p.variant,
    serial: p.serialNumber,
    retailPaise: Math.round(p.retailPrice * 100),
    buyer: p.buyerB.name,
    buyerArea: p.buyerB.location,
    buyerIntent: p.buyerB.intentSummary,
    budgetPaise: Math.round(p.buyerB.priceCeiling * 100),
    requestedVariant: p.variant,
    distanceKm: p.buyerB.distanceKm,
    radiusKm: Math.max(5, Math.ceil(p.buyerB.distanceKm)),
    etaMinutes: Math.round(15 + p.buyerB.distanceKm * 3),
    reason: p.buyerA.returnReason,
    category: p.categoryLabel,
    economics: {
      localPricePaise: price,
      warehouseResalePaise: warehouseEstimate,
      reverseFreightPaise: 25000,
      warehouseHandlingPaise: 10000,
      warehouseSellingFeePaise: Math.round(warehouseEstimate * 0.025),
      courierPaise: 5000 + Math.round(p.buyerB.distanceKm * 1500),
      inspectionPaise: 2500,
      localSellingFeePaise: Math.round(price * 0.025),
      riskReservePaise: Math.round(price * 0.005),
    },
  };
});
export const ALL_PARCELS = [
  ...PARCELS,
  ...CATALOG_PARCELS.filter((p) => !PARCELS.some((q) => q.id === p.id)),
];
export function money(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: paise % 100 ? 2 : 0,
  }).format(paise / 100);
}
export function calculateRecovery(e: Economics) {
  if (Object.values(e).some((v) => !Number.isSafeInteger(v) || v < 0))
    throw new Error('Cost inputs must be non-negative integer paise.');
  const localNetPaise =
    e.localPricePaise -
    e.courierPaise -
    e.inspectionPaise -
    e.localSellingFeePaise -
    e.riskReservePaise;
  const warehouseNetPaise =
    e.warehouseResalePaise -
    e.reverseFreightPaise -
    e.warehouseHandlingPaise -
    e.warehouseSellingFeePaise;
  return {
    localNetPaise,
    warehouseNetPaise,
    advantagePaise: localNetPaise - warehouseNetPaise,
  };
}
export function evaluateRescue(
  parcel: Parcel,
  input: {
    budgetPaise: number;
    radiusKm: number;
    requestedVariant: string;
    courierPaise: number;
    cutoffAt: string;
  },
  now = Date.now(),
) {
  if (
    !Number.isSafeInteger(input.budgetPaise) ||
    input.budgetPaise <= 0 ||
    !Number.isFinite(input.radiusKm) ||
    input.radiusKm <= 0 ||
    input.radiusKm > 15
  )
    throw new Error('Enter a positive budget and a radius up to 15 km.');
  const economics = { ...parcel.economics, courierPaise: input.courierPaise };
  const recovery = calculateRecovery(economics);
  const rules = [
    {
      name: 'Exact colour · no substitutions',
      passed:
        input.requestedVariant.toLowerCase().trim() ===
        parcel.variant.toLowerCase(),
      detail: `Requested ${input.requestedVariant}; parcel is ${parcel.variant}.`,
    },
    {
      name: 'Buyer budget respected',
      passed: economics.localPricePaise <= input.budgetPaise,
      detail: `${money(economics.localPricePaise)} offer / ${money(input.budgetPaise)} limit.`,
    },
    {
      name: 'Within delivery radius',
      passed: parcel.distanceKm <= input.radiusKm,
      detail: `${parcel.distanceKm} km / ${input.radiusKm} km allowed. Illustrative route.`,
    },
    {
      name: 'Before the hub dispatch cutoff',
      passed: now + parcel.etaMinutes * 60000 < Date.parse(input.cutoffAt),
      detail: `${parcel.etaMinutes} minutes allowed for local handoff.`,
    },
    {
      name: 'Merchant recovers more',
      passed: recovery.advantagePaise > 0,
      detail: `${money(recovery.advantagePaise)} expected advantage after costs and risk reserve.`,
    },
  ];
  return { allowed: rules.every((r) => r.passed), rules, economics, recovery };
}
export type Decision = ReturnType<typeof evaluateRescue>;
export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
  state: CaseState;
  previousHash: string;
  hash: string;
};
export type RescueCase = {
  id: string;
  requestId: string;
  parcel: Parcel;
  decision: Decision;
  buyerBudgetPaise: number;
  radiusKm: number;
  requestedVariant: string;
  state: CaseState;
  rail: Rail;
  createdAt: string;
  expiresAt: string;
  cutoffAt: string;
  tokenBuyer: string;
  tokenCourier: string;
  otp: string;
  otpAttempts: number;
  passUsedAt: string | null;
  courierEvidence: string | null;
  buyerEvidence: string | null;
  orderId: string | null;
  paymentId: string | null;
  refundId: string | null;
  refundKey: string;
  refundAttempts: number;
  refundSubmittedAt: string | null;
  failureReason: string | null;
  providerMessage: string | null;
  injectRefundTimeout: boolean;
  warehouseReturn: 'not_requested' | 'required' | 'acknowledged';
  originalBuyerRefund: 'merchant_policy_applies' | 'merchant_review_required';
  events: AuditEvent[];
};
export type Workspace = {
  createdAt: string;
  cutoffAt: string;
  cases: RescueCase[];
  providerEventIds?: string[];
  rejectedDecisions: {
    id: string;
    at: string;
    parcel: string;
    reasons: string[];
  }[];
};
export type SafeCase = Omit<
  RescueCase,
  'tokenBuyer' | 'tokenCourier' | 'otp'
> & { otp?: string; buyerLink?: string; courierLink?: string };
export type Snapshot = {
  workspace: Omit<Workspace, 'cases'> & { cases: SafeCase[] };
  parcels: Parcel[];
  testCheckoutAvailable: boolean;
  aiAvailable: boolean;
};
export function parcelIsReserved(
  cases: RescueCase[],
  parcelId: string,
  now = Date.now(),
) {
  const serial = ALL_PARCELS.find((p) => p.id === parcelId)?.serial;
  return cases.some(
    (c) =>
      (c.parcel.id === parcelId || (serial && c.parcel.serial === serial)) &&
      c.state !== 'EXPIRED' &&
      !(c.state === 'RESERVED' && Date.parse(c.expiresAt) <= now),
  );
}
export function nextHandoffState(
  current: CaseState,
  actor: 'courier' | 'buyer',
  accepted: boolean,
): CaseState {
  if (actor === 'courier' && current !== 'PAID')
    throw new Error(
      'A confirmed payment is required before courier inspection.',
    );
  if (actor === 'buyer' && current !== 'COURIER_VERIFIED')
    throw new Error('Courier inspection must be completed first.');
  return accepted
    ? actor === 'courier'
      ? 'COURIER_VERIFIED'
      : 'DELIVERED'
    : 'REFUND_PENDING';
}
export const stateLabel: Record<CaseState, string> = {
  RESERVED: 'Parcel reserved',
  ORDER_CREATING: 'Creating test order',
  PAYMENT_PENDING: 'Awaiting payment',
  PAYMENT_REVIEW: 'Payment needs review',
  PAID: 'Payment confirmed',
  COURIER_VERIFIED: 'Courier inspected',
  DELIVERED: 'Handoff complete',
  REFUND_PENDING: 'Refund pending',
  REFUND_SUBMITTING: 'Submitting refund',
  REFUNDED: 'Refund confirmed',
  REFUND_REVIEW: 'Refund needs review',
  EXPIRED: 'Reservation expired',
};
export function outcomeMetrics(cases: SafeCase[]) {
  const delivered = cases.filter((c) => c.state === 'DELIVERED');
  return {
    completed: delivered.length,
    expectedRecoveryPaise: delivered.reduce(
      (s, c) => s + c.decision.recovery.advantagePaise,
      0,
    ),
    buyerSavingsPaise: delivered.reduce(
      (s, c) => s + c.parcel.retailPaise - c.decision.economics.localPricePaise,
      0,
    ),
    pendingRefunds: cases.filter((c) =>
      ['REFUND_PENDING', 'REFUND_SUBMITTING', 'REFUND_REVIEW'].includes(
        c.state,
      ),
    ).length,
    simulations: delivered.filter((c) => c.rail === 'simulation').length,
  };
}
