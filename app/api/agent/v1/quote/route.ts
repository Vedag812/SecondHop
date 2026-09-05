import { CATALOG_PARCELS } from '@/lib/rescue';
import { reserve, safeCase } from '@/lib/rescue-service';
import {
  readWorkspace,
  findCase,
  randomToken,
  RescueError,
} from '@/lib/rescue-store';
import {
  commerceBody,
  commerceError,
  commerceReply,
  workspaceCookie,
} from '@/lib/commerce-http';
export async function POST(request: Request) {
  try {
    const body = await commerceBody(request);
    if (body.approved !== true)
      throw new RescueError(
        'Explicit approval of this exact purchase is required.',
        403,
      );
    const parcel = CATALOG_PARCELS.find((p) => p.productId === body.productId);
    if (!parcel) throw new RescueError('Product not found.', 404);
    const id = workspaceCookie(request) ?? randomToken();
    const caseId = await reserve(id, {
      parcelId: parcel.id,
      requestId: body.requestId ?? crypto.randomUUID(),
      budgetPaise: body.maxAuthorizedPaise,
      radiusKm: body.maxRadiusKm,
      requestedVariant: body.requestedVariant,
      courierPaise: parcel.economics.courierPaise,
      rail: body.rail,
    });
    const c = findCase((await readWorkspace(id)).workspace, caseId);
    return commerceReply(
      request,
      {
        status: 'AUTHORIZED_AND_RESERVED',
        mandateId: caseId,
        maximumChargePaise: c.buyerBudgetPaise,
        chargePaise: c.decision.economics.localPricePaise,
        expiresAt: c.expiresAt,
        case: safeCase(c, 'owner'),
        next: '/api/agent/v1/transact',
      },
      id,
    );
  } catch (error) {
    return commerceError(request, error);
  }
}
