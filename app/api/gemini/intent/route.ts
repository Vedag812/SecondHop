import { extractIntent } from '@/lib/gemini';

export async function POST(request: Request) {
  const body = (await request.json()) as { input?: string };
  if (!body.input || body.input.length > 2000)
    return Response.json(
      { error: 'Provide a purchase request under 2,000 characters.' },
      { status: 400 },
    );
  return Response.json(
    await extractIntent(body.input, process.env.GEMINI_API_KEY),
  );
}
