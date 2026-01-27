'use client';

import { useState, useEffect } from 'react';
import { getDailyNote } from '../lib/dailyNotes';

export default function DailyNote({ calculatorId }: { calculatorId: number }) {
  const [note, setNote] = useState('');

  useEffect(() => {
    setNote(getDailyNote(calculatorId));
  }, [calculatorId]);

  if (!note) return null;

  return (
    <p className="text-xs text-zinc-600 mt-4">{note}</p>
  );
}
