import { database, storageMode } from '@/lib/rescue-store';
export async function GET() {
  try {
    const db = await database();
    await db.prepare('SELECT 1').first();
    const ledger = storageMode();
    return Response.json({
      status: 'ready',
      ledger,
      durable: ledger === 'd1',
      livePaymentsEnabled: false,
      ...(ledger === 'memory'
        ? {
            warning:
              'Demo memory storage is active. Configure a D1-compatible database before relying on cross-instance persistence.',
          }
        : {}),
    });
  } catch {
    return Response.json(
      { status: 'unavailable', ledger: 'unavailable' },
      { status: 503 },
    );
  }
}
