import React from 'react';

const STATES = {
  idle:        { label: 'IDLE', color: '#8A8A93', bg: 'rgba(138,138,147,0.12)' },
  listening:   { label: 'LIVE', color: '#B4FF39', bg: 'rgba(180,255,57,0.14)' },
  translating: { label: 'SYNC', color: '#00E5FF', bg: 'rgba(0,229,255,0.14)' },
  error:       { label: 'FAULT', color: '#FF4D6D', bg: 'rgba(255,77,109,0.18)' },
};

export default function StatusBadge({ state }) {
  const s = STATES[state] || STATES.idle;
  const isActive = state === 'listening' || state === 'translating';

  return (
    <div
      className="text-hud inline-flex items-center gap-2 rounded-full px-2.5 py-1"
      style={{
        fontSize: '10px',
        color: s.color,
        background: s.bg,
        boxShadow: isActive ? `inset 0 0 0 1px ${s.color}40` : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        transition: 'all 260ms ease',
      }}
    >
      {state === 'translating' ? (
        <span
          className="inline-block w-2.5 h-2.5 rounded-full border-2 animate-spin"
          style={{ borderColor: `${s.color}55`, borderTopColor: s.color }}
        />
      ) : (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${isActive ? 'animate-pulse' : ''}`}
          style={{ background: s.color, boxShadow: isActive ? `0 0 8px ${s.color}` : 'none' }}
        />
      )}
      <span className="flex items-center gap-0.5">
        {s.label}
      </span>
      {isActive && (
        <span className="flex items-end gap-[2px] h-3 ml-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-[2px] animate-sparkleDot"
              style={{
                height: '100%',
                background: s.color,
                animationDelay: `${i * 120}ms`,
                transformOrigin: 'bottom',
              }}
            />
          ))}
        </span>
      )}
    </div>
  );
}
