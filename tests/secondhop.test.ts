import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransition,
  DEMO_MATCH,
  evaluateCompatibility,
} from '../lib/secondhop.ts';
import { validateIntent, type GeminiIntent } from '../lib/gemini.ts';
import { verifyCheckoutSignature } from '../lib/razorpay.ts';

void test('exact demo SKU and variant pass deterministic compatibility', () => {
  assert.equal(evaluateCompatibility(DEMO_MATCH).allowed, true);
});

void test('variant mismatch is rejected even when the model matches', () => {
  const result = evaluateCompatibility({
    ...DEMO_MATCH,
    variant: 'Stone Grey',
  });
  assert.equal(result.allowed, false);
  assert.equal(
    result.rules.find((rule) => rule.rule === 'exact_variant')?.passed,
    false,
  );
});

void test('price ceiling is enforced in integer paise', () => {
  assert.equal(
    evaluateCompatibility({ ...DEMO_MATCH, offerPaise: 115001 }).allowed,
    false,
  );
});

void test('prohibited categories never redirect', () => {
  assert.equal(
    evaluateCompatibility({ ...DEMO_MATCH, category: 'medicine' }).allowed,
    false,
  );
});

void test('Buyer A refund cannot begin before handoff succeeds', () => {
  assert.equal(
    canTransition('PAYMENT_CAPTURED', 'BUYER_A_REFUND_PENDING'),
    false,
  );
  assert.equal(
    canTransition('HANDOFF_SUCCEEDED', 'BUYER_A_REFUND_PENDING'),
    true,
  );
});

void test('broken seal can transition to Buyer B refund recovery', () => {
  assert.equal(
    canTransition('HANDOFF_VERIFICATION_PENDING', 'HANDOFF_FAILED'),
    true,
  );
  assert.equal(canTransition('HANDOFF_FAILED', 'BUYER_B_REFUND_PENDING'), true);
});

void test('checkout signature verification rejects invalid HMAC', async () => {
  assert.equal(
    await verifyCheckoutSignature('order_1', 'pay_1', 'invalid', 'secret'),
    false,
  );
});

void test('malformed Gemini output is rejected by the strict schema', () => {
  assert.throws(() => validateIntent({ model: 'WH40' }));
});

void test('valid Gemini intent preserves integer paise', () => {
  const intent: GeminiIntent = {
    product_type: 'wireless_headphones',
    brand: 'SoundWave',
    model: 'WH40',
    colour: 'Midnight Blue',
    merchant_sku_candidate: 'SND-WH40-BLU-IN',
    claimed_condition: 'factory_sealed',
    visible_condition_signals: [],
    buyer_price_ceiling_paise: 115000,
    maximum_distance_km: 3,
    deadline: '2026-09-04T14:30:00Z',
    substitutions_allowed: false,
    confidence: 0.94,
    requires_clarification: false,
    clarification_question: null,
  };
  assert.equal(validateIntent(intent).buyer_price_ceiling_paise, 115000);
});
