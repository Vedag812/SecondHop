type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
  notes?: Record<string, string>;
};
type RazorpayRefund = {
  id: string;
  payment_id: string;
  amount: number;
  status: string;
};

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return bytesToHex(
    new Uint8Array(
      await crypto.subtle.sign('HMAC', key, encoder.encode(payload)),
    ),
  );
}

function secureEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1)
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}

export async function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
) {
  return secureEqual(
    await hmacHex(secret, `${orderId}|${paymentId}`),
    signature,
  );
}

export async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
) {
  return secureEqual(await hmacHex(secret, rawBody), signature);
}

async function razorpayRequest<T>(
  path: string,
  init: RequestInit,
  keyId: string,
  keySecret: string,
): Promise<T> {
  const cleanKey = keyId.trim();
  const cleanSecret = keySecret.trim();
  const authorization = `Basic ${btoa(`${cleanKey}:${cleanSecret}`)}`;
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: new Headers({
      ...Object.fromEntries(new Headers(init.headers).entries()),
      Authorization: authorization,
      'Content-Type': 'application/json',
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(`Payment provider request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export async function createRazorpayOrder(
  keyId: string,
  keySecret: string,
  idempotencyKey: string,
  options?: {
    amountPaise?: number;
    receipt?: string;
    notes?: Record<string, string>;
  },
) {
  const amount = options?.amountPaise ?? 109900;
  const receipt = options?.receipt ?? 'secondhop_RTN-24094';
  return razorpayRequest<RazorpayOrder>(
    '/orders',
    {
      method: 'POST',
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        payment_capture: 1,
        notes: {
          transaction_id: options?.notes?.transaction_id ?? 'TXN-2H-884921',
          mandate_id: options?.notes?.mandate_id ?? 'MND-884921',
          idempotency_key: idempotencyKey,
          ...options?.notes,
        },
      }),
    },
    keyId,
    keySecret,
  );
}

export async function fetchRazorpayPayment(
  paymentId: string,
  keyId: string,
  keySecret: string,
) {
  return razorpayRequest<{
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: string;
  }>(
    `/payments/${encodeURIComponent(paymentId)}`,
    { method: 'GET' },
    keyId,
    keySecret,
  );
}

export async function captureRazorpayPayment(
  paymentId: string,
  amountPaise: number,
  keyId: string,
  keySecret: string,
) {
  return razorpayRequest<{ id: string; status: string }>(
    `/payments/${encodeURIComponent(paymentId)}/capture`,
    {
      method: 'POST',
      body: JSON.stringify({ amount: amountPaise, currency: 'INR' }),
    },
    keyId,
    keySecret,
  );
}

export async function createRazorpayRefund(
  paymentId: string,
  keyId: string,
  keySecret: string,
  idempotencyKey: string,
  options?: { amountPaise?: number; notes?: Record<string, string> },
) {
  const amount = options?.amountPaise ?? 109900;
  return razorpayRequest<RazorpayRefund>(
    `/payments/${encodeURIComponent(paymentId)}/refund`,
    {
      method: 'POST',
      headers: { 'X-Refund-Idempotency': idempotencyKey },
      body: JSON.stringify({
        amount,
        speed: 'normal',
        notes: {
          reason: 'secondhop_handoff_condition_failed',
          transaction_id: options?.notes?.transaction_id ?? 'TXN-2H-884921',
          ...options?.notes,
        },
      }),
    },
    keyId,
    keySecret,
  );
}

export async function fetchRazorpayRefund(
  refundId: string,
  keyId: string,
  keySecret: string,
) {
  return razorpayRequest<RazorpayRefund>(
    `/refunds/${encodeURIComponent(refundId)}`,
    { method: 'GET' },
    keyId,
    keySecret,
  );
}

export async function fetchRazorpayOrder(
  orderId: string,
  keyId: string,
  keySecret: string,
) {
  return razorpayRequest<RazorpayOrder>(
    `/orders/${encodeURIComponent(orderId)}`,
    { method: 'GET' },
    keyId,
    keySecret,
  );
}
export async function fetchRazorpayOrderPayments(
  orderId: string,
  keyId: string,
  keySecret: string,
) {
  return razorpayRequest<{
    items: {
      id: string;
      order_id: string;
      amount: number;
      currency: string;
      status: string;
    }[];
  }>(
    `/orders/${encodeURIComponent(orderId)}/payments`,
    { method: 'GET' },
    keyId,
    keySecret,
  );
}
