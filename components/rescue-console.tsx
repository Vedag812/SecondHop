'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Headphones,
  IndianRupee,
  Loader2,
  MapPin,
  Package,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import {
  HUB,
  PARCELS,
  ALL_PARCELS,
  calculateRecovery,
  evaluateRescue,
  money,
  outcomeMetrics,
  stateLabel,
  type Parcel,
  type Rail,
  type SafeCase,
  type Snapshot,
} from '@/lib/rescue';
import { getProductImage } from '@/lib/products';
import { rescueRequest, useRescue } from './rescue-client';
import { CaseHistory, downloadReceipt } from './rescue-history';
import { RescueHandoff } from './rescue-handoff';

export { CaseHistory, downloadReceipt };

type Checkout = { open(): void };
type CheckoutConstructor = new (options: Record<string, unknown>) => Checkout;

async function checkoutScript(): Promise<CheckoutConstructor> {
  const target = window as typeof window & { Razorpay?: CheckoutConstructor };
  if (!target.Razorpay) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () =>
        reject(
          new Error(
            'Secure checkout could not load. Your order remains pending.',
          ),
        );
      document.head.appendChild(script);
    });
  }
  if (!target.Razorpay) throw new Error('Checkout is unavailable.');
  return target.Razorpay;
}

export function CasePanel({
  c,
  run,
  busy,
  refresh,
}: {
  c: SafeCase;
  run: (action: string, payload?: Record<string, unknown>) => Promise<void>;
  busy: boolean;
  refresh: () => Promise<void>;
}) {
  const [checkoutError, setCheckoutError] = useState('');
  const [opening, setOpening] = useState(false);
  const [quickProgressing, setQuickProgressing] = useState(false);
  const [buyerOtp, setBuyerOtp] = useState('');
  const [popupModal, setPopupModal] = useState<'courier' | 'buyer' | null>(
    null,
  );

  // Auto-fetch buyer OTP if case is COURIER_VERIFIED
  useEffect(() => {
    if (c.state === 'COURIER_VERIFIED' && c.buyerLink) {
      const buyerToken = c.buyerLink.split('#')[1];
      if (buyerToken) {
        void rescueRequest<{ case: SafeCase }>(undefined, buyerToken, c.id)
          .then((data) => {
            if (data.case.otp) setBuyerOtp(data.case.otp);
          })
          .catch(() => {});
      }
    }
  }, [c.state, c.buyerLink, c.id]);

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

  async function checkout() {
    setOpening(true);
    setCheckoutError('');
    try {
      const data = await rescueRequest<{
        result: { orderId: string; amountPaise: number; keyId: string };
      }>({ action: 'order', caseId: c.id });
      const Constructor = await checkoutScript();
      const rzp = new Constructor({
        key: data.result.keyId,
        order_id: data.result.orderId,
        amount: data.result.amountPaise,
        currency: 'INR',
        name: 'SecondHop · Instant Checkout',
        description: `${c.parcel.title} · ${c.parcel.variant}`,
        theme: { color: '#f97316' },
        handler: (response: Record<string, string>) => {
          void (async () => {
            try {
              await rescueRequest({
                action: 'verify_payment',
                caseId: c.id,
                ...response,
              });
            } catch (error) {
              setCheckoutError(
                error instanceof Error
                  ? error.message
                  : 'Payment is awaiting verification.',
              );
            } finally {
              await refresh();
              setOpening(false);
            }
          })();
        },
        modal: {
          ondismiss: () => {
            setOpening(false);
            void refresh();
          },
        },
      });
      rzp.open();
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : 'Checkout failed.',
      );
      setOpening(false);
      await refresh();
    }
  }

  // 1-Click Courier Confirmation
  async function quickCourierVerify() {
    const courierToken = c.courierLink?.split('#')[1];
    if (!courierToken) return;
    setQuickProgressing(true);
    setCheckoutError('');
    try {
      await rescueRequest(
        {
          action: 'inspect',
          caseId: c.id,
          accepted: true,
          serial: c.parcel.serial,
          evidence:
            'Courier verified package seal intact and serial number confirmed.',
        },
        courierToken,
        c.id,
      );
      await refresh();
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : 'Courier confirmation failed.',
      );
    } finally {
      setQuickProgressing(false);
    }
  }

  // 1-Click Buyer Acceptance Confirmation
  async function quickBuyerVerify() {
    const buyerToken = c.buyerLink?.split('#')[1];
    if (!buyerToken) return;
    setQuickProgressing(true);
    setCheckoutError('');
    try {
      const buyerSnap = await rescueRequest<{ case: SafeCase }>(
        undefined,
        buyerToken,
        c.id,
      );
      const otp = buyerSnap.case.otp;
      await rescueRequest(
        {
          action: 'inspect',
          caseId: c.id,
          accepted: true,
          otp,
          evidence:
            'Buyer verified product condition and confirmed delivery pass.',
        },
        buyerToken,
        c.id,
      );
      await refresh();
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : 'Buyer confirmation failed.',
      );
    } finally {
      setQuickProgressing(false);
    }
  }

  return (
    <section
      className="rescue-card rescue-case"
      aria-label="Active return case"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-orange-400 font-semibold">
            Active Order · Case {c.id.slice(0, 8).toUpperCase()}
          </span>
          <h2 className="mt-1 text-2xl font-bold text-white">
            {c.parcel.title}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {c.parcel.variant} · {money(c.decision.economics.localPricePaise)}
          </p>
        </div>
        <div>
          <span
            className={`rescue-badge ${c.state === 'DELIVERED' ? 'badge-green' : 'badge-blue'}`}
          >
            {c.state === 'DELIVERED' ? '✓ Delivered' : stateLabel[c.state]}
          </span>
        </div>
      </div>

      {/* Clean 3-Step Flow */}
      <div className="my-5 grid gap-3 sm:grid-cols-3">
        <div
          className={`p-3 rounded-xl border ${Boolean(c.paymentId) ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-white/10 bg-white/[0.02]'}`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${Boolean(c.paymentId) ? 'bg-emerald-400' : 'bg-slate-500'}`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Payment
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {Boolean(c.paymentId) ? '✓ Payment Confirmed' : 'Awaiting payment'}
          </p>
        </div>

        <div
          className={`p-3 rounded-xl border ${Boolean(c.courierEvidence) ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : c.state === 'PAID' ? 'border-orange-500/40 bg-orange-500/[0.06]' : 'border-white/10 bg-white/[0.02]'}`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${Boolean(c.courierEvidence) ? 'bg-emerald-400' : c.state === 'PAID' ? 'bg-orange-400 animate-pulse' : 'bg-slate-500'}`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              2. Courier Inspection
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {Boolean(c.courierEvidence)
              ? '✓ Seal Inspected'
              : c.state === 'PAID'
                ? 'Ready for courier check'
                : 'Locked'}
          </p>
        </div>

        <div
          className={`p-3 rounded-xl border ${c.state === 'DELIVERED' ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : c.state === 'COURIER_VERIFIED' ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-white/10 bg-white/[0.02]'}`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${c.state === 'DELIVERED' ? 'bg-emerald-400' : c.state === 'COURIER_VERIFIED' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              3. Buyer Delivery
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {c.state === 'DELIVERED'
              ? '✓ Order Completed'
              : c.state === 'COURIER_VERIFIED'
                ? 'Ready for buyer code'
                : 'Locked'}
          </p>
        </div>
      </div>

      {checkoutError && (
        <div className="rescue-error my-4">{checkoutError}</div>
      )}

      {/* Actions based on state */}
      {['RESERVED', 'PAYMENT_PENDING'].includes(c.state) && (
        <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/[0.06] flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white">Payment Required</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Open checkout to authorize this parcel.
            </p>
          </div>
          <Button
            className="rescue-primary font-bold text-xs"
            disabled={busy || opening}
            onClick={() => void checkout()}
          >
            {opening ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <IndianRupee size={16} />
            )}
            Open Checkout
          </Button>
        </div>
      )}

      {c.state === 'PAID' && (
        <div className="p-5 rounded-xl border border-orange-500/40 bg-orange-500/[0.07] my-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-orange-300 font-bold text-sm">
                <Truck size={18} /> Step 2: Courier Inspection
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Courier verifies package seal is intact and matches S/N{' '}
                <strong className="font-mono text-white">
                  {c.parcel.serial}
                </strong>
                .
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="rescue-primary text-xs font-bold"
                disabled={busy || quickProgressing}
                onClick={() => void quickCourierVerify()}
              >
                {quickProgressing ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Check size={14} />
                )}
                ⚡ 1-Click: Confirm Courier Inspection
              </Button>
              {c.courierLink && (
                <Button
                  className="rescue-secondary text-xs inline-flex items-center gap-1.5 px-3 py-2 rounded-xl"
                  onClick={() => setPopupModal('courier')}
                >
                  Open Courier Popup <ArrowUpRight size={13} />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {c.state === 'COURIER_VERIFIED' && (
        <div className="p-5 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.07] my-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <ShieldCheck size={18} /> Step 3: Buyer Acceptance
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Buyer inspects package upon delivery and confirms the one-time
                delivery pass.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">
                  Buyer Delivery Pass:
                </span>
                <span className="font-mono font-bold text-emerald-300 text-sm bg-black/60 px-3 py-1 rounded border border-emerald-500/30">
                  {buyerOtp || c.otp || 'Fetching…'}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="rescue-primary text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black"
                disabled={busy || quickProgressing}
                onClick={() => void quickBuyerVerify()}
              >
                {quickProgressing ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Check size={14} />
                )}
                ⚡ 1-Click: Confirm Buyer Delivery
              </Button>
              {c.buyerLink && (
                <Button
                  className="rescue-secondary text-xs inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-emerald-300"
                  onClick={() => setPopupModal('buyer')}
                >
                  Open Buyer Popup <ArrowUpRight size={13} />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {c.state === 'DELIVERED' && (
        <div className="p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent my-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <CheckCircle2 size={36} className="text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-white">
                  Return Successfully Saved & Delivered!
                </h3>
                <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                  +{money(c.decision.recovery.advantagePaise)} Extra Net
                  Merchant Margin Recovered vs. Long-Haul Warehouse Return.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Delivered locally to buyer in {c.parcel.buyerArea} (
                  {c.parcel.distanceKm} km). Return shipping completely avoided.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                className="rescue-primary text-xs font-bold"
                onClick={() => void run('new_demo')}
              >
                <Sparkles size={14} /> Test Another Return
              </Button>
              <Button
                className="rescue-secondary text-xs"
                onClick={() => downloadReceipt(c)}
              >
                <Download size={14} /> Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Technical Details */}
      <details className="mt-5 pt-4 border-t border-white/10">
        <summary className="cursor-pointer text-xs font-mono text-slate-400 hover:text-white flex items-center justify-between">
          <span>View Technical Audit Trail & Actions</span>
          <ArrowDown size={12} />
        </summary>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              className="rescue-secondary text-xs"
              onClick={() => downloadReceipt(c)}
            >
              <Download size={14} /> Export Evidence Receipt
            </Button>
            {c.courierLink && (
              <Button
                className="rescue-secondary text-xs inline-flex items-center gap-1.5 px-3 py-2 rounded-xl"
                onClick={() => setPopupModal('courier')}
              >
                Open Courier Popup <ArrowUpRight size={13} />
              </Button>
            )}
            {c.buyerLink && (
              <Button
                className="rescue-secondary text-xs inline-flex items-center gap-1.5 px-3 py-2 rounded-xl"
                onClick={() => setPopupModal('buyer')}
              >
                Open Buyer Popup <ArrowUpRight size={13} />
              </Button>
            )}
          </div>
          <CaseHistory c={c} />
        </div>
      </details>

      {/* In-Place Handoff Modal Popup */}
      {popupModal && (
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
              caseId={c.id}
              initialToken={
                popupModal === 'courier'
                  ? c.courierLink?.split('#')[1]
                  : c.buyerLink?.split('#')[1]
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
    </section>
  );
}

export function RescueConsole({
  agentView = false,
  initialParcelId,
}: {
  agentView?: boolean;
  initialParcelId?: string;
}) {
  const initial =
    ALL_PARCELS.find((p) => p.id === initialParcelId) ?? PARCELS[0];
  const { data, error: loadError, refresh, setData } = useRescue();
  const [parcelId, setParcelId] = useState(initial.id);
  const [budget, setBudget] = useState(String(initial.budgetPaise / 100));
  const [radius, setRadius] = useState(String(initial.radiusKm));
  const [courier, setCourier] = useState(
    String(initial.economics.courierPaise / 100),
  );
  const [variant, setVariant] = useState(initial.requestedVariant);
  const rail: Rail = 'razorpay_test';
  const [fault, setFault] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(0);
  const [intent, setIntent] = useState(initial.buyerIntent);

  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'audio' | 'wearables' | 'computing' | 'phones_cameras'
  >('all');
  const [showAllParcels, setShowAllParcels] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const availableParcels: Parcel[] =
    data?.parcels && data.parcels.length > 0 ? data.parcels : ALL_PARCELS;
  const parcel =
    availableParcels.find((p) => p.id === parcelId) ?? availableParcels[0];
  const c = data?.workspace.cases
    .filter((c) => c.parcel.id === parcelId && c.state !== 'EXPIRED')
    .at(-1);
  const metrics = outcomeMetrics(data?.workspace.cases ?? []);

  let decision: ReturnType<typeof evaluateRescue> | null = null;
  try {
    if (data) {
      decision = evaluateRescue(
        parcel,
        {
          budgetPaise: Math.round(Number(budget) * 100),
          radiusKm: Number(radius),
          requestedVariant: variant,
          courierPaise: Math.round(Number(courier) * 100),
          cutoffAt: data.workspace.cutoffAt,
        },
        now || Date.parse(data.workspace.createdAt),
      );
    }
  } catch {
    /* Handled */
  }

  const minutes =
    data && now
      ? Math.max(
          0,
          Math.ceil((Date.parse(data.workspace.cutoffAt) - now) / 60000),
        )
      : 45;

  function selectParcel(p: Parcel) {
    setParcelId(p.id);
    setBudget(String(p.budgetPaise / 100));
    setRadius(String(p.radiusKm));
    setCourier(String(p.economics.courierPaise / 100));
    setVariant(p.requestedVariant);
    setIntent(p.buyerIntent);
    setError('');
    setNotice('');
  }

  function offer() {
    return {
      parcelId,
      budgetPaise: Math.round(Number(budget) * 100),
      radiusKm: Number(radius),
      courierPaise: Math.round(Number(courier) * 100),
      requestedVariant: variant,
      rail: 'razorpay_test' as Rail,
      injectRefundTimeout: fault,
    };
  }

  async function run(action: string, payload: Record<string, unknown> = {}) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (action === 'new_demo') {
        setData(await rescueRequest<Snapshot>({ action }));
        setNotice('Workspace refreshed. Previous cases cleared.');
      } else {
        await rescueRequest({
          action,
          caseId: c?.id,
          ...(action === 'reserve'
            ? { ...offer(), requestId: crypto.randomUUID() }
            : {}),
          ...payload,
        });
      }
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Action failed.');
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function approveAndCheckout() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      let targetCaseId = c?.id;
      if (!targetCaseId) {
        const reserveRes = await rescueRequest<{ result: { caseId: string } }>({
          action: 'reserve',
          ...offer(),
          requestId: crypto.randomUUID(),
        });
        targetCaseId = reserveRes.result.caseId;
      }

      const orderData = await rescueRequest<{
        result: { orderId: string; amountPaise: number; keyId: string };
      }>({
        action: 'order',
        caseId: targetCaseId,
      });

      const Constructor = await checkoutScript();
      const rzp = new Constructor({
        key: orderData.result.keyId,
        order_id: orderData.result.orderId,
        amount: orderData.result.amountPaise,
        currency: 'INR',
        name: 'SecondHop · Instant Checkout',
        description: `${parcel.title} · ${variant}`,
        theme: { color: '#f97316' },
        handler: (response: Record<string, string>) => {
          void (async () => {
            try {
              await rescueRequest({
                action: 'verify_payment',
                caseId: targetCaseId,
                ...response,
              });
              setNotice('Payment verified! Proceed to courier check.');
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : 'Payment verification pending.',
              );
            } finally {
              await refresh();
              setBusy(false);
            }
          })();
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            void refresh();
          },
        },
      });
      rzp.open();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Checkout could not start.',
      );
      await refresh();
      setBusy(false);
    }
  }

  const isAudio = (p: Parcel) => {
    const cat = (p.category || '').toLowerCase();
    const title = p.title.toLowerCase();
    return (
      cat.includes('audio') ||
      cat.includes('headphone') ||
      title.includes('airpods') ||
      title.includes('ear')
    );
  };
  const isWearables = (p: Parcel) => {
    const cat = (p.category || '').toLowerCase();
    const title = p.title.toLowerCase();
    return (
      cat.includes('wearable') ||
      cat.includes('watch') ||
      title.includes('watch')
    );
  };
  const isComputing = (p: Parcel) => {
    const cat = (p.category || '').toLowerCase();
    const title = p.title.toLowerCase();
    return (
      cat.includes('computing') ||
      cat.includes('reader') ||
      cat.includes('tablet') ||
      title.includes('master') ||
      title.includes('keychron') ||
      title.includes('kindle') ||
      title.includes('ipad')
    );
  };
  const isPhonesCameras = (p: Parcel) => {
    const cat = (p.category || '').toLowerCase();
    const title = p.title.toLowerCase();
    return (
      cat.includes('phone') ||
      cat.includes('camera') ||
      title.includes('iphone') ||
      title.includes('galaxy s') ||
      title.includes('pixel') ||
      title.includes('osmo') ||
      title.includes('fuji')
    );
  };

  const audioCount = availableParcels.filter(isAudio).length;
  const wearablesCount = availableParcels.filter(isWearables).length;
  const computingCount = availableParcels.filter(isComputing).length;
  const phonesCamerasCount = availableParcels.filter(isPhonesCameras).length;

  const filteredParcels = availableParcels.filter((p) => {
    if (categoryFilter === 'audio') return isAudio(p);
    if (categoryFilter === 'wearables') return isWearables(p);
    if (categoryFilter === 'computing') return isComputing(p);
    if (categoryFilter === 'phones_cameras') return isPhonesCameras(p);
    return true;
  });

  const displayedParcels =
    categoryFilter === 'all' && !showAllParcels
      ? filteredParcels.slice(0, 6).some((p) => p.id === parcelId)
        ? filteredParcels.slice(0, 6)
        : [
            ...filteredParcels.slice(0, 5),
            filteredParcels.find((p) => p.id === parcelId)!,
          ]
      : filteredParcels;

  return (
    <div className="rescue-app">
      {/* Page Header */}
      <div className="rescue-page-top">
        <div>
          <p className="rescue-eyebrow">
            <span className="size-2 rounded-full bg-orange-500"></span>
            HYPERLOCAL RETURN DISPATCH
          </p>
          <h1>Smart Return Redirection</h1>
          <p className="rescue-subtitle">
            Turn customer returns at the local hub into instant local sales.
            Save on return shipping and earn more margin.
          </p>
        </div>
        <Button
          className="rescue-secondary text-xs font-mono"
          disabled={busy}
          onClick={() => {
            void run('new_demo');
          }}
        >
          <RefreshCw size={13} /> Reset Demo
        </Button>
      </div>

      {/* Status Bar */}
      <div className="rescue-disclosure">
        <span className="rescue-live-dot" />
        <strong>Local Return Center</strong>
        <span className="text-slate-300">
          · {HUB} · Pan-India Dispatch Network
        </span>
        <span className="ml-auto font-mono text-xs text-emerald-400">
          Instant Settlement Active
        </span>
      </div>

      {/* Metrics */}
      <div className="rescue-stats">
        <div>
          <span>Returns Rescued</span>
          <strong>
            {metrics.completed}
            <small>Confirmed handoffs</small>
          </strong>
        </div>
        <div>
          <span>Extra Profit Recovered</span>
          <strong className="text-emerald-400">
            +{money(metrics.expectedRecoveryPaise)}
            <small>Saved vs warehouse</small>
          </strong>
        </div>
        <div>
          <span>Safety Rules Enforced</span>
          <strong>
            {data?.workspace.rejectedDecisions.length ?? 0}
            <small>Mismatches blocked</small>
          </strong>
        </div>
        <div>
          <span>Protected Escrow</span>
          <strong>
            {metrics.pendingRefunds}
            <small>Protected holds</small>
          </strong>
        </div>
      </div>

      {(error || loadError) && (
        <div className="rescue-error mb-5">{error || loadError}</div>
      )}
      {notice && <div className="rescue-success mb-5">{notice}</div>}

      {/* 3-Step Simple Flow Guide */}
      <div className="mb-6 grid sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="size-8 rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs grid place-items-center shrink-0 border border-orange-500/30">
            1
          </div>
          <div className="text-xs">
            <strong className="text-white block font-semibold">
              1. Select Return Package
            </strong>
            <span className="text-slate-400 text-[11px]">
              Returned parcel sitting at local hub
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="size-8 rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs grid place-items-center shrink-0 border border-orange-500/30">
            2
          </div>
          <div className="text-xs">
            <strong className="text-white block font-semibold">
              2. Instant Checkout
            </strong>
            <span className="text-slate-400 text-[11px]">
              Protected payment rail
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="size-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs grid place-items-center shrink-0 border border-emerald-500/30">
            3
          </div>
          <div className="text-xs">
            <strong className="text-white block font-semibold">
              3. 1-Click Verification
            </strong>
            <span className="text-slate-400 text-[11px]">
              Courier check & buyer pass code
            </span>
          </div>
        </div>
      </div>

      {/* Return Packages Catalog Selector */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Package className="text-orange-400 size-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Select Return Package at Hub
            </h2>
            <span className="rounded-full bg-orange-500/15 border border-orange-500/25 px-2 py-0.5 text-[10px] font-mono text-orange-400 font-semibold">
              {availableParcels.length} Returns at Hub
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            ⏱ {minutes}m until warehouse truck departure
          </span>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-orange-500 text-black font-bold shadow-md shadow-orange-500/20'
                : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/5'
            }`}
          >
            All Returns ({availableParcels.length})
          </button>
          <button
            onClick={() => setCategoryFilter('audio')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
              categoryFilter === 'audio'
                ? 'bg-orange-500 text-black font-bold shadow-md shadow-orange-500/20'
                : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/5'
            }`}
          >
            Audio ({audioCount})
          </button>
          <button
            onClick={() => setCategoryFilter('wearables')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
              categoryFilter === 'wearables'
                ? 'bg-orange-500 text-black font-bold shadow-md shadow-orange-500/20'
                : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/5'
            }`}
          >
            Wearables ({wearablesCount})
          </button>
          <button
            onClick={() => setCategoryFilter('computing')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
              categoryFilter === 'computing'
                ? 'bg-orange-500 text-black font-bold shadow-md shadow-orange-500/20'
                : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/5'
            }`}
          >
            Computing ({computingCount})
          </button>
          <button
            onClick={() => setCategoryFilter('phones_cameras')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
              categoryFilter === 'phones_cameras'
                ? 'bg-orange-500 text-black font-bold shadow-md shadow-orange-500/20'
                : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/5'
            }`}
          >
            Phones & Cameras ({phonesCamerasCount})
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayedParcels.map((p, i) => {
            const isSelected = p.id === parcelId;
            const recovery = calculateRecovery(p.economics);
            const isMismatch =
              p.requestedVariant.toLowerCase().trim() !==
              p.variant.toLowerCase();
            return (
              <button
                key={p.id}
                onClick={() => selectParcel(p)}
                className={`relative flex items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-transparent shadow-xl shadow-orange-500/15 ring-1 ring-orange-500/40'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                  <Image
                    src={getProductImage(p.productId || p.id)}
                    alt={p.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <span className="absolute top-1 left-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-mono text-slate-300">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded border ${
                        isMismatch
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : recovery.advantagePaise > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {isMismatch
                        ? 'Variant Mismatch'
                        : `+${money(recovery.advantagePaise)} Margin`}
                    </span>
                    {isSelected && (
                      <span className="size-2 rounded-full bg-orange-400 ring-2 ring-orange-500/30 animate-pulse" />
                    )}
                  </div>
                  <h4 className="mt-1 text-sm font-bold text-white truncate">
                    {p.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">{p.variant}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xs font-mono font-bold text-orange-300">
                      {money(p.economics.localPricePaise)}
                    </span>
                    {p.retailPaise > p.economics.localPricePaise && (
                      <span className="text-[10px] font-mono text-slate-500 line-through">
                        {money(p.retailPaise)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Toggle Expand (when 'all' category is selected) */}
        {categoryFilter === 'all' && filteredParcels.length > 6 && (
          <div className="mt-3 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllParcels(!showAllParcels)}
              className="border-white/10 bg-white/[0.02] text-xs font-mono text-slate-300 hover:bg-white/[0.06] hover:text-white"
            >
              {showAllParcels ? (
                <>
                  <ChevronUp size={14} className="mr-1 text-orange-400" />
                  Show Top 6 Returns
                </>
              ) : (
                <>
                  <ChevronDown size={14} className="mr-1 text-orange-400" />
                  View All {filteredParcels.length} Hub Returns (
                  {filteredParcels.length - 6} More)
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Main Detail or Active Case */}
      <div className="min-w-0">
        {c ? (
          <CasePanel c={c} run={run} busy={busy} refresh={refresh} />
        ) : (
          <section className="rescue-card overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-orange-400 font-semibold">
                  Hyperlocal Redirect Review · S/N {parcel.serial}
                </span>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  Save this return from warehouse transit.
                </h2>
              </div>
              <div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 ${
                    decision?.allowed
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {decision?.allowed ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <ShieldCheck size={14} />
                  )}
                  {decision?.allowed
                    ? 'Deterministic Rules Passed'
                    : 'Variant Mismatch Blocked'}
                </span>
              </div>
            </div>

            {/* Simple 2-Column: Return vs Buyer */}
            <div className="grid lg:grid-cols-2 gap-6 py-6 border-b border-white/10">
              {/* Left: Returning Item */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  1. Returned Package (Sitting at Hub)
                </span>
                <div className="flex gap-4 items-center">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    <Image
                      src={getProductImage(parcel.productId || parcel.id)}
                      alt={parcel.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {parcel.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {parcel.variant}
                    </p>
                    <p className="text-xs text-emerald-300 mt-1">
                      Claimed: Factory Sealed & Unopened
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Reason: {parcel.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Matched Local Buyer */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  2. Matched Nearby Buyer
                </span>
                <div>
                  <div className="flex items-center justify-between">
                    <strong className="text-base text-white">
                      {parcel.buyer} ({parcel.buyerArea})
                    </strong>
                    <span className="text-xs font-mono text-orange-300 flex items-center gap-1">
                      <MapPin size={12} /> {parcel.distanceKm} km away
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 italic mt-2 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                    "{intent}"
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Offered Price:</span>
                    <strong className="text-orange-400 font-bold">
                      {money(parcel.economics.localPricePaise)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Economics & Primary Action */}
            <div className="pt-6">
              <div className="grid gap-6 md:grid-cols-[1fr_auto] items-center">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
                    <span className="text-[11px] font-mono text-slate-400 block">
                      Warehouse Return Net
                    </span>
                    <strong className="text-sm font-mono text-slate-300">
                      {money(decision?.recovery.warehouseNetPaise ?? 0)}
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      After freight & fees
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
                    <span className="text-[11px] font-mono text-slate-400 block">
                      Hyperlocal Net
                    </span>
                    <strong className="text-sm font-mono text-emerald-400">
                      {money(decision?.recovery.localNetPaise ?? 0)}
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      Direct handoff
                    </span>
                  </div>
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">
                    <span className="text-[11px] font-mono text-emerald-300 font-medium block">
                      You Save
                    </span>
                    <strong className="text-base font-mono text-emerald-300 font-bold">
                      +{money(decision?.recovery.advantagePaise ?? 0)}
                    </strong>
                    <span className="text-[10px] text-emerald-400/80 block">
                      Extra recovery retained
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {decision?.allowed ? (
                    <Button
                      className="rescue-primary h-12 px-6 text-sm font-bold"
                      disabled={busy || !data}
                      onClick={() => {
                        void approveAndCheckout();
                      }}
                    >
                      {busy ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <ShieldCheck size={16} />
                      )}
                      Approve & Authorize Order
                    </Button>
                  ) : (
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-mono text-amber-300 font-semibold">
                      Rule Gate: Variant Mismatch (Blocked)
                    </div>
                  )}
                </div>
              </div>

              {/* Optional parameter adjustments */}
              <details className="mt-5 pt-4 border-t border-white/5">
                <summary className="cursor-pointer text-xs font-mono text-slate-400 hover:text-white inline-flex items-center gap-1">
                  Adjust Parameters (Optional) <ArrowDown size={11} />
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <label className="rescue-field">
                    Firm budget (₹)
                    <Input
                      className="rescue-input h-9 text-xs"
                      type="number"
                      min="1"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </label>
                  <label className="rescue-field">
                    Max radius (km)
                    <Input
                      className="rescue-input h-9 text-xs"
                      type="number"
                      min="0.1"
                      max="15"
                      step="0.1"
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                    />
                  </label>
                  <label className="rescue-field">
                    Required colour
                    <Input
                      className="rescue-input h-9 text-xs"
                      value={variant}
                      onChange={(e) => setVariant(e.target.value)}
                    />
                  </label>
                  <label className="rescue-field">
                    Courier fee (₹)
                    <Input
                      className="rescue-input h-9 text-xs"
                      type="number"
                      min="0"
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                    />
                  </label>
                </div>
              </details>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
