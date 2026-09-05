import { CATALOG_PARCELS, type Parcel } from './rescue.ts';
import type { GeminiIntent } from './gemini.ts';
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export function searchCatalog(
  input: { query: string; maximumPaise: number; maximumKm: number },
  parsed?: GeminiIntent,
) {
  if (
    !Number.isSafeInteger(input.maximumPaise) ||
    input.maximumPaise <= 0 ||
    !Number.isFinite(input.maximumKm) ||
    input.maximumKm <= 0 ||
    input.maximumKm > 15
  )
    throw new Error('Choose a positive budget and a radius up to 15 km.');
  const budgetPaise =
    parsed?.buyer_price_ceiling_paise && parsed.buyer_price_ceiling_paise > 0
      ? Math.min(input.maximumPaise, parsed.buyer_price_ceiling_paise)
      : input.maximumPaise;
  const radiusKm =
    parsed?.maximum_distance_km && parsed.maximum_distance_km > 0
      ? Math.min(input.maximumKm, parsed.maximum_distance_km)
      : input.maximumKm;
  const stop = new Set([
    'find',
    'want',
    'need',
    'with',
    'under',
    'below',
    'within',
    'only',
    'sealed',
    'unopened',
    'factory',
    'today',
    'please',
    'colour',
    'color',
    'budget',
    'maximum',
    'return',
    'returns',
    'buy',
    'inr',
    'and',
    'the',
    'for',
    'no',
    'substitutions',
    'show',
    'me',
    'looking',
  ]);
  const tokens = input.query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !stop.has(t) && !/^\d+$/.test(t));
  const model = normalize(parsed?.model ?? '');
  const prodType = normalize(parsed?.product_type ?? '');
  const colour = normalize(parsed?.colour ?? '');
  const brand = normalize(parsed?.brand ?? '');

  const ranked = CATALOG_PARCELS.map((p) => {
    const pTitle = normalize(p.title);
    const pSku = normalize(p.sku);
    const pVariant = normalize(p.variant);
    const pCat = normalize(p.category);
    const pHaystack = normalize(
      `${p.title} ${p.sku} ${p.variant} ${p.category} ${p.buyerIntent} ${p.reason}`,
    );

    const score = tokens.reduce(
      (s, t) => s + (pHaystack.includes(normalize(t)) ? 1 : 0),
      0,
    );
    const reasons: string[] = [];

    if (p.economics.localPricePaise > budgetPaise)
      reasons.push('Over your budget');
    if (p.distanceKm > radiusKm) reasons.push('Outside your radius');

    // Robust model matching
    if (model) {
      const modelKeywords = (parsed?.model ?? '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(
          (w) =>
            w.length > 1 &&
            !['2nd', 'generation', 'gen', 'pro', 'the'].includes(w),
        );
      const modelMatches =
        pTitle.includes(model) ||
        model.includes(pTitle) ||
        pSku.includes(model) ||
        (prodType &&
          (pTitle.includes(prodType) || prodType.includes(pTitle))) ||
        (modelKeywords.length > 0 &&
          modelKeywords.some((w) => pTitle.includes(w) || pSku.includes(w)));

      if (!modelMatches && score === 0) {
        reasons.push('Different model');
      }
    }

    // Brand matching
    if (brand && !pTitle.includes(brand) && !pHaystack.includes(brand)) {
      reasons.push('Different brand');
    }

    // Colour matching
    if (colour && !pVariant.includes(colour) && !colour.includes(pVariant)) {
      reasons.push('Different colour');
    }

    if (!model && !brand && !prodType && score === 0) {
      reasons.push('No product match');
    }

    return { parcel: p, score, reasons };
  }).sort(
    (a, b) =>
      b.score - a.score ||
      a.parcel.economics.localPricePaise - b.parcel.economics.localPricePaise,
  );

  const matches = ranked.filter((p) => !p.reasons.length).slice(0, 6);
  return {
    budgetPaise,
    radiusKm,
    matches: matches.map((p) => p.parcel),
    rejected: ranked
      .filter(
        (p) =>
          p.reasons.length &&
          (p.score > 0 || (brand && normalize(p.parcel.title).includes(brand))),
      )
      .slice(0, 4)
      .map((p) => ({ title: p.parcel.title, reasons: p.reasons })),
    requiresSelection: true,
    explanation: matches.length
      ? `Found ${matches.length} eligible return ${matches.length === 1 ? 'deal' : 'deals'} matching your request within ₹${(budgetPaise / 100).toLocaleString('en-IN')} and ${radiusKm} km.`
      : 'No exact eligible offer fits those requirements. Try adjusting budget or radius.',
  };
}
export type AgentSearch = ReturnType<typeof searchCatalog> & {
  interpretationMode: string;
  interpreted: GeminiIntent;
  inventoryMode: string;
  timestamp: string;
};
export function publicCatalogItem(p: Parcel) {
  return {
    productId: p.productId,
    sku: p.sku,
    title: p.title,
    variant: p.variant,
    condition: 'factory_sealed_claim_pending_inspection',
    pricePaise: p.economics.localPricePaise,
    currency: 'INR',
    availableQuantity: 1,
    distanceKm: p.distanceKm,
    inventoryMode: 'demo',
    quoteEndpoint: '/api/agent/v1/quote',
  };
}
