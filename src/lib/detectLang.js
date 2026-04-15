const HANGUL = /[\uac00-\ud7a3]/g;
const HAN = /[\u4e00-\u9fff]/g;

export function detectLang(text, fallback = 'ko') {
  if (!text) return fallback;
  const ko = (text.match(HANGUL) || []).length;
  const zh = (text.match(HAN) || []).length;
  if (ko === 0 && zh === 0) return fallback;
  return ko >= zh ? 'ko' : 'zh';
}

export const LANG_NAMES = {
  ko: 'Korean',
  zh: 'Chinese',
};

export const LANG_LABELS = {
  ko: '한국어',
  zh: '中文',
};

export const SPEECH_LANG = {
  ko: 'ko-KR',
  zh: 'zh-CN',
};

export function otherLang(lang) {
  return lang === 'ko' ? 'zh' : 'ko';
}
