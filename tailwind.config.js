/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        hud: {
          bg: '#0a0a0a',
          cyan: '#00E5FF',
          cyanSoft: 'rgba(0, 229, 255, 0.18)',
          lime: '#B4FF39',
          limeSoft: 'rgba(180, 255, 57, 0.20)',
          danger: '#FF4D6D',
          dangerSoft: 'rgba(255, 77, 109, 0.18)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Noto Sans KR', 'Noto Sans SC', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(0%)', opacity: '0.0' },
          '8%': { opacity: '1' },
          '92%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0.0' },
        },
        cornerPulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        gridDrift: {
          '0%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(-6px,-4px,0)' },
          '100%': { transform: 'translate3d(0,0,0)' },
        },
        meshTwinkle: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        ringGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 229, 255, 0.45), 0 0 18px rgba(0, 229, 255, 0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 229, 255, 0.0), 0 0 28px rgba(0, 229, 255, 0.55)' },
        },
        ringGlowLime: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(180, 255, 57, 0.45), 0 0 18px rgba(180, 255, 57, 0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgba(180, 255, 57, 0.0), 0 0 28px rgba(180, 255, 57, 0.55)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sparkleDot: {
          '0%, 100%': { opacity: '0.25', transform: 'scaleY(0.4)' },
          '50%': { opacity: '1', transform: 'scaleY(1)' },
        },
      },
      animation: {
        scanline: 'scanline 2.4s linear infinite',
        cornerPulse: 'cornerPulse 2s ease-in-out infinite',
        gridDrift: 'gridDrift 12s ease-in-out infinite',
        meshTwinkle: 'meshTwinkle 3s ease-in-out infinite',
        ringGlow: 'ringGlow 1.6s ease-in-out infinite',
        ringGlowLime: 'ringGlowLime 1.6s ease-in-out infinite',
        fadeInUp: 'fadeInUp 360ms cubic-bezier(0.22, 1, 0.36, 1) both',
        slideDown: 'slideDown 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        sparkleDot: 'sparkleDot 900ms ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(0, 229, 255, 0.45), inset 0 0 0 1px rgba(0, 229, 255, 0.35)',
        'glow-lime': '0 0 24px rgba(180, 255, 57, 0.45), inset 0 0 0 1px rgba(180, 255, 57, 0.35)',
        'glow-danger': '0 0 18px rgba(255, 77, 109, 0.45)',
        'glass': 'inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 40px rgba(0,0,0,0.55)',
      },
    },
  },
  plugins: [],
};
