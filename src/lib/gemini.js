import { LANG_NAMES } from './detectLang.js';

const MODEL = 'gemini-2.5-flash';
const ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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
    let payload;
    try {
      payload = await res.json();
    } catch {
      payload = { raw: await res.text().catch(() => '') };
    }
    const apiMsg = payload?.error?.message || payload?.raw || '(no body)';
    const apiStatus = payload?.error?.status || '';
    // eslint-disable-next-line no-console
    console.error('[Gemini error]', {
      http: res.status,
      model: MODEL,
      status: apiStatus,
      payload,
    });
    const suffix = apiStatus ? ` ${apiStatus}` : '';
    throw new Error(`Gemini ${res.status}${suffix}: ${apiMsg.slice(0, 300)}`);
  }

  const data = await res.json();

  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Gemini blocked: ${blockReason}`);
  }

  const out =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim() || '';

  if (!out) {
    const finishReason = data?.candidates?.[0]?.finishReason;
    // eslint-disable-next-line no-console
    console.warn('[Gemini empty response]', { finishReason, data });
  }

  rememberCache(key, out);
  return out;
}
