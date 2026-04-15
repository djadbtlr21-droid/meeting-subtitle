import React from 'react';

export default function SubtitleOverlay({ original, translation, interim, fontScale, listening }) {
  const base = 17;
  const originalSize = base * fontScale;
  const translationSize = base * 1.55 * fontScale;

  const isInterimOnly = !original && !!interim;
  const displayedOriginal = original || interim || '';
  const hasContent = Boolean(original || interim || translation);

  const accentColor = listening ? '#B4FF39' : '#00E5FF';
  const accentGlow = listening ? 'rgba(180,255,57,0.55)' : 'rgba(0,229,255,0.45)';

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-28 sm:pb-32 flex justify-center">
      <div
        className="glass relative w-full max-w-3xl rounded-[28px] px-6 py-5 text-center overflow-hidden"
        style={{
          transition: 'box-shadow 400ms ease',
        }}
      >
        <span
          aria-hidden
          className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full"
          style={{
            background: accentColor,
            boxShadow: `0 0 10px ${accentGlow}`,
            transition: 'background 300ms ease, box-shadow 300ms ease',
          }}
        />

        <div className="flex items-center justify-center gap-2 mb-2 text-hud text-white/40" style={{ fontSize: '9px' }}>
          <span
            className="inline-block w-1 h-1 rounded-full"
            style={{ background: accentColor, boxShadow: `0 0 6px ${accentGlow}` }}
          />
          TRANSCRIPT
        </div>

        <div
          key={`orig-${displayedOriginal}`}
          className={`mx-auto leading-snug animate-fadeInUp ${isInterimOnly ? 'italic' : ''}`}
          style={{
            fontSize: `${originalSize}px`,
            color: isInterimOnly ? 'rgba(245,247,250,0.55)' : 'rgba(245,247,250,0.78)',
          }}
        >
          {displayedOriginal || (hasContent ? '\u00a0' : '준비됨 · READY')}
        </div>

        <div
          key={`trans-${translation}`}
          className="font-display mx-auto mt-2 font-bold leading-tight animate-fadeInUp"
          style={{
            fontSize: `${translationSize}px`,
            color: '#F5F7FA',
            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          }}
        >
          {translation || '\u00a0'}
        </div>
      </div>
    </div>
  );
}
