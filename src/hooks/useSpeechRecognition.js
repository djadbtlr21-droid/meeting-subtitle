import { useCallback, useEffect, useRef, useState } from 'react';

const SR = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

export const isSpeechSupported = !!SR;

export function useSpeechRecognition({ lang, onFinal } = {}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const shouldRunRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  const langRef = useRef(lang);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    langRef.current = lang;
    const rec = recognitionRef.current;
    if (rec) rec.lang = lang;
  }, [lang]);

  const ensureInstance = useCallback(() => {
    if (!SR) return null;
    if (recognitionRef.current) return recognitionRef.current;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = langRef.current || 'ko-KR';

    rec.onresult = (event) => {
      // Strict split: isFinal===true → commit sentence via onFinal (translation trigger).
      // isFinal===false → interim live-preview only; NEVER trigger translation.
      let interimText = '';
      let sawFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          sawFinal = true;
          const clean = transcript.trim();
          if (clean.length > 1) onFinalRef.current?.(clean);
        } else {
          interimText += transcript;
        }
      }
      // Clear interim on final; otherwise mirror the latest interim buffer.
      if (sawFinal && !interimText) setInterim('');
      else setInterim(interimText);
    };

    rec.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('마이크 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
        shouldRunRef.current = false;
        setListening(false);
      } else {
        setError(`음성 인식 오류: ${event.error}`);
      }
    };

    rec.onend = () => {
      if (shouldRunRef.current) {
        try {
          rec.lang = langRef.current;
          rec.start();
        } catch {
          // 이미 시작됨 등 무시
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = rec;
    return rec;
  }, []);

  const start = useCallback(() => {
    const rec = ensureInstance();
    if (!rec) {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome/Edge를 사용해주세요.');
      return;
    }
    setError(null);
    shouldRunRef.current = true;
    try {
      rec.lang = langRef.current;
      rec.start();
      setListening(true);
    } catch {
      // 이미 시작된 상태
      setListening(true);
    }
  }, [ensureInstance]);

  const stop = useCallback(() => {
    shouldRunRef.current = false;
    const rec = recognitionRef.current;
    if (rec) {
      try { rec.stop(); } catch { /* noop */ }
    }
    setListening(false);
    setInterim('');
  }, []);

  useEffect(() => () => {
    shouldRunRef.current = false;
    const rec = recognitionRef.current;
    if (rec) {
      try { rec.abort(); } catch { /* noop */ }
    }
  }, []);

  return { listening, interim, error, start, stop, supported: isSpeechSupported };
}
