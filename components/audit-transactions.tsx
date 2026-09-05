'use client';

import { useState } from 'react';
import Link from '@/components/safe-link';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileCheck,
  Filter,
  FolderOpen,
  Hash,
  IndianRupee,
  Layers,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { money, outcomeMetrics, stateLabel, type SafeCase } from '@/lib/rescue';
import { getProductImage } from '@/lib/products';
import { useRescue } from './rescue-client';
import { CaseHistory, downloadReceipt } from './rescue-console';

export function AuditTransactions() {
  const { data, error, refresh } = useRescue();
  const [selectedId, setSelectedId] = useState('');
  const [filterState, setFilterState] = useState<
    'all' | 'delivered' | 'paid' | 'in_progress'
  >('all');
  const [copiedId, setCopiedId] = useState('');

  const cases = data?.workspace.cases ?? [];
  const metrics = outcomeMetrics(cases);

  const selectedCase = cases.find((c) => c.id === selectedId);

  const filteredCases = cases.filter((c) => {
    if (filterState === 'delivered') return c.state === 'DELIVERED';
    if (filterState === 'paid')
      return Boolean(c.paymentId) || c.state === 'PAID';
    if (filterState === 'in_progress') return c.state !== 'DELIVERED';
    return true;
  });

  const totalEvents = cases.reduce((sum, c) => sum + c.events.length, 0);
  const paidCount = cases.filter(
    (c) =>
      Boolean(c.paymentId) ||
      ['PAID', 'COURIER_VERIFIED', 'DELIVERED'].includes(c.state),
  ).length;

  function copyText(text: string, id: string) {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  }

  return (
    <div className="rescue-app">
      {/* Page Header */}
      <div className="rescue-page-top">
        <div>
          <p className="rescue-eyebrow">
            <span className="size-2 rounded-full bg-orange-500"></span>
            FINANCIAL AUDIT TRAIL · CRYPTOGRAPHIC LEDGER
          </p>
          <h1>Transactions & Audit Ledger</h1>
          <p className="rescue-subtitle">
            Tamper-evident record of return orders, authorized payments, SHA-256
            evidence chains, and custody transfers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="rescue-secondary text-xs font-mono"
            onClick={() => {
              void refresh();
            }}
          >
            <RefreshCw size={13} /> Refresh Ledger
          </Button>
          <Link
            href="/dashboard"
            className="rescue-text-link text-xs font-semibold"
          >
            Dispatch Console <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {error && <div className="rescue-error mb-5">{error}</div>}

      {/* Trust Disclosure */}
      <div className="rescue-disclosure">
        <ShieldCheck size={16} className="text-emerald-400" />
        <span>
          Protected Settlement Rail · SHA-256 Event Chain · Immutable Order
          State Machine
        </span>
        <span className="ml-auto font-mono text-xs text-orange-400">
          Local Return Hub
        </span>
      </div>

      {/* Top 4 Financial & Audit Metrics */}
      <div className="rescue-stats">
        <div>
          <span>Total Orders Logged</span>
          <strong>
            {cases.length}
            <small>Audited return orders</small>
          </strong>
        </div>
        <div>
          <span>Authorized Payments</span>
          <strong className="text-emerald-400">
            {paidCount}
            <small>Authorized captures</small>
          </strong>
        </div>
        <div>
          <span>Completed Deliveries</span>
          <strong>
            {metrics.completed}
            <small>Verified handoffs</small>
          </strong>
        </div>
        <div>
          <span>Cryptographic Events</span>
          <strong className="text-orange-400">
            {totalEvents}
            <small>SHA-256 signed nodes</small>
          </strong>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterState('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterState === 'all'
                ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            All Transactions ({cases.length})
          </button>
          <button
            onClick={() => setFilterState('delivered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterState === 'delivered'
                ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Delivered ({metrics.completed})
          </button>
          <button
            onClick={() => setFilterState('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterState === 'paid'
                ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Paid & In Flight ({paidCount})
          </button>
          <button
            onClick={() => setFilterState('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterState === 'in_progress'
                ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Active Pipeline (
            {cases.filter((c) => c.state !== 'DELIVERED').length})
          </button>
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filteredCases.length} of {cases.length} records
        </span>
      </div>

      {/* Transaction Table or Empty State */}
      {cases.length === 0 ? (
        <div className="rescue-card text-center py-16">
          <FolderOpen className="mx-auto text-orange-400 mb-3" size={36} />
          <h2 className="text-xl font-bold text-white">
            No Transactions Recorded Yet
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Reserve a return parcel on the Dispatch Console to generate your
            first test-mode transaction and build the audit trail.
          </p>
          <Link
            href="/dashboard"
            className="rescue-primary mt-6 inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl"
          >
            Open Dispatch Console <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <section className="rescue-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="rescue-table">
              <thead>
                <tr>
                  <th>Order / Case ID</th>
                  <th>Item & Variant</th>
                  <th>Settlement Rail</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Latest Hash</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => {
                  const isSelected = selectedId === c.id;
                  const latestEvent = c.events[c.events.length - 1];
                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-orange-500/[0.08] border-l-2 border-l-orange-500'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-xs text-orange-300">
                            #{c.id.slice(0, 8).toUpperCase()}
                          </strong>
                          <button
                            onClick={() => copyText(c.id, c.id)}
                            className="text-slate-500 hover:text-white"
                            title="Copy Case ID"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          {new Date(
                            c.events[0]?.at || Date.now(),
                          ).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-3">
                          <div className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                            <Image
                              src={getProductImage(
                                c.parcel.productId || c.parcel.id,
                              )}
                              alt={c.parcel.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div>
                            <strong className="text-xs font-semibold text-white block truncate max-w-[160px]">
                              {c.parcel.title}
                            </strong>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {c.parcel.variant} · S/N {c.parcel.serial}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-300">
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          Direct Settlement Rail
                        </span>
                        {c.paymentId && (
                          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                            ID: {c.paymentId.slice(0, 14)}…
                          </span>
                        )}
                      </td>

                      <td>
                        <strong className="text-xs font-mono font-bold text-white">
                          {money(c.decision.economics.localPricePaise)}
                        </strong>
                        <span className="block text-[10px] text-emerald-400 font-mono">
                          +{money(c.decision.recovery.advantagePaise)} saved
                        </span>
                      </td>

                      <td>
                        <span
                          className={`rescue-badge ${
                            c.state === 'DELIVERED'
                              ? 'badge-green'
                              : c.state === 'PAID'
                                ? 'badge-amber'
                                : 'badge-blue'
                          }`}
                        >
                          {stateLabel[c.state]}
                        </span>
                      </td>

                      <td>
                        <span className="text-[11px] font-mono text-slate-500">
                          {latestEvent?.hash.slice(0, 10)}…
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            className={`text-xs h-8 px-3 ${
                              isSelected ? 'rescue-primary' : 'rescue-secondary'
                            }`}
                            onClick={() =>
                              setSelectedId(isSelected ? '' : c.id)
                            }
                          >
                            {isSelected ? 'Hide Audit' : 'Inspect Audit'}
                          </Button>
                          <Button
                            className="rescue-secondary text-xs size-8 p-0"
                            title="Download JSON Receipt"
                            onClick={() => downloadReceipt(c)}
                          >
                            <Download size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Selected Case Deep Audit Inspector */}
      {selectedCase && (
        <section className="rescue-card mt-6 border border-orange-500/30 bg-orange-500/[0.02]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold">
                Cryptographic Audit Trail · #
                {selectedCase.id.slice(0, 8).toUpperCase()}
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {selectedCase.parcel.title} ({selectedCase.parcel.variant})
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className="rescue-secondary text-xs"
                onClick={() => downloadReceipt(selectedCase)}
              >
                <Download size={14} /> Export Signed Receipt
              </Button>
              <Button
                className="rescue-secondary text-xs size-8 p-0"
                onClick={() => setSelectedId('')}
              >
                <X size={14} />
              </Button>
            </div>
          </div>

          {/* Key Audit Details */}
          <div className="my-5 grid gap-3 sm:grid-cols-4">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <span className="text-slate-500 font-mono uppercase block">
                Serial Verification
              </span>
              <strong className="text-white font-mono mt-1 block">
                {selectedCase.parcel.serial}
              </strong>
              <span className="text-emerald-400 text-[10px]">
                Verified Intact
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <span className="text-slate-500 font-mono uppercase block">
                Payment Capture
              </span>
              <strong className="text-white font-mono mt-1 block">
                {selectedCase.paymentId
                  ? selectedCase.paymentId.slice(0, 16)
                  : 'Authorized Settlement'}
              </strong>
              <span className="text-emerald-400 text-[10px]">
                Captured & Verified
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <span className="text-slate-500 font-mono uppercase block">
                Delivery Pass Code
              </span>
              <strong className="text-white font-mono mt-1 block">
                {selectedCase.otp || 'Generated on Verify'}
              </strong>
              <span className="text-slate-400 text-[10px]">Single-use OTP</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <span className="text-slate-500 font-mono uppercase block">
                Merchant Advantage
              </span>
              <strong className="text-emerald-400 font-mono mt-1 block">
                +{money(selectedCase.decision.recovery.advantagePaise)}
              </strong>
              <span className="text-slate-400 text-[10px]">
                Avoided warehouse fees
              </span>
            </div>
          </div>

          {/* Full Event Chain */}
          <div className="pt-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
              Immutable SHA-256 Hash Chain ({selectedCase.events.length} Nodes)
            </h4>
            <CaseHistory c={selectedCase} />
          </div>
        </section>
      )}
    </div>
  );
}
