import { POST as caseAction } from '@/app/api/rescue/route';
export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  return caseAction(
    new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({
        action: 'order',
        caseId: body.caseId ?? body.mandateId,
      }),
    }),
  );
}
