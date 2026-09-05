'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Check, Loader2, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  calculateRecovery,
  money,
  type Parcel,
  type Snapshot,
} from '@/lib/rescue';
import { getProductImage } from '@/lib/products';
import { CasePanel } from './rescue-console';
import { rescueRequest } from './rescue-client';

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

export function CommerceCheckout({
  parcel,
  data,
  refresh,
  onClose,
  authorizedBudget,
  authorizedRadius,
}: {
  parcel: Parcel;
  data: Snapshot;
  refresh: () => Promise<void>;
  onClose?: () => void;
  authorizedBudget?: number;
  authorizedRadius?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdCaseId, setCreatedCaseId] = useState('');
  const c = data.workspace.cases
    .filter(
      (c) =>
        (c.id === createdCaseId ||
          c.parcel.serial === parcel.serial ||
          c.parcel.id === parcel.id ||
          c.parcel.productId === parcel.productId) &&
        c.state !== 'EXPIRED',
    )
    .at(-1);
  const budget = authorizedBudget ?? parcel.economics.localPricePaise;
  const radius = authorizedRadius ?? parcel.radiusKm;

  async function approve() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: parcel.productId,
          mode: 'test',
          maxAuthorizedPaise: budget,
          maxRadiusKm: radius,
          requestedVariant: parcel.variant,
          requestId: `checkout_${parcel.productId}_test_${budget}_${radius}`,
        }),
      });
      const result = (await response.json()) as {
        caseId: string;
        keyId: string;
        order: { id: string; amount: number };
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error ?? 'Unable to create the checkout.');
      if (result.caseId) setCreatedCaseId(result.caseId);

      // Open checkout modal immediately
      const Constructor = await checkoutScript();
      const rzp = new Constructor({
        key: result.keyId,
        order_id: result.order.id,
        amount: result.order.amount,
        currency: 'INR',
        name: 'SecondHop · Instant Checkout',
        description: `${parcel.title} · ${parcel.variant}`,
        theme: { color: '#f97316' },
        handler: (res: Record<string, string>) => {
          void (async () => {
            try {
              const verifyResponse = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  caseId: result.caseId,
                  razorpay_order_id: res.razorpay_order_id,
                  razorpay_payment_id: res.razorpay_payment_id,
                  razorpay_signature: res.razorpay_signature,
                }),
              });
              const verifyResult = (await verifyResponse
                .json()
                .catch(() => ({}))) as {
                verified?: boolean;
                authoritativeStatus?: string;
                error?: string;
              };
              if (!verifyResponse.ok) {
                throw new Error(
                  verifyResult.error ??
                    'Payment verification failed. The handoff remains locked.',
                );
              }
              if (!verifyResult.verified) {
                throw new Error(
                  verifyResult.authoritativeStatus
                    ? `Payment is ${verifyResult.authoritativeStatus}; handoff remains locked.`
                    : 'Payment verification is still pending. Check payment status before handing off.',
                );
              }
            } catch (err) {
              setError(
                err instanceof Error ? err.message : 'Verification pending.',
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
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Checkout could not start.',
      );
      await refresh();
      setBusy(false);
    }
  }

  async function run(action: string) {
    setBusy(true);
    setError('');
    try {
      await rescueRequest({ action, caseId: c?.id });
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Action failed.');
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="commerce-checkout" id="checkout-review">
      <div className="mb-4 flex items-center justify-between">
        <p className="rescue-eyebrow">AUTHORIZED HYPERLOCAL CHECKOUT</p>
        {onClose && (
          <Button
            className="rescue-secondary text-xs"
            onClick={onClose}
            aria-label="Close checkout"
          >
            <X size={14} /> Close
          </Button>
        )}
      </div>

      {error && (
        <div className="rescue-error mb-4" role="alert">
          {error}
        </div>
      )}

      {c ? (
        <CasePanel c={c} run={run} busy={busy} refresh={refresh} />
      ) : (
        <section className="rescue-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src={getProductImage(parcel.productId || parcel.id)}
                  alt={parcel.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{parcel.title}</h2>
                <p className="mt-0.5 text-xs text-slate-400 font-mono">
                  {parcel.variant} · Factory Sealed Return
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-orange-400">
                {money(parcel.economics.localPricePaise)}
              </p>
              <p className="mt-0.5 text-xs font-mono text-slate-400 line-through">
                {money(parcel.retailPaise)}
              </p>
            </div>
          </div>

          <div className="my-5 grid gap-3 sm:grid-cols-3">
            <div className="rescue-mini">
              <span>Your Maximum Charge</span>
              <strong>{money(budget)}</strong>
            </div>
            <div className="rescue-mini">
              <span>Hyperlocal Distance</span>
              <strong>{parcel.distanceKm} km</strong>
            </div>
            <div className="rescue-mini border-orange-500/30 bg-orange-500/[0.04]">
              <span className="text-orange-300">Buyer Discount</span>
              <strong className="text-orange-300">
                +{money(parcel.retailPaise - parcel.economics.localPricePaise)}
              </strong>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <p className="flex items-center gap-2">
              <Check className="text-emerald-400" size={16} />
              Exact SKU and colour variant. Single unit. No substitutions.
            </p>
            <p className="flex items-center gap-2">
              <Check className="text-emerald-400" size={16} />
              Merchant return policy remains active.
            </p>
            <p className="flex items-center gap-2">
              <Check className="text-emerald-400" size={16} />
              Courier physical inspection and buyer one-time pass confirmation
              required at handoff.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-300 font-semibold flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Protected Escrow Payment Rail
              </span>
            </div>
            <Button
              className="rescue-primary h-11 px-6 text-sm font-bold tracking-wide"
              disabled={busy}
              onClick={() => {
                void approve();
              }}
            >
              {busy ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <ShieldCheck size={16} />
              )}
              Approve {money(parcel.economics.localPricePaise)} & Pay
            </Button>
          </div>

          <p className="mt-4 text-xs font-mono text-slate-400 leading-relaxed">
            Your approval locks this unit and initiates secure payment
            authorization. Funds are held safely in escrow until mutual handoff
            verification.
          </p>
        </section>
      )}
    </div>
  );
}
