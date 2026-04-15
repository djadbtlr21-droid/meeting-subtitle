import React from 'react';

export default function SubtitleOverlay({ original, translation, interim, fontScale }) {
  const base = 18;
  const originalSize = base * fontScale;
  const translationSize = base * 1.4 * fontScale;

  const displayedOriginal = original || interim || '';
  const hasAny = displayedOriginal || translation;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-6 pt-5 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white text-center">
      <div
        className="mx-auto max-w-4xl leading-snug opacity-85"
        style={{ fontSize: `${originalSize}px` }}
      >
        {displayedOriginal || (hasAny ? '\u00a0' : '대기중...')}
      </div>
      <div
        className="mx-auto max-w-4xl mt-2 font-bold leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
        style={{ fontSize: `${translationSize}px` }}
      >
        {translation || '\u00a0'}
      </div>
    </div>
  );
}
