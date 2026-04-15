import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js';
import { useCamera, requestInitialPermissions } from './hooks/useCamera.js';
import { translate } from './lib/gemini.js';
import { detectLang, otherLang, SPEECH_LANG } from './lib/detectLang.js';

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, 'Segoe UI', 'Noto Sans KR', 'Noto Sans SC', sans-serif";
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const C = {
  purple: '#a78bfa',
  purpleSoft: 'rgba(167, 139, 250, 0.45)',
  purpleVeil: 'rgba(167, 139, 250, 0.18)',
  cyan: '#67e8f9',
  white: '#FFFFFF',
  textHi: 'rgba(255, 255, 255, 0.95)',
  textMid: 'rgba(255, 255, 255, 0.6)',
  textLo: 'rgba(255, 255, 255, 0.45)',
  glassBg: 'rgba(255, 255, 255, 0.08)',
  glassBgHover: 'rgba(255, 255, 255, 0.15)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  shadow: '0 8px 32px rgba(0, 0, 0, 0.30)',
  danger: '#fca5a5',
};

const FONT_SIZES = [
  { label: 'S', value: 0.85 },
  { label: 'M', value: 1 },
  { label: 'L', value: 1.3 },
];

const v3Styles = `
@keyframes v3-bgShift {
  0%   { background-position: 0% 30%; }
  50%  { background-position: 100% 70%; }
  100% { background-position: 0% 30%; }
}
@keyframes v3-scanLine {
  0%   { transform: translateY(0%);   opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(100%); opacity: 0; }
}
@keyframes v3-blink {
  0%, 100% { opacity: 0.45; }
  50%      { opacity: 1; }
}
@keyframes v3-pulse {
  0%, 100% { opacity: 0.65; }
  50%      { opacity: 1; }
}
@keyframes v3-breathe {
  0%, 100% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.55);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 24px 6px rgba(167, 139, 250, 0.35);
  }
}
@keyframes v3-fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes v3-toast {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes v3-twinkle {
  0%, 100% { opacity: 0.15; }
  50%      { opacity: 0.55; }
}
.v3-bg {
  background: radial-gradient(ellipse at 20% 20%, #302b63 0%, transparent 55%),
              radial-gradient(ellipse at 80% 80%, #24243e 0%, transparent 55%),
              linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  background-size: 200% 200%;
  animation: v3-bgShift 8s ease-in-out infinite;
}
.v3-scan    { animation: v3-scanLine 4s ease-in-out infinite; }
.v3-blink   { animation: v3-blink 1.5s ease-in-out infinite; }
.v3-pulse   { animation: v3-pulse 1.6s ease-in-out infinite; }
.v3-breathe { animation: v3-breathe 2s ease-in-out infinite; }
.v3-fade    { animation: v3-fadeUp 320ms ${EASE} both; }
.v3-toast   { animation: v3-toast 260ms ${EASE} both; }
.v3-twinkle { animation: v3-twinkle 2.4s ease-in-out infinite; }
.v3-glass {
  background: ${C.glassBg};
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid ${C.glassBorder};
  box-shadow: ${C.shadow};
}
.v3-btn {
  transition: all 250ms ${EASE};
}
.v3-btn:hover {
  transform: scale(1.05);
  background: ${C.glassBgHover};
}
.v3-btn:active {
  transform: scale(0.96);
}
`;

