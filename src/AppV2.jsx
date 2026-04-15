import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js';
import { useCamera, requestInitialPermissions } from './hooks/useCamera.js';
import { translate } from './lib/gemini.js';
import { detectLang, otherLang, SPEECH_LANG } from './lib/detectLang.js';

const APPLE_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, 'Segoe UI', 'Noto Sans KR', 'Noto Sans SC', sans-serif";
const APPLE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const COLORS = {
  white: '#FFFFFF',
  surface: '#F5F5F7',
  hairline: 'rgba(0, 0, 0, 0.06)',
  inkHi: '#1D1D1F',
  inkLo: '#6E6E73',
  inkFaint: '#8E8E93',
  accent: '#0071E3',
  accentSoft: 'rgba(0, 113, 227, 0.10)',
  danger: '#FF3B30',
};

const FONT_SIZES = [
  { label: 'S', value: 0.85 },
  { label: 'M', value: 1 },
  { label: 'L', value: 1.3 },
];

const localStyles = `
@keyframes mtgv2-breathe {
  0%, 100% { opacity: 0.55; transform: scale(0.92); }
  50%      { opacity: 1;    transform: scale(1.08); }
}
@keyframes mtgv2-fadeSlide {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes mtgv2-slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.mtgv2-breathe { animation: mtgv2-breathe 1.6s ease-in-out infinite; }
.mtgv2-fade    { animation: mtgv2-fadeSlide 320ms ${APPLE_EASE} both; }
.mtgv2-toast   { animation: mtgv2-slideDown 260ms ${APPLE_EASE} both; }
`;

export default function AppV2() {
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
      <style>{localStyles}</style>
      <div
        className="h-dvh w-full flex flex-col"
        style={{
          fontFamily: APPLE_FONT,
          background: COLORS.white,
          color: COLORS.inkHi,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        <div className="w-full max-w-xl mx-auto flex-1 flex flex-col min-h-0 px-4">
          <TopBar status={status} />

          <div className="flex-[0.6] min-h-0 pb-3 pt-1">
            <CameraCard
              stream={camera.stream}
              enabled={camera.enabled}
              facing={camera.facing}
              listening={listening}
            />
          </div>

          <div className="flex-[0.4] flex flex-col justify-end pb-3 min-h-0">
            <SubtitleCard
              original={original}
              interim={interim}
              translation={translation}
              fontScale={fontScale}
            />
          </div>

          <div className="pb-4 pt-1">
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

function TopBar({ status }) {
  const label = status === 'translating' ? 'TRANSLATING' : status === 'listening' ? 'LISTENING' : 'IDLE';
  const active = status !== 'idle';
  return (
    <div className="h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: COLORS.accent }}
        />
        <span
          className="font-semibold tracking-tight"
          style={{ fontSize: 13, color: COLORS.inkHi, letterSpacing: '-0.01em' }}
        >
          MEETING.SUB
        </span>
      </div>
      <span
        className="uppercase transition-colors duration-300"
        style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          color: active ? COLORS.accent : COLORS.inkLo,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function CameraCard({ stream, enabled, facing, listening }) {
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
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        borderRadius: 24,
        background: COLORS.surface,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04)',
      }}
    >
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
      <MicChip listening={listening} visible={showVideo} />
    </div>
  );
}

function CameraEmpty() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ color: COLORS.inkFaint }}>
      <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10h5l2-3h10l2 3h5v14H4z" />
        <circle cx="16" cy="16" r="4.5" />
      </svg>
      <span style={{ fontSize: 13 }}>카메라 꺼짐</span>
    </div>
  );
}

function MicChip({ listening, visible }) {
  if (!visible) return null;
  return (
    <div
      className="absolute bottom-3 left-3 flex items-center justify-center"
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        background: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(12px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(0, 0, 0, 0.04)',
      }}
    >
      <span
        className={listening ? 'mtgv2-breathe' : ''}
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: 5,
          background: listening ? COLORS.accent : COLORS.inkFaint,
          transition: `background-color 300ms ${APPLE_EASE}`,
        }}
      />
    </div>
  );
}

