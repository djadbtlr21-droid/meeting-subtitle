import React, { useCallback, useEffect, useRef, useState } from 'react';
import ControlPanel from './components/ControlPanel.jsx';
import SubtitleOverlay from './components/SubtitleOverlay.jsx';
import CameraView from './components/CameraView.jsx';
import FaceHudOverlay from './components/FaceHudOverlay.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import { useSpeechRecognition, isSpeechSupported } from './hooks/useSpeechRecognition.js';
import { useCamera, requestInitialPermissions } from './hooks/useCamera.js';
import { translate } from './lib/gemini.js';
import { detectLang, otherLang, SPEECH_LANG } from './lib/detectLang.js';

export default function App() {
  const [sourceLang, setSourceLang] = useState('ko');
  const [fontScale, setFontScale] = useState(1);
  const [history, setHistory] = useState([]);
  const [pendingOriginal, setPendingOriginal] = useState('');
  const [translating, setTranslating] = useState(0);
  const [translateError, setTranslateError] = useState(null);
  const [errorVisible, setErrorVisible] = useState(false);

  const lastSentRef = useRef('');
  const initializedRef = useRef(false);

  const camera = useCamera();
  const cameraStartRef = useRef(camera.start);
  cameraStartRef.current = camera.start;

  const handleFinal = useCallback(async (text) => {
    if (!text || text.length < 2) return;
    if (text === lastSentRef.current) return;
    lastSentRef.current = text;

    setPendingOriginal(text);

    const detected = detectLang(text, sourceLang);
    const target = otherLang(detected);

    setTranslating((n) => n + 1);
    setTranslateError(null);
    try {
      const out = await translate(text, detected, target);
      setHistory((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, original: text, translation: out },
      ]);
      setPendingOriginal('');
    } catch (err) {
      setTranslateError(err.message || '번역 실패');
    } finally {
      setTranslating((n) => Math.max(0, n - 1));
    }
  }, [sourceLang]);

  const { listening, interim, error: speechError, start, stop, supported: speechSupported } =
    useSpeechRecognition({
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

  const handleStart = useCallback(() => {
    setTranslateError(null);
    start();
  }, [start]);

  let status = 'idle';
  if (speechError || translateError) status = 'error';
  else if (translating > 0) status = 'translating';
  else if (listening) status = 'listening';

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
    const t = setTimeout(() => setErrorVisible(false), 5200);
    return () => clearTimeout(t);
  }, [combinedError]);

  const fallbackMsg = !camera.supported
    ? '카메라 미지원 브라우저'
    : camera.error
    ? '카메라를 사용할 수 없습니다'
    : '카메라 꺼짐';

  const latestTranslation = history.length > 0 ? history[history.length - 1].translation : '';
  const hasAnyContent = history.length > 0 || !!pendingOriginal || !!interim;

  return (
    <div className="fixed inset-0 w-full h-full bg-[#0a0a0a] text-white overflow-hidden flex flex-col">
      <div className="relative w-full h-1/2 overflow-hidden">
        <CameraView
          stream={camera.stream}
          enabled={camera.enabled}
          facing={camera.facing}
          fallbackMessage={fallbackMsg}
        />

        <FaceHudOverlay
          active={camera.enabled && !!camera.stream}
          voiceDetected={listening}
          translating={translating > 0}
          hasTranslation={!!latestTranslation && translating === 0}
        />

        <BrandMark />
      </div>

      <div className="relative w-full h-1/2 overflow-hidden">
        <SubtitleOverlay
          history={history}
          pendingOriginal={pendingOriginal}
          interim={interim}
          fontScale={fontScale}
          listening={listening}
          translating={translating > 0}
        />
      </div>

      {errorVisible && combinedError && (
        <div className="pointer-events-none absolute top-3 inset-x-0 z-40 flex justify-center px-4">
          <div
            className="pointer-events-auto animate-slideDown glass rounded-full px-4 py-2 flex items-center gap-2 text-hud"
            style={{
              fontSize: '10px',
              color: '#FF4D6D',
              boxShadow: '0 0 18px rgba(255,77,109,0.35), inset 0 0 0 1px rgba(255,77,109,0.35)',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#FF4D6D', boxShadow: '0 0 8px #FF4D6D' }}
            />
            <span className="max-w-[70vw] truncate normal-case tracking-normal font-sans text-[12px] text-white/90">
              {combinedError}
            </span>
          </div>
        </div>
      )}

      <InstallPrompt />

      <ControlPanel
        listening={listening}
        onStart={handleStart}
        onStop={stop}
        sourceLang={sourceLang}
        onSourceLangChange={setSourceLang}
        fontScale={fontScale}
        onFontScaleChange={setFontScale}
        status={status}
        error={combinedError}
        cameraEnabled={camera.enabled}
        onToggleCamera={camera.toggle}
        onSwitchCamera={camera.switchCamera}
        cameraSupported={camera.supported}
      />
    </div>
  );
}

function BrandMark() {
  return (
    <div className="pointer-events-none absolute top-4 left-4 z-30 flex items-center gap-2 select-none">
      <span
        className="inline-block w-2 h-2 rounded-sm"
        style={{ background: '#00E5FF', boxShadow: '0 0 10px #00E5FF' }}
      />
      <div className="flex flex-col leading-none">
        <span className="text-hud text-white/90" style={{ fontSize: '11px' }}>
          MEETING<span className="text-hud-cyan">.SUB</span>
        </span>
        <span className="text-mono-hud text-white/35 mt-1" style={{ fontSize: '8.5px' }}>
          v0.1 · KO⇄ZH
        </span>
      </div>
    </div>
  );
}
