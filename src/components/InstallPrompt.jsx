import React, { useEffect, useState } from 'react';

const DISMISS_KEY = 'mtgsub.install.dismissedAt';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  const mm = window.matchMedia?.('(display-mode: standalone)')?.matches;
  const iosStandalone = window.navigator.standalone === true;
  return Boolean(mm || iosStandalone);
}

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function wasRecentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    return Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) {
      setInstalled(true);
      return;
    }
    if (wasRecentlyDismissed()) return;

    const onBip = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);

    if (isIos()) {
      const t = setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onBip);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'dismissed') {
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* noop */ }
      }
    } catch { /* noop */ }
    setVisible(false);
    setDeferred(null);
  };

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* noop */ }
    setVisible(false);
  };

  if (installed || !visible) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-24 sm:pb-28 flex justify-center">
      <div
        role="dialog"
        aria-label="앱 설치 안내"
        className="pointer-events-auto animate-fadeInUp glass rounded-2xl p-4 flex items-center gap-3 w-full max-w-md"
        style={{
          boxShadow: '0 0 32px rgba(0,229,255,0.18), inset 0 0 0 1px rgba(0,229,255,0.18)',
        }}
      >
        <div
          aria-hidden
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.25), rgba(0,229,255,0.05))',
            boxShadow: 'inset 0 0 0 1px rgba(0,229,255,0.4)',
          }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12" />
            <path d="M7 10l5 5 5-5" />
            <path d="M4 21h16" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-hud text-hud-cyan mb-0.5" style={{ fontSize: '9px' }}>
            INSTALL · PWA
          </div>
          <div className="text-white/90 text-sm font-semibold leading-tight">
            홈 화면에 추가
          </div>
          <div className="text-white/55 text-[11px] leading-tight mt-0.5 truncate">
            {iosHint
              ? '공유 아이콘 → "홈 화면에 추가"를 누르세요'
              : '오프라인에서도 열람 가능, 앱처럼 사용하세요'}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!iosHint && (
            <button
              onClick={handleInstall}
              className="text-hud px-3 h-8 rounded-full font-bold transition active:scale-[0.96]"
              style={{
                fontSize: '10px',
                background: 'linear-gradient(135deg, #00E5FF 0%, #0097B2 100%)',
                color: '#0a0a0a',
                boxShadow: '0 0 18px rgba(0,229,255,0.45)',
              }}
            >
              ADD
            </button>
          )}
          <button
            onClick={handleDismiss}
            aria-label="닫기"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white/65 transition active:scale-[0.94]"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
