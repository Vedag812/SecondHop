import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  Code2,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRescue } from './rescue-client';
import { CommerceCheckout } from './commerce-checkout';
import { RescueHandoff } from './rescue-handoff';
import { money, type Parcel } from '@/lib/rescue';
import { getProductImage } from '@/lib/products';
import type { AgentSearch } from '@/lib/agent-search';

const examples = [
  {
    text: 'Sony WH-1000XM5 in Silver, sealed, under ₹19,000, within 5 km. No substitutions.',
    budget: '19000',
    radius: '5',
  },
  {
    text: 'AirPods Pro 2, sealed, under ₹18,000, within 5 km.',
    budget: '18000',
    radius: '5',
  },
  {
    text: 'Midnight Blue WH40, unopened, under ₹1,150, within 3 km today.',
    budget: '1150',
    radius: '3',
  },
];
export function BuyerAgent() {
  const { data, error: ledgerError, refresh } = useRescue();
  const [query, setQuery] = useState(examples[0].text);
  const [budget, setBudget] = useState('19000');
  const [radius, setRadius] = useState('5');
  const [result, setResult] = useState<AgentSearch | null>(null);
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [popupModal, setPopupModal] = useState<'courier' | 'buyer' | null>(
    null,
  );

  // Close popup modal on Escape key
  useEffect(() => {
    if (!popupModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPopupModal(null);
        void refresh();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [popupModal, refresh]);

  // Find most recent active case in workspace
  const activeCase = data?.workspace.cases
    .filter(
      (c) =>
        c.state !== 'EXPIRED' &&
        ['PAID', 'COURIER_VERIFIED', 'DELIVERED'].includes(c.state),
    )
    .at(-1);

  async function search() {
    setBusy(true);
    setError('');
    setSelected(null);
    setResult(null);
    try {
      const response = await fetch('/api/agent/v1/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          maxBudgetInr: Number(budget),
          maxRadiusKm: Number(radius),
        }),
      });
      const value = (await response.json()) as AgentSearch & { error?: string };
      if (!response.ok)
        throw new Error(value.error ?? 'The catalog could not be searched.');
      setResult(value);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search unavailable.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rescue-app buyer-agent">
      <div className="rescue-page-top">
        <div>
          <p className="rescue-eyebrow">
            <span className="size-2 rounded-full bg-orange-500"></span>
            TRACK 01 · AGENTIC COMMERCE · AUTONOMOUS BUYER AGENT
          </p>
          <h1>
            Say what you want.
            <br />
            <span className="text-orange-400">Keep strict policy bounds.</span>
          </h1>
          <p className="rescue-subtitle">
            An agent-readable catalog. Exact SKU matches. Instant checkout.
          </p>
        </div>
        <Bot size={42} className="text-orange-400" />
      </div>
      <div className="rescue-disclosure">
        <ShieldCheck size={17} className="text-emerald-400" />
        <span className="text-slate-300">
          Agentic Commerce Rail · Instant Settlement Active · Firm budget &
          distance gates enforce purchase boundaries
        </span>
      </div>

      {/* Active Handoff in Progress Card */}
      {activeCase && (
        <div
          className={`mt-6 p-5 rounded-2xl border transition-all ${
            activeCase.state === 'DELIVERED'
              ? 'border-emerald-500/30 bg-emerald-500/[0.05]'
              : 'border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-orange-500/[0.04] to-transparent'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src={getProductImage(
                    activeCase.parcel.productId || activeCase.parcel.id,
                  )}
                  alt={activeCase.parcel.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full border ${
                      activeCase.state === 'DELIVERED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : activeCase.state === 'COURIER_VERIFIED'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    }`}
                  >
                    {activeCase.state === 'PAID'
                      ? 'Step 2: Courier Inspection Needed'
                      : activeCase.state === 'COURIER_VERIFIED'
                        ? 'Step 3: Ready for Buyer Pass Code'
                        : 'Handoff Completed'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    S/N: {activeCase.parcel.serial}
                  </span>
                </div>
                <h3 className="mt-1 text-base font-bold text-white">
                  {activeCase.parcel.title} ·{' '}
                  <span className="text-orange-300 font-mono">
                    {money(activeCase.decision.economics.localPricePaise)}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {activeCase.state === 'PAID'
                    ? `Awaiting courier seal verification before dispatch to ${activeCase.parcel.buyerArea}.`
                    : activeCase.state === 'COURIER_VERIFIED'
                      ? `Courier verified. Present your 6-digit delivery pass code upon arrival.`
                      : `Delivered locally in ${activeCase.parcel.buyerArea}. Return successfully rescued.`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {activeCase.courierLink && (
                <Button
                  className="rescue-secondary text-xs inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl"
                  onClick={() => setPopupModal('courier')}
                >
                  <Truck size={13} className="text-orange-400" />
                  Open Courier Popup <ArrowUpRight size={12} />
                </Button>
              )}
              {activeCase.buyerLink && (
                <Button
                  className="rescue-primary text-xs inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold"
                  onClick={() => setPopupModal('buyer')}
                >
                  <ShieldCheck size={13} />
                  Open Buyer Pass Popup <ArrowUpRight size={12} />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      <section className="rescue-card mt-6">
        <label htmlFor="buyer-agent-field-1" className="rescue-field text-base">
          What are you looking for?
          <Textarea
            id="buyer-agent-field-1"
            className="rescue-input min-h-28 mt-2"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setResult(null);
              setSelected(null);
            }}
          />
        </label>
        <div className="my-4 flex flex-wrap gap-2">
          {examples.map((e, i) => (
            <button
              key={e.text}
              className="commerce-prompt-chip"
              onClick={() => {
                setQuery(e.text);
                setBudget(e.budget);
                setRadius(e.radius);
                setResult(null);
                setSelected(null);
              }}
            >
              {['Sony headphones', 'AirPods Pro 2', 'Budget headphones'][i]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label htmlFor="buyer-agent-field-2" className="rescue-field flex-1">
            Firm spending limit (₹)
            <Input
              id="buyer-agent-field-2"
              className="rescue-input"
              type="number"
              value={budget}
              min="1"
              onChange={(e) => {
                setBudget(e.target.value);
                setResult(null);
                setSelected(null);
              }}
            />
          </label>
          <label htmlFor="buyer-agent-field-3" className="rescue-field flex-1">
            Maximum distance (km)
            <Input
              id="buyer-agent-field-3"
              className="rescue-input"
              type="number"
              value={radius}
              min="0.1"
              max="15"
              onChange={(e) => {
                setRadius(e.target.value);
                setResult(null);
                setSelected(null);
              }}
            />
          </label>
          <Button
            className="rescue-primary"
            disabled={busy}
            onClick={() => {
              void search();
            }}
          >
            {busy ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            Find eligible offers
          </Button>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          If your sentence and controls differ, the lower budget and smaller
          radius apply. A search never charges you.
        </p>
      </section>
      {(error || ledgerError) && (
        <div className="rescue-error mt-5" role="alert">
          {error || ledgerError}
        </div>
      )}
      {busy && (
        <div
          className="rescue-card mt-5 flex items-center gap-3"
          aria-live="polite"
        >
          <Sparkles className="text-orange-300" />
          Interpreting your request and checking the merchant’s catalog…
        </div>
      )}
      {result && (
        <section className="mt-6">
          <div className="rescue-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {result.matches.length
                  ? `${result.matches.length} eligible ${result.matches.length === 1 ? 'offer' : 'offers'}`
                  : 'No exact match within your limits'}
              </h2>
              <span className="rescue-badge badge-blue">
                {result.interpretationMode === 'live'
                  ? 'AI interpreted'
                  : 'Local search · model unavailable'}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-300">{result.explanation}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-emerald-200">
              <span className="flex items-center gap-1">
                <Check size={16} />
                Budget ≤ {money(result.budgetPaise)}
              </span>
              <span className="flex items-center gap-1">
                <Check size={16} />
                Radius ≤ {result.radiusKm} km
              </span>
              <span className="flex items-center gap-1">
                <Check size={16} />
                One exact unit
              </span>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {result.matches.map((p) => (
              <article
                className="rescue-card flex flex-col justify-between overflow-hidden group"
                key={p.id}
              >
                <div>
                  <div className="relative mb-4 h-44 w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    <Image
                      src={getProductImage(p.productId || p.id)}
                      alt={p.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-orange-300 border border-white/10">
                      Hyperlocal Match
                    </span>
                  </div>
                  <p className="rescue-eyebrow">{p.sku}</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {p.variant} · {p.distanceKm} km route
                  </p>
                </div>
                <div>
                  <div className="my-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400">
                        Locked Price
                      </span>
                      <p className="text-2xl font-bold text-orange-300">
                        {money(p.economics.localPricePaise)}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      1 unit available
                    </span>
                  </div>
                  <Button
                    className="rescue-primary w-full"
                    disabled={!data}
                    onClick={() => setSelected(p)}
                  >
                    Review & authorize purchase <ArrowRight size={15} />
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {result.rejected.length > 0 && (
            <details className="rescue-card mt-4">
              <summary className="cursor-pointer text-sm font-medium">
                Why other offers were rejected
              </summary>
              <div className="mt-4 space-y-3">
                {result.rejected.map((p) => (
                  <p className="text-sm text-slate-400" key={p.title}>
                    <strong className="font-medium text-slate-200">
                      {p.title}
                    </strong>{' '}
                    · {p.reasons.join(' · ')}
                  </p>
                ))}
              </div>
            </details>
          )}
        </section>
      )}
      {selected && result && data && (
        <div className="mt-6">
          <CommerceCheckout
            key={selected.id}
            parcel={selected}
            data={data}
            refresh={refresh}
            authorizedBudget={result.budgetPaise}
            authorizedRadius={result.radiusKm}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
      <details className="rescue-card mt-6">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <Code2 size={17} />
          For builders: agent-readable commerce
        </summary>
        <p className="mt-4 text-sm leading-7 text-slate-400">
          The merchant exposes catalog discovery, explicit purchase
          authorization, order creation, payment verification and recovery
          endpoints. This is a working custom commerce API. Protocol names in
          the hackathon brief describe the wider ecosystem; interoperability is
          not claimed without a conforming implementation.
        </p>
        <div className="mt-4 flex flex-wrap gap-5">
          <a
            className="rescue-text-link"
            href="/api/agent/manifest"
            target="_blank"
            rel="noreferrer"
          >
            Inspect API manifest <ArrowRight size={15} />
          </a>
          <Link href="/dashboard/analytics" className="rescue-text-link">
            Review recorded outcomes <ArrowRight size={15} />
          </Link>
        </div>
        {result && (
          <pre className="mt-5 max-h-64 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
            {JSON.stringify(
              {
                budgetPaise: result.budgetPaise,
                radiusKm: result.radiusKm,
                candidates: result.matches.map((p) => ({
                  sku: p.sku,
                  pricePaise: p.economics.localPricePaise,
                  variant: p.variant,
                })),
                approvalRequired: true,
              },
              null,
              2,
            )}
          </pre>
        )}
      </details>

      {/* In-Place Handoff Modal Popup for AI Buyer Agent */}
      {popupModal && activeCase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPopupModal(null);
              void refresh();
            }
          }}
        >
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0f] p-6 shadow-2xl shadow-black/80 ring-1 ring-white/10 animate-in zoom-in-95 duration-150">
            <RescueHandoff
              caseId={activeCase.id}
              initialToken={
                popupModal === 'courier'
                  ? activeCase.courierLink?.split('#')[1]
                  : activeCase.buyerLink?.split('#')[1]
              }
              isModal
              onClose={() => {
                setPopupModal(null);
                void refresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
