'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useCurrency } from '../components/CurrencyProvider';
import DailyNote from '../components/DailyNote';

// Types
interface SalaryInputs {
  payType: 'annual' | 'hourly';
  annualSalary: string;
  hourlyRate: string;
  paidHoursWeek: string;
  contractHoursWeek: string;
  actualHoursWeek: string;
  commuteMinutesDay: string;
  commuteDaysWeek: string;
  afterHoursMinutesDay: string;
  afterHoursDaysWeek: string;
  monthlyWorkExpenses: string;
  childcareCostWeek: string;
  recoveryHoursWeek: number;
}

interface CalculationResults {
  commuteHoursWeek: number;
  afterHoursWeek: number;
  totalWorkTimeWeek: number;
  grossPayWeek: number;
  costsWeek: number;
  netAfterCostsWeek: number;
  trueHourlyRate: number;
  donatedOvertimeHours: number;
  onPaperHourly: number;
}

interface StoredData {
  inputs: SalaryInputs;
  results: CalculationResults;
  savedAsDefault: boolean;
}

const STORAGE_KEY = 'truecost.salaryReality';

const DEFAULT_INPUTS: SalaryInputs = {
  payType: 'annual',
  annualSalary: '75000',
  hourlyRate: '35',
  paidHoursWeek: '38',
  contractHoursWeek: '38',
  actualHoursWeek: '45',
  commuteMinutesDay: '30',
  commuteDaysWeek: '5',
  afterHoursMinutesDay: '30',
  afterHoursDaysWeek: '3',
  monthlyWorkExpenses: '200',
  childcareCostWeek: '',
  recoveryHoursWeek: 2,
};

// Pure calculation function
function calculateResults(inputs: SalaryInputs): CalculationResults {
  const parse = (val: string): number => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const annualSalary = parse(inputs.annualSalary);
  const hourlyRate = parse(inputs.hourlyRate);
  const paidHoursWeek = parse(inputs.paidHoursWeek);
  const contractHoursWeek = parse(inputs.contractHoursWeek);
  const actualHoursWeek = parse(inputs.actualHoursWeek);
  const commuteMinutesDay = parse(inputs.commuteMinutesDay);
  const commuteDaysWeek = parse(inputs.commuteDaysWeek);
  const afterHoursMinutesDay = parse(inputs.afterHoursMinutesDay);
  const afterHoursDaysWeek = parse(inputs.afterHoursDaysWeek);
  const monthlyWorkExpenses = parse(inputs.monthlyWorkExpenses);
  const childcareCostWeek = parse(inputs.childcareCostWeek);
  const recoveryHoursWeek = inputs.recoveryHoursWeek;

  // Calculated values
  const commuteHoursWeek = (commuteMinutesDay * commuteDaysWeek) / 60;
  const afterHoursWeek = (afterHoursMinutesDay * afterHoursDaysWeek) / 60;
  const totalWorkTimeWeek = actualHoursWeek + commuteHoursWeek + afterHoursWeek + recoveryHoursWeek;

  const grossPayWeek = inputs.payType === 'annual'
    ? annualSalary / 52
    : hourlyRate * paidHoursWeek;

  const costsWeek = (monthlyWorkExpenses * 12 / 52) + childcareCostWeek;
  const netAfterCostsWeek = grossPayWeek - costsWeek;
  const trueHourlyRate = netAfterCostsWeek / Math.max(totalWorkTimeWeek, 0.1);
  const donatedOvertimeHours = Math.max(0, actualHoursWeek - contractHoursWeek);

  const onPaperHourly = inputs.payType === 'annual'
    ? (annualSalary / 52) / Math.max(contractHoursWeek, 0.1)
    : hourlyRate;

  return {
    commuteHoursWeek,
    afterHoursWeek,
    totalWorkTimeWeek,
    grossPayWeek,
    costsWeek,
    netAfterCostsWeek,
    trueHourlyRate,
    donatedOvertimeHours,
    onPaperHourly,
  };
}

