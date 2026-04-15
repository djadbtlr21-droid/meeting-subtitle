import { LANG_NAMES } from './detectLang.js';

const ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

const cache = new Map();
const CACHE_MAX = 50;

function cacheKey(text, source, target) {
  return `${source}->${target}::${text}`;
}

function rememberCache(key, value) {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}

export async function translate(text, source, target) {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_KEY가 설정되지 않았습니다.');

  const trimmed = text.trim();
  if (!trimmed) return '';

  const key = cacheKey(trimmed, source, target);
  if (cache.has(key)) return cache.get(key);

  const prompt =
    `Translate the following ${LANG_NAMES[source]} text to ${LANG_NAMES[target]}. ` +
    `Output ONLY the translation — no quotes, no explanation, no romanization.\n\n${trimmed}`;

  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const out =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim() || '';

  rememberCache(key, out);
  return out;
}
