import React, { useEffect, useRef } from 'react';

export default function SubtitleOverlay({
  history,
  interim,
  fontScale,
  listening,
}) {
  const base = 17;
  const originalSize = base * fontScale;
  // Translated text: 10% smaller than the prior 1.705× ratio (→ 1.5345×).
  const translationSize = base * 1.5345 * fontScale;

  const accentColor = listening ? '#B4FF39' : '#00E5FF';
  const accentGlow = listening ? 'rgba(180,255,57,0.55)' : 'rgba(0,229,255,0.45)';

  const bottomRef = useRef(null);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [history.length, history[history.length - 1]?.translation, interim]);

  const hasInterim = !!interim;
  const hasAny = history.length > 0 || hasInterim;

  return (
    <div className="absolute inset-0 z-20 px-3 pt-3 pb-28 sm:pb-32 flex">
      <div
        className="glass relative w-full max-w-3xl mx-auto rounded-[24px] overflow-hidden flex flex-col"
        style={{ transition: 'box-shadow 400ms ease' }}
      >
        <span
          aria-hidden
          className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full z-10"
          style={{
            background: accentColor,
            boxShadow: `0 0 10px ${accentGlow}`,
            transition: 'background 300ms ease, box-shadow 300ms ease',
          }}
        />

        <div className="flex items-center justify-center gap-2 pt-4 pb-2 text-hud text-white/40" style={{ fontSize: '9px' }}>
          <span
            className="inline-block w-1 h-1 rounded-full"
            style={{ background: accentColor, boxShadow: `0 0 6px ${accentGlow}` }}
          />
          TRANSCRIPT
        </div>

        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 pb-5 pt-1"
          style={{ scrollBehavior: 'smooth' }}
        >
          {!hasAny && (
            <div className="h-full w-full flex items-center justify-center text-white/35 text-center" style={{ fontSize: `${originalSize}px` }}>
              준비됨 · READY
            </div>
          )}

          {history.map((entry, idx) => (
            <TranscriptEntry
              key={entry.id}
              original={entry.original}
              translation={entry.translation}
              failed={entry.failed}
              originalSize={originalSize}
              translationSize={translationSize}
              showDivider={idx < history.length - 1 || hasInterim}
            />
          ))}

          {hasInterim && (
            <InterimPreview
              text={interim}
              fontSize={originalSize}
              accentColor={accentColor}
              accentGlow={accentGlow}
            />
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

function TranscriptEntry({
  original,
  translation,
  failed,
  originalSize,
  translationSize,
  showDivider,
}) {
  const pending = translation == null && !failed;
  return (
    <div className="py-3 first:pt-2">
      <div
        className="text-center leading-snug"
        style={{
          fontSize: `${originalSize}px`,
          color: 'rgba(245,247,250,0.78)',
        }}
      >
        {original}
      </div>
      <div
        className="font-display text-center mt-2 font-bold leading-tight"
        style={{
          fontSize: `${translationSize}px`,
          color: failed ? 'rgba(255,77,109,0.85)' : pending ? 'rgba(245,247,250,0.4)' : '#F5F7FA',
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          minHeight: `${translationSize}px`,
        }}
      >
        {failed ? '번역 실패' : pending ? <TypingDots /> : translation}
      </div>
      {showDivider && (
        <div className="mt-3 flex justify-center">
          <span className="block h-px w-16 bg-white/10" />
        </div>
      )}
    </div>
  );
}

function InterimPreview({ text, fontSize, accentColor, accentGlow }) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-center gap-2 mb-1">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: accentColor, boxShadow: `0 0 6px ${accentGlow}` }}
        />
        <span className="text-hud text-white/35" style={{ fontSize: '9px', letterSpacing: '0.18em' }}>
          TYPING
        </span>
      </div>
      <div
        className="text-center italic leading-snug"
        style={{
          fontSize: `${fontSize}px`,
          color: 'rgba(245,247,250,0.45)',
        }}
      >
        {text}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span aria-hidden className="inline-flex items-center gap-1 align-middle">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/35 animate-pulse" style={{ animationDelay: '0ms' }} />
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/35 animate-pulse" style={{ animationDelay: '180ms' }} />
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/35 animate-pulse" style={{ animationDelay: '360ms' }} />
    </span>
  );
}
