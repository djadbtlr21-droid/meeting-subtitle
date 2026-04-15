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
    <div className="absolute inset-0 bg-black overflow-hidden">
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/40 text-sm select-none">
          {fallbackMessage || '카메라 꺼짐'}
        </div>
      )}
    </div>
  );
}
