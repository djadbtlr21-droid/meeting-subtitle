import { useCallback, useEffect, useRef, useState } from 'react';

function stopStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    try { track.stop(); } catch { /* noop */ }
  });
}

export function useCamera() {
  const [stream, setStream] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [facing, setFacing] = useState('user');
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);

  const streamRef = useRef(null);
  const enabledRef = useRef(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }
  }, []);

  const stop = useCallback(() => {
    enabledRef.current = false;
    const s = streamRef.current;
    streamRef.current = null;
    setStream(null);
    setEnabled(false);
    stopStream(s);
  }, []);

  const start = useCallback(async (nextFacing) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
      setError('이 브라우저는 카메라를 지원하지 않습니다.');
      return;
    }
    setError(null);
    const target = nextFacing || facing;
    enabledRef.current = true;

    // 기존 스트림 먼저 정리 (facing 전환 시 중요)
    const prev = streamRef.current;
    streamRef.current = null;
    stopStream(prev);

    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: target }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (!enabledRef.current) {
        stopStream(s);
        return;
      }
      streamRef.current = s;
      setStream(s);
      setEnabled(true);
      setFacing(target);
    } catch (e) {
      enabledRef.current = false;
      setEnabled(false);
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('카메라 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
      } else if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') {
        setError('사용 가능한 카메라를 찾을 수 없습니다.');
      } else {
        setError(`카메라 오류: ${e.name || e.message}`);
      }
    }
  }, [facing]);

  const toggle = useCallback(() => {
    if (enabledRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  const switchCamera = useCallback(() => {
    const next = facing === 'user' ? 'environment' : 'user';
    start(next);
  }, [facing, start]);

  useEffect(() => () => {
    enabledRef.current = false;
    stopStream(streamRef.current);
    streamRef.current = null;
  }, []);

  return { stream, enabled, facing, error, supported, start, stop, toggle, switchCamera };
}

export async function requestInitialPermissions() {
  if (!navigator.mediaDevices?.getUserMedia) return;
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    s.getTracks().forEach((t) => {
      try { t.stop(); } catch { /* noop */ }
    });
  } catch {
    // 사용자가 거부하면 각 기능이 필요할 때 다시 요청됨
  }
}
