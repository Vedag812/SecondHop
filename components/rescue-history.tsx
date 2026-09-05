'use client';

import { Check } from 'lucide-react';
import type { SafeCase } from '@/lib/rescue';

export function CaseHistory({ c }: { c: SafeCase }) {
  return (
    <ol className="rescue-timeline">
      {c.events.map((e, i) => (
        <li key={e.id}>
          <span className="timeline-dot">
            {i === c.events.length - 1 ? <Check size={12} /> : null}
          </span>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>{e.action}</strong>
              <time className="text-xs font-mono text-slate-400">
                {new Date(e.at).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </time>
            </div>
            <p>{e.detail}</p>
            <span className="text-xs font-mono text-slate-500">
              {e.actor} · SHA-256 {e.hash.slice(0, 12)}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function downloadReceipt(c: SafeCase) {
  const {
    buyerLink: _buyerLink,
    courierLink: _courierLink,
    otp: _otp,
    ...safe
  } = c;
  const blob = new Blob(
    [
      JSON.stringify(
        {
          ...safe,
          disclosure:
            'Autonomous Return Logistics Engine. Verified payment settlement.',
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `secondhop-case-${c.id.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
