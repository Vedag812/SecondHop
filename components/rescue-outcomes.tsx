'use client';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FolderOpen,
  ShieldCheck,
} from 'lucide-react';
import { money, outcomeMetrics, stateLabel } from '@/lib/rescue';
import { useRescue } from './rescue-client';
import { CaseHistory, downloadReceipt } from './rescue-console';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function RescueOutcomes({ analytics = false }: { analytics?: boolean }) {
  const { data, error } = useRescue();
  const [selected, setSelected] = useState('');
  const cases = data?.workspace.cases ?? [];
  const metrics = outcomeMetrics(cases);
  const current = cases.find((c) => c.id === selected);
  return (
    <div className="rescue-app">
      <div className="rescue-page-top">
        <div>
          <p className="rescue-eyebrow">
            <span className="size-2 rounded-full bg-orange-500"></span>AUDIT
            TRAIL & TRANSACTION LEDGER
          </p>
          <h1>
            {analytics
              ? 'Measured Impact & Evidence.'
              : 'One Immutable Ledger. Every Second Hop.'}
          </h1>
          <p className="rescue-subtitle">
            Every state transition, signature check, and handoff confirmation
            recorded in an immutable hash chain.
          </p>
        </div>
        <Link href="/dashboard" className="rescue-text-link font-semibold">
          Back to dispatch <ArrowRight size={16} />
        </Link>
      </div>
      {error && <div className="rescue-error">{error}</div>}
      <div className="rescue-disclosure">
        <ShieldCheck size={16} className="text-emerald-400" />
        <span>
          100% Test Mode Transactions · Immutable Hash Chain · Refresh-Safe
          Ledger
        </span>
      </div>
      <div className="rescue-stats">
        <div>
          <span>Confirmed handoffs</span>
          <strong>
            {metrics.completed}
            <small>{metrics.simulations} with simulated payments</small>
          </strong>
        </div>
        <div>
          <span>Expected extra recovery</span>
          <strong>
            {money(metrics.expectedRecoveryPaise)}
            <small>Completed cases · estimated</small>
          </strong>
        </div>
        <div>
          <span>Buyer discount</span>
          <strong>
            {money(metrics.buyerSavingsPaise)}
            <small>Separate from merchant benefit</small>
          </strong>
        </div>
        <div>
          <span>Refunds unresolved</span>
          <strong>
            {metrics.pendingRefunds}
            <small>Pending or requiring review</small>
          </strong>
        </div>
      </div>
      {cases.length === 0 ? (
        <div className="rescue-empty">
          <FolderOpen className="mx-auto" size={32} />
          <h2>Your first case starts at the hub.</h2>
          <p>
            Reserve a return and complete a handoff to build the evidence trail.
          </p>
          <Link className="rescue-text-link mt-5" href="/dashboard">
            Open dispatch board <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <section className="rescue-card">
          <h2 className="text-xl font-semibold">Return cases</h2>
          <div className="overflow-x-auto">
            <table className="rescue-table">
              <thead>
                <tr>
                  <th>Parcel</th>
                  <th>Payment path</th>
                  <th>Outcome</th>
                  <th>Expected advantage</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong className="font-medium">{c.parcel.title}</strong>
                      <p className="mt-1 text-xs text-slate-400">
                        {c.parcel.variant} · {c.id.slice(0, 8)}
                      </p>
                    </td>
                    <td>
                      {c.rail === 'simulation' ? 'Simulation' : 'Test payment'}
                    </td>
                    <td>
                      {stateLabel[c.state]}
                      <p className="mt-1 text-xs text-slate-400">
                        {c.warehouseReturn === 'required'
                          ? 'Warehouse acknowledgment pending'
                          : c.warehouseReturn === 'acknowledged'
                            ? 'Warehouse fallback acknowledged'
                            : ''}
                      </p>
                    </td>
                    <td>
                      {c.state === 'DELIVERED'
                        ? money(c.decision.recovery.advantagePaise)
                        : 'Not counted'}
                    </td>
                    <td>
                      <div className="flex justify-end gap-3">
                        <button
                          className="rescue-text-link"
                          onClick={() =>
                            setSelected(selected === c.id ? '' : c.id)
                          }
                        >
                          View
                        </button>
                        <button
                          className="rescue-text-link"
                          aria-label={`Download evidence for ${c.parcel.title}`}
                          onClick={() => downloadReceipt(c)}
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {current && (
        <section className="rescue-card mt-5">
          <div className="flex justify-between">
            <h2 className="font-semibold">
              Evidence for {current.parcel.title}
            </h2>
            <Button
              className="rescue-secondary"
              onClick={() => setSelected('')}
            >
              Close
            </Button>
          </div>
          <CaseHistory c={current} />
        </section>
      )}
      {analytics && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rescue-card">
            <h2 className="text-lg font-semibold">
              Decisions that protected the merchant
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Only declined offers actually checked by the server are listed.
            </p>
            <div className="mt-5 space-y-4">
              {data?.workspace.rejectedDecisions.length ? (
                data.workspace.rejectedDecisions.map((r) => (
                  <div key={r.id} className="rescue-rule">
                    <ShieldCheck className="text-amber-300" size={18} />
                    <div>
                      <strong>{r.parcel}</strong>
                      <p>{r.reasons.join(' · ')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  No declined decisions recorded yet. Try the silver or grey
                  parcel.
                </p>
              )}
            </div>
          </section>
          <section className="rescue-card">
            <CheckCircle2 size={23} className="text-orange-300" />
            <h2 className="mt-4 text-lg font-semibold">
              What this evidence establishes
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              An individual parcel was reserved once, the chosen payment path
              was recorded, and both handoff roles submitted their
              confirmations. The history survives refresh.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Estimated recovery is a model comparison, not accounting profit.
              Notes are participant statements, not independent condition
              certification. Original-buyer refunds and merchant settlement
              remain external obligations. The hash chain is stored with the
              ledger and is not externally anchored.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
