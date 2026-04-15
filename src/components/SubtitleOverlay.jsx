import React, { useEffect, useRef } from 'react';

export default function SubtitleOverlay({
  history,
  pendingOriginal,
  interim,
  fontScale,
  listening,
  translating,
}) {
  const base = 17;
  const originalSize = base * fontScale;
  // Translated text: previously base * 1.705, now 10% smaller → base * 1.5345
  const translationSize = base * 1.5345 * fontScale;

  const accentColor = listening ? '#B4FF39' : '#00E5FF';
  const accentGlow = listening ? 'rgba(180,255,57,0.55)' : 'rgba(0,229,255,0.45)';

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    // Defer to next frame so newly appended node is laid out
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [history.length, pendingOriginal, interim]);

  const hasHistory = history.length > 0;
  const showPending = !!pendingOriginal || !!interim;
  const hasAny = hasHistory || showPending;

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
          ref={scrollRef}
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
              originalSize={originalSize}
              translationSize={translationSize}
              showDivider={idx < history.length - 1 || showPending}
            />
          ))}

          {showPending && (
            <TranscriptEntry
              original={pendingOriginal || interim}
              translation={translating ? '…' : ''}
              originalSize={originalSize}
              translationSize={translationSize}
              italicOriginal={!pendingOriginal}
              dim
              showDivider={false}
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
  originalSize,
  translationSize,
  italicOriginal,
  dim,
  showDivider,
}) {
  return (
    <div className="py-3 first:pt-2">
      <div
        className={`text-center leading-snug ${italicOriginal ? 'italic' : ''}`}
        style={{
          fontSize: `${originalSize}px`,
          color: dim ? 'rgba(245,247,250,0.55)' : 'rgba(245,247,250,0.78)',
        }}
      >
        {original}
      </div>
      {translation && (
        <div
          className="font-display text-center mt-2 font-bold leading-tight"
          style={{
            fontSize: `${translationSize}px`,
            color: dim ? 'rgba(245,247,250,0.65)' : '#F5F7FA',
            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          }}
        >
          {translation}
        </div>
      )}
      {showDivider && (
        <div className="mt-3 flex justify-center">
          <span className="block h-px w-16 bg-white/10" />
        </div>
      )}
    </div>
  );
}
