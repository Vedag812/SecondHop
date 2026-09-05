import { database } from '@/lib/rescue-store';
export async function GET() {
  try {
    const db = await database();
    await db.prepare('SELECT 1').first();
    return Response.json({
      status: 'ready',
      ledger: 'd1',
      livePaymentsEnabled: false,
    });
  } catch {
    return Response.json(
      { status: 'unavailable', ledger: 'unavailable' },
      { status: 503 },
    );
  }
}
