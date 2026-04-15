import React from 'react';

export default function SubtitleOverlay({ original, translation, interim, fontScale }) {
  const hasAny = original || translation || interim;
  if (!hasAny) return null;

  const base = 18;
  const originalSize = base * fontScale;
  const translationSize = base * 1.4 * fontScale;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-4 pb-6 pt-4 bg-black/70 backdrop-blur-sm text-white text-center">
      <div
        className="mx-auto max-w-4xl leading-snug opacity-80"
        style={{ fontSize: `${originalSize}px` }}
      >
        {original || interim || '\u00a0'}
      </div>
      <div
        className="mx-auto max-w-4xl mt-2 font-bold leading-snug"
        style={{ fontSize: `${translationSize}px` }}
      >
        {translation || '\u00a0'}
      </div>
    </div>
  );
}
