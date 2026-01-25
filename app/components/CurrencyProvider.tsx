'use client';

import { createContext, useContext, useState, useCallback, useSyncExternalStore, type ReactNode } from 'react';
import { type CurrencyCode, DEFAULT_CURRENCY, CURRENCY_STORAGE_KEY, formatCurrency } from '../lib/currency';

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  format: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

// Load currency from localStorage
function loadCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && ['AUD', 'USD', 'EUR', 'GBP'].includes(stored)) {
      return stored as CurrencyCode;
    }
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_CURRENCY;
}

// Save currency to localStorage
function saveCurrency(currency: CurrencyCode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch {
    // Ignore localStorage errors
  }
}

// Hook to safely check if we're on the client
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => loadCurrency());

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    saveCurrency(newCurrency);
  }, []);

  // Use default currency during SSR to avoid hydration mismatch
  const effectiveCurrency = isClient ? currency : DEFAULT_CURRENCY;

  const value: CurrencyContextValue = {
    currency: effectiveCurrency,
    setCurrency,
    format: (value: number) => formatCurrency(value, effectiveCurrency),
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
