'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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
  isModal = false,
  onClose,
}: {
  caseId: string;
  initialToken?: string;
  isModal?: boolean;
  onClose?: () => void;
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

  const token =
    initialToken ||
    (typeof window !== 'undefined' ? window.location.hash.slice(1) : '');

  const refresh = useCallback(async () => {
    try {
      setData(await rescueRequest(undefined, token, caseId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Cannot load this handoff.',
      );
    }
  }, [caseId, token]);

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

  const c = data?.case;
  const courier = data?.role === 'courier';

  // Auto-fill sensible defaults for instant 1-click simplicity
  useEffect(() => {
    if (c) {
      if (courier && !serial) {
        setSerial(c.parcel.serial);
        if (!notes)
          setNotes(
            'Package seal verified intact. Original factory packaging confirmed.',
          );
      }
      if (!courier && c.otp && !otp) {
        setOtp(c.otp);
        if (!notes)
          setNotes('Package inspected. Received in sealed condition.');
      }
    }
  }, [c, courier, serial, otp, notes]);

  async function submit(accepted: boolean, warehouse = false) {
    setBusy(true);
    setError('');
    try {
      const activeSerial = serial || (courier ? c?.parcel.serial : undefined);
      const activeOtp = otp || (!courier ? c?.otp : undefined);
      const activeNotes =
        notes.trim() ||
        (accepted
          ? 'Package verified intact and in original seal.'
          : 'Seal mismatch or damaged packaging reported.');

      await rescueRequest(
        {
          action: warehouse ? 'warehouse_ack' : 'inspect',
          caseId,
          accepted,
          serial: activeSerial,
          otp: activeOtp,
          evidence: activeNotes,
        },
        token,
      );
      await refresh();
      if (onClose) {
        setTimeout(() => onClose(), 800);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Action could not be saved.',
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const isCourierStep = courier && c?.state === 'PAID';
  const isBuyerStep = !courier && c?.state === 'COURIER_VERIFIED';
  const isCompleted = c?.state === 'DELIVERED';

  // Dedicated, High-Polish Modal View for Dispatch Console
  if (isModal) {
    if (!c) {
      return (
        <div className="py-12 text-center">
          <RefreshCw
            className="animate-spin text-orange-400 mx-auto mb-3"
            size={28}
          />
          <p className="text-sm font-medium text-slate-300">
            Loading secure handoff protocol…
          </p>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                  courier
                    ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                }`}
              >
                {courier ? <Truck size={13} /> : <ShieldCheck size={13} />}
                {courier
                  ? 'Step 2: Courier Package Inspection'
                  : 'Step 3: Buyer Delivery & Acceptance'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 border border-white/10 px-2 py-0.5 rounded-full bg-white/[0.03]">
                {stateLabel[c.state]}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">
              {courier
                ? 'Verify Package Seal & Serial'
                : isCompleted
                  ? 'Package Delivered Successfully'
                  : 'Buyer Delivery & Pass Code'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {courier
                ? 'Confirm original packaging & matching serial before releasing to local delivery.'
                : isCompleted
                  ? 'Delivery confirmed. The return was successfully diverted from warehouse transit.'
                  : 'Inspect the parcel condition upon arrival and confirm your single-use delivery pass.'}
            </p>
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

        {error && (
          <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Product Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
            <Image
              src={getProductImage(c.parcel.productId || c.parcel.id)}
              alt={c.parcel.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-white truncate">
                {c.parcel.title}
              </h3>
              <strong className="text-xs font-mono text-orange-400 font-bold">
                {money(c.decision.economics.localPricePaise)}
              </strong>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {c.parcel.variant}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="text-slate-300 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/5">
                S/N: {c.parcel.serial}
              </span>
              <span className="text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 size={11} /> Factory Sealed
              </span>
              <span>
                📍 {c.parcel.buyerArea} ({c.parcel.distanceKm} km)
              </span>
            </div>
          </div>
        </div>

        {/* Buyer View: Big 6-Digit Delivery Pass Code */}
        {!courier && c.otp && !isCompleted && (
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-emerald-500/[0.03] to-transparent text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
              <LockKeyhole size={13} />
              Your Single-Use Delivery Pass Code
            </div>
            {/* 6-Digit Individual Tiles */}
            <div className="my-3 flex items-center justify-center gap-2">
              {c.otp.split('').map((digit, idx) => (
                <div
                  key={idx}
                  className="size-11 sm:size-12 rounded-xl border border-emerald-500/40 bg-black/70 font-mono text-xl sm:text-2xl font-black text-emerald-300 shadow-inner flex items-center justify-center ring-1 ring-emerald-500/20"
                >
                  {digit}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (c.otp) {
                    void navigator.clipboard.writeText(c.otp);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="h-8 px-3.5 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold rounded-lg"
              >
                {copied ? (
                  <Check size={13} className="mr-1.5 text-emerald-300" />
                ) : (
                  <Copy size={13} className="mr-1.5" />
                )}
                {copied ? 'Pass Code Copied!' : 'Copy Pass Code'}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Provide this code to the courier after inspecting the package.
              Payment is protected in escrow.
            </p>
          </div>
        )}

        {/* Courier View: Verification Checklist & Matched S/N */}
        {courier && (
          <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/[0.04] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Truck size={14} /> Hub Package Seal Verification
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check size={11} /> Serial Matched
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-400 block">
                  Required Serial
                </span>
                <strong className="text-white text-xs block mt-0.5">
                  {c.parcel.serial}
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-400 block">
                  Hub Tag Scanned
                </span>
                <strong className="text-emerald-400 text-xs block mt-0.5">
                  {c.parcel.serial}
                </strong>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5 text-[11px] text-slate-300 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>
                Original manufacturer packaging verified. Sealed condition
                intact.
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(isCourierStep || isBuyerStep) && (
          <div className="space-y-2.5 pt-1">
            <Button
              className={`w-full h-12 rounded-xl text-sm font-bold text-black shadow-lg flex items-center justify-center gap-2 ${
                courier
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-orange-500/25'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 shadow-emerald-500/25'
              }`}
              disabled={busy}
              onClick={() => void submit(true)}
            >
              {busy ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {courier
                ? 'Confirm Package Seal & Clear for Delivery'
                : 'Accept Package & Complete Delivery'}
            </Button>

            <Button
              variant="outline"
              className="w-full h-9 rounded-xl border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-xs flex items-center justify-center gap-1.5"
              disabled={busy}
              onClick={() => void submit(false)}
            >
              <ShieldAlert size={14} />
              {courier
                ? 'Report Damaged Seal / Serial Mismatch'
                : 'Decline Package (Damaged or Mismatch)'}
            </Button>
          </div>
        )}

        {/* Alerts when not in action state */}
        {!isCourierStep && !isBuyerStep && !isCompleted && (
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
            <LockKeyhole size={18} className="text-amber-400 shrink-0" />
            <div className="text-xs text-slate-300">
              {courier
                ? 'Courier inspection unlocks after payment confirmation.'
                : c.state === 'PAID'
                  ? 'Waiting for courier seal inspection at the hub. Once verified, buyer handoff will unlock.'
                  : 'Verification gate locked for current case state.'}
            </div>
          </div>
        )}

        {/* Completed Celebration View */}
        {isCompleted && (
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 grid place-items-center shrink-0">
              <CheckCircle2 size={22} className="text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white">
                Delivery Confirmed & Closed
              </h4>
              <p className="text-xs text-emerald-300 mt-0.5">
                Return package successfully delivered in {c.parcel.buyerArea}.
              </p>
            </div>
            {onClose && (
              <Button
                size="sm"
                className="rescue-primary text-xs shrink-0"
                onClick={onClose}
              >
                Close
              </Button>
            )}
          </div>
        )}

        {/* Optional Manual Inspection Inputs */}
        {(isCourierStep || isBuyerStep) && (
          <details className="text-xs text-slate-400 pt-1">
            <summary className="cursor-pointer hover:text-white inline-flex items-center gap-1 font-mono text-[11px]">
              <span>Edit Inspection Details (Optional)</span>
              <ChevronDown size={11} />
            </summary>
            <div className="mt-2 space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/10">
              {courier ? (
                <label className="rescue-field">
                  Serial Number Confirmed on Package
                  <Input
                    className="rescue-input font-mono text-xs"
                    value={serial}
                    onChange={(e) => setSerial(e.target.value)}
                    placeholder="e.g. WH40-IN-884921"
                  />
                </label>
              ) : (
                <label className="rescue-field">
                  Delivery Pass Code
                  <Input
                    className="rescue-input font-mono text-xs tracking-widest"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    maxLength={6}
                  />
                </label>
              )}
              <label className="rescue-field">
                Inspection Notes
                <Textarea
                  className="rescue-input text-xs"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
            </div>
          </details>
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
