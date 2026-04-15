import React, { useEffect, useMemo, useRef, useState } from 'react';

function useCountUp(active, { to = 100, durationMs = 1600 } = {}) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    startRef.current = performance.now();
    const tick = (now) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * to));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, to, durationMs]);

  return value;
}

function buildMesh(seed = 1) {
  const points = [];
  const cols = 6;
  const rows = 7;
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const jx = (rand() - 0.5) * 8;
      const jy = (rand() - 0.5) * 8;
      const x = (c / (cols - 1)) * 100 + jx * 0.35;
      const y = (r / (rows - 1)) * 100 + jy * 0.35;
      points.push({ x: Math.max(3, Math.min(97, x)), y: Math.max(3, Math.min(97, y)) });
    }
  }
  const lines = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 22) lines.push({ a: i, b: j, d });
    }
  }
  return { points, lines };
}

function CornerBracket({ className }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={`absolute w-7 h-7 animate-cornerPulse ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M1 10 V3 Q1 1 3 1 H10" />
    </svg>
  );
}

export default function FaceHudOverlay({ active, voiceDetected, translating, hasTranslation }) {
  const mesh = useMemo(() => buildMesh(7), []);
  const percent = useCountUp(active, { to: 100, durationMs: 1600 });
  const accent = voiceDetected ? 'text-hud-lime' : 'text-hud-cyan';
  const borderColor = voiceDetected ? 'rgba(180,255,57,0.85)' : 'rgba(0,229,255,0.85)';
  const glow = voiceDetected
    ? '0 0 30px rgba(180,255,57,0.30), inset 0 0 0 1px rgba(180,255,57,0.25)'
    : '0 0 30px rgba(0,229,255,0.25), inset 0 0 0 1px rgba(0,229,255,0.20)';

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <div className="hud-vignette absolute inset-0" />

      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[28px]"
        style={{
          width: 'min(60vmin, 520px)',
          height: 'min(72vmin, 620px)',
          border: `1px solid ${borderColor}`,
          boxShadow: glow,
          transition: 'border-color 400ms ease, box-shadow 400ms ease',
        }}
      >
        <CornerBracket className={`-top-[1px] -left-[1px] ${accent}`} />
        <CornerBracket className={`-top-[1px] -right-[1px] rotate-90 ${accent}`} />
        <CornerBracket className={`-bottom-[1px] -right-[1px] rotate-180 ${accent}`} />
        <CornerBracket className={`-bottom-[1px] -left-[1px] -rotate-90 ${accent}`} />

        <div className="absolute inset-0 overflow-hidden rounded-[28px]">
          <div
            className="absolute inset-x-0 h-[72%] top-[14%] pointer-events-none animate-scanline"
            style={{
              background: voiceDetected
                ? 'linear-gradient(180deg, transparent 0%, rgba(180,255,57,0.0) 30%, rgba(180,255,57,0.85) 50%, rgba(180,255,57,0.0) 70%, transparent 100%)'
                : 'linear-gradient(180deg, transparent 0%, rgba(0,229,255,0.0) 30%, rgba(0,229,255,0.85) 50%, rgba(0,229,255,0.0) 70%, transparent 100%)',
              maskImage: 'linear-gradient(180deg, transparent, black 20%, black 80%, transparent)',
            }}
          />

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full animate-gridDrift"
            style={{ opacity: 0.5 }}
          >
            {mesh.lines.map((ln, i) => {
              const a = mesh.points[ln.a];
              const b = mesh.points[ln.b];
              const op = Math.max(0.05, 0.35 - ln.d / 80);
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={voiceDetected ? '#B4FF39' : '#00E5FF'}
                  strokeOpacity={op}
                  strokeWidth="0.12"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {mesh.points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="0.55"
                fill={voiceDetected ? '#B4FF39' : '#00E5FF'}
                className="animate-meshTwinkle"
                style={{ animationDelay: `${(i % 7) * 160}ms` }}
              />
            ))}
          </svg>
        </div>

        <div className={`absolute top-3 left-3 text-hud ${accent}`} style={{ fontSize: '10px' }}>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                background: voiceDetected ? '#B4FF39' : '#00E5FF',
                boxShadow: voiceDetected
                  ? '0 0 8px #B4FF39'
                  : '0 0 8px #00E5FF',
              }}
            />
            {voiceDetected ? 'VOICE DETECTED' : 'ANALYZING...'}
          </div>
          <div className="text-mono-hud mt-1 text-white/45" style={{ fontSize: '9px' }}>
            LOCK 34.021°N · 127.441°E
          </div>
        </div>

        <div className={`absolute top-3 right-3 text-mono-hud ${accent}`} style={{ fontSize: '20px', lineHeight: 1 }}>
          {percent.toString().padStart(3, '0')}
          <span className="text-white/50 text-sm ml-0.5">%</span>
          <div className="text-[9px] text-white/40 text-right mt-1 tracking-widest">SCAN</div>
        </div>

        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <HudChip label="REC" on={voiceDetected} tone="danger" />
          <HudChip label="CAM" on={active} tone="cyan" />
          <HudChip label="NET" on={hasTranslation} tone="lime" pulse={translating} />
        </div>

        <div className="absolute bottom-3 right-3 text-mono-hud text-white/35" style={{ fontSize: '9px' }}>
          ID · 0x7F3A
        </div>
      </div>
    </div>
  );
}

function HudChip({ label, on, tone, pulse }) {
  const color = tone === 'danger' ? '#FF4D6D' : tone === 'lime' ? '#B4FF39' : '#00E5FF';
  return (
    <div
      className="text-hud flex items-center gap-1 px-1.5 py-0.5 rounded-full glass-soft"
      style={{ fontSize: '8.5px', color: on ? color : 'rgba(255,255,255,0.4)' }}
    >
      <span
        className={`inline-block w-1 h-1 rounded-full ${pulse ? 'animate-pulse' : ''}`}
        style={{
          background: on ? color : 'rgba(255,255,255,0.3)',
          boxShadow: on ? `0 0 6px ${color}` : 'none',
        }}
      />
      {label}
    </div>
  );
}
