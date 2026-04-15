import React from 'react';

const STATES = {
  idle: { label: '대기중', color: 'bg-neutral-600' },
  listening: { label: '듣는중', color: 'bg-emerald-600' },
  translating: { label: '번역중', color: 'bg-blue-600' },
  error: { label: '오류', color: 'bg-red-600' },
};

export default function StatusBadge({ state }) {
  const s = STATES[state] || STATES.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white ${s.color}`}>
      <span className="h-2 w-2 rounded-full bg-white/80 animate-pulse" />
      {s.label}
    </span>
  );
}
