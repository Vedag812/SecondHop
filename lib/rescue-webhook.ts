import {
  changeWorkspace,
  database,
  findCase,
  readWorkspace,
  record,
  RescueError,
} from './rescue-store';
import { refund } from './rescue-service';
import { verifyWebhookSignature } from './razorpay';

type Entity = {
  id?: string;
  order_id?: string;
  payment_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  notes?: { case_id?: string };
};
export async function receiveWebhook(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const eventId = request.headers.get('x-razorpay-event-id') ?? '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (
    !secret ||
    !eventId ||
    raw.length > 100000 ||
    !(await verifyWebhookSignature(raw, signature, secret))
  )
    throw new RescueError('Invalid webhook signature.', 401);
  const body = JSON.parse(raw) as {
    event?: string;
    payload?: { payment?: { entity?: Entity }; refund?: { entity?: Entity } };
  };
  if (
    !['payment.captured', 'refund.processed', 'refund.failed'].includes(
      body.event ?? '',
    )
  )
    return { accepted: true, ignored: true };
  const paymentEvent = body.event === 'payment.captured';
  const entity = paymentEvent
    ? body.payload?.payment?.entity
    : body.payload?.refund?.entity;
  if (!entity?.id) throw new RescueError('Missing provider entity.');
  const entityId = entity.id;
  const db = await database();
  const orderOrPayment = paymentEvent ? entity.order_id : entity.payment_id;
  const field = paymentEvent ? '$.orderId' : '$.paymentId';
  const row = await db
    .prepare(
      "SELECT w.id AS workspaceId, json_extract(c.value, '$.id') AS caseId FROM rescue_workspaces w, json_each(w.payload, '$.cases') c WHERE json_extract(c.value, ?) = ? LIMIT 1",
    )
    .bind(field, orderOrPayment ?? '')
    .first<{ workspaceId: string; caseId: string }>();
  if (!row)
    return {
      accepted: true,
      ignored: true,
      reason: 'No matching case in this prototype.',
    };
  const outcome = await changeWorkspace(row.workspaceId, async (w) => {
    w.providerEventIds ??= [];
    if (w.providerEventIds.includes(eventId))
      return { accepted: true, duplicate: true };
    const c = findCase(w, row.caseId);
    if (
      c.rail !== 'razorpay_test' ||
      entity.amount !== c.decision.economics.localPricePaise ||
      (paymentEvent && entity.currency !== 'INR')
    )
      throw new RescueError(
        'Webhook does not match the stored test transaction.',
      );
    if (
      paymentEvent &&
      ['PAYMENT_PENDING', 'PAYMENT_REVIEW'].includes(c.state)
    ) {
      c.paymentId = entityId;
      c.providerMessage = null;
      if (Date.parse(c.cutoffAt) <= Date.now()) {
        c.state = 'REFUND_PENDING';
        c.failureReason = 'Payment confirmed after the hub cutoff.';
        c.warehouseReturn = 'required';
        c.passUsedAt = new Date().toISOString();
      } else c.state = 'PAID';
      await record(
        c,
        'Payment test webhook',
        'Captured payment reconciled',
        'Verified event matched the reserved order, currency and amount.',
      );
    } else if (
      !paymentEvent &&
      ['REFUND_PENDING', 'REFUND_SUBMITTING', 'REFUND_REVIEW'].includes(c.state)
    ) {
      if (c.refundId && c.refundId !== entity.id)
        throw new RescueError('Refund ID does not match.');
      if (!c.refundId && entity.notes?.case_id !== c.id)
        throw new RescueError('Unknown refund is not linked to this case.');
      c.refundId = entityId;
      c.state =
        body.event === 'refund.processed' ? 'REFUNDED' : 'REFUND_REVIEW';
      c.providerMessage =
        c.state === 'REFUND_REVIEW'
          ? 'Provider reports a failed refund. Merchant review required.'
          : null;
      await record(
        c,
        'Payment test webhook',
        'Refund reconciled',
        `Provider event: ${body.event}. Warehouse routing remains separate.`,
      );
    }
    w.providerEventIds.push(eventId);
    return { accepted: true, duplicate: false };
  });
  if (
    paymentEvent &&
    findCase((await readWorkspace(row.workspaceId)).workspace, row.caseId)
      .state === 'REFUND_PENDING'
  )
    await refund(row.workspaceId, row.caseId);
  return outcome;
}