export default function AppV3() {
  const [sourceLang, setSourceLang] = useState('ko');
  const [fontScale, setFontScale] = useState(1);
  const [original, setOriginal] = useState('');
  const [translation, setTranslation] = useState('');
  const [translating, setTranslating] = useState(0);
  const [translateError, setTranslateError] = useState(null);
  const [errorVisible, setErrorVisible] = useState(false);

  const lastSentRef = useRef('');
  const initializedRef = useRef(false);

  const camera = useCamera();
  const cameraStartRef = useRef(camera.start);
  cameraStartRef.current = camera.start;

  const handleFinal = useCallback(
    async (text) => {
      if (!text || text.length < 2) return;
      if (text === lastSentRef.current) return;
      lastSentRef.current = text;

      setOriginal(text);

      const detected = detectLang(text, sourceLang);
      const target = otherLang(detected);

      setTranslating((n) => n + 1);
      setTranslateError(null);
      try {
        const out = await translate(text, detected, target);
        setTranslation(out);
      } catch (err) {
        setTranslateError(err.message || '번역 실패');
      } finally {
        setTranslating((n) => Math.max(0, n - 1));
      }
    },
    [sourceLang]
  );

  const {
    listening,
    interim,
    error: speechError,
    start,
    stop,
    supported: speechSupported,
  } = useSpeechRecognition({
    lang: SPEECH_LANG[sourceLang],
    onFinal: handleFinal,
  });

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    (async () => {
      await requestInitialPermissions();
      cameraStartRef.current?.();
    })();
  }, []);

  const handleToggleListen = useCallback(() => {
    if (listening) {
      stop();
    } else {
      setTranslateError(null);
      start();
    }
  }, [listening, start, stop]);

  const handleSwapLang = useCallback(() => {
    setSourceLang((prev) => (prev === 'ko' ? 'zh' : 'ko'));
  }, []);

  let status = 'idle';
  if (translating > 0) status = 'translating';
  else if (listening) status = 'listening';

  const combinedError =
    speechError ||
    translateError ||
    camera.error ||
    (!speechSupported ? '이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge를 사용해주세요.' : null);

  useEffect(() => {
    if (!combinedError) {
      setErrorVisible(false);
      return;
    }
    setErrorVisible(true);
    const t = setTimeout(() => setErrorVisible(false), 4000);
    return () => clearTimeout(t);
  }, [combinedError]);

  return (
    <>
      <style>{v3Styles}</style>
      <div
        className="v3-bg h-dvh w-full overflow-hidden"
        style={{
          fontFamily: FONT_STACK,
          color: C.textHi,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <div className="w-full max-w-xl mx-auto h-full flex flex-col px-4 gap-3">
          <TopBar status={status} listening={listening} />

          <div className="flex-[0.55] min-h-0">
            <CameraCard
              stream={camera.stream}
              enabled={camera.enabled}
              facing={camera.facing}
              listening={listening}
              translating={translating > 0}
            />
          </div>

          <div className="flex-[0.35] min-h-0 flex">
            <SubtitleCard
              original={original}
              interim={interim}
              translation={translation}
              fontScale={fontScale}
            />
          </div>

          <div className="pb-3 pt-1">
            <ControlBar
              listening={listening}
              onToggleListen={handleToggleListen}
              sourceLang={sourceLang}
              onSwapLang={handleSwapLang}
              cameraEnabled={camera.enabled}
              onToggleCamera={camera.toggle}
              cameraSupported={camera.supported}
              fontScale={fontScale}
              onFontScaleChange={setFontScale}
            />
          </div>
        </div>

        {errorVisible && combinedError && <ErrorPill message={combinedError} />}
      </div>
    </>
  );
}

function TopBar({ status, listening }) {
  const [label, color] = useMemo(() => {
    if (status === 'translating') return ['TRANSLATING', C.cyan];
    if (status === 'listening')   return ['LISTENING',   C.purple];
    return ['IDLE', C.textLo];
  }, [status]);

  return (
    <div className="h-12 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2">
        <span
          className={listening ? 'v3-breathe' : ''}
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: 4,
            background: C.purple,
            boxShadow: `0 0 12px ${C.purpleSoft}`,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: C.textHi }}>
          MEETING.SUB
        </span>
      </div>
      <span
        className="v3-glass"
        style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          padding: '6px 12px',
          borderRadius: 999,
          color,
          fontWeight: 600,
          transition: `color 300ms ${EASE}`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function CameraCard({ stream, enabled, facing, listening, translating }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (stream && enabled) {
      if (v.srcObject !== stream) v.srcObject = stream;
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      v.srcObject = null;
    }
  }, [stream, enabled]);

  const showVideo = enabled && !!stream;
  const mirror = facing === 'user';

  return (
    <div className="v3-glass relative w-full h-full overflow-hidden" style={{ borderRadius: 24 }}>
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <CameraEmpty />
      )}

      {showVideo && <FaceHud listening={listening} translating={translating} />}
      <MicDot listening={listening} visible={showVideo} />
    </div>
  );
}

function CameraEmpty() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ color: C.textLo }}>
      <svg viewBox="0 0 32 32" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10h5l2-3h10l2 3h5v14H4z" />
        <circle cx="16" cy="16" r="4.5" />
      </svg>
      <span style={{ fontSize: 13 }}>카메라 꺼짐</span>
    </div>
  );
}

