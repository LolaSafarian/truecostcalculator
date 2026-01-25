'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { CurrencyProvider } from './CurrencyProvider';
import { CurrencySelector } from './CurrencySelector';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/salary-reality', label: 'Salary Reality' },
  { href: '/time-cost', label: 'Time Cost' },
  { href: '/life-friction', label: 'Life Friction' },
];

export function LayoutClient({ children }: { children: ReactNode }) {
  return (
    <CurrencyProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-52 md:flex-col md:fixed md:inset-y-0 bg-card-bg border-r border-card-border">
          <div className="flex flex-col flex-1 pt-6 pb-4">
            <Link href="/" className="px-6 mb-8">
              <span className="text-xl font-bold text-accent">True Cost</span>
            </Link>
            <nav className="flex-1 px-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {/* Currency selector at bottom of sidebar */}
            <div className="px-6 pt-4 border-t border-card-border">
              <label className="block text-xs text-zinc-500 mb-1.5">Currency</label>
              <CurrencySelector />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-52 pb-20 md:pb-0 flex flex-col min-h-screen">
          <div className="flex-1">{children}</div>
          <footer className="px-6 py-4 text-center text-xs text-zinc-500">
            For informational purposes only.
          </footer>
        </main>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card-bg border-t border-card-border">
          <div className="flex items-center justify-around py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs text-zinc-400 hover:text-accent transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <CurrencySelector />
          </div>
        </nav>
      </div>
    </CurrencyProvider>
  );
}
