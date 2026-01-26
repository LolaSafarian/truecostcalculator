'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';

// Types
type CategoryKey = 'adminDrag' | 'scheduleOverload' | 'environmentFriction' | 'peopleDrain' | 'healthDrag' | 'digitalNoise';

interface FrictionInputs {
  adminDrag: number;
  scheduleOverload: number;
  environmentFriction: number;
  peopleDrain: number;
  healthDrag: number;
  digitalNoise: number;
  dailyMinutesLost: number;
}

interface CategoryBreakdown {
  key: CategoryKey;
  label: string;
  score: number;
  minutesPerDay: number;
  minutesPerWeek: number;
}

interface CalculationResults {
  categoryBreakdowns: CategoryBreakdown[];
  highestCategory: CategoryKey;
  highestCategoryLabel: string;
  leverageCategory: CategoryKey;
  leverageCategoryLabel: string;
  nextMove: string;
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
  key: CategoryKey;
  label: string;
}[] = [
  { key: 'adminDrag', label: 'Admin drag' },
  { key: 'scheduleOverload', label: 'Schedule overload' },
  { key: 'environmentFriction', label: 'Environment friction' },
  { key: 'peopleDrain', label: 'People drain' },
  { key: 'healthDrag', label: 'Health drag' },
  { key: 'digitalNoise', label: 'Digital noise' },
];

// Categories that are more actionable (preferred for leverage)
const ACTIONABLE_CATEGORIES: CategoryKey[] = [
  'adminDrag',
  'scheduleOverload',
  'environmentFriction',
  'digitalNoise',
];

// Next move suggestions by category - calm, grounded, no exclamation marks
const NEXT_MOVES: Record<CategoryKey, string> = {
  adminDrag: 'Pick one recurring task that drains you and see if it can be automated, batched, or let go.',
  scheduleOverload: 'Look at this week and find one commitment you can decline, delay, or shorten.',
  environmentFriction: 'Identify one thing in your space that bothers you daily and spend ten minutes on it.',
  peopleDrain: 'Notice which interactions leave you emptier and consider what boundary would help.',
  healthDrag: 'Choose the smallest health-related thing you have been putting off and do just that.',
  digitalNoise: 'Turn off notifications for one app that interrupts you most often.',
};

// Pure calculation function
function calculateResults(inputs: FrictionInputs): CalculationResults {
  const categories = FRICTION_CATEGORIES.map(({ key, label }) => ({
    key,
    label,
    score: inputs[key],
  }));

  // Calculate total score for proportional allocation
  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);

  // Allocate daily minutes proportionally across categories
  const categoryBreakdowns: CategoryBreakdown[] = categories.map(({ key, label, score }) => {
    const proportion = totalScore > 0 ? score / totalScore : 0;
    const minutesPerDay = inputs.dailyMinutesLost * proportion;
    return {
      key,
      label,
      score,
      minutesPerDay,
      minutesPerWeek: minutesPerDay * 7,
    };
  });

  // Find highest friction category
  const highest = categoryBreakdowns.reduce((max, curr) =>
    curr.score > max.score ? curr : max
  );

  // Find best leverage category
  // Prefer actionable categories, only choose people/health if clearly dominant
  const actionableBreakdowns = categoryBreakdowns.filter(c =>
    ACTIONABLE_CATEGORIES.includes(c.key)
  );
  const nonActionableBreakdowns = categoryBreakdowns.filter(c =>
    !ACTIONABLE_CATEGORIES.includes(c.key)
  );

  const highestActionable = actionableBreakdowns.reduce((max, curr) =>
    curr.score > max.score ? curr : max
  , { key: 'adminDrag' as CategoryKey, label: '', score: 0, minutesPerDay: 0, minutesPerWeek: 0 });

  const highestNonActionable = nonActionableBreakdowns.reduce((max, curr) =>
    curr.score > max.score ? curr : max
  , { key: 'peopleDrain' as CategoryKey, label: '', score: 0, minutesPerDay: 0, minutesPerWeek: 0 });

  // Only choose non-actionable if it's clearly dominant (at least 3 points higher)
  let leverage: CategoryBreakdown;
  if (highestNonActionable.score >= highestActionable.score + 3) {
    leverage = highestNonActionable;
  } else {
    leverage = highestActionable;
  }

  return {
    categoryBreakdowns,
    highestCategory: highest.key,
    highestCategoryLabel: highest.label,
    leverageCategory: leverage.key,
    leverageCategoryLabel: leverage.label,
    nextMove: NEXT_MOVES[leverage.key],
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
          <h2 className="text-lg font-semibold mb-4 text-zinc-200">Estimated minutes lost per day</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Based on your {inputs.dailyMinutesLost} minutes, allocated by friction scores.
          </p>

          {/* Category breakdown */}
          <div className="space-y-3 mb-6">
            {results.categoryBreakdowns.map((category) => (
              <div key={category.key} className="flex justify-between items-baseline">
                <span className="text-zinc-400">{category.label}</span>
                <span className="text-foreground">
                  <span className="font-medium">{Math.round(category.minutesPerDay)}</span>
                  <span className="text-zinc-500 text-sm"> min/day</span>
                  <span className="text-zinc-600 text-sm ml-2">({Math.round(category.minutesPerWeek)} min/week)</span>
                </span>
              </div>
            ))}
          </div>

          {/* Highest friction */}
          <div className="border-t border-card-border pt-4 mb-4">
            <p className="text-zinc-400">
              Highest friction: <span className="text-foreground font-medium">{results.highestCategoryLabel}</span>
            </p>
          </div>

          {/* Best leverage */}
          <div className="border-t border-card-border pt-4 mb-4">
            <p className="text-zinc-400">
              Best leverage: <span className="text-accent font-medium">{results.leverageCategoryLabel}</span>
            </p>
          </div>

          {/* Next move */}
          <div className="border-t border-card-border pt-4">
            <p className="text-sm text-zinc-500 mb-2">Next move</p>
            <p className="text-zinc-300">{results.nextMove}</p>
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
