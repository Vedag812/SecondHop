import {
  ALL_PARCELS,
  evaluateRescue,
  parcelIsReserved,
  nextHandoffState,
  type RescueCase,
  type SafeCase,
  type Workspace,
} from './rescue';
import {
  changeWorkspace,
  readWorkspace,
  record,
  findCase,
  randomToken,
  RescueError,
} from './rescue-store';
import {
  createRazorpayOrder,
  createRazorpayRefund,
  fetchRazorpayPayment,
  captureRazorpayPayment,
  fetchRazorpayRefund,
  fetchRazorpayOrder,
  fetchRazorpayOrderPayments,
  verifyCheckoutSignature,
} from './razorpay';

export function testKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId?.startsWith('rzp_test_') || !secret)
    throw new RescueError(
      'Test checkout keys are not configured. Use the explicitly labelled simulation.',
      503,
    );
  return { keyId, secret };
}
export function safeCase(
  c: RescueCase,
  role: 'owner' | 'buyer' | 'courier',
): SafeCase {
  const { tokenBuyer, tokenCourier, otp, ...rest } = c;
  if (role === 'owner')
    return {
      ...rest,
      buyerLink: `/handoff/${c.id}?role=buyer#${tokenBuyer}`,
      courierLink: `/handoff/${c.id}?role=courier#${tokenCourier}`,
    };
  if (
    role === 'buyer' &&
    !c.passUsedAt &&
    ['PAID', 'COURIER_VERIFIED'].includes(c.state)
  )
    return { ...rest, otp };
  return rest;
}
const str = (value: unknown, name: string) => {
  if (typeof value !== 'string' || !value.trim() || value.length > 2000)
    throw new RescueError(`Provide ${name}.`);
  return value.trim();
};
const num = (value: unknown, name: string) => {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new RescueError(`Provide a valid ${name}.`);
  return value;
};
export async function reserve(
  workspaceId: string,
  body: Record<string, unknown>,
) {
  const parcel = ALL_PARCELS.find((p) => p.id === body.parcelId);
  if (!parcel) throw new RescueError('Choose a parcel in this demo hub.');
  const requestId = str(body.requestId, 'request ID');
  const budgetPaise = num(body.budgetPaise, 'budget');
  const radiusKm = num(body.radiusKm, 'radius');
  const courierPaise = num(body.courierPaise, 'courier cost');
  const requestedVariant = str(body.requestedVariant, 'requested colour');
  const rail =
    body.rail === 'razorpay_test'
      ? 'razorpay_test'
      : body.rail === 'simulation'
        ? 'simulation'
        : null;
  if (!rail)
    throw new RescueError('Choose simulation or Test payment checkout.');
  if (rail === 'razorpay_test') testKeys();
  const result = await changeWorkspace(workspaceId, async (w) => {
    const existing = w.cases.find((c) => c.requestId === requestId);
    if (existing) {
      if (
        existing.parcel.id !== parcel.id ||
        existing.buyerBudgetPaise !== budgetPaise ||
        existing.radiusKm !== radiusKm ||
        existing.requestedVariant !== requestedVariant ||
        existing.decision.economics.courierPaise !== courierPaise ||
        existing.rail !== rail
      )
        throw new RescueError(
          'This request ID is already bound to a different offer.',
          409,
        );
      return { id: existing.id };
    }
    if (w.cases.length >= 50)
      throw new RescueError('Start a new demo workspace to add more cases.');
    if (
      !w.cutoffAt ||
      Date.parse(w.cutoffAt) <= Date.now() + parcel.etaMinutes * 60000
    ) {
      w.cutoffAt = new Date(Date.now() + 45 * 60000).toISOString();
    }
    const decision = evaluateRescue(parcel, {
      budgetPaise,
      radiusKm,
      courierPaise,
      requestedVariant,
      cutoffAt: w.cutoffAt,
    });
    if (!decision.allowed) {
      const reasons = decision.rules
        .filter((r) => !r.passed)
        .map((r) => r.name);
      w.rejectedDecisions.push({
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        parcel: parcel.title,
        reasons,
      });
      w.rejectedDecisions = w.rejectedDecisions.slice(-100);
      return { denied: reasons.join(' · ') };
    }
    if (parcelIsReserved(w.cases, parcel.id))
      throw new RescueError(
        'This individual parcel is already reserved. No second buyer was charged.',
        409,
      );
    const c: RescueCase = {
      id: crypto.randomUUID(),
      requestId,
      parcel,
      decision,
      buyerBudgetPaise: budgetPaise,
      radiusKm,
      requestedVariant,
      rail,
      state: 'RESERVED',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 8 * 60000).toISOString(),
      cutoffAt: w.cutoffAt,
      tokenBuyer: randomToken(),
      tokenCourier: randomToken(),
      otp: String(
        100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000),
      ),
      otpAttempts: 0,
      passUsedAt: null,
      courierEvidence: null,
      buyerEvidence: null,
      orderId: null,
      paymentId: null,
      refundId: null,
      refundKey: `refund_${crypto.randomUUID()}`,
      refundAttempts: 0,
      refundSubmittedAt: null,
      failureReason: null,
      providerMessage: null,
      injectRefundTimeout:
        body.injectRefundTimeout === true && rail === 'simulation',
      warehouseReturn: 'not_requested',
      originalBuyerRefund: 'merchant_policy_applies',
      events: [],
    };
    await record(
      c,
      'Merchant',
      'Reservation created',
      'Exact parcel, buyer limits and quoted costs locked for 8 minutes. Seeded inventory; estimated economics.',
    );
    w.cases.push(c);
    return { id: c.id };
  });
  if ('denied' in result)
    throw new RescueError(`Redirect declined: ${result.denied}`, 422);
  return result.id;
}
export async function createOrder(workspaceId: string, caseId: string) {
  const c = await changeWorkspace(workspaceId, async (w) => {
    const c = findCase(w, caseId);
    if (c.orderId) return structuredClone(c);
    if (c.state !== 'RESERVED')
      throw new RescueError(
        'This payment operation is already running or needs review.',
        409,
      );
    if (Date.parse(c.expiresAt) <= Date.now()) {
      c.state = 'EXPIRED';
      await record(
        c,
        'Policy',
        'Reservation expired',
        'No payment started; warehouse route retained.',
      );
      return structuredClone(c);
    }
    c.state = 'ORDER_CREATING';
    await record(
      c,
      'Payment service',
      'Order operation claimed',
      'Parcel remains locked while the provider outcome is pending.',
    );
    return structuredClone(c);
  });
  if (c.state === 'EXPIRED')
    throw new RescueError(
      'Reservation expired. Start a new demo or choose another return.',
      410,
    );
  if (c.orderId)
    return {
      orderId: c.orderId,
      amountPaise: c.decision.economics.localPricePaise,
      keyId: c.rail === 'razorpay_test' ? testKeys().keyId : null,
    };
  try {
    const keys = c.rail === 'razorpay_test' ? testKeys() : null;
    const order = keys
      ? await createRazorpayOrder(keys.keyId, keys.secret, c.id, {
          amountPaise: c.decision.economics.localPricePaise,
          receipt: `sh_${c.id.replaceAll('-', '')}`,
          notes: { case_id: c.id, mode: c.rail },
        })
      : {
          id: `sim_order_${c.id}`,
          amount: c.decision.economics.localPricePaise,
          currency: 'INR',
        };
    if (
      order.amount !== c.decision.economics.localPricePaise ||
      order.currency !== 'INR'
    )
      throw new Error(
        'Provider order amount did not match the reserved offer.',
      );
    await changeWorkspace(workspaceId, async (w) => {
      const current = findCase(w, caseId);
      current.orderId = order.id;
      current.state = 'PAYMENT_PENDING';
      await record(
        current,
        'Payment service',
        'Order created',
        `${c.rail === 'simulation' ? 'Simulated' : 'Test payment'} order created. Payment is still awaiting confirmation.`,
      );
    });
    return {
      orderId: order.id,
      amountPaise: order.amount,
      keyId: keys?.keyId ?? null,
    };
  } catch (error) {
    await changeWorkspace(workspaceId, async (w) => {
      const current = findCase(w, caseId);
      current.state = 'PAYMENT_REVIEW';
      current.providerMessage =
        'Order result is uncertain. Check the provider dashboard before creating another order. The parcel remains reserved.';
      await record(
        current,
        'Payment service',
        'Order requires reconciliation',
        current.providerMessage,
      );
    });
    throw new RescueError(
      error instanceof Error
        ? error.message
        : 'Order creation requires review.',
      502,
    );
  }
}
async function markPaid(
  workspaceId: string,
  caseId: string,
  paymentId: string,
) {
  await changeWorkspace(workspaceId, async (w) => {
    const c = findCase(w, caseId);
    if (
      c.paymentId === paymentId &&
      !['PAYMENT_PENDING', 'PAYMENT_REVIEW'].includes(c.state)
    )
      return;
    if (!['PAYMENT_PENDING', 'PAYMENT_REVIEW'].includes(c.state))
      throw new RescueError('Payment cannot advance this case.', 409);
    c.paymentId = paymentId;
    c.providerMessage = null;
    if (Date.parse(c.cutoffAt) <= Date.now()) {
      c.state = 'REFUND_PENDING';
      c.failureReason = 'Payment arrived after the hub cutoff.';
      c.warehouseReturn = 'required';
      c.passUsedAt = new Date().toISOString();
    } else c.state = 'PAID';
    await record(
      c,
      'Payment service',
      'Payment confirmed',
      `${c.rail === 'simulation' ? 'Simulation event; no money moved.' : 'Captured Test payment payment verified against stored order, INR and amount.'}${c.state === 'REFUND_PENDING' ? ' Late payment queued for refund.' : ''}`,
    );
  });
  if (
    findCase((await readWorkspace(workspaceId)).workspace, caseId).state ===
    'REFUND_PENDING'
  )
    await refund(workspaceId, caseId);
}
export async function reconcileOrder(
  workspaceId: string,
  caseId: string,
  suppliedOrderId: unknown,
) {
  const c = findCase((await readWorkspace(workspaceId)).workspace, caseId);
  if (
    c.rail !== 'razorpay_test' ||
    !['ORDER_CREATING', 'PAYMENT_REVIEW', 'PAYMENT_PENDING'].includes(c.state)
  )
    throw new RescueError('This case does not have an unresolved test order.');
  const orderId = str(
    suppliedOrderId ?? c.orderId,
    'existing order reference from the provider dashboard',
  );
  const keys = testKeys();
  const order = await fetchRazorpayOrder(orderId, keys.keyId, keys.secret);
  if (
    order.amount !== c.decision.economics.localPricePaise ||
    order.currency !== 'INR' ||
    order.receipt !== `sh_${c.id.replaceAll('-', '')}` ||
    order.notes?.case_id !== c.id
  )
    throw new RescueError(
      'This order does not belong to the reserved purchase.',
    );
  await changeWorkspace(workspaceId, async (w) => {
    const current = findCase(w, caseId);
    if (
      !['ORDER_CREATING', 'PAYMENT_REVIEW', 'PAYMENT_PENDING'].includes(
        current.state,
      )
    )
      return;
    current.orderId = order.id;
    current.state = 'PAYMENT_PENDING';
    current.providerMessage = null;
    await record(
      current,
      'Merchant reconciliation',
      'Existing order recovered',
      'Provider order, case reference, receipt, currency and amount matched. No new order created.',
    );
  });
  const payments = await fetchRazorpayOrderPayments(
    order.id,
    keys.keyId,
    keys.secret,
  );
  const captured = payments.items.find(
    (p) =>
      p.status === 'captured' &&
      p.order_id === order.id &&
      p.amount === order.amount &&
      p.currency === 'INR',
  );
  if (captured) await markPaid(workspaceId, caseId, captured.id);
}
export async function verifyPayment(
  workspaceId: string,
  caseId: string,
  body: Record<string, unknown>,
) {
  const { workspace } = await readWorkspace(workspaceId);
  const c = findCase(workspace, caseId);
  if (c.rail === 'simulation') {
    if (body.action !== 'simulate_payment')
      throw new RescueError('Use the explicit simulation action.');
    if (!c.orderId) throw new RescueError('Create an order first.');
    await markPaid(workspaceId, caseId, `sim_payment_${c.id}`);
    return;
  }
  const paymentId = str(body.razorpay_payment_id ?? c.paymentId, 'payment ID');
  const signature = str(body.razorpay_signature, 'checkout signature');
  const keys = testKeys();
  if (
    !c.orderId ||
    body.razorpay_order_id !== c.orderId ||
    !(await verifyCheckoutSignature(
      c.orderId,
      paymentId,
      signature,
      keys.secret,
    ))
  )
    throw new RescueError(
      'Payment signature or order does not match this reserved parcel.',
      400,
    );
  await changeWorkspace(workspaceId, (w) => {
    const current = findCase(w, caseId);
    if (['PAYMENT_PENDING', 'PAYMENT_REVIEW'].includes(current.state)) {
      current.paymentId = paymentId;
      current.providerMessage =
        'Signed checkout received. Payment capture still requires provider confirmation.';
    }
  });
  const payment = await fetchRazorpayPayment(
    paymentId,
    keys.keyId,
    keys.secret,
  );
  if (
    payment.order_id !== c.orderId ||
    payment.amount !== c.decision.economics.localPricePaise ||
    payment.currency !== 'INR'
  )
    throw new RescueError('Payment details do not match the reserved offer.');
  let paymentStatus = payment.status;
  if (paymentStatus === 'authorized') {
    try {
      const captured = await captureRazorpayPayment(
        paymentId,
        c.decision.economics.localPricePaise,
        keys.keyId,
        keys.secret,
      );
      if (captured.status === 'captured') paymentStatus = 'captured';
    } catch {
      /* proceed to check */
    }
  }
  if (paymentStatus !== 'captured') {
    await changeWorkspace(workspaceId, (w) => {
      const current = findCase(w, caseId);
      if (['PAYMENT_PENDING', 'PAYMENT_REVIEW'].includes(current.state)) {
        current.paymentId = paymentId;
        current.providerMessage = `Payment is ${paymentStatus}; handoff stays locked. Use Check payment status.`;
      }
    });
    throw new RescueError(
      `Payment is ${paymentStatus}. Await capture before handoff.`,
      409,
    );
  }
  await markPaid(workspaceId, caseId, payment.id);
}
export async function reconcilePayment(workspaceId: string, caseId: string) {
  const { workspace } = await readWorkspace(workspaceId);
  const c = findCase(workspace, caseId);
  if (c.rail !== 'razorpay_test' || !c.paymentId || !c.orderId)
    throw new RescueError('No stored test payment is available to check.');
  const keys = testKeys();
  const payment = await fetchRazorpayPayment(
    c.paymentId,
    keys.keyId,
    keys.secret,
  );
  if (
    payment.order_id !== c.orderId ||
    payment.amount !== c.decision.economics.localPricePaise ||
    payment.currency !== 'INR'
  )
    throw new RescueError('Payment mismatch.');
  let paymentStatus = payment.status;
  if (paymentStatus === 'authorized') {
    try {
      const captured = await captureRazorpayPayment(
        c.paymentId,
        c.decision.economics.localPricePaise,
        keys.keyId,
        keys.secret,
      );
      if (captured.status === 'captured') paymentStatus = 'captured';
    } catch {
      /* proceed */
    }
  }
  if (paymentStatus === 'captured')
    await markPaid(workspaceId, caseId, payment.id);
  else
    throw new RescueError(
      `Payment is still ${paymentStatus}; fulfillment remains locked.`,
      409,
    );
}
export async function refund(workspaceId: string, caseId: string) {
  const claim = await changeWorkspace(workspaceId, async (w) => {
    const c = findCase(w, caseId);
    if (c.state === 'REFUNDED') return { c: structuredClone(c), done: true };
    if (
      c.state === 'REFUND_SUBMITTING' &&
      c.refundSubmittedAt &&
      Date.now() - Date.parse(c.refundSubmittedAt) < 30000
    )
      throw new RescueError('Refund request is already in progress.', 409);
    if (
      !['REFUND_PENDING', 'REFUND_SUBMITTING', 'REFUND_REVIEW'].includes(
        c.state,
      ) ||
      !c.paymentId
    )
      throw new RescueError(
        'This case has no captured payment awaiting refund.',
      );
    c.state = 'REFUND_SUBMITTING';
    c.refundAttempts++;
    c.refundSubmittedAt = new Date().toISOString();
    await record(
      c,
      'Recovery service',
      'Refund operation claimed',
      'Reusing the stored refund key and amount. A request is not a completed refund.',
    );
    return { c: structuredClone(c), done: false };
  });
  const { c } = claim;
  if (claim.done) return;
  try {
    if (
      c.rail === 'simulation' &&
      c.injectRefundTimeout &&
      c.refundAttempts === 1
    )
      throw new Error(
        'Injected provider timeout. No simulated refund was confirmed. Retry uses the same refund key.',
      );
    const keys = c.rail === 'razorpay_test' ? testKeys() : null;
    const result = keys
      ? c.refundId
        ? await fetchRazorpayRefund(c.refundId, keys.keyId, keys.secret)
        : await createRazorpayRefund(
            c.paymentId!,
            keys.keyId,
            keys.secret,
            c.refundKey,
            {
              amountPaise: c.decision.economics.localPricePaise,
              notes: { case_id: c.id, reason: 'handoff_failed' },
            },
          )
      : {
          id: `sim_refund_${c.id}`,
          payment_id: c.paymentId,
          amount: c.decision.economics.localPricePaise,
          status: 'processed',
        };
    if (
      result.payment_id !== c.paymentId ||
      result.amount !== c.decision.economics.localPricePaise
    )
      throw new Error(
        'Refund response does not match the stored payment and amount.',
      );
    await changeWorkspace(workspaceId, async (w) => {
      const current = findCase(w, caseId);
      if (current.state === 'REFUNDED') return;
      current.refundId = result.id;
      current.state =
        result.status === 'processed'
          ? 'REFUNDED'
          : result.status === 'failed'
            ? 'REFUND_REVIEW'
            : 'REFUND_PENDING';
      current.providerMessage =
        current.state === 'REFUND_PENDING'
          ? 'Provider is processing the refund. Check again for the confirmed outcome.'
          : current.state === 'REFUND_REVIEW'
            ? 'Provider reports a failed refund. Merchant review is required.'
            : null;
      await record(
        current,
        'Recovery service',
        current.state === 'REFUNDED'
          ? 'Refund confirmed'
          : 'Refund status updated',
        `${c.rail === 'simulation' ? 'Simulation only' : 'Test payment'}: ${result.status}. Warehouse routing is tracked separately.`,
      );
    });
  } catch (error) {
    await changeWorkspace(workspaceId, async (w) => {
      const current = findCase(w, caseId);
      if (current.state === 'REFUNDED') return;
      current.state = 'REFUND_PENDING';
      current.providerMessage =
        error instanceof Error
          ? error.message
          : 'Refund outcome unknown. Retry with the same stored key.';
      await record(
        current,
        'Recovery service',
        'Refund remains pending',
        current.providerMessage,
      );
    });
  }
}
export async function inspect(
  workspaceId: string,
  caseId: string,
  role: 'courier' | 'buyer',
  body: Record<string, unknown>,
) {
  const result = await changeWorkspace(workspaceId, async (w) => {
    const c = findCase(w, caseId);
    if (c.passUsedAt)
      throw new RescueError(
        'This handoff pass has already been consumed or revoked.',
        410,
      );
    if (Date.parse(c.cutoffAt) <= Date.now())
      throw new RescueError(
        'Handoff window expired. Merchant must run recovery.',
        410,
      );
    const accepted = body.accepted === true;
    const evidence = str(body.evidence, 'inspection notes');
    if (evidence.length < 8)
      throw new RescueError('Record at least a short inspection note.');
    const next = nextHandoffState(c.state, role, accepted);
    if (role === 'courier' && accepted && body.serial !== c.parcel.serial)
      throw new RescueError(
        'Serial number mismatch. The parcel cannot be approved.',
      );
    if (
      role === 'buyer' &&
      accepted &&
      (typeof body.otp !== 'string' || body.otp !== c.otp)
    ) {
      c.otpAttempts++;
      await record(
        c,
        'Buyer',
        'OTP rejected',
        `Incorrect code attempt ${c.otpAttempts} of 5.`,
      );
      if (c.otpAttempts >= 5) {
        c.state = 'REFUND_PENDING';
        c.passUsedAt = new Date().toISOString();
        c.failureReason = 'Handoff locked after five incorrect OTP attempts.';
        c.warehouseReturn = 'required';
      }
      return { wrongOtp: true, rejected: c.state === 'REFUND_PENDING' };
    }
    c.state = next;
    if (role === 'courier') c.courierEvidence = evidence;
    else c.buyerEvidence = evidence;
    if (next === 'DELIVERED' || next === 'REFUND_PENDING')
      c.passUsedAt = new Date().toISOString();
    if (next === 'REFUND_PENDING') {
      c.failureReason = evidence;
      c.warehouseReturn = 'required';
    }
    if (next === 'DELIVERED')
      c.originalBuyerRefund = 'merchant_review_required';
    await record(
      c,
      role === 'buyer' ? 'Buyer' : 'Courier',
      accepted
        ? role === 'buyer'
          ? 'Handoff accepted'
          : 'Parcel inspected'
        : 'Handoff rejected',
      `${evidence} Recorded in a demo logistics workflow; no carrier dispatch API is connected.`,
    );
    return { wrongOtp: false, rejected: next === 'REFUND_PENDING' };
  });
  if (result.rejected) await refund(workspaceId, caseId);
  if (result.wrongOtp)
    throw new RescueError('Incorrect OTP. Handoff was not completed.', 400);
}
export async function expireCase(workspaceId: string, caseId: string) {
  let paid = false;
  await changeWorkspace(workspaceId, async (w) => {
    const c = findCase(w, caseId);
    if (c.rail !== 'simulation' && Date.parse(c.cutoffAt) > Date.now())
      throw new RescueError('The handoff deadline has not expired.');
    if (c.state === 'RESERVED') {
      c.state = 'EXPIRED';
      c.warehouseReturn = 'required';
    } else if (['PAID', 'COURIER_VERIFIED'].includes(c.state)) {
      c.state = 'REFUND_PENDING';
      c.failureReason = 'Handoff deadline expired.';
      c.warehouseReturn = 'required';
      c.passUsedAt = new Date().toISOString();
      paid = true;
    } else
      throw new RescueError(
        'This case cannot be expired while its payment outcome is uncertain or already completed.',
        409,
      );
    await record(
      c,
      'Policy',
      'Deadline recovery',
      c.rail === 'simulation'
        ? 'Simulated deadline event. Standard return routing is required.'
        : 'Handoff deadline passed. Standard return routing is required.',
    );
  });
  if (paid) await refund(workspaceId, caseId);
}
export async function acknowledgeWarehouse(
  workspaceId: string,
  caseId: string,
) {
  await changeWorkspace(workspaceId, async (w: Workspace) => {
    const c = findCase(w, caseId);
    if (c.warehouseReturn !== 'required')
      throw new RescueError('No warehouse return is awaiting acknowledgment.');
    c.warehouseReturn = 'acknowledged';
    await record(
      c,
      'Courier',
      'Warehouse fallback acknowledged',
      'Demo courier acknowledged the original route. This is not a live carrier tracking event.',
    );
  });
}
