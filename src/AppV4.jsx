import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js';
import { useCamera, requestInitialPermissions } from './hooks/useCamera.js';
import { translate } from './lib/gemini.js';
import { detectLang, otherLang, SPEECH_LANG } from './lib/detectLang.js';

const FONT_STACK =
  "'Netflix Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Noto Sans KR', 'Noto Sans SC', system-ui, sans-serif";
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const FONT_SIZES = [
  { label: 'S', value: 0.85 },
  { label: 'M', value: 1 },
  { label: 'L', value: 1.25 },
];

const SUBTITLE_SHADOW =
  '0 0 8px rgba(0,0,0,0.9), 2px 2px 4px rgba(0,0,0,1), 0 0 2px rgba(0,0,0,1)';

const v4Styles = `
@keyframes v4-breathe {
  0%, 100% { opacity: 0.15; }
  50%      { opacity: 0.35; }
}
@keyframes v4-sub-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes v4-toast {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.v4-breathe { animation: v4-breathe 3s ease-in-out infinite; }
.v4-sub-in  { animation: v4-sub-in 150ms ${EASE} both; }
.v4-toast   { animation: v4-toast 220ms ${EASE} both; }
.v4-btn {
  transition: background-color 180ms ${EASE}, transform 180ms ${EASE}, color 180ms ${EASE};
}
.v4-btn:active { transform: scale(0.94); }
`;

