import React, { useCallback, useEffect, useRef, useState } from 'react';
import ControlPanel from './components/ControlPanel.jsx';
import SubtitleOverlay from './components/SubtitleOverlay.jsx';
import CameraView from './components/CameraView.jsx';
import { useSpeechRecognition, isSpeechSupported } from './hooks/useSpeechRecognition.js';
import { useCamera, requestInitialPermissions } from './hooks/useCamera.js';
import { translate } from './lib/gemini.js';
import { detectLang, otherLang, SPEECH_LANG } from './lib/detectLang.js';

export default function App() {
  const [sourceLang, setSourceLang] = useState('ko');
  const [fontScale, setFontScale] = useState(1);
  const [original, setOriginal] = useState('');
  const [translation, setTranslation] = useState('');
  const [translating, setTranslating] = useState(0);
  const [translateError, setTranslateError] = useState(null);

  const lastSentRef = useRef('');
  const initializedRef = useRef(false);

  const camera = useCamera();
  const cameraStartRef = useRef(camera.start);
  cameraStartRef.current = camera.start;

  const handleFinal = useCallback(async (text) => {
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
  }, [sourceLang]);

  const { listening, interim, error: speechError, start, stop, supported: speechSupported } =
    useSpeechRecognition({
      lang: SPEECH_LANG[sourceLang],
      onFinal: handleFinal,
    });

  // 마운트 시 카메라 + 마이크 권한을 동시에 요청한 후 카메라 자동 시작
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

  const fallbackMsg = !camera.supported
    ? '카메라 미지원 브라우저'
    : camera.error
    ? '카메라를 사용할 수 없습니다'
    : '카메라 꺼짐';

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden">
      <CameraView
        stream={camera.stream}
        enabled={camera.enabled}
        facing={camera.facing}
        fallbackMessage={fallbackMsg}
      />

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

      <SubtitleOverlay
        original={original}
        translation={translation}
        interim={interim}
        fontScale={fontScale}
      />
    </div>
  );
}
