import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import { LANG_LABELS } from '../lib/detectLang.js';

const FONT_OPTIONS = [
  { label: 'S',  value: 0.85 },
  { label: 'M',  value: 1 },
  { label: 'L',  value: 1.3 },
  { label: 'XL', value: 1.7 },
];

function IconMic({ stop }) {
  if (stop) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

function IconCamera({ off }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h4l2-3h6l2 3h4v12H3z" />
      <circle cx="12" cy="13" r="3.5" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

function IconSwap() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h13l-3-3" />
      <path d="M20 15H7l3 3" />
    </svg>
  );
}

export default function ControlPanel({
  listening,
  onStart,
  onStop,
  sourceLang,
  onSourceLangChange,
  fontScale,
  onFontScaleChange,
  status,
  cameraEnabled,
  onToggleCamera,
  onSwitchCamera,
  cameraSupported,
}) {
  const primaryRing = listening ? 'animate-ringGlow' : 'animate-ringGlow';
  return (
    <div className="pointer-events-auto absolute bottom-0 inset-x-0 z-30 px-3 pb-4 sm:pb-6 flex justify-center">
      <div className="glass rounded-full px-2 py-2 flex items-center gap-1.5 sm:gap-2 max-w-[96vw] overflow-x-auto">
        <button
          onClick={listening ? onStop : onStart}
          aria-label={listening ? '중지' : '시작'}
          className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 active:scale-[0.94] ${primaryRing}`}
          style={{
            background: listening
              ? 'linear-gradient(135deg, #FF4D6D 0%, #C4122A 100%)'
              : 'linear-gradient(135deg, #00E5FF 0%, #0097B2 100%)',
            color: listening ? '#fff' : '#0a0a0a',
            boxShadow: listening
              ? '0 0 24px rgba(255,77,109,0.55), inset 0 0 0 1px rgba(255,77,109,0.5)'
              : '0 0 24px rgba(0,229,255,0.45), inset 0 0 0 1px rgba(0,229,255,0.45)',
          }}
        >
          <IconMic stop={listening} />
        </button>

        <div className="h-8 w-px bg-white/10 mx-0.5" />

        <label className="relative flex items-center">
          <select
            value={sourceLang}
            onChange={(e) => onSourceLangChange(e.target.value)}
            className="appearance-none text-mono-hud bg-white/[0.04] hover:bg-white/[0.08] text-white/85 border border-white/10 rounded-full pl-3 pr-7 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-hud-cyan/60 transition"
            style={{ backgroundImage: 'none' }}
          >
            <option value="ko">KO · {LANG_LABELS.ko}</option>
            <option value="zh">ZH · {LANG_LABELS.zh}</option>
          </select>
          <svg viewBox="0 0 12 12" className="pointer-events-none absolute right-2 w-3 h-3 text-white/50" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 4.5l3 3 3-3" />
          </svg>
        </label>

        {cameraSupported && (
          <>
            <button
              onClick={onToggleCamera}
              title={cameraEnabled ? '카메라 끄기' : '카메라 켜기'}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-xs transition active:scale-[0.96] text-hud ${
                cameraEnabled
                  ? 'bg-white/[0.06] text-hud-cyan border border-hud-cyan/40 shadow-glow-cyan'
                  : 'bg-white/[0.04] text-white/55 border border-white/10 hover:bg-white/[0.08]'
              }`}
              style={{ fontSize: '10px' }}
            >
              <IconCamera off={!cameraEnabled} />
              {cameraEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={onSwitchCamera}
              disabled={!cameraEnabled}
              title="전/후면 전환"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/75 disabled:opacity-35 transition active:rotate-180 active:scale-[0.94] duration-300"
            >
              <IconSwap />
            </button>
          </>
        )}

        <div className="h-8 w-px bg-white/10 mx-0.5" />

        <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-white/[0.04] border border-white/10">
          {FONT_OPTIONS.map((opt) => {
            const isActive = Math.abs(fontScale - opt.value) < 0.01;
            return (
              <button
                key={opt.value}
                onClick={() => onFontScaleChange(opt.value)}
                className={`text-mono-hud px-2.5 h-7 rounded-full transition ${
                  isActive
                    ? 'bg-hud-cyan text-[#0a0a0a] font-semibold'
                    : 'text-white/60 hover:text-white/90'
                }`}
                style={{ fontSize: '10px' }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="hidden sm:block">
          <StatusBadge state={status} />
        </div>
      </div>
    </div>
  );
}
