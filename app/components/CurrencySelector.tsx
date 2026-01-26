'use client';

import { useCurrency } from './CurrencyProvider';
import { CURRENCIES, type CurrencyCode } from '../lib/currency';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      aria-label="Select currency"
      style={{
        backgroundColor: '#171717',
        color: '#ededed',
        border: '1px solid #22c55e',
        borderRadius: '6px',
        padding: '6px 10px',
        fontSize: '12px',
        cursor: 'pointer',
        outline: 'none',
        WebkitAppearance: 'menulist',
        MozAppearance: 'menulist',
        appearance: 'menulist',
      }}
    >
      {CURRENCIES.map((c) => (
        <option
          key={c.code}
          value={c.code}
          style={{
            backgroundColor: '#171717',
            color: '#ededed',
          }}
        >
          {c.label}
        </option>
      ))}
    </select>
  );
}
