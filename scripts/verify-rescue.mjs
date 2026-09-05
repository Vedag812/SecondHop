import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const origin = process.env.SECONDHOP_TEST_URL ?? 'http://localhost:3000';
let checks = 0;
function check(condition, message) {
  assert.ok(condition, message);
  checks++;
  console.log(`PASS ${message}`);
}
async function session() {
  const r = await fetch(`${origin}/api/rescue`);
  const data = await r.json();
  assert.equal(r.status, 200, JSON.stringify(data));
  const cookie = r.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie);
  return { cookie, data };
}
async function request(s, body, options = {}) {
  const { token, path = '/api/rescue', caseId } = options;
  const r = await fetch(
    `${origin}${path}${!body && caseId ? `?caseId=${caseId}` : ''}`,
    {
      method: body ? 'POST' : 'GET',
      headers: {
        ...(s ? { Cookie: s.cookie } : {}),
        Origin: origin,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { 'x-handoff-token': token } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  return { status: r.status, data: await r.json() };
}
const offer = {
  action: 'reserve',
  parcelId: 'parcel-blue',
  budgetPaise: 115000,
  radiusKm: 3,
  requestedVariant: 'Midnight Blue',
  courierPaise: 6000,
  rail: 'simulation',
  injectRefundTimeout: true,
};
async function stored(s, id) {
  const r = await request(s);
  return r.data.workspace.cases.find((c) => c.id === id);
}
const a = await session();
const b = await session();
const [first, second] = await Promise.all([
  request(a, { ...offer, requestId: crypto.randomUUID() }),
  request(a, { ...offer, requestId: crypto.randomUUID() }),
]);
check(
  [first.status, second.status].sort((a, b) => a - b).join(',') === '200,409',
  'simultaneous buyers produce one reservation and one conflict',
);
const id = (first.status === 200 ? first : second).data.result.caseId;
let c = await stored(a, id);
check(c.state === 'RESERVED', 'reservation persists after fresh request');
check(
  (await request(b, undefined, { caseId: id })).status === 404,
  'another workspace cannot read the case',
);
const buyerToken = c.buyerLink.split('#')[1],
  courierToken = c.courierLink.split('#')[1];
check(
  (
    await request(
      null,
      { action: 'order', caseId: id },
      { token: courierToken },
    )
  ).status === 403,
  'courier capability cannot create a payment',
);
check(
  (
    await request(
      null,
      {
        action: 'inspect',
        caseId: id,
        accepted: true,
        evidence: 'Seal appears intact.',
        otp: '123456',
      },
      { token: buyerToken },
    )
  ).status !== 200,
  'buyer cannot bypass the payment and courier gates',
);
const order = await request(a, { action: 'order', caseId: id });
check(order.status === 200, 'simulated order can be created');
const repeated = await request(a, { action: 'order', caseId: id });
check(
  repeated.data.result.orderId === order.data.result.orderId,
  'order retry reuses the stored order',
);
check(
  (await stored(a, id)).state === 'PAYMENT_PENDING',
  'order creation does not claim payment',
);
check(
  (await request(a, { action: 'simulate_payment', caseId: id })).status === 200,
  'explicit simulated payment progresses',
);
const courierView = await request(null, undefined, {
  caseId: id,
  token: courierToken,
});
check(!courierView.data.case.otp, 'courier cannot read the buyer code');
check(
  (
    await request(
      null,
      {
        action: 'inspect',
        caseId: id,
        accepted: true,
        serial: 'WRONG',
        evidence: 'Factory seal intact.',
      },
      { token: courierToken },
    )
  ).status !== 200,
  'wrong parcel serial is rejected',
);
check(
  (
    await request(
      null,
      {
        action: 'inspect',
        caseId: id,
        accepted: true,
        serial: c.parcel.serial,
        evidence: 'Demo: serial checked, outer seal intact.',
      },
      { token: courierToken },
    )
  ).status === 200,
  'courier inspection is saved',
);
const buyerView = await request(null, undefined, {
  caseId: id,
  token: buyerToken,
});
check(
  Boolean(buyerView.data.case.otp),
  'only the buyer pass reveals the acceptance code',
);
check(
  (
    await request(
      null,
      {
        action: 'inspect',
        caseId: id,
        accepted: true,
        otp: '000000',
        evidence: 'Demo: item matches, seal intact.',
      },
      { token: buyerToken },
    )
  ).status === 400,
  'incorrect OTP cannot complete handoff',
);
check(
  (
    await request(
      null,
      {
        action: 'inspect',
        caseId: id,
        accepted: true,
        otp: buyerView.data.case.otp,
        evidence: 'Demo: exact item, intact seal, accepted.',
      },
      { token: buyerToken },
    )
  ).status === 200,
  'correct buyer confirmation completes handoff',
);
check(
  (
    await request(
      null,
      {
        action: 'inspect',
        caseId: id,
        accepted: true,
        otp: buyerView.data.case.otp,
        evidence: 'Repeated acceptance attempt.',
      },
      { token: buyerToken },
    )
  ).status === 410,
  'consumed handoff cannot be replayed',
);
c = await stored(a, id);
check(
  c.state === 'DELIVERED' && c.passUsedAt,
  'completed handoff survives refresh',
);
let previous = 'GENESIS';
for (const e of c.events) {
  const { hash, ...payload } = e;
  assert.equal(e.previousHash, previous);
  assert.equal(
    createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
    hash,
  );
  previous = hash;
}
check(true, 'stored evidence hash chain verifies');
const f = await session();
const reserved = await request(f, { ...offer, requestId: crypto.randomUUID() });
const fid = reserved.data.result.caseId;
await request(f, { action: 'order', caseId: fid });
await request(f, { action: 'simulate_payment', caseId: fid });
let fc = await stored(f, fid);
const ft = fc.courierLink.split('#')[1];
await request(
  null,
  {
    action: 'inspect',
    caseId: fid,
    accepted: false,
    evidence: 'Demo: factory seal broken; reject parcel.',
  },
  { token: ft },
);
fc = await stored(f, fid);
check(
  fc.state === 'REFUND_PENDING' && !fc.refundId,
  'injected refund timeout remains pending without fabricated refund ID',
);
const refundKey = fc.refundKey;
check(
  fc.warehouseReturn === 'required',
  'warehouse route is required, not falsely marked complete',
);
await request(f, { action: 'refund', caseId: fid });
fc = await stored(f, fid);
check(
  fc.state === 'REFUNDED' &&
    fc.refundKey === refundKey &&
    fc.refundAttempts === 2,
  'refund retry uses the same key and records confirmed simulation',
);
await request(f, { action: 'refund', caseId: fid });
check(
  (await stored(f, fid)).refundAttempts === 2,
  'completed refund replay does not create another operation',
);
check(
  (await request(null, { action: 'warehouse_ack', caseId: fid }, { token: ft }))
    .status === 200,
  'courier separately acknowledges warehouse fallback',
);
check(
  (
    await request(f, {
      ...offer,
      budgetPaise: 100,
      requestId: crypto.randomUUID(),
    })
  ).status === 422,
  'server rejects an over-budget offer',
);
check(
  (
    await request(f, {
      ...offer,
      courierPaise: 12000,
      requestId: crypto.randomUUID(),
    })
  ).status === 422,
  'server rejects negative merchant advantage',
);
check(
  (
    await request(f, {
      ...offer,
      parcelId: 'parcel-grey',
      requestId: crypto.randomUUID(),
    })
  ).status === 422,
  'server rejects wrong colour',
);
const e = await session();
const er = await request(e, { ...offer, requestId: crypto.randomUUID() });
await request(e, { action: 'expire', caseId: er.data.result.caseId });
check(
  (await stored(e, er.data.result.caseId)).state === 'EXPIRED',
  'reservation expiry is stored without inventing a payment',
);
check(
  (await request(e, { action: 'order', caseId: er.data.result.caseId }))
    .status !== 200,
  'expired reservation cannot start payment',
);
const legacy = await request(
  null,
  { productId: 'prod_airpods_pro2', mode: 'simulation' },
  { path: '/api/razorpay/order' },
);
check(
  legacy.status === 200 && legacy.data.order?.id && legacy.data.caseId,
  'standalone product order works without a prior workspace cookie',
);
const tampered = await request(
  null,
  { productId: 'prod_airpods_pro2', mode: 'simulation', amountPaise: 1 },
  { path: '/api/razorpay/order' },
);
check(
  tampered.status === 400,
  'standalone order rejects a tampered client price',
);
const catalog = await fetch(`${origin}/api/agent/v1/discover`).then((r) =>
  r.json(),
);
check(
  catalog.inventory.length >= 10,
  'agent-readable catalog exposes the full product range',
);
const invalidWebhook = await fetch(`${origin}/api/razorpay/webhook`, {
  method: 'POST',
  body: '{}',
});
check(invalidWebhook.status === 401, 'unsigned provider event is rejected');
console.log(
  `Verified ${checks} integration checks. Simulation only; no provider payment API was called.`,
);