export default function AppV4() {
  const [sourceLang, setSourceLang] = useState('ko');
  const [fontScale, setFontScale] = useState(1);
  const [original, setOriginal] = useState('');
  const [translation, setTranslation] = useState('');
  const [translating, setTranslating] = useState(0);
  const [translateError, setTranslateError] = useState(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [hudGlow, setHudGlow] = useState(false);

  const lastSentRef = useRef('');
  const initializedRef = useRef(false);
  const hideTimerRef = useRef(null);
  const glowTimerRef = useRef(null);

  const camera = useCamera();
  const cameraStartRef = useRef(camera.start);
  cameraStartRef.current = camera.start;

  const handleFinal = useCallback(
    async (text) => {
      if (!text || text.length < 2) return;
      if (text === lastSentRef.current) return;
      lastSentRef.current = text;

      setOriginal(text);

      setHudGlow(true);
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
      glowTimerRef.current = setTimeout(() => setHudGlow(false), 400);

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

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    };
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  const handleToggleListen = useCallback(() => {
    if (listening) {
      stop();
    } else {
      setTranslateError(null);
      start();
    }
    revealControls();
  }, [listening, start, stop, revealControls]);

  const handleSwapLang = useCallback(() => {
    setSourceLang((prev) => (prev === 'ko' ? 'zh' : 'ko'));
    revealControls();
  }, [revealControls]);

  const handleToggleCamera = useCallback(() => {
    camera.toggle();
    revealControls();
  }, [camera, revealControls]);

  const handleFontScale = useCallback(
    (v) => {
      setFontScale(v);
      revealControls();
    },
    [revealControls]
  );

  const combinedError =
    speechError ||
    translateError ||
    camera.error ||
    (!speechSupported
      ? '이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge를 사용해주세요.'
      : null);

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
      <style>{v4Styles}</style>
      <div
        className="fixed inset-0 overflow-hidden"
        style={{
          background: '#000000',
          fontFamily: FONT_STACK,
          color: '#ffffff',
          touchAction: 'manipulation',
          WebkitFontSmoothing: 'antialiased',
          minHeight: '100dvh',
        }}
        onClick={revealControls}
      >
        <CameraLayer
          stream={camera.stream}
          enabled={camera.enabled}
          facing={camera.facing}
        />

        <CornerBrackets glow={hudGlow} />

        <Wordmark />

        <SubtitleLayer
          original={original}
          interim={interim}
          translation={translation}
          fontScale={fontScale}
        />

        <ControlsOverlay
          visible={controlsVisible}
          listening={listening}
          onToggleListen={handleToggleListen}
          sourceLang={sourceLang}
          onSwapLang={handleSwapLang}
          cameraEnabled={camera.enabled}
          onToggleCamera={handleToggleCamera}
          cameraSupported={camera.supported}
          fontScale={fontScale}
          onFontScaleChange={handleFontScale}
          translating={translating > 0}
        />

        {errorVisible && combinedError && <ErrorPill message={combinedError} />}
      </div>
    </>
  );
}

function CameraLayer({ stream, enabled, facing }) {
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

  const mirror = facing === 'user';
  const show = enabled && !!stream;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`absolute inset-0 w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
      style={{
        opacity: show ? 1 : 0,
        transition: `opacity 400ms ${EASE}`,
        background: '#000000',
      }}
    />
  );
}

function CornerBrackets({ glow }) {
  const color = glow ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)';
  const filter = glow
    ? 'drop-shadow(0 0 6px rgba(255,255,255,0.45))'
    : 'none';
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        top: '4%',
        right: '4%',
        bottom: '4%',
        left: '4%',
      }}
    >
      <Bracket corner="tl" color={color} filter={filter} glow={glow} />
      <Bracket corner="tr" color={color} filter={filter} glow={glow} />
      <Bracket corner="br" color={color} filter={filter} glow={glow} />
      <Bracket corner="bl" color={color} filter={filter} glow={glow} />
    </div>
  );
}

function Bracket({ corner, color, filter, glow }) {
  const pos = {
    tl: { top: 0, left: 0, rotate: 0 },
    tr: { top: 0, right: 0, rotate: 90 },
    br: { bottom: 0, right: 0, rotate: 180 },
    bl: { bottom: 0, left: 0, rotate: 270 },
  }[corner];

  return (
    <svg
      viewBox="0 0 40 40"
      className={glow ? '' : 'v4-breathe'}
      style={{
        position: 'absolute',
        width: 40,
        height: 40,
        top: pos.top,
        right: pos.right,
        bottom: pos.bottom,
        left: pos.left,
        transform: `rotate(${pos.rotate}deg)`,
        opacity: glow ? 1 : undefined,
        transition: `opacity 200ms ${EASE}`,
        filter,
      }}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2 16 V4 Q2 2 4 2 H16" />
    </svg>
  );
}

function Wordmark() {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        top: `calc(env(safe-area-inset-top) + 14px)`,
        left: `calc(env(safe-area-inset-left) + 16px)`,
        fontSize: 10,
        letterSpacing: '0.22em',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.4)',
        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
      }}
    >
      MEETING.SUB
    </div>
  );
}

function SubtitleLayer({ original, interim, translation, fontScale }) {
  const origText = original || interim || '';
  const origItalic = !original && !!interim;

  const origSize = 14 * fontScale;
  const transSize = 22 * fontScale;

  if (!origText && !translation) return null;

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        bottom: `calc(12% + env(safe-area-inset-bottom))`,
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '80vw',
        textAlign: 'center',
      }}
    >
      {origText && (
        <div
          key={`v4-orig-${origText}`}
          className="v4-sub-in"
          style={{
            fontSize: origSize,
            color: 'rgba(255,255,255,0.65)',
            fontWeight: 400,
            fontStyle: origItalic ? 'italic' : 'normal',
            lineHeight: 1.35,
            letterSpacing: 0,
            textShadow: SUBTITLE_SHADOW,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
            marginBottom: translation ? 6 : 0,
          }}
        >
          {origText}
        </div>
      )}
      {translation && (
        <div
          key={`v4-trans-${translation}`}
          className="v4-sub-in"
          style={{
            fontSize: transSize,
            color: '#FFFFFF',
            fontWeight: 600,
            lineHeight: 1.3,
            letterSpacing: '-0.3px',
            textShadow: SUBTITLE_SHADOW,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
          }}
        >
          {translation}
        </div>
      )}
    </div>
  );
}

function ControlsOverlay({
  visible,
  listening,
  onToggleListen,
  sourceLang,
  onSwapLang,
  cameraEnabled,
  onToggleCamera,
  cameraSupported,
  fontScale,
  onFontScaleChange,
  translating,
}) {
  return (
    <div
      className="absolute left-0 right-0"
      style={{
        bottom: 0,
        paddingBottom: `calc(env(safe-area-inset-bottom) + 16px)`,
        paddingLeft: `calc(env(safe-area-inset-left) + 16px)`,
        paddingRight: `calc(env(safe-area-inset-right) + 16px)`,
        paddingTop: 12,
        display: 'flex',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: `opacity 200ms ${EASE}, transform 200ms ${EASE}`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: 6,
          borderRadius: 999,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(10px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <StatusDot listening={listening} translating={translating} />
        <LangButton sourceLang={sourceLang} onClick={onSwapLang} />
        <MicButton listening={listening} onClick={onToggleListen} />
        {cameraSupported && (
          <CamButton enabled={cameraEnabled} onClick={onToggleCamera} />
        )}
        <FontSeg value={fontScale} onChange={onFontScaleChange} />
      </div>
    </div>
  );
}

function StatusDot({ listening, translating }) {
  const active = listening || translating;
  const color = listening ? '#ef4444' : translating ? '#ffffff' : 'rgba(255,255,255,0.3)';
  const glow = listening
    ? '0 0 10px rgba(239,68,68,0.8)'
    : translating
    ? '0 0 8px rgba(255,255,255,0.5)'
    : 'none';
  return (
    <div
      style={{
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          background: color,
          boxShadow: glow,
          transition: `background 220ms ${EASE}, box-shadow 220ms ${EASE}`,
          opacity: active ? 1 : 0.8,
        }}
      />
    </div>
  );
}

function LangButton({ sourceLang, onClick }) {
  const label = sourceLang === 'ko' ? 'KO→ZH' : 'ZH→KO';
  return (
    <button
      onClick={onClick}
      className="v4-btn"
      style={{
        minWidth: 72,
        height: 44,
        padding: '0 14px',
        borderRadius: 22,
        background: 'transparent',
        border: 'none',
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.06em',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function MicButton({ listening, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={listening ? '중지' : '시작'}
      className="v4-btn"
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        background: listening ? '#ef4444' : 'rgba(255,255,255,0.1)',
        border: 'none',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: listening ? '0 0 12px rgba(239,68,68,0.55)' : 'none',
      }}
    >
      {listening ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <rect x="7" y="7" width="10" height="10" rx="2" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
        </svg>
      )}
    </button>
  );
}

function CamButton({ enabled, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={enabled ? '카메라 끄기' : '카메라 켜기'}
      className="v4-btn"
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        background: 'transparent',
        border: 'none',
        color: enabled ? '#ffffff' : 'rgba(255,255,255,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
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
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 36,
        padding: 3,
        borderRadius: 18,
        background: 'rgba(255,255,255,0.06)',
      }}
    >
      {FONT_SIZES.map((opt) => {
        const active = Math.abs(value - opt.value) < 0.01;
        return (
          <button
            key={opt.label}
            onClick={() => onChange(opt.value)}
            className="v4-btn"
            style={{
              minWidth: 30,
              height: 30,
              padding: '0 10px',
              borderRadius: 15,
              background: active ? 'rgba(255,255,255,0.95)' : 'transparent',
              border: 'none',
              color: active ? '#000000' : '#ffffff',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
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
      className="pointer-events-none fixed inset-x-0 flex justify-center px-4"
      style={{
        top: `calc(env(safe-area-inset-top) + 10px)`,
        zIndex: 50,
      }}
    >
      <div
        className="v4-toast"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 999,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#fca5a5',
          fontSize: 12,
          fontWeight: 500,
          maxWidth: '90vw',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: '#ef4444',
            boxShadow: '0 0 8px rgba(239,68,68,0.8)',
          }}
        />
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {message}
        </span>
      </div>
    </div>
  );
}
