'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';

// Types
interface FrictionInputs {
  adminDrag: number;
  scheduleOverload: number;
  environmentFriction: number;
  peopleDrain: number;
  healthDrag: number;
  digitalNoise: number;
  dailyMinutesLost: number;
}

interface CalculationResults {
  frictionScore: number;
  yearlyHoursLost: number;
  yearlyDaysLost: number;
  highestCategory: keyof Omit<FrictionInputs, 'dailyMinutesLost'>;
  highestCategoryLabel: string;
}

interface StoredData {
  inputs: FrictionInputs;
  results: CalculationResults;
}

const STORAGE_KEY = 'truecost.lifeFriction';

const DEFAULT_INPUTS: FrictionInputs = {
  adminDrag: 3,
  scheduleOverload: 4,
  environmentFriction: 2,
  peopleDrain: 3,
  healthDrag: 2,
  digitalNoise: 5,
  dailyMinutesLost: 45,
};

const FRICTION_CATEGORIES: {
  key: keyof Omit<FrictionInputs, 'dailyMinutesLost'>;
  label: string;
  insight: string;
}[] = [
  {
    key: 'adminDrag',
    label: 'Admin drag',
    insight: 'The small tasks keep piling up, each one feeling heavier than it should.',
  },
  {
    key: 'scheduleOverload',
    label: 'Schedule overload',
    insight: 'There is always somewhere to be, and rarely time to just be.',
  },
  {
    key: 'environmentFriction',
    label: 'Environment friction',
    insight: 'The space around you is asking for something you have not had time to give.',
  },
  {
    key: 'peopleDrain',
    label: 'People drain',
    insight: 'Some relationships take more than they return, and you feel the difference.',
  },
  {
    key: 'healthDrag',
    label: 'Health drag',
    insight: 'Your body has been keeping score of what you have been putting off.',
  },
  {
    key: 'digitalNoise',
    label: 'Digital noise',
    insight: 'The notifications never stop, and neither does the low hum of being always reachable.',
  },
];

// Pure calculation function
function calculateResults(inputs: FrictionInputs): CalculationResults {
  const frictionValues = [
    inputs.adminDrag,
    inputs.scheduleOverload,
    inputs.environmentFriction,
    inputs.peopleDrain,
    inputs.healthDrag,
    inputs.digitalNoise,
  ];

  const frictionScore = frictionValues.reduce((a, b) => a + b, 0) / frictionValues.length;
  const yearlyHoursLost = (inputs.dailyMinutesLost * 365) / 60;
  const yearlyDaysLost = yearlyHoursLost / 24;

  // Find highest friction category
  const categoryValues: { key: keyof Omit<FrictionInputs, 'dailyMinutesLost'>; value: number }[] = [
    { key: 'adminDrag', value: inputs.adminDrag },
    { key: 'scheduleOverload', value: inputs.scheduleOverload },
    { key: 'environmentFriction', value: inputs.environmentFriction },
    { key: 'peopleDrain', value: inputs.peopleDrain },
    { key: 'healthDrag', value: inputs.healthDrag },
    { key: 'digitalNoise', value: inputs.digitalNoise },
  ];

  const highest = categoryValues.reduce((max, curr) =>
    curr.value > max.value ? curr : max
  );

  const highestCategoryLabel = FRICTION_CATEGORIES.find(c => c.key === highest.key)?.label ?? '';

  return {
    frictionScore,
    yearlyHoursLost,
    yearlyDaysLost,
    highestCategory: highest.key,
    highestCategoryLabel,
  };
}

// Helper to load from localStorage
function loadFromStorage(): FrictionInputs | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: StoredData = JSON.parse(stored);
      if (data.inputs) {
        return data.inputs;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

// Helper to save to localStorage
function saveToStorage(inputs: FrictionInputs, results: CalculationResults): void {
  if (typeof window === 'undefined') return;
  try {
    const data: StoredData = { inputs, results };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

// Slider component
function FrictionSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-sm font-medium text-zinc-300">{label}</label>
        <span className="text-sm text-zinc-500">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 bg-card-border rounded-lg appearance-none cursor-pointer accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
      />
      <p className="text-xs text-zinc-600 mt-1">0 = no friction · 10 = constant resistance</p>
    </div>
  );
}

export default function LifeFriction() {
  const isClient = useIsClient();

  // Initialize state with localStorage data if available
  const [inputs, setInputs] = useState<FrictionInputs>(() => {
    const stored = loadFromStorage();
    return stored ?? DEFAULT_INPUTS;
  });

  // Calculate results
  const results = useMemo(() => calculateResults(inputs), [inputs]);

  // Get insight for highest category
  const insight = useMemo(() => {
    return FRICTION_CATEGORIES.find(c => c.key === results.highestCategory)?.insight ?? '';
  }, [results.highestCategory]);

  // Save to localStorage when inputs change
  useEffect(() => {
    if (isClient) {
      saveToStorage(inputs, results);
    }
  }, [inputs, results, isClient]);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    if (isClient) {
      const stored = loadFromStorage();
      if (stored) {
        setInputs(stored);
      }
    }
  }, [isClient]);

  const handleSliderChange = useCallback((key: keyof FrictionInputs, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
  }, []);

  // Format numbers for display
  const formatScore = (value: number): string => value.toFixed(1);
  const formatHours = (value: number): string => Math.round(value).toLocaleString();
  const formatDays = (value: number): string => value.toFixed(1);

  return (
    <div className="px-6 py-12 md:py-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Life Friction Calculator
          </h1>
          <p className="text-zinc-500">
            Small, constant sources of resistance add up. This helps you see where.
          </p>
        </div>

        {/* Friction Sliders */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-6 text-zinc-200">Sources of friction</h2>

          {FRICTION_CATEGORIES.map(({ key, label }) => (
            <FrictionSlider
              key={key}
              label={label}
              value={inputs[key]}
              onChange={(value) => handleSliderChange(key, value)}
            />
          ))}
        </div>

        {/* Time Lost Slider */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-6">
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-sm font-medium text-zinc-300">
                How much time do these frictions quietly cost you each day?
              </label>
              <span className="text-sm text-zinc-500">{inputs.dailyMinutesLost} min</span>
            </div>
            <input
              type="range"
              min={0}
              max={300}
              value={inputs.dailyMinutesLost}
              onChange={(e) => handleSliderChange('dailyMinutesLost', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-card-border rounded-lg appearance-none cursor-pointer accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
            <p className="text-xs text-zinc-600 mt-1">This does not need to be precise. Your best guess is enough.</p>
          </div>
        </div>

        {/* Results */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-6">
          <p className="text-sm text-zinc-500 mb-4">This is what constant friction costs.</p>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-baseline">
              <span className="text-zinc-400">Friction score</span>
              <span className="text-2xl font-semibold text-foreground">
                {formatScore(results.frictionScore)} <span className="text-base text-zinc-500">/ 10</span>
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-zinc-400">Hours lost per year</span>
              <span className="text-2xl font-semibold text-foreground">
                {formatHours(results.yearlyHoursLost)}
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-zinc-400">Equivalent days lost</span>
              <span className="text-2xl font-semibold text-foreground">
                {formatDays(results.yearlyDaysLost)}
              </span>
            </div>
          </div>

          <div className="border-t border-card-border pt-4">
            <p className="text-zinc-400 mb-2">
              Your biggest source of friction right now is: <span className="text-foreground font-medium">{results.highestCategoryLabel}</span>
            </p>
            <p className="text-sm text-zinc-500 italic">{insight}</p>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
