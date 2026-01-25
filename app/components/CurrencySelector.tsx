'use client';

import { useCurrency } from './CurrencyProvider';
import { CURRENCIES, type CurrencyCode } from '../lib/currency';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      className="bg-background border border-card-border rounded-md px-2 py-1 text-xs text-zinc-400 hover:text-foreground hover:border-zinc-500 focus:outline-none focus:border-accent transition-colors cursor-pointer"
      aria-label="Select currency"
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.label}
        </option>
      ))}
    </select>
  );
}
