import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PARCELS,
  calculateRecovery,
  evaluateRescue,
  nextHandoffState,
  outcomeMetrics,
  parcelIsReserved,
  type RescueCase,
} from '../lib/rescue.ts';
import { extractIntent } from '../lib/gemini.ts';

const cutoffAt = '2030-01-01T01:00:00Z';
const now = Date.parse('2030-01-01T00:00:00Z');
const input = {
  budgetPaise: 115000,
  radiusKm: 3,
  requestedVariant: 'Midnight Blue',
  courierPaise: 6000,
  cutoffAt,
};
void test('positive redirect earns ₹55 extra; buyer discount is independently ₹200', () => {
  const result = evaluateRescue(PARCELS[0], input, now);
  assert.equal(result.allowed, true);
  assert.deepEqual(result.recovery, {
    localNetPaise: 95400,
    warehouseNetPaise: 89900,
    advantagePaise: 5500,
  });
  assert.equal(
    PARCELS[0].retailPaise - result.economics.localPricePaise,
    20000,
  );
});
void test('a large consumer discount is not mistaken for merchant benefit', () => {
  const result = evaluateRescue(
    PARCELS[1],
    {
      ...input,
      budgetPaise: 1950000,
      radiusKm: 5,
      requestedVariant: 'Platinum Silver',
      courierPaise: 9000,
    },
    now,
  );
  assert.equal(result.allowed, false);
  assert.ok(result.recovery.advantagePaise < 0);
});
void test('increasing courier cost can correctly reverse a decision', () => {
  assert.equal(
    evaluateRescue(PARCELS[0], { ...input, courierPaise: 12000 }, now).allowed,
    false,
  );
});
void test('wrong colour, out of radius, expired cutoff, and low budget each independently block checkout', () => {
  for (const overrides of [
    { requestedVariant: 'Stone Grey' },
    { radiusKm: 2 },
    { cutoffAt: '2029-01-01T00:00:00Z' },
    { budgetPaise: 100 },
  ])
    assert.equal(
      evaluateRescue(PARCELS[0], { ...input, ...overrides }, now).allowed,
      false,
    );
});
void test('invalid financial inputs cannot enter the economic model', () => {
  for (const invalid of [-1, 1.5, NaN, Infinity])
    assert.throws(() =>
      calculateRecovery({ ...PARCELS[0].economics, courierPaise: invalid }),
    );
  assert.throws(() =>
    evaluateRescue(PARCELS[0], { ...input, budgetPaise: 0 }, now),
  );
});
void test('a payment in progress keeps parcel ownership after quote expiry', () => {
  const c = {
    parcel: PARCELS[0],
    state: 'PAYMENT_PENDING',
    expiresAt: '2020-01-01T00:00:00Z',
  } as RescueCase;
  assert.equal(parcelIsReserved([c], PARCELS[0].id, now), true);
  assert.equal(
    parcelIsReserved([{ ...c, state: 'RESERVED' }], PARCELS[0].id, now),
    false,
  );
});
void test('buyer cannot accept before courier; consumed state cannot be accepted again', () => {
  assert.throws(() => nextHandoffState('PAID', 'buyer', true));
  assert.throws(() => nextHandoffState('DELIVERED', 'buyer', true));
  assert.equal(nextHandoffState('PAID', 'courier', true), 'COURIER_VERIFIED');
  assert.equal(
    nextHandoffState('COURIER_VERIFIED', 'buyer', false),
    'REFUND_PENDING',
  );
});
void test('no completed cases means no reported recovery or buyer savings', () => {
  assert.deepEqual(outcomeMetrics([]), {
    completed: 0,
    expectedRecoveryPaise: 0,
    buyerSavingsPaise: 0,
    pendingRefunds: 0,
    simulations: 0,
  });
});
void test('local intent parsing does not invent a product for unrelated requests', async () => {
  const result = await extractIntent('I need something useful');
  assert.equal(result.value.requires_clarification, true);
  assert.equal(result.value.buyer_price_ceiling_paise, 0);
});