function formatHours(value: number): string {
  if (!isFinite(value)) return '–';
  return value.toFixed(1);
}

// Helper to load from localStorage
function loadFromStorage(): { inputs: SalaryInputs; savedAsDefault: boolean } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: StoredData = JSON.parse(stored);
      if (data.inputs) {
        return { inputs: data.inputs, savedAsDefault: data.savedAsDefault ?? false };
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

// Helper to save to localStorage
function saveToStorage(inputs: SalaryInputs, results: CalculationResults, savedAsDefault: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const data: StoredData = { inputs, results, savedAsDefault };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors
  }
}

// NumberInput component - defined outside to avoid re-creation on each render
function NumberInput({
  label,
  name,
  value,
  placeholder,
  suffix,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  suffix?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1.5 text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder ?? '0'}
          className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// Hook to safely check if we're on the client
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function SalaryReality() {
  const isClient = useIsClient();
  const { currency, format: formatCurrency } = useCurrency();

  // Initialize state with localStorage data if available (client-side only)
  const [inputs, setInputs] = useState<SalaryInputs>(() => {
    const stored = loadFromStorage();
    return stored?.inputs ?? DEFAULT_INPUTS;
  });

  const [savedAsDefault, setSavedAsDefault] = useState(() => {
    const stored = loadFromStorage();
    return stored?.savedAsDefault ?? false;
  });

  const [copied, setCopied] = useState(false);

  // Calculate results using useMemo
  const results = useMemo(() => calculateResults(inputs), [inputs]);

  // Save to localStorage when inputs or savedAsDefault changes (client-side only)
  useEffect(() => {
    if (!isClient) return;
    saveToStorage(inputs, results, savedAsDefault);
  }, [inputs, results, savedAsDefault, isClient]);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  }, []);

  const handlePayTypeChange = useCallback((payType: 'annual' | 'hourly') => {
    setInputs(prev => ({ ...prev, payType }));
  }, []);

  const handleSliderChange = useCallback((value: number) => {
    setInputs(prev => ({ ...prev, recoveryHoursWeek: value }));
  }, []);

  const handleReset = useCallback(() => {
    if (!savedAsDefault) {
      setInputs(DEFAULT_INPUTS);
    }
    // If savedAsDefault is true, we keep current values (they are already the "default")
  }, [savedAsDefault]);

  const handleSaveAsDefaultToggle = useCallback(() => {
    setSavedAsDefault(prev => !prev);
  }, []);

  const copyToClipboard = useCallback(async () => {
    const summary = `Salary Reality Summary
----------------------
Pay Type: ${inputs.payType === 'annual' ? 'Annual Salary' : 'Hourly Rate'}
${inputs.payType === 'annual'
  ? `Annual Salary: ${formatCurrency(parseFloat(inputs.annualSalary) || 0)}`
  : `Hourly Rate: ${formatCurrency(parseFloat(inputs.hourlyRate) || 0)}/hr`}

Total Time Consumed: ${formatHours(results.totalWorkTimeWeek)} hours/week
True Hourly Rate: ${formatCurrency(results.trueHourlyRate)}/hr
On-Paper Hourly: ${formatCurrency(results.onPaperHourly)}/hr
Donated Overtime: ${formatHours(results.donatedOvertimeHours)} hours/week

On paper: ${formatCurrency(results.onPaperHourly)}/hr. In reality: ${formatCurrency(results.trueHourlyRate)}/hr.`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API failed
    }
  }, [inputs, results, formatCurrency]);

  // Show loading state during SSR/hydration
  if (!isClient) {
    return (
      <div className="px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-accent">
            Salary Reality Calculator
          </h1>
          <p className="text-zinc-400 mb-8">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-accent">
          Salary Reality Calculator
        </h1>
        <p className="text-zinc-400 mb-8">
          Discover what your salary really means when you account for all your work-related time and expenses.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs Panel */}
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Inputs</h2>

            {/* Pay Type Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-zinc-300">
                Pay Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePayTypeChange('annual')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    inputs.payType === 'annual'
                      ? 'bg-accent text-background border-accent font-medium'
                      : 'bg-background border-card-border text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  Annual Salary
                </button>
                <button
                  type="button"
                  onClick={() => handlePayTypeChange('hourly')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    inputs.payType === 'hourly'
                      ? 'bg-accent text-background border-accent font-medium'
                      : 'bg-background border-card-border text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  Hourly Rate
                </button>
              </div>
            </div>

            {/* Salary / Hourly inputs */}
            {inputs.payType === 'annual' ? (
              <NumberInput
                label={`Annual Salary (${currency})`}
                name="annualSalary"
                value={inputs.annualSalary}
                placeholder="75000"
                suffix={currency}
                onChange={handleInputChange}
              />
            ) : (
              <>
                <NumberInput
                  label={`Hourly Rate (${currency})`}
                  name="hourlyRate"
                  value={inputs.hourlyRate}
                  placeholder="35"
                  suffix="/hr"
                  onChange={handleInputChange}
                />
                <NumberInput
                  label="Paid Hours per Week"
                  name="paidHoursWeek"
                  value={inputs.paidHoursWeek}
                  placeholder="38"
                  suffix="hrs"
                  onChange={handleInputChange}
                />
              </>
            )}

            {/* Work Hours */}
            <div className="border-t border-card-border pt-4 mt-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">Work Hours</h3>
              <NumberInput
                label="Contract Hours per Week"
                name="contractHoursWeek"
                value={inputs.contractHoursWeek}
                placeholder="38"
                suffix="hrs"
                onChange={handleInputChange}
              />
              <NumberInput
                label="Actual Hours Worked per Week"
                name="actualHoursWeek"
                value={inputs.actualHoursWeek}
                placeholder="45"
                suffix="hrs"
                onChange={handleInputChange}
              />
            </div>

            {/* Commute */}
            <div className="border-t border-card-border pt-4 mt-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">Commute</h3>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="Minutes per Day"
                  name="commuteMinutesDay"
                  value={inputs.commuteMinutesDay}
                  placeholder="30"
                  suffix="min"
                  onChange={handleInputChange}
                />
                <NumberInput
                  label="Days per Week"
                  name="commuteDaysWeek"
                  value={inputs.commuteDaysWeek}
                  placeholder="5"
                  suffix="days"
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* After Hours Work */}
            <div className="border-t border-card-border pt-4 mt-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">After Hours Work</h3>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="Minutes per Day"
                  name="afterHoursMinutesDay"
                  value={inputs.afterHoursMinutesDay}
                  placeholder="30"
                  suffix="min"
                  onChange={handleInputChange}
                />
                <NumberInput
                  label="Days per Week"
                  name="afterHoursDaysWeek"
                  value={inputs.afterHoursDaysWeek}
                  placeholder="3"
                  suffix="days"
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Expenses */}
            <div className="border-t border-card-border pt-4 mt-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">Work Expenses</h3>
              <NumberInput
                label={`Monthly Work Expenses (${currency})`}
                name="monthlyWorkExpenses"
                value={inputs.monthlyWorkExpenses}
                placeholder="200"
                suffix={currency}
                onChange={handleInputChange}
              />
              <NumberInput
                label={`Childcare Cost per Week (${currency}, optional)`}
                name="childcareCostWeek"
                value={inputs.childcareCostWeek}
                placeholder="0"
                suffix={currency}
                onChange={handleInputChange}
              />
            </div>

            {/* Recovery Time */}
            <div className="border-t border-card-border pt-4 mt-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">Recovery Time</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-zinc-300">
                  Recovery Hours per Week: <span className="text-accent">{inputs.recoveryHoursWeek}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={inputs.recoveryHoursWeek}
                  onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>0 hrs</span>
                  <span>10 hrs</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-card-border pt-4 mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-background border border-card-border rounded-lg text-zinc-400 hover:text-foreground hover:border-zinc-500 transition-colors"
              >
                Reset
              </button>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={savedAsDefault}
                  onChange={handleSaveAsDefaultToggle}
                  className="w-4 h-4 accent-accent rounded"
                />
                <span className="text-sm text-zinc-400">Save as default</span>
              </label>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Results</h2>

            {/* Big Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-background border border-card-border">
                <p className="text-zinc-500 text-sm mb-1">True Hourly Rate</p>
                <p className="text-3xl font-bold text-accent">
                  {formatCurrency(results.trueHourlyRate)}
                  <span className="text-lg text-zinc-400 font-normal">/hr</span>
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background border border-card-border">
                <p className="text-zinc-500 text-sm mb-1">Total Time Consumed</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatHours(results.totalWorkTimeWeek)}
                  <span className="text-lg text-zinc-400 font-normal"> hrs/week</span>
                </p>
              </div>
            </div>

            {/* Donated Overtime */}
            <div className="p-4 rounded-lg bg-background border border-card-border mb-6">
              <p className="text-zinc-500 text-sm mb-1">Donated Overtime</p>
              <p className="text-2xl font-semibold text-foreground">
                {formatHours(results.donatedOvertimeHours)}
                <span className="text-base text-zinc-400 font-normal"> hrs/week</span>
              </p>
              {results.donatedOvertimeHours > 0 && (
                <p className="text-sm text-zinc-500 mt-1">
                  That&apos;s {formatHours(results.donatedOvertimeHours * 52)} hours per year of unpaid work.
                </p>
              )}
            </div>

            {/* Comparison Line */}
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 mb-6">
              <p className="text-lg">
                <span className="text-zinc-400">On paper: </span>
                <span className="font-semibold text-foreground">{formatCurrency(results.onPaperHourly)}/hr</span>
                <span className="text-zinc-400"> &rarr; In reality: </span>
                <span className="font-semibold text-accent">{formatCurrency(results.trueHourlyRate)}/hr</span>
              </p>
              {results.onPaperHourly > 0 && (
                <p className="text-sm text-zinc-500 mt-2">
                  {results.trueHourlyRate < results.onPaperHourly
                    ? `You are earning ${((1 - results.trueHourlyRate / results.onPaperHourly) * 100).toFixed(0)}% less than it appears.`
                    : `Your true rate matches your on-paper rate.`}
                </p>
              )}
            </div>

            {/* Breakdown */}
            <div className="border-t border-card-border pt-4 mt-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">Time Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Actual work hours</span>
                  <span className="text-foreground">{formatHours(parseFloat(inputs.actualHoursWeek) || 0)} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Commute time</span>
                  <span className="text-foreground">{formatHours(results.commuteHoursWeek)} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">After hours work</span>
                  <span className="text-foreground">{formatHours(results.afterHoursWeek)} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Recovery time</span>
                  <span className="text-foreground">{formatHours(inputs.recoveryHoursWeek)} hrs</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-card-border font-medium">
                  <span className="text-zinc-300">Total</span>
                  <span className="text-accent">{formatHours(results.totalWorkTimeWeek)} hrs</span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-card-border pt-4 mt-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">Weekly Financials</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Gross pay</span>
                  <span className="text-foreground">{formatCurrency(results.grossPayWeek)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Work expenses</span>
                  <span className="text-red-400">-{formatCurrency(results.costsWeek)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-card-border font-medium">
                  <span className="text-zinc-300">Net after costs</span>
                  <span className="text-accent">{formatCurrency(results.netAfterCostsWeek)}</span>
                </div>
              </div>
            </div>

            {/* Copy Summary Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={copyToClipboard}
                className="w-full px-4 py-2.5 bg-accent text-background font-medium rounded-lg hover:bg-accent-dim transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Summary'}
              </button>
            </div>

            <DailyNote calculatorId={1} />
          </div>
        </div>
      </div>
    </div>
  );
}
