import { ALL_PARCELS } from '@/lib/rescue';
import {
  acknowledgeWarehouse,
  createOrder,
  expireCase,
  inspect,
  reconcileOrder,
  reconcilePayment,
  refund,
  reserve,
  safeCase,
  testKeys,
  verifyPayment,
} from '@/lib/rescue-service';
import {
  findCase,
  findWorkspaceForCase,
  randomToken,
  readWorkspace,
  RescueError,
  storageMode,
} from '@/lib/rescue-store';

function cookieWorkspace(request: Request) {
  return request.headers
    .get('cookie')
    ?.match(/(?:^|;\s*)secondhop_workspace=([a-f0-9]{64})(?:;|$)/)?.[1];
}
function reply(
  request: Request,
  data: unknown,
  workspaceId?: string,
  status = 200,
) {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  if (workspaceId)
    headers['Set-Cookie'] =
      `secondhop_workspace=${workspaceId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
  return Response.json(data, { status, headers });
}
function failure(request: Request, error: unknown) {
  return reply(
    request,
    {
      error:
        error instanceof Error
          ? error.message
          : 'The action could not be completed.',
    },
    undefined,
    error instanceof RescueError ? error.status : 500,
  );
}
async function access(request: Request, caseId: string) {
  const token = request.headers.get('x-handoff-token');
  if (token) {
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new RescueError('Invalid handoff capability.', 403);
    const workspaceId = await findWorkspaceForCase(caseId);
    const { workspace } = await readWorkspace(workspaceId);
    const c = findCase(workspace, caseId);
    const role: 'buyer' | 'courier' | null =
      token === c.tokenBuyer
        ? 'buyer'
        : token === c.tokenCourier
          ? 'courier'
          : null;
    if (!role || Date.now() > Date.parse(c.createdAt) + 24 * 60 * 60000)
      throw new RescueError('Handoff access is invalid or expired.', 403);
    return { workspaceId, role } as const;
  }
  const workspaceId = cookieWorkspace(request);
  if (!workspaceId)
    throw new RescueError(
      'Open the operations dashboard to start your demo workspace.',
      401,
    );
  return { workspaceId, role: 'owner' as const };
}
async function snapshot(workspaceId: string) {
  const { workspace } = await readWorkspace(workspaceId);
  let testCheckoutAvailable = false;
  try {
    testKeys();
    testCheckoutAvailable = true;
  } catch {
    /* Explicit simulation remains available. */
  }
  return {
    workspace: {
      ...workspace,
      cases: workspace.cases.map((c) => safeCase(c, 'owner')),
    },
    parcels: ALL_PARCELS,
    testCheckoutAvailable,
    aiAvailable: Boolean(process.env.GEMINI_API_KEY),
    ledger: storageMode(),
    durableLedger: storageMode() === 'd1',
  };
}
export async function GET(request: Request) {
  try {
    const caseId = new URL(request.url).searchParams.get('caseId');
    if (caseId) {
      const { workspaceId, role } = await access(request, caseId);
      const { workspace } = await readWorkspace(workspaceId);
      return reply(request, {
        case: safeCase(findCase(workspace, caseId), role),
        role,
      });
    }
    const workspaceId = cookieWorkspace(request) ?? randomToken();
    return reply(request, await snapshot(workspaceId), workspaceId);
  } catch (error) {
    return failure(request, error);
  }
}
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin)
      throw new RescueError('Cross-origin changes are not allowed.', 403);
    if (!request.headers.get('content-type')?.includes('application/json'))
      throw new RescueError('Send a JSON request.', 415);
    const raw = await request.text();
    if (raw.length > 12000) throw new RescueError('Request is too large.', 413);
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new RescueError('Invalid request.');
    const input = body as Record<string, unknown>;
    if (input.action === 'new_demo') {
      const id = randomToken();
      return reply(request, await snapshot(id), id);
    }
    const caseId = typeof input.caseId === 'string' ? input.caseId : '';
    const { workspaceId, role } = await access(request, caseId);
    if (
      role !== 'owner' &&
      !['inspect', 'warehouse_ack'].includes(String(input.action))
    )
      throw new RescueError(
        'This handoff link cannot perform merchant or payment actions.',
        403,
      );
    let result: unknown = null;
    switch (input.action) {
      case 'reserve':
        result = { caseId: await reserve(workspaceId, input) };
        break;
      case 'order':
        result = await createOrder(workspaceId, caseId);
        break;
      case 'simulate_payment':
      case 'verify_payment':
        await verifyPayment(workspaceId, caseId, input);
        break;
      case 'check_payment':
        await reconcilePayment(workspaceId, caseId);
        break;
      case 'recover_order':
        await reconcileOrder(workspaceId, caseId, input.orderId);
        break;
      case 'refund':
        await refund(workspaceId, caseId);
        break;
      case 'expire':
        await expireCase(workspaceId, caseId);
        break;
      case 'inspect':
        if (role === 'owner')
          throw new RescueError(
            'Use the separate buyer or courier link for inspection.',
            403,
          );
        await inspect(workspaceId, caseId, role, input);
        break;
      case 'warehouse_ack':
        if (role !== 'courier')
          throw new RescueError(
            'Only the courier handoff link can acknowledge routing.',
            403,
          );
        await acknowledgeWarehouse(workspaceId, caseId);
        break;
      default:
        throw new RescueError('Unknown action.');
    }
    return reply(request, { ok: true, result });
  } catch (error) {
    return failure(request, error);
  }
}