function SubtitleCard({ original, interim, translation, fontScale }) {
  const originalBase = 16;
  const translationBase = 24;
  const originalSize = originalBase * fontScale;
  const translationSize = translationBase * fontScale;
  const isInterim = !original && !!interim;
  const displayedOriginal = original || interim || '';

  return (
    <div
      className="w-full"
      style={{
        borderRadius: 24,
        background: COLORS.surface,
        padding: '20px 22px',
        minHeight: 120,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: `all 300ms ${APPLE_EASE}`,
      }}
    >
      <div
        key={`v2-orig-${displayedOriginal}`}
        className="mtgv2-fade"
        style={{
          fontSize: originalSize,
          color: COLORS.inkLo,
          fontWeight: 400,
          lineHeight: 1.4,
          fontStyle: isInterim ? 'italic' : 'normal',
          transition: `font-size 300ms ${APPLE_EASE}`,
          minHeight: `${originalBase * 1.4}px`,
        }}
      >
        {displayedOriginal || '대기중'}
      </div>
      <div
        key={`v2-trans-${translation}`}
        className="mtgv2-fade"
        style={{
          fontSize: translationSize,
          color: COLORS.inkHi,
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          marginTop: 8,
          transition: `font-size 300ms ${APPLE_EASE}`,
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
    <div
      className="w-full flex items-center justify-center"
    >
      <div
        className="flex items-center gap-2"
        style={{
          borderRadius: 999,
          padding: 6,
          background: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(0, 0, 0, 0.04)',
        }}
      >
        <PrimaryButton listening={listening} onClick={onToggleListen} />
        <LangSwapButton sourceLang={sourceLang} onClick={onSwapLang} />
        {cameraSupported && <CameraButton enabled={cameraEnabled} onClick={onToggleCamera} />}
        <FontSizeSegment value={fontScale} onChange={onFontScaleChange} />
      </div>
    </div>
  );
}

function PrimaryButton({ listening, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={listening ? '중지' : '시작'}
      className="flex items-center justify-center active:scale-[0.97]"
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        background: listening ? COLORS.accent : COLORS.white,
        color: listening ? COLORS.white : COLORS.inkHi,
        border: listening ? 'none' : `1px solid ${COLORS.hairline}`,
        boxShadow: listening
          ? '0 2px 8px rgba(0, 113, 227, 0.28)'
          : '0 1px 2px rgba(0, 0, 0, 0.04)',
        transition: `all 300ms ${APPLE_EASE}`,
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

function LangSwapButton({ sourceLang, onClick }) {
  const label = sourceLang === 'ko' ? 'KO→ZH' : 'ZH→KO';
  const rotate = sourceLang === 'ko' ? 'rotate(0deg)' : 'rotate(180deg)';
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 active:scale-[0.97]"
      style={{
        minWidth: 72,
        height: 44,
        padding: '0 12px',
        borderRadius: 22,
        background: 'transparent',
        color: COLORS.inkHi,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        transition: `all 300ms ${APPLE_EASE}`,
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
        style={{ transform: rotate, transition: `transform 500ms ${APPLE_EASE}` }}
      >
        <path d="M4 7h10l-2-2" />
        <path d="M16 13H6l2 2" />
      </svg>
      <span>{label}</span>
    </button>
  );
}

function CameraButton({ enabled, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={enabled ? '카메라 끄기' : '카메라 켜기'}
      className="flex items-center justify-center active:scale-[0.97]"
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        background: 'transparent',
        color: enabled ? COLORS.inkHi : COLORS.inkFaint,
        transition: `all 300ms ${APPLE_EASE}`,
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

function FontSizeSegment({ value, onChange }) {
  return (
    <div
      className="flex items-center"
      style={{
        borderRadius: 18,
        background: COLORS.surface,
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
            className="active:scale-[0.96]"
            style={{
              minWidth: 32,
              height: 30,
              padding: '0 10px',
              borderRadius: 15,
              background: isActive ? COLORS.accent : 'transparent',
              color: isActive ? COLORS.white : COLORS.inkHi,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.02em',
              transition: `all 300ms ${APPLE_EASE}`,
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
        className="mtgv2-toast pointer-events-auto flex items-center gap-2 max-w-[90vw]"
        style={{
          borderRadius: 999,
          padding: '10px 16px',
          background: COLORS.white,
          color: COLORS.danger,
          fontSize: 13,
          fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 59, 48, 0.18)',
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: COLORS.danger }}
        />
        <span className="truncate">{message}</span>
      </div>
    </div>
  );
}
