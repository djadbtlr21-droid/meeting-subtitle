import React, { useEffect, useRef } from 'react';

export default function CameraView({ stream, enabled, facing, fallbackMessage }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream && enabled) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      const play = video.play();
      if (play && typeof play.catch === 'function') play.catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream, enabled]);

  const showVideo = enabled && !!stream;
  const mirror = facing === 'user';

  return (
    <div className="absolute inset-0 bg-[#0a0a0a] overflow-hidden">
      {showVideo ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 hud-vignette" />
          <div aria-hidden className="pointer-events-none absolute inset-0 hud-noise" />
        </>
      ) : (
        <NoSignalFallback message={fallbackMessage} />
      )}
    </div>
  );
}

function NoSignalFallback({ message }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#141418_0%,#070708_80%)]">
      <div className="glass rounded-2xl px-6 py-5 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-hud text-hud-cyan" style={{ fontSize: '10px' }}>
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#00E5FF', boxShadow: '0 0 8px #00E5FF' }}
          />
          NO SIGNAL
        </div>
        <div className="text-white/55 text-sm">{message || '카메라 꺼짐'}</div>
        <div className="text-mono-hud text-white/30" style={{ fontSize: '9px' }}>
          DEVICE · OFFLINE
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 hud-noise" />
    </div>
  );
}
