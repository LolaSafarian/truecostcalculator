// Currency types and formatting utilities

export type CurrencyCode = 'AUD' | 'USD' | 'EUR' | 'GBP';

export const CURRENCIES: { code: CurrencyCode; label: string; locale: string }[] = [
  { code: 'AUD', label: 'AUD', locale: 'en-AU' },
  { code: 'USD', label: 'USD', locale: 'en-US' },
  { code: 'EUR', label: 'EUR', locale: 'de-DE' },
  { code: 'GBP', label: 'GBP', locale: 'en-GB' },
];

export const DEFAULT_CURRENCY: CurrencyCode = 'AUD';
export const CURRENCY_STORAGE_KEY = 'truecost.currency';

export function getLocaleForCurrency(currency: CurrencyCode): string {
  const found = CURRENCIES.find((c) => c.code === currency);
  return found?.locale ?? 'en-AU';
}

export function formatCurrency(value: number, currency: CurrencyCode): string {
  if (!isFinite(value)) return '–';
  const locale = getLocaleForCurrency(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
