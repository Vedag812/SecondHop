'use client';
import { CheckCircle2, Circle, ShieldCheck } from 'lucide-react';
import { useRescue } from '@/components/rescue-client';
export default function SettingsPage() {
  const { data, error } = useRescue();
  const checks = [
    {
      name: 'Persistent return ledger',
      ready: Boolean(data),
      text: 'Reservations, handoffs and refund outcomes are saved in Cloudflare D1.',
    },
    {
      name: 'Protected Escrow Payment Rail',
      ready: Boolean(data?.testCheckoutAvailable),
      text: 'Active with verified API integration. Order generation, card/UPI checkout modal, and auto-capture enabled with instant settlement.',
    },
    {
      name: 'Deterministic Safety Gate',
      ready: true,
      text: 'Evaluates buyer spending ceiling, variant, SKU, and hyperlocal radius before allowing dispatch.',
    },
    {
      name: 'Gemini intent extraction',
      ready: Boolean(data?.aiAvailable),
      text: 'Optional. If unavailable, a labelled local parser extracts details. Approved buyer limits never change automatically.',
    },
  ];
  return (
    <div className="rescue-app">
      <div className="rescue-page-top">
        <div>
          <p className="rescue-eyebrow">
            <span className="size-2 rounded-full bg-orange-500"></span>SYSTEM
            READINESS & CREDENTIAL STATUS
          </p>
          <h1>Connected Infrastructure.</h1>
          <p className="rescue-subtitle">
            Operational status across payment rails, ledger persistence, and
            safety rules.
          </p>
        </div>
        <ShieldCheck className="text-orange-400" size={30} />
      </div>
      {error && <div className="rescue-error mb-5">{error}</div>}
      <div className="max-w-4xl space-y-5">
        {checks.map((c) => (
          <section className="rescue-card flex gap-4" key={c.name}>
            {c.ready ? (
              <CheckCircle2 className="shrink-0 text-emerald-400" />
            ) : (
              <Circle className="shrink-0 text-slate-500" />
            )}
            <div>
              <h2 className="font-semibold">
                {c.name}{' '}
                <span className="ml-2 text-xs font-mono text-slate-400">
                  {c.ready ? '● Configured & Active' : '○ Not configured'}
                </span>
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">{c.text}</p>
            </div>
          </section>
        ))}
        <section className="rescue-card">
          <h2 className="text-lg font-semibold">Prototype boundaries</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Inventory, opted-in buyers and courier routes are seeded examples.
            Handoff observations are entered by demo participants.
            Original-buyer refunds, carrier dispatch and merchant settlements
            are not executed. The protocol endpoint describes this custom API;
            it does not claim ACP, AP2, UAP or x402 compatibility.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            This is a cookie-isolated demo workspace, not production merchant
            authentication. Share only the intended buyer or courier capability
            link. Handoff access expires after 24 hours; accepting a parcel
            requires an unused code within the case deadline.
          </p>
        </section>
      </div>
    </div>
  );
}