function FaceHud({ listening, translating }) {
  const [percent, setPercent] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 2000;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setPercent(Math.round(eased * 100));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const ready = percent >= 100;
  const [statusText, statusClass, statusColor] = useMemo(() => {
    if (translating) return ['TRANSLATING...', 'v3-pulse', C.cyan];
    if (listening)   return ['VOICE DETECTED', '',         C.purple];
    return ['SCANNING...', 'v3-blink', C.textMid];
  }, [translating, listening]);

  // 5x7 grid, slight inset
  const dots = useMemo(() => {
    const arr = [];
    const cols = 7;
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 18 + (c / (cols - 1)) * 64; // 18-82 in viewBox %
        const y = 22 + (r / (rows - 1)) * 56; // 22-78
        arr.push({ x, y, delay: ((r + c) % 7) * 220 });
      }
    }
    return arr;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Corner brackets — centered, 60% of card */}
      <div
        className="absolute"
        style={{
          left: '20%',
          top: '15%',
          width: '60%',
          height: '70%',
        }}
      >
        <Bracket className="absolute top-0 left-0" rotate={0} />
        <Bracket className="absolute top-0 right-0" rotate={90} />
        <Bracket className="absolute bottom-0 right-0" rotate={180} />
        <Bracket className="absolute bottom-0 left-0" rotate={270} />

        {/* Mesh dots */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {dots.map((d, i) => (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r="0.6"
              fill={C.purple}
              className="v3-twinkle"
              style={{ animationDelay: `${d.delay}ms`, opacity: 0.2 }}
            />
          ))}
        </svg>

        {/* Scan line */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="v3-scan absolute inset-x-0"
            style={{
              height: 2,
              top: 0,
              background: `linear-gradient(90deg, transparent 0%, ${C.purple} 50%, transparent 100%)`,
              boxShadow: `0 0 10px ${C.purpleSoft}`,
            }}
          />
        </div>
      </div>

      {/* Status text — top-right */}
      <div
        className={`absolute top-3 right-3 ${statusClass}`}
        style={{
          fontSize: 10,
          letterSpacing: '0.16em',
          fontWeight: 700,
          color: statusColor,
          textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
          transition: `color 300ms ${EASE}`,
        }}
      >
        {statusText}
      </div>

      {/* Percentage — bottom-right (left side has MicDot) */}
      <div
        className="absolute bottom-3 right-3 font-mono"
        style={{
          fontSize: 11,
          letterSpacing: '0.04em',
          color: ready ? C.textHi : C.purple,
          fontWeight: 600,
          textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
        }}
      >
        {ready ? 'READY 100%' : `${percent.toString().padStart(3, '0')}%`}
      </div>
    </div>
  );
}

function Bracket({ className, rotate }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={`w-7 h-7 ${className}`}
      fill="none"
      stroke={C.purple}
      strokeWidth="2"
      strokeLinecap="round"
      style={{
        transform: `rotate(${rotate}deg)`,
        opacity: 0.9,
        filter: `drop-shadow(0 0 4px ${C.purpleSoft})`,
      }}
    >
      <path d="M2 12 V4 Q2 2 4 2 H12" />
    </svg>
  );
}

function MicDot({ listening, visible }) {
  if (!visible) return null;
  return (
    <div
      className="absolute bottom-3 left-3 v3-glass flex items-center justify-center"
      style={{ width: 36, height: 36, borderRadius: 18 }}
    >
      <span
        className={listening ? 'v3-breathe' : ''}
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: 5,
          background: listening ? C.purple : C.textLo,
          boxShadow: listening ? `0 0 16px ${C.purpleSoft}` : 'none',
          transition: `all 300ms ${EASE}`,
        }}
      />
    </div>
  );
}

function SubtitleCard({ original, interim, translation, fontScale }) {
  const originalBase = 15;
  const translationBase = 24;
  const originalSize = originalBase * fontScale;
  const translationSize = translationBase * fontScale;
  const isInterim = !original && !!interim;
  const displayedOriginal = original || interim || '';

  return (
    <div
      className="v3-glass w-full flex flex-col justify-center"
      style={{ borderRadius: 24, padding: '20px 22px' }}
    >
      <div
        key={`v3-orig-${displayedOriginal}`}
        className="v3-fade"
        style={{
          fontSize: originalSize,
          color: C.textMid,
          fontWeight: 400,
          lineHeight: 1.4,
          fontStyle: isInterim ? 'italic' : 'normal',
          transition: `font-size 300ms ${EASE}`,
        }}
      >
        {displayedOriginal || '대기중'}
      </div>
      <div
        key={`v3-trans-${translation}`}
        className="v3-fade"
        style={{
          fontSize: translationSize,
          color: C.textHi,
          fontWeight: 700,
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          marginTop: 10,
          transition: `font-size 300ms ${EASE}`,
          textShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
          minHeight: `${translationBase * 1.3}px`,
        }}
      >
        {translation || '\u00a0'}
      </div>
    </div>
  );
}

