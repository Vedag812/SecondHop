'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  List,
  Settings,
  ShoppingBag,
  Bot,
} from 'lucide-react';

const operationsNav = [
  { href: '/dashboard', label: 'Dispatch Console', icon: LayoutDashboard },
  {
    href: '/dashboard/transactions',
    label: 'Audit & Transactions',
    icon: List,
  },
  {
    href: '/dashboard/analytics',
    label: 'Impact & Analytics',
    icon: BarChart3,
  },
];

const commerceNav = [
  { href: '/dashboard/products', label: 'Return Inventory', icon: ShoppingBag },
  { href: '/dashboard/agentic', label: 'AI Buyer Agent', icon: Bot },
];

const systemNav = [
  { href: '/dashboard/settings', label: 'System Readiness', icon: Settings },
];

const navItems = [...operationsNav, ...commerceNav, ...systemNav];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#070709] text-white selection:bg-orange-500 selection:text-black">
      {/* Buildathon Ambient Background Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[35%] left-1/2 -translate-x-1/2 size-[1000px] rounded-full bg-orange-600/[0.06] blur-[150px]" />
        <div className="absolute -bottom-[20%] -left-[10%] size-[700px] rounded-full bg-blue-600/[0.03] blur-[140px]" />
      </div>

      {/* ── SIDEBAR ── */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[260px] flex-col border-r border-white/[0.08] bg-[#0a0a0f]/95 backdrop-blur-2xl lg:flex">
        {/* Brand Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.08] px-6">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ea580c] text-sm font-black text-black shadow-lg shadow-orange-500/25">
            2H
          </span>
          <div>
            <p className="text-sm font-bold text-white tracking-tight leading-none">
              SecondHop
            </p>
            <p className="mt-1 font-mono text-[10px] text-orange-400 font-semibold tracking-wider uppercase">
              Hyperlocal Logistics
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {/* Operations Group */}
          <div>
            <p className="px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
              OPERATIONS
            </p>
            <div className="mt-2 space-y-1">
              {operationsNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all ${
                      active
                        ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/5 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-500/10'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <item.icon
                      className={`size-[17px] ${active ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                    />
                    {item.label}
                    {active && (
                      <ChevronRight className="ml-auto size-3.5 text-orange-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Commerce Group */}
          <div>
            <p className="px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
              COMMERCE
            </p>
            <div className="mt-2 space-y-1">
              {commerceNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all ${
                      active
                        ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/5 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-500/10'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <item.icon
                      className={`size-[17px] ${active ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                    />
                    {item.label}
                    {active && (
                      <ChevronRight className="ml-auto size-3.5 text-orange-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* System Group */}
          <div>
            <p className="px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
              SYSTEM
            </p>
            <div className="mt-2 space-y-1">
              {systemNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all ${
                      active
                        ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/5 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-500/10'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <item.icon
                      className={`size-[17px] ${active ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                    />
                    {item.label}
                    {active && (
                      <ChevronRight className="ml-auto size-3.5 text-orange-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Bottom User & Node Status Section */}
        <div className="border-t border-white/[0.08] p-3 space-y-2.5">
          {/* User Profile Card */}
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition-all hover:border-white/20 hover:bg-white/[0.05]">
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ea580c] text-xs font-black text-black shadow-md shadow-orange-500/20">
              V
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#0a0a0f] bg-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="truncate text-xs font-bold text-white">Vedant</p>
                <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-orange-400 border border-orange-500/25">
                  Admin
                </span>
              </div>
              <p className="truncate text-[10px] font-mono text-slate-400">
                Hub Operations Lead
              </p>
            </div>
          </div>

          {/* Node Status */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-xs font-mono font-semibold text-white">
                City Hub Node · Active
              </p>
            </div>
            <p className="mt-1 text-[11px] font-mono text-slate-400">
              Protected Payment Rail
            </p>
          </div>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.08] bg-[#070709]/95 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#ff6b00] to-[#ea580c] text-xs font-black text-black">
            2H
          </span>
          <span className="text-sm font-bold text-white">SecondHop</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
            <span className="relative flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-[#ff6b00] to-[#ea580c] text-[10px] font-black text-black">
              V
              <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-semibold text-slate-200">Vedant</span>
          </div>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
                    active
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <item.icon className="size-4" />
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 w-full pt-14 lg:pl-[260px] lg:pt-0">
        {children}
      </main>
    </div>
  );
}
