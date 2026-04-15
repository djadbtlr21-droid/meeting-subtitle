import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import { LANG_LABELS } from '../lib/detectLang.js';

const FONT_OPTIONS = [
  { label: '작게', value: 0.85 },
  { label: '보통', value: 1 },
  { label: '크게', value: 1.3 },
  { label: '매우크게', value: 1.7 },
];

export default function ControlPanel({
  listening,
  onStart,
  onStop,
  sourceLang,
  onSourceLangChange,
  fontScale,
  onFontScaleChange,
  status,
  error,
}) {
  return (
    <div className="pointer-events-auto fixed top-0 inset-x-0 z-20 p-3 sm:p-4">
      <div className="mx-auto max-w-4xl rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={listening ? onStop : onStart}
            className={`px-4 py-2 rounded-xl font-semibold text-white transition ${
              listening
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {listening ? '■ 중지' : '● 시작'}
          </button>

          <label className="flex items-center gap-2 text-sm text-white/80">
            <span>주 언어</span>
            <select
              value={sourceLang}
              onChange={(e) => onSourceLangChange(e.target.value)}
              className="bg-neutral-800 text-white border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ko">{LANG_LABELS.ko} (한국어)</option>
              <option value="zh">{LANG_LABELS.zh} (中文)</option>
            </select>
          </label>

          <div className="flex items-center gap-1 ml-auto">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onFontScaleChange(opt.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm transition ${
                  Math.abs(fontScale - opt.value) < 0.01
                    ? 'bg-white text-black font-semibold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <StatusBadge state={status} />
        </div>

        {error && (
          <div className="mt-2 text-sm text-red-300 bg-red-900/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
