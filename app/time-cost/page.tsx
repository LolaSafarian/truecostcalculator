'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useCurrency } from '../components/CurrencyProvider';
import DailyNote from '../components/DailyNote';

// Types
type Frequency = 'once' | 'weekly' | 'fortnightly' | 'monthly';
type Duration = '4weeks' | '8weeks' | '12weeks' | '6months' | 'ongoing';
type EnergyLevel = 'light' | 'medium' | 'heavy';
type TimeUnit = 'minutes' | 'hours' | 'days';

interface TimeCostInputs {
  commitmentName: string;
  baseTimeValue: string;
  baseTimeUnit: TimeUnit;
  hiddenTimeValue: string;
  hiddenTimeUnit: TimeUnit;
  frequency: Frequency;
  duration: Duration;
  energyLevel: EnergyLevel;
  hourlyValue: string;
  showMoneyCost: boolean;
}

interface CalculationResults {
  totalMinutesPerOccurrence: number;
  timeMinutesMonth: number;
  recoveryMinutesMonth: number;
  totalMinutesMonth: number;
  hoursMonth: number;
  daysMonth: number;
  weekendsMonth: number;
  moneyCostMonth: number | null;
  isOneOff: boolean;
  totalHoursOneOff: number;
  totalDaysOneOff: number;
  totalWeekendsOneOff: number;
  moneyCostOneOff: number | null;
}

interface StoredData {
  inputs: TimeCostInputs;
  results: CalculationResults;
}

// Legacy interface for migration
interface LegacyInputs {
  commitmentName?: string;
  baseTimeMinutes?: string;
  hiddenTimeMinutes?: string;
  frequency?: Frequency;
  duration?: Duration;
  energyLevel?: EnergyLevel;
  hourlyValue?: string;
  showMoneyCost?: boolean;
}

const STORAGE_KEY = 'truecost.timeCost';
const SALARY_REALITY_KEY = 'truecost.salaryReality';

const DEFAULT_INPUTS: TimeCostInputs = {
  commitmentName: '',
  baseTimeValue: '1',
  baseTimeUnit: 'hours',
  hiddenTimeValue: '15',
  hiddenTimeUnit: 'minutes',
  frequency: 'weekly',
  duration: 'ongoing',
  energyLevel: 'medium',
  hourlyValue: '',
  showMoneyCost: false,
};

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
];

const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: '4weeks', label: '4 weeks' },
  { value: '8weeks', label: '8 weeks' },
  { value: '12weeks', label: '12 weeks' },
  { value: '6months', label: '6 months' },
  { value: 'ongoing', label: 'Ongoing' },
];

const TIME_UNIT_OPTIONS: { value: TimeUnit; label: string }[] = [
  { value: 'minutes', label: 'min' },
  { value: 'hours', label: 'hrs' },
  { value: 'days', label: 'days' },
];

const ENERGY_OPTIONS: { value: EnergyLevel; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'No recovery needed' },
  { value: 'medium', label: 'Medium', description: '+25% recovery time' },
  { value: 'heavy', label: 'Heavy', description: '+50% recovery time' },
];

// Recovery multipliers
const RECOVERY_MULTIPLIERS: Record<EnergyLevel, number> = {
  light: 0,
  medium: 0.25,
  heavy: 0.5,
};

// Monthly multipliers
const MONTHLY_MULTIPLIERS: Record<Frequency, number> = {
  weekly: 4.33,
  fortnightly: 2.165,
  monthly: 1,
  once: 1,
};

// Convert value + unit to minutes
function toMinutes(value: number, unit: TimeUnit): number {
  switch (unit) {
    case 'minutes': return value;
    case 'hours': return value * 60;
    case 'days': return value * 24 * 60;
  }
}

