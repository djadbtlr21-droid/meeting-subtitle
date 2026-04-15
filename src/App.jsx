import React, { useCallback, useEffect, useRef, useState } from 'react';
import ControlPanel from './components/ControlPanel.jsx';
import SubtitleOverlay from './components/SubtitleOverlay.jsx';
import { useSpeechRecognition, isSpeechSupported } from './hooks/useSpeechRecognition.js';
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

  const { listening, interim, error, start, stop, supported } = useSpeechRecognition({
    lang: SPEECH_LANG[sourceLang],
    onFinal: handleFinal,
  });

  useEffect(() => {
    if (!isSpeechSupported) return;
  }, []);

  const handleStart = useCallback(() => {
    setTranslateError(null);
    start();
  }, [start]);

  let status = 'idle';
  if (error || translateError) status = 'error';
  else if (translating > 0) status = 'translating';
  else if (listening) status = 'listening';

  const combinedError = error || translateError ||
    (!supported ? '이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge를 사용해주세요.' : null);

  return (
    <div className="min-h-screen w-full bg-neutral-900 text-white relative">
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
      />

      <main className="pt-32 sm:pt-28 px-4 pb-48 max-w-3xl mx-auto text-center text-white/60">
        <h1 className="text-2xl sm:text-3xl font-bold mt-4 text-white">회의 자막 번역</h1>
        <p className="mt-3 text-sm sm:text-base">
          한국어 ↔ 중국어 실시간 자막 · Web Speech API + Gemini
        </p>
        <ol className="mt-6 text-left text-sm sm:text-base space-y-2 text-white/70">
          <li>1. 상단에서 <b className="text-white">주 언어</b>(주로 말할 언어)를 선택하세요.</li>
          <li>2. <b className="text-white">시작</b> 버튼을 누르고 마이크 권한을 허용하세요.</li>
          <li>3. 화면 하단에 원문과 번역이 실시간으로 표시됩니다.</li>
          <li>4. <b className="text-white">폰트 크기</b>는 우측 버튼으로 조절할 수 있습니다.</li>
        </ol>
        <p className="mt-6 text-xs text-white/40">
          * 정확한 인식을 위해 HTTPS 환경(배포본 또는 localhost)에서 사용하세요.
        </p>
      </main>

      <SubtitleOverlay
        original={original}
        translation={translation}
        interim={interim}
        fontScale={fontScale}
      />
    </div>
  );
}
