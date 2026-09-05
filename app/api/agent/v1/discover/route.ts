import { CATALOG_PARCELS } from '@/lib/rescue';
import { extractIntent } from '@/lib/gemini';
import { searchCatalog, publicCatalogItem } from '@/lib/agent-search';
import { commerceBody, commerceError } from '@/lib/commerce-http';
export function GET() {
  return Response.json({
    protocol: 'secondhop-demo/1',
    inventory: CATALOG_PARCELS.map(publicCatalogItem),
  });
}
export async function POST(request: Request) {
  try {
    const body = await commerceBody(request);
    if (
      typeof body.query !== 'string' ||
      body.query.length < 3 ||
      body.query.length > 2000
    )
      return Response.json(
        { error: 'Describe the product you want in 3–2,000 characters.' },
        { status: 400 },
      );
    const interpretation = await extractIntent(
      body.query,
      process.env.GEMINI_API_KEY,
    );
    const result = searchCatalog(
      {
        query: body.query,
        maximumPaise:
          typeof body.maxBudgetInr === 'number'
            ? Math.round(body.maxBudgetInr * 100)
            : 0,
        maximumKm: typeof body.maxRadiusKm === 'number' ? body.maxRadiusKm : 0,
      },
      interpretation.value,
    );
    return Response.json({
      ...result,
      interpretationMode: interpretation.mode,
      interpreted: interpretation.value,
      inventoryMode: 'demo',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return commerceError(request, error);
  }
}