function ControlBar({
  listening,
  onToggleListen,
  sourceLang,
  onSwapLang,
  cameraEnabled,
  onToggleCamera,
  cameraSupported,
  fontScale,
  onFontScaleChange,
}) {
  return (
    <div className="w-full flex justify-center">
      <div
        className="v3-glass flex items-center gap-2"
        style={{ borderRadius: 999, padding: 6 }}
      >
        <PrimaryButton listening={listening} onClick={onToggleListen} />
        <LangSwap sourceLang={sourceLang} onClick={onSwapLang} />
        {cameraSupported && <CamButton enabled={cameraEnabled} onClick={onToggleCamera} />}
        <FontSeg value={fontScale} onChange={onFontScaleChange} />
      </div>
    </div>
  );
}

function PrimaryButton({ listening, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={listening ? '중지' : '시작'}
      className="v3-btn flex items-center justify-center"
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        background: listening
          ? `linear-gradient(135deg, ${C.purple} 0%, #7c3aed 100%)`
          : 'rgba(255, 255, 255, 0.10)',
        color: C.white,
        border: `1px solid ${listening ? 'rgba(167, 139, 250, 0.6)' : C.glassBorder}`,
        boxShadow: listening
          ? `0 0 24px ${C.purpleSoft}, inset 0 0 0 1px rgba(255, 255, 255, 0.2)`
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      {listening ? (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <rect x="7" y="7" width="10" height="10" rx="2" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
        </svg>
      )}
    </button>
  );
}

function LangSwap({ sourceLang, onClick }) {
  const label = sourceLang === 'ko' ? 'KO→ZH' : 'ZH→KO';
  const rotate = sourceLang === 'ko' ? 0 : 180;
  return (
    <button
      onClick={onClick}
      className="v3-btn flex items-center gap-1.5 justify-center"
      style={{
        minWidth: 76,
        height: 44,
        padding: '0 12px',
        borderRadius: 22,
        background: 'transparent',
        color: C.textHi,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
      }}
    >
      <svg
        viewBox="0 0 20 20"
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: `rotate(${rotate}deg)`, transition: `transform 500ms ${EASE}` }}
      >
        <path d="M4 7h10l-2-2" />
        <path d="M16 13H6l2 2" />
      </svg>
      <span>{label}</span>
    </button>
  );
}

function CamButton({ enabled, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={enabled ? '카메라 끄기' : '카메라 켜기'}
      className="v3-btn flex items-center justify-center"
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        background: 'transparent',
        color: enabled ? C.textHi : C.textLo,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7h4l2-3h6l2 3h4v12H3z" />
        <circle cx="12" cy="13" r="3.5" />
        {!enabled && <path d="M3 3l18 18" />}
      </svg>
    </button>
  );
}

function FontSeg({ value, onChange }) {
  return (
    <div
      className="flex items-center"
      style={{
        borderRadius: 18,
        background: 'rgba(255, 255, 255, 0.06)',
        padding: 3,
        height: 36,
      }}
    >
      {FONT_SIZES.map((opt) => {
        const isActive = Math.abs(value - opt.value) < 0.01;
        return (
          <button
            key={opt.label}
            onClick={() => onChange(opt.value)}
            className="v3-btn"
            style={{
              minWidth: 32,
              height: 30,
              padding: '0 10px',
              borderRadius: 15,
              background: isActive
                ? `linear-gradient(135deg, ${C.purple} 0%, #7c3aed 100%)`
                : 'transparent',
              color: isActive ? C.white : C.textHi,
              fontSize: 11,
              fontWeight: 700,
              boxShadow: isActive ? `0 0 12px ${C.purpleSoft}` : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ErrorPill({ message }) {
  return (
    <div
      className="pointer-events-none fixed top-3 inset-x-0 z-50 flex justify-center px-4"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div
        className="v3-toast v3-glass pointer-events-auto flex items-center gap-2 max-w-[90vw]"
        style={{
          borderRadius: 999,
          padding: '10px 16px',
          color: C.danger,
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <span
          className="inline-block rounded-full"
          style={{ width: 6, height: 6, background: C.danger, boxShadow: `0 0 8px ${C.danger}` }}
        />
        <span className="truncate">{message}</span>
      </div>
    </div>
  );
}
