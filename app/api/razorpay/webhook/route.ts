import { receiveWebhook } from '@/lib/rescue-webhook';
import { RescueError } from '@/lib/rescue-store';
export async function POST(request: Request) {
  try {
    return Response.json(await receiveWebhook(request));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid event.' },
      { status: error instanceof RescueError ? error.status : 400 },
    );
  }
}
