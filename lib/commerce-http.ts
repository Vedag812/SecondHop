import { CATALOG_PARCELS } from './rescue';
import {
  createOrder,
  reserve,
  safeCase,
  testKeys,
  verifyPayment,
  refund,
} from './rescue-service';
import {
  readWorkspace,
  randomToken,
  findCase,
  RescueError,
} from './rescue-store';
import { PRODUCTS } from './products';

export function workspaceCookie(request: Request) {
  return request.headers
    .get('cookie')
    ?.match(/(?:^|;\s*)secondhop_workspace=([a-f0-9]{64})(?:;|$)/)?.[1];
}
export function commerceReply(
  request: Request,
  data: unknown,
  id?: string,
  status = 200,
) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...(id
        ? {
            'Set-Cookie': `secondhop_workspace=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
          }
        : {}),
    },
  });
}
export async function commerceBody(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    throw new RescueError('Cross-origin changes are not allowed.', 403);
  const raw = await request.text();
  if (raw.length > 12000) throw new RescueError('Request is too large.', 413);
  const body: unknown = JSON.parse(raw);
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new RescueError('Send an object.');
  return body as Record<string, unknown>;
}
export function commerceError(request: Request, error: unknown) {
  return commerceReply(
    request,
    {
      error:
        error instanceof Error
          ? error.message
          : 'Checkout could not be completed.',
    },
    undefined,
    error instanceof RescueError ? error.status : 400,
  );
}
export async function productOrder(request: Request) {
  try {
    const body = await commerceBody(request);
    const product = PRODUCTS.find(
      (p) =>
        p.id === body.productId ||
        (body.mandateId && p.mandateId === body.mandateId),
    );
    if (!product) throw new RescueError('Choose a valid product.', 404);
    const parcel = CATALOG_PARCELS.find((p) => p.productId === product.id)!;
    const expectedAmount = parcel.economics.localPricePaise;
    if (
      (body.amountPaise !== undefined && body.amountPaise !== expectedAmount) ||
      (body.amount !== undefined &&
        (typeof body.amount !== 'number' ||
          Math.round(body.amount * 100) !== expectedAmount))
    )
      throw new RescueError(
        'The amount does not match the merchant’s current offer.',
      );
    const id = workspaceCookie(request) ?? randomToken();
    let available = false;
    try {
      testKeys();
      available = true;
    } catch {
      /* Configuration only. */
    }
    const rail =
      body.mode === 'simulation' ||
      body.mode === 'mock' ||
      body.rail === 'simulation'
        ? 'simulation'
        : available
          ? 'razorpay_test'
          : null;
    if (!rail)
      throw new RescueError(
        'Test checkout is not configured. Select simulation explicitly to rehearse without money.',
        503,
      );
    const caseId = await reserve(id, {
      parcelId: parcel.id,
      requestId:
        body.requestId ??
        request.headers.get('Idempotency-Key') ??
        `store_${product.id}`,
      budgetPaise: body.maxAuthorizedPaise ?? expectedAmount,
      radiusKm: body.maxRadiusKm ?? parcel.radiusKm,
      requestedVariant: body.requestedVariant ?? parcel.variant,
      courierPaise: parcel.economics.courierPaise,
      rail,
      injectRefundTimeout: body.injectRefundTimeout === true,
    });
    const order = await createOrder(id, caseId);
    const { workspace } = await readWorkspace(id);
    return commerceReply(
      request,
      {
        caseId,
        mode: rail === 'simulation' ? 'simulation' : 'test',
        keyId: order.keyId,
        order: {
          id: order.orderId,
          amount: order.amountPaise,
          currency: 'INR',
          status: 'created',
        },
        product,
        case: safeCase(findCase(workspace, caseId), 'owner'),
      },
      id,
    );
  } catch (error) {
    return commerceError(request, error);
  }
}
export async function productVerify(request: Request) {
  try {
    const body = await commerceBody(request);
    const id = workspaceCookie(request);
    if (!id)
      throw new RescueError(
        'Use the same checkout session that created the order.',
        401,
      );
    const { workspace } = await readWorkspace(id);
    const c = workspace.cases.find(
      (c) =>
        c.orderId === body.razorpay_order_id ||
        (body.caseId && c.id === body.caseId),
    );
    if (!c)
      throw new RescueError('Order not found in this checkout session.', 404);
    await verifyPayment(id, c.id, {
      ...body,
      action:
        body.mode === 'simulation' || body.mode === 'mock'
          ? 'simulate_payment'
          : 'verify_payment',
    });
    const updated = findCase((await readWorkspace(id)).workspace, c.id);
    return commerceReply(request, {
      caseId: c.id,
      verified: Boolean(updated.paymentId),
      authoritativeStatus:
        updated.state === 'PAID' ? 'captured' : updated.state,
      mode: c.rail === 'simulation' ? 'simulation' : 'test',
      case: safeCase(updated, 'owner'),
    });
  } catch (error) {
    return commerceError(request, error);
  }
}
export async function productRefund(request: Request) {
  try {
    const body = await commerceBody(request);
    const id = workspaceCookie(request);
    if (!id)
      throw new RescueError(
        'Use the checkout session that owns this payment.',
        401,
      );
    const { workspace } = await readWorkspace(id);
    const c = workspace.cases.find(
      (c) =>
        (body.caseId && c.id === body.caseId) ||
        (body.paymentId && c.paymentId === body.paymentId),
    );
    if (!c) throw new RescueError('Payment not found in this session.', 404);
    if (
      body.amountPaise !== undefined &&
      body.amountPaise !== c.decision.economics.localPricePaise
    )
      throw new RescueError(
        'Refund amount must match the stored captured payment.',
      );
    await refund(id, c.id);
    const updated = findCase((await readWorkspace(id)).workspace, c.id);
    return commerceReply(request, {
      caseId: c.id,
      refund: {
        id: updated.refundId,
        status: updated.state === 'REFUNDED' ? 'processed' : 'pending',
        amount: updated.decision.economics.localPricePaise,
      },
      case: safeCase(updated, 'owner'),
    });
  } catch (error) {
    return commerceError(request, error);
  }
}