// Pure calculation function
function calculateResults(inputs: TimeCostInputs): CalculationResults {
  const parse = (val: string): number => {
    const num = parseFloat(val);
    return isNaN(num) || num < 0 ? 0 : num;
  };

  const baseTimeMinutes = toMinutes(parse(inputs.baseTimeValue), inputs.baseTimeUnit);
  const hiddenTimeMinutes = toMinutes(parse(inputs.hiddenTimeValue), inputs.hiddenTimeUnit);
  const hourlyValue = parse(inputs.hourlyValue);
  const recoveryMultiplier = RECOVERY_MULTIPLIERS[inputs.energyLevel];
  const monthlyMultiplier = MONTHLY_MULTIPLIERS[inputs.frequency];
  const isOneOff = inputs.frequency === 'once';

  const totalMinutesPerOccurrence = baseTimeMinutes + hiddenTimeMinutes;

  // For one-off, we calculate total hours once, not per month
  const timeMinutesMonth = isOneOff
    ? totalMinutesPerOccurrence
    : totalMinutesPerOccurrence * monthlyMultiplier;

  const recoveryMinutesMonth = timeMinutesMonth * recoveryMultiplier;
  const totalMinutesMonth = timeMinutesMonth + recoveryMinutesMonth;
  const hoursMonth = totalMinutesMonth / 60;
  const daysMonth = hoursMonth / 24;
  const weekendsMonth = hoursMonth / 16; // Assuming 16 waking hours in a weekend day

  const totalHoursOneOff = totalMinutesPerOccurrence * (1 + recoveryMultiplier) / 60;
  const totalDaysOneOff = totalHoursOneOff / 24;
  const totalWeekendsOneOff = totalHoursOneOff / 16;

  const moneyCostMonth = hourlyValue > 0 && inputs.showMoneyCost
    ? hoursMonth * hourlyValue
    : null;

  const moneyCostOneOff = hourlyValue > 0 && inputs.showMoneyCost
    ? totalHoursOneOff * hourlyValue
    : null;

  return {
    totalMinutesPerOccurrence,
    timeMinutesMonth,
    recoveryMinutesMonth,
    totalMinutesMonth,
    hoursMonth,
    daysMonth,
    weekendsMonth,
    moneyCostMonth,
    isOneOff,
    totalHoursOneOff,
    totalDaysOneOff,
    totalWeekendsOneOff,
    moneyCostOneOff,
  };
}

// Migrate legacy data to new format
function migrateLegacyData(data: LegacyInputs): TimeCostInputs {
  return {
    commitmentName: data.commitmentName ?? DEFAULT_INPUTS.commitmentName,
    baseTimeValue: data.baseTimeMinutes ?? DEFAULT_INPUTS.baseTimeValue,
    baseTimeUnit: 'minutes', // Legacy was always minutes
    hiddenTimeValue: data.hiddenTimeMinutes ?? DEFAULT_INPUTS.hiddenTimeValue,
    hiddenTimeUnit: 'minutes', // Legacy was always minutes
    frequency: data.frequency ?? DEFAULT_INPUTS.frequency,
    duration: data.duration ?? DEFAULT_INPUTS.duration,
    energyLevel: data.energyLevel ?? DEFAULT_INPUTS.energyLevel,
    hourlyValue: data.hourlyValue ?? DEFAULT_INPUTS.hourlyValue,
    showMoneyCost: data.showMoneyCost ?? DEFAULT_INPUTS.showMoneyCost,
  };
}

// Check if data is in legacy format
function isLegacyFormat(data: Record<string, unknown>): boolean {
  return 'baseTimeMinutes' in data || 'hiddenTimeMinutes' in data;
}

