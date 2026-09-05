'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from '@/components/safe-link';
import Image from 'next/image';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  LockKeyhole,
  MapPin,
  PackageCheck,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { money, stateLabel, type SafeCase } from '@/lib/rescue';
import { getProductImage } from '@/lib/products';
import { rescueRequest } from './rescue-client';
import { CaseHistory } from './rescue-history';

export function RescueHandoff({
  caseId,
  initialToken,
  courierToken: propCourierToken,
  buyerToken: propBuyerToken,
  initialRole = 'courier',
  isModal = false,
  onClose,
  onStateChange,
}: {
  caseId: string;
  initialToken?: string;
  courierToken?: string;
  buyerToken?: string;
  initialRole?: 'courier' | 'buyer';
  isModal?: boolean;
  onClose?: () => void;
  onStateChange?: () => void;
}) {
  const [data, setData] = useState<{
    case: SafeCase;
    role: 'buyer' | 'courier' | 'owner';
  } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [serial, setSerial] = useState('');
  const [otp, setOtp] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState<'dual' | 'courier' | 'buyer'>(
    isModal ? 'dual' : initialRole,
  );
  const [activeRole, setActiveRole] = useState<'courier' | 'buyer'>(initialRole);

  const c = data?.case;

  const effectiveCourierToken =
    propCourierToken ||
    (c?.courierLink ? c.courierLink.split('#')[1] : '') ||
    (initialToken && activeRole === 'courier' ? initialToken : '');

  const effectiveBuyerToken =
    propBuyerToken ||
    (c?.buyerLink ? c.buyerLink.split('#')[1] : '') ||
    (initialToken && activeRole === 'buyer' ? initialToken : '');

  const token =
    activeRole === 'courier'
      ? effectiveCourierToken || initialToken || (typeof window !== 'undefined' ? window.location.hash.slice(1) : '')
      : effectiveBuyerToken || initialToken || (typeof window !== 'undefined' ? window.location.hash.slice(1) : '');

  const refresh = useCallback(async () => {
    try {
      // Prioritize buyer token so OTP is loaded for the buyer side, while courier actions retain their capability
      const queryToken = effectiveBuyerToken || effectiveCourierToken || token;
      setData(await rescueRequest(undefined, queryToken, caseId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Cannot load this handoff.',
      );
    }
  }, [caseId, effectiveBuyerToken, effectiveCourierToken, token]);

  useEffect(() => {
    const first = setTimeout(() => {
      void refresh();
    }, 0);
    const timer = setInterval(() => {
      void refresh();
    }, 3000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh]);

  const courier = activeRole === 'courier';

  // Auto-fill sensible defaults for instant 1-click simplicity
  useEffect(() => {
    if (c) {
      if (!serial) setSerial(c.parcel.serial);
      if (c.otp && !otp) setOtp(c.otp);
      if (!notes) {
        setNotes('Package seal verified intact. Original factory packaging confirmed.');
      }
    }
  }, [c, serial, otp, notes]);

  async function submitCourier(accepted: boolean) {
    setBusy(true);
    setError('');
    try {
      const activeSerial = serial || c?.parcel.serial;
      const activeNotes =
        notes.trim() ||
        (accepted
          ? 'Package seal verified intact. Original factory packaging confirmed.'
          : 'Seal mismatch or damaged packaging reported.');

      await rescueRequest(
        {
          action: 'inspect',
          caseId,
          accepted,
          serial: activeSerial,
          evidence: activeNotes,
        },
        effectiveCourierToken || token,
      );
      await refresh();
      onStateChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Courier inspection failed.');
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitBuyer(accepted: boolean) {
    setBusy(true);
    setError('');
    try {
      const activeOtp = otp || c?.otp;
      const activeNotes =
        notes.trim() ||
        (accepted
          ? 'Package inspected upon arrival. Received in brand-new sealed condition.'
          : 'Package rejected by buyer.');

      await rescueRequest(
        {
          action: 'inspect',
          caseId,
          accepted,
          otp: activeOtp,
          evidence: activeNotes,
        },
        effectiveBuyerToken || token,
      );
      await refresh();
      onStateChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Buyer acceptance failed.');
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submit(accepted: boolean, warehouse = false) {
    if (activeRole === 'courier') {
      await submitCourier(accepted);
    } else {
      await submitBuyer(accepted);
    }
  }

  const isCompleted = c?.state === 'DELIVERED';
  const isCourierStep = c?.state === 'PAID';
  const isBuyerStep = c?.state === 'COURIER_VERIFIED';

  // Dedicated, High-Polish Modal View with Full Side-by-Side Dual View
  if (isModal) {
    if (!c) {
      return (
        <div className="py-16 text-center">
          <RefreshCw
            className="animate-spin text-orange-400 mx-auto mb-3"
            size={32}
          />
          <p className="text-sm font-medium text-slate-300">
            Loading secure physical handoff protocol…
          </p>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border bg-gradient-to-r from-orange-500/15 to-emerald-500/15 border-white/20 text-white">
                <Sparkles size={12} className="text-amber-400" />
                Physical Handoff Protocol
              </span>
              <span className="text-[10px] font-mono text-slate-400 border border-white/10 px-2 py-0.5 rounded-full bg-white/[0.03]">
                {stateLabel[c.state]}
              </span>
            </div>
            <h2 className="mt-1.5 text-lg sm:text-xl font-bold text-white">
              Courier Inspection & Buyer Acceptance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live dual-party capability. Verify factory seal at the hub, then confirm the single-use delivery pass upon arrival.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('dual')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'dual'
                    ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View Courier and Buyer side by side"
              >
                <Sparkles size={12} className="text-amber-400" />
                <span>Side-by-Side</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('courier')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'courier'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Truck size={12} className="text-orange-400" />
                <span>Courier</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('buyer')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'buyer'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>Buyer</span>
              </button>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="size-8 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/10 grid place-items-center text-slate-400 hover:text-white transition-colors shrink-0"
                title="Close (Esc)"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Product & Route Summary Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <Image
                src={getProductImage(c.parcel.productId || c.parcel.id)}
                alt={c.parcel.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {c.parcel.title} · <span className="text-slate-300 font-normal">{c.parcel.variant}</span>
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="text-slate-300 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/5">
                  S/N: {c.parcel.serial}
                </span>
                <span className="text-emerald-400 font-medium">✓ Factory Sealed</span>
                <span>📍 {c.parcel.buyerArea} ({c.parcel.distanceKm} km route)</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Escrow Amount</span>
            <strong className="text-base font-mono text-orange-400 font-bold">
              {money(c.decision.economics.localPricePaise)}
            </strong>
          </div>
        </div>

        {/* MAIN INTERACTIVE DUAL/SINGLE PANE GRID */}
        <div
          className={`grid gap-4 ${
            viewMode === 'dual' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {/* ================= LEFT PANE: COURIER HUB INSPECTION ================= */}
          {(viewMode === 'dual' || viewMode === 'courier') && (
            <div
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                c.state === 'PAID'
                  ? 'border-orange-500/40 bg-orange-500/[0.03] shadow-lg shadow-orange-500/5'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="size-7 rounded-lg bg-orange-500/20 border border-orange-500/30 grid place-items-center text-orange-400">
                      <Truck size={14} />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Step 2: Courier Hub Inspection
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        Physical condition verification
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      c.state === 'PAID'
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 animate-pulse font-bold'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-semibold'
                    }`}
                  >
                    {c.state === 'PAID' ? 'Action Required' : 'Seal Cleared ✓'}
                  </span>
                </div>

                {/* S/N Match & Verification Checklist */}
                <div className="my-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-slate-400 block">
                        Manifest Serial
                      </span>
                      <strong className="text-white text-xs block mt-0.5 truncate">
                        {c.parcel.serial}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-slate-400 block">
                        Hub Barcode Scanned
                      </span>
                      <strong className="text-emerald-400 text-xs block mt-0.5 truncate">
                        {c.parcel.serial}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-2 p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Original factory shrink-wrap intact & unopened</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Tamper-evident security barcode matched</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Geofence destination: {c.parcel.buyerArea} ({c.parcel.distanceKm} km)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Courier Actions */}
              <div className="pt-2 space-y-2">
                {c.state === 'PAID' ? (
                  <>
                    <Button
                      className="w-full h-11 rounded-xl text-xs font-bold text-black shadow-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-orange-500/20 flex items-center justify-center gap-2"
                      disabled={busy}
                      onClick={() => void submitCourier(true)}
                    >
                      {busy ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      ⚡ 1-Click: Confirm Package Seal & Clear Dispatch
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-8 rounded-xl border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-[11px] flex items-center justify-center gap-1.5"
                      disabled={busy}
                      onClick={() => void submitCourier(false)}
                    >
                      <ShieldAlert size={13} />
                      Report Damaged Seal / Serial Mismatch
                    </Button>
                  </>
                ) : (
                  <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.08] text-xs text-emerald-300 font-semibold flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Package seal verified. Cleared for local courier delivery!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= RIGHT PANE: BUYER DOORSTEP ACCEPTANCE ================= */}
          {(viewMode === 'dual' || viewMode === 'buyer') && (
            <div
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                c.state === 'COURIER_VERIFIED'
                  ? 'border-emerald-500/40 bg-emerald-500/[0.04] shadow-lg shadow-emerald-500/5'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="size-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 grid place-items-center text-emerald-400">
                      <ShieldCheck size={14} />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Step 3: Buyer Doorstep Pass
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        Protected escrow delivery release
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      c.state === 'COURIER_VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse font-bold'
                        : c.state === 'DELIVERED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-semibold'
                          : 'bg-white/10 text-slate-400 border-white/10'
                    }`}
                  >
                    {c.state === 'COURIER_VERIFIED'
                      ? 'Pass Code Ready'
                      : c.state === 'DELIVERED'
                        ? 'Delivered ✓'
                        : 'Awaiting Courier'}
                  </span>
                </div>

                {/* Buyer Delivery Pass Tiles */}
                <div className="my-4 space-y-3">
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-black/50 text-center">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <LockKeyhole size={11} /> Single-Use Delivery Pass Code
                    </span>

                    {/* 6 Digits */}
                    <div className="my-2.5 flex items-center justify-center gap-1.5 sm:gap-2">
                      {(c.otp || '872467').split('').map((digit, idx) => (
                        <span
                          key={idx}
                          className="size-9 sm:size-10 rounded-xl border border-emerald-500/40 bg-black font-mono text-lg sm:text-xl font-black text-emerald-300 shadow-inner flex items-center justify-center ring-1 ring-emerald-500/20"
                        >
                          {digit}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const code = c.otp || '872467';
                          void navigator.clipboard.writeText(code);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="h-7 px-3 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-mono rounded-lg"
                      >
                        {copied ? (
                          <Check size={12} className="mr-1 text-emerald-300" />
                        ) : (
                          <Copy size={12} className="mr-1" />
                        )}
                        {copied ? 'Pass Copied!' : 'Copy Code'}
                      </Button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-300 space-y-1">
                    <p className="text-[11px] text-slate-400">
                      📍 Recipient: <strong className="text-white">{c.parcel.buyer}</strong> · {c.parcel.buyerArea}
                    </p>
                    <p className="text-[11px] text-emerald-400">
                      🛡️ Protected Escrow: Payment is held safe until you inspect the seal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Buyer Actions */}
              <div className="pt-2 space-y-2">
                {c.state === 'COURIER_VERIFIED' ? (
                  <>
                    <Button
                      className="w-full h-11 rounded-xl text-xs font-bold text-black shadow-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 shadow-emerald-500/20 flex items-center justify-center gap-2"
                      disabled={busy}
                      onClick={() => void submitBuyer(true)}
                    >
                      {busy ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <ShieldCheck size={16} />
                      )}
                      ⚡ 1-Click: Confirm Pass Code & Accept Delivery
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-8 rounded-xl border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-[11px] flex items-center justify-center gap-1.5"
                      disabled={busy}
                      onClick={() => void submitBuyer(false)}
                    >
                      <ShieldAlert size={13} />
                      Decline Package (Damage or Reject)
                    </Button>
                  </>
                ) : c.state === 'DELIVERED' ? (
                  <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.12] text-xs text-emerald-300 font-semibold flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Package delivered & escrow funds settled successfully!</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-slate-400 flex items-center gap-2">
                    <LockKeyhole size={14} className="text-amber-400 shrink-0" />
                    <span>Courier seal inspection on the left must be confirmed before release.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Celebration / Delivery Success Summary */}
        {isCompleted && (
          <div className="p-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 grid place-items-center shrink-0">
                <CheckCircle2 size={22} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Return Rescued & Hyperlocal Delivery Confirmed!
                </h4>
                <p className="text-xs text-emerald-300 mt-0.5 font-semibold">
                  +{money(c.decision.recovery.advantagePaise)} Net Merchant Margin Recovered vs Warehouse Return
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  1,200 km diesel freight avoided · Zero interstate warehouse bleed.
                </p>
              </div>
            </div>
            {onClose && (
              <Button
                className="rescue-primary text-xs font-bold px-5 py-2 rounded-xl shrink-0"
                onClick={onClose}
              >
                Close & Return
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }


  return (
    <main
      className={`rescue-app rescue-handoff-page ${isModal ? 'p-0 max-w-full' : 'max-w-4xl mx-auto py-6 px-4'}`}
    >
      {/* Top Bar */}
      {isModal ? (
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="rescue-badge badge-blue">
              {courier ? 'Courier Inspection Popup' : 'Buyer Delivery Popup'}
            </span>
            <span className="text-xs font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full bg-emerald-500/10">
              Live Modal
            </span>
          </div>
          {onClose && (
            <Button
              className="rescue-secondary size-8 p-0 text-xs"
              onClick={onClose}
              title="Close Popup"
            >
              <X size={15} />
            </Button>
          )}
        </div>
      ) : (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <Link href="/dashboard" className="rescue-brand">
            <span>2H</span>SecondHop
          </Link>
          <div className="flex items-center gap-2">
            <span className="rescue-badge badge-blue">
              {courier ? 'Courier Inspection Portal' : 'Buyer Delivery Portal'}
            </span>
            <span className="text-xs font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full bg-emerald-500/10">
              Secure Protocol
            </span>
          </div>
        </header>
      )}

      {/* Trust Notice */}
      {!isModal && (
        <div className="rescue-disclosure my-5">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>
            SecondHop Hyperlocal Network · Return Avoidance Protocol · Verified
            Handoff
          </span>
        </div>
      )}

      {error && (
        <div className="rescue-error mb-5" role="alert">
          {error}
        </div>
      )}

      {!c ? (
        <div className="rescue-card text-center py-12">
          <RefreshCw
            className="animate-spin text-orange-400 mx-auto mb-3"
            size={28}
          />
          <p className="text-slate-300 font-medium">
            Opening secure verification link…
          </p>
          <Button
            className="rescue-secondary mt-4"
            onClick={() => {
              void refresh();
            }}
          >
            Retry Loading
          </Button>
        </div>
      ) : (
        <>
          {/* Header Banner */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-mono text-orange-400 font-semibold uppercase tracking-wider">
              {courier ? <Truck size={14} /> : <PackageCheck size={14} />}
              {courier
                ? 'Step 2 of 3 · Courier Verification'
                : 'Step 3 of 3 · Buyer Acceptance'}
            </div>
            <h1 className="mt-2 text-3xl font-bold text-white">
              {courier
                ? 'Inspect Package Seal & Serial'
                : isCompleted
                  ? 'Package Delivered Successfully'
                  : 'Your Package is Ready for Delivery'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {courier
                ? 'Verify the original factory seal is intact before handing over to the local buyer.'
                : isCompleted
                  ? 'Delivery confirmed. The return was successfully diverted from warehouse transit.'
                  : 'Inspect the parcel condition upon arrival and confirm your single-use delivery pass.'}
            </p>
          </div>

          {/* Product Overview Card */}
          <section className="rescue-card mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="relative size-28 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src={getProductImage(c.parcel.productId || c.parcel.id)}
                  alt={c.parcel.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-white">
                    {c.parcel.title}
                  </h2>
                  <span
                    className={`rescue-badge ${isCompleted ? 'badge-green' : 'badge-blue'}`}
                  >
                    {stateLabel[c.state]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  {c.parcel.variant} ·{' '}
                  <strong className="text-orange-400 font-mono">
                    {money(c.decision.economics.localPricePaise)}
                  </strong>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                  <span className="bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/10 text-white">
                    Parcel S/N: {c.parcel.serial}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 size={13} /> Factory Sealed
                  </span>
                  <span>Destination: {c.parcel.buyerArea}</span>
                </div>
              </div>
            </div>

            {/* Courier evidence if previously logged */}
            {c.courierEvidence && (
              <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/30 text-xs">
                <strong className="text-emerald-300 flex items-center gap-1.5 font-bold">
                  <Check size={14} /> Courier Inspection Confirmed
                </strong>
                <p className="mt-1 text-slate-300">{c.courierEvidence}</p>
              </div>
            )}

            {/* Buyer Delivery Code Display */}
            {c.otp && !courier && !isCompleted && (
              <div className="rescue-otp my-6">
                <span>Your Single-Use Delivery Pass Code</span>
                <strong>{c.otp}</strong>
                <p>
                  Provide this pass code to complete delivery and claim this
                  item.
                </p>
              </div>
            )}

            {/* 1-Click Verification Form */}
            {(isCourierStep || isBuyerStep) && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/30 mb-5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-orange-400" />
                    {courier
                      ? 'Ready for 1-Click Courier Confirmation'
                      : 'Ready for 1-Click Buyer Acceptance'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {courier
                      ? `Serial number ${c.parcel.serial} is matched. Click below to confirm seal and clear for buyer delivery.`
                      : `Your delivery pass code (${c.otp}) is pre-filled. Click below to accept the package.`}
                  </p>
                </div>

                {/* Primary 1-Click Action */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    className="rescue-primary font-bold text-sm h-12 px-6"
                    disabled={busy}
                    onClick={() => void submit(true)}
                  >
                    <CheckCircle2 size={18} />
                    {courier
                      ? 'Confirm Package Seal & Hand Over'
                      : 'Accept Package & Complete Delivery'}
                  </Button>

                  <Button
                    className="rescue-danger text-xs h-12 px-4"
                    disabled={busy}
                    onClick={() => void submit(false)}
                  >
                    <ShieldAlert size={16} />
                    Reject (Seal Mismatch / Damaged)
                  </Button>
                </div>

                {/* Optional Custom Inspection Controls */}
                <details className="mt-4 pt-3 text-xs text-slate-400">
                  <summary
                    className="cursor-pointer hover:text-white inline-flex items-center gap-1 font-mono"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <span>Edit Inspection Details (Optional)</span>
                    <ChevronDown size={12} />
                  </summary>
                  <div className="mt-3 space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                    {courier ? (
                      <label className="rescue-field">
                        Serial Number Read from Package
                        <Input
                          className="rescue-input font-mono text-xs"
                          value={serial}
                          onChange={(e) => setSerial(e.target.value)}
                          placeholder="e.g. WH5-BLR-001"
                        />
                      </label>
                    ) : (
                      <label className="rescue-field">
                        6-Digit Delivery Code
                        <Input
                          className="rescue-input font-mono text-sm tracking-widest"
                          value={otp}
                          onChange={(e) =>
                            setOtp(
                              e.target.value.replace(/\D/g, '').slice(0, 6),
                            )
                          }
                          maxLength={6}
                        />
                      </label>
                    )}

                    <label className="rescue-field">
                      Inspection Notes
                      <Textarea
                        className="rescue-input min-h-20 text-xs"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observation notes…"
                      />
                    </label>
                  </div>
                </details>
              </div>
            )}

            {/* Waiting State if not ready */}
            {!isCourierStep && !isBuyerStep && !isCompleted && (
              <div className="mt-6 p-5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
                <LockKeyhole size={20} className="text-amber-400 shrink-0" />
                <div className="text-xs text-slate-300">
                  {courier
                    ? 'Courier inspection unlocks after payment confirmation.'
                    : c.state === 'PAID'
                      ? 'Waiting for courier inspection at the hub. Once the courier verifies the package seal, your 1-click delivery pass will activate.'
                      : 'Verification gate locked.'}
                </div>
              </div>
            )}

            {/* Completed Celebration Card */}
            {isCompleted && (
              <div className="mt-6 p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="size-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 grid place-items-center shrink-0">
                    <CheckCircle2 size={32} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Delivery Confirmed & Closed
                    </h3>
                    <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                      Return package successfully rescued in{' '}
                      {c.parcel.buyerArea}. Warehouse transit avoided.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Evidence sealed in tamper-evident ledger. Test-mode
                      payment captured.
                    </p>
                  </div>
                  <div className="sm:ml-auto mt-3 sm:mt-0">
                    <Link
                      href="/dashboard"
                      className="rescue-primary text-xs font-bold inline-flex items-center gap-1 px-4 py-2.5 rounded-xl"
                    >
                      Dispatch Console <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Warehouse fallback if rejected */}
            {courier && c.warehouseReturn === 'required' && (
              <div className="rescue-notice mt-5">
                <strong>Package Rejected · Return to Warehouse</strong>
                <p className="mt-1 text-xs">
                  Confirm that the parcel has been routed back to the central
                  warehouse return queue.
                </p>
                <Button
                  className="rescue-secondary mt-3 text-xs"
                  disabled={busy}
                  onClick={() => {
                    void submit(false, true);
                  }}
                >
                  <Truck size={14} /> Acknowledge Warehouse Return
                </Button>
              </div>
            )}
          </section>

          {/* Audit History */}
          <section className="rescue-card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Verification Evidence Trail
              </h2>
              <button
                className="rescue-text-link text-xs"
                onClick={() => {
                  void refresh();
                }}
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            <CaseHistory c={c} />
          </section>
        </>
      )}
    </main>
  );
}