// Helper to load from localStorage with migration
function loadFromStorage(): { inputs: TimeCostInputs } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: StoredData = JSON.parse(stored);
      if (data.inputs) {
        // Check for legacy format and migrate
        if (isLegacyFormat(data.inputs as unknown as Record<string, unknown>)) {
          const migrated = migrateLegacyData(data.inputs as unknown as LegacyInputs);
          return { inputs: migrated };
        }
        return { inputs: data.inputs };
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

// Helper to save to localStorage
function saveToStorage(inputs: TimeCostInputs, results: CalculationResults): void {
  if (typeof window === 'undefined') return;
  try {
    const data: StoredData = { inputs, results };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors
  }
}

// Helper to load true hourly rate from Salary Reality
function loadTrueHourlyRate(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(SALARY_REALITY_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.results?.trueHourlyRate && data.results.trueHourlyRate > 0) {
        return data.results.trueHourlyRate;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

function formatHours(value: number): string {
  if (!isFinite(value)) return '–';
  if (value < 1) return `${Math.round(value * 60)} min`;
  return value.toFixed(1);
}

function formatDuration(hours: number): string {
  if (!isFinite(hours)) return '–';
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  if (hours < 24) return `${hours.toFixed(1)} hours`;
  const days = hours / 24;
  return `${days.toFixed(1)} days`;
}

// Hook to safely check if we're on the client
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// Duration multiplier helper
function getDurationMultiplier(duration: Duration): number {
  switch (duration) {
    case '4weeks': return 1;
    case '8weeks': return 2;
    case '12weeks': return 3;
    case '6months': return 6;
    case 'ongoing': return 0;
  }
}

function getDurationLabel(duration: Duration): string {
  switch (duration) {
    case '4weeks': return '4 weeks';
    case '8weeks': return '8 weeks';
    case '12weeks': return '12 weeks';
    case '6months': return '6 months';
    case 'ongoing': return 'ongoing';
  }
}

export default function TimeCost() {
  const isClient = useIsClient();
  const { currency, format: formatCurrency } = useCurrency();

  const [step, setStep] = useState<1 | 2>(1);
  const [inputs, setInputs] = useState<TimeCostInputs>(() => {
    const stored = loadFromStorage();
    return stored?.inputs ?? DEFAULT_INPUTS;
  });
  const [copied, setCopied] = useState(false);
  const [rateMessage, setRateMessage] = useState<string | null>(null);

  // Calculate results using useMemo
  const results = useMemo(() => calculateResults(inputs), [inputs]);

  // Save to localStorage when inputs change
  useEffect(() => {
    if (!isClient) return;
    saveToStorage(inputs, results);
  }, [inputs, results, isClient]);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setInputs(prev => ({ ...prev, [name]: checked }));
    } else {
      setInputs(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleReset = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    setStep(1);
    setRateMessage(null);
  }, []);

  const handleUseTrueRate = useCallback(() => {
    const rate = loadTrueHourlyRate();
    if (rate !== null) {
      setInputs(prev => ({
        ...prev,
        hourlyValue: rate.toFixed(2),
        showMoneyCost: true
      }));
      setRateMessage(null);
    } else {
      setRateMessage('No saved rate found. Calculate your true hourly rate in Salary Reality first.');
      setTimeout(() => setRateMessage(null), 4000);
    }
  }, []);

  const handleNext = useCallback(() => {
    setStep(2);
  }, []);

  const handleBack = useCallback(() => {
    setStep(1);
  }, []);

  const copyToClipboard = useCallback(async () => {
    const name = inputs.commitmentName || 'This commitment';
    const isOneOff = results.isOneOff;

    let summary = `${name}\n`;
    summary += `${'─'.repeat(name.length)}\n`;

    if (isOneOff) {
      summary += `Time cost: ${formatDuration(results.totalHoursOneOff)} (one-off)\n`;
      if (results.totalWeekendsOneOff >= 0.1) {
        summary += `That's about ${results.totalWeekendsOneOff.toFixed(1)} weekends\n`;
      }
    } else {
      summary += `Time cost: ${formatHours(results.hoursMonth)} hours/month\n`;
      summary += `That's about ${results.weekendsMonth.toFixed(1)} weekends/month\n`;
    }

    if (isOneOff && results.moneyCostOneOff !== null) {
      summary += `Opportunity cost: ${formatCurrency(results.moneyCostOneOff)} (one-off)\n`;
    } else if (!isOneOff && results.moneyCostMonth !== null) {
      summary += `Opportunity cost: ${formatCurrency(results.moneyCostMonth)}/month\n`;
    }

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API failed
    }
  }, [inputs, results, formatCurrency]);

  const isOneOff = inputs.frequency === 'once';

  // Show loading state during SSR/hydration
  if (!isClient) {
    return (
      <div className="px-6 py-12 md:py-16">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-accent">
            Time Cost Calculator
          </h1>
          <p className="text-zinc-400 mb-8">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:py-16">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-accent">
          Time Cost Calculator
        </h1>
        <p className="text-zinc-400 mb-6">
          If I say yes, what am I really agreeing to?
        </p>

        {/* Progress Indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-accent' : 'text-zinc-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step === 1 ? 'bg-accent text-background' : 'bg-zinc-700 text-zinc-400'
            }`}>1</span>
            <span className="text-sm font-medium">The Yes</span>
          </div>
          <div className="flex-1 h-px bg-zinc-700" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-accent' : 'text-zinc-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step === 2 ? 'bg-accent text-background' : 'bg-zinc-700 text-zinc-400'
            }`}>2</span>
            <span className="text-sm font-medium">The Cost</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            {/* Commitment Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">
                What are you considering?
              </label>
              <input
                type="text"
                name="commitmentName"
                value={inputs.commitmentName}
                onChange={handleInputChange}
                placeholder="e.g. Weekly team meeting"
                className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* Base Time with Unit */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">
                Base time
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="baseTimeValue"
                  value={inputs.baseTimeValue}
                  onChange={handleInputChange}
                  placeholder="1"
                  className="flex-1 px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <select
                  name="baseTimeUnit"
                  value={inputs.baseTimeUnit}
                  onChange={handleInputChange}
                  className="w-24 px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  {TIME_UNIT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Time for one occurrence</p>
            </div>

            {/* Hidden Time with Unit */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">
                Hidden time
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="hiddenTimeValue"
                  value={inputs.hiddenTimeValue}
                  onChange={handleInputChange}
                  placeholder="15"
                  className="flex-1 px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <select
                  name="hiddenTimeUnit"
                  value={inputs.hiddenTimeUnit}
                  onChange={handleInputChange}
                  className="w-24 px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  {TIME_UNIT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Prep, travel, follow-ups</p>
            </div>

            {/* Frequency & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-zinc-300">
                  Frequency
                </label>
                <select
                  name="frequency"
                  value={inputs.frequency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  {FREQUENCY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-zinc-300">
                  Duration
                </label>
                {isOneOff ? (
                  <div className="w-full px-3 py-2.5 bg-zinc-800 border border-card-border rounded-lg text-zinc-500 cursor-not-allowed">
                    Not applicable
                  </div>
                ) : (
                  <select
                    name="duration"
                    value={inputs.duration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors cursor-pointer"
                  >
                    {DURATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Energy Level */}
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">
                Energy drain
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ENERGY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setInputs(prev => ({ ...prev, energyLevel: opt.value }))}
                    className={`px-3 py-2 rounded-lg border transition-colors text-center ${
                      inputs.energyLevel === opt.value
                        ? 'bg-accent text-background border-accent font-medium'
                        : 'bg-background border-card-border text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    <span className="block text-sm">{opt.label}</span>
                    <span className={`block text-xs mt-0.5 ${
                      inputs.energyLevel === opt.value ? 'text-background/70' : 'text-zinc-500'
                    }`}>{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hourly Value */}
            <div className="border-t border-card-border pt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Your hourly value ({currency})
                </label>
                <button
                  type="button"
                  onClick={handleUseTrueRate}
                  className="text-xs text-accent hover:text-accent-dim transition-colors"
                >
                  Use my true hourly rate
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  name="hourlyValue"
                  value={inputs.hourlyValue}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">/hr</span>
              </div>
              {rateMessage && (
                <p className="text-xs text-amber-400 mt-2">{rateMessage}</p>
              )}

              {parseFloat(inputs.hourlyValue) > 0 && (
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="showMoneyCost"
                    checked={inputs.showMoneyCost}
                    onChange={handleInputChange}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <span className="text-sm text-zinc-400">Show opportunity cost in money</span>
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 px-4 py-3 bg-accent text-background font-medium rounded-lg hover:bg-accent-dim transition-colors"
              >
                See the cost
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 bg-background border border-card-border rounded-lg text-zinc-400 hover:text-foreground hover:border-zinc-500 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Results Card */}
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              <p className="text-sm text-zinc-500 mb-4">This yes quietly takes more than you think.</p>
              {/* Headline */}
              <div className="mb-6">
                {inputs.commitmentName && (
                  <p className="text-zinc-400 text-sm mb-2">{inputs.commitmentName}</p>
                )}
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {results.isOneOff ? (
                    <>This yes costs you <span className="text-accent">{formatDuration(results.totalHoursOneOff)}</span>.</>
                  ) : (
                    <>This yes costs you <span className="text-accent">{formatHours(results.hoursMonth)} hours</span> per month.</>
                  )}
                </h2>
                {results.isOneOff ? (
                  results.totalWeekendsOneOff >= 0.1 && (
                    <p className="text-zinc-400 mt-2">
                      That&apos;s about <span className="text-foreground font-medium">{results.totalWeekendsOneOff.toFixed(1)} weekends</span> of time.
                    </p>
                  )
                ) : (
                  <p className="text-zinc-400 mt-2">
                    That&apos;s about <span className="text-foreground font-medium">{results.weekendsMonth.toFixed(1)} weekends</span> a month.
                  </p>
                )}
              </div>

              {/* Money Cost */}
              {results.isOneOff && results.moneyCostOneOff !== null && (
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 mb-6">
                  <p className="text-lg">
                    At your rate, that&apos;s <span className="font-semibold text-accent">{formatCurrency(results.moneyCostOneOff)}</span>.
                  </p>
                </div>
              )}
              {!results.isOneOff && results.moneyCostMonth !== null && (
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 mb-6">
                  <p className="text-lg">
                    At your rate, that&apos;s <span className="font-semibold text-accent">≈ {formatCurrency(results.moneyCostMonth)}</span> per month.
                  </p>
                </div>
              )}

              {/* Breakdown */}
              <div className="border-t border-card-border pt-4">
                <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Base + hidden time</span>
                    <span className="text-foreground">
                      {results.isOneOff
                        ? formatDuration(results.totalMinutesPerOccurrence / 60)
                        : `${formatHours(results.timeMinutesMonth / 60)} hrs/month`
                      }
                    </span>
                  </div>
                  {results.recoveryMinutesMonth > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Recovery time</span>
                      <span className="text-foreground">
                        {results.isOneOff
                          ? formatDuration((results.totalMinutesPerOccurrence * RECOVERY_MULTIPLIERS[inputs.energyLevel]) / 60)
                          : `${formatHours(results.recoveryMinutesMonth / 60)} hrs/month`
                        }
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-card-border font-medium">
                    <span className="text-zinc-300">Total</span>
                    <span className="text-accent">
                      {results.isOneOff
                        ? formatDuration(results.totalHoursOneOff)
                        : `${formatHours(results.hoursMonth)} hrs/month`
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Duration context for recurring commitments */}
              {!results.isOneOff && inputs.duration !== 'ongoing' && (
                <div className="mt-4 pt-4 border-t border-card-border">
                  <p className="text-sm text-zinc-500">
                    Over {getDurationLabel(inputs.duration)}, this is approximately{' '}
                    <span className="text-foreground font-medium">
                      {formatHours(results.hoursMonth * getDurationMultiplier(inputs.duration))} total hours
                    </span>
                    {results.moneyCostMonth !== null && (
                      <> or <span className="text-foreground font-medium">
                        {formatCurrency(results.moneyCostMonth * getDurationMultiplier(inputs.duration))}
                      </span></>
                    )}.
                  </p>
                </div>
              )}

              <DailyNote calculatorId={1} />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-3 bg-background border border-card-border rounded-lg text-zinc-400 hover:text-foreground hover:border-zinc-500 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex-1 px-4 py-3 bg-accent text-background font-medium rounded-lg hover:bg-accent-dim transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Summary'}
              </button>
            </div>

            {/* New Scenario */}
            <button
              type="button"
              onClick={handleReset}
              className="w-full px-4 py-3 bg-background border border-card-border rounded-lg text-zinc-400 hover:text-foreground hover:border-zinc-500 transition-colors"
            >
              New scenario
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
