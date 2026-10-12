export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick(list, seed, salt = 0) {
  if (!list?.length) return "";
  return list[(seed + salt) % list.length];
}

export function rotate(list, seed) {
  if (!list?.length) return [];
  const start = seed % list.length;
  return list.slice(start).concat(list.slice(0, start));
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function hasBatchim(word) {
  const text = String(word).trim();
  if (!text) return false;
  const code = text.charCodeAt(text.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

export function josa(word, pair) {
  const batchim = hasBatchim(word);
  const table = {
    을를: batchim ? "을" : "를",
    은는: batchim ? "은" : "는",
    이가: batchim ? "이" : "가",
    과와: batchim ? "과" : "와",
  };
  return `${word}${table[pair] || ""}`;
}

export function fill(template, map) {
  return String(template).replace(/\{([^{}]+)\}/g, (_, key) => map[key] ?? `{${key}}`);
}

export function shortId(input) {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  let cursor = input;
  for (let i = 0; i < 6; i += 1) {
    cursor = `${hash(cursor)}:${input}:${i}`;
    out += alphabet[hash(cursor) % alphabet.length];
  }
  return out;
}

const SPIN = [
  ["수 있습니다", ["수 있습니다", "수 있는 편입니다", "가능성이 있습니다", "경우가 있습니다"]],
  ["수 있어", ["수 있어", "수 있어서", "가능성이 있어", "경향이 있어"]],
  ["해야 합니다", ["해야 합니다", "하는 편이 맞습니다", "일정에 넣습니다"]],
  ["하지 않습니다", ["하지 않습니다", "않는 편입니다", "전제로 두지 않습니다"]],
  ["안내합니다", ["안내합니다", "정리해 드립니다", "풀어 설명합니다"]],
  ["확인합니다", ["확인합니다", "대조해 봅니다", "목록에 남깁니다"]],
  ["말씀드립니다", ["말씀드립니다", "전해 드립니다", "상담 메모에 남깁니다"]],
  ["필요합니다", ["필요합니다", "전제입니다", "빠져서는 곤란합니다"]],
  ["좋습니다", ["좋습니다", "맞습니다", "무난한 편입니다"]],
  ["많습니다", ["많습니다", "적지 않습니다", "흔하게 봅니다"]],
  ["먼저", ["먼저", "우선", "처음부터"]],
];

export function spinText(text, seed) {
  let out = String(text);
  let cursor = seed >>> 0;
  for (const [from, options] of SPIN) {
    if (!out.includes(from)) continue;
    cursor = (Math.imul(cursor ^ from.length, 16777619) + options.length) >>> 0;
    const next = options[cursor % options.length];
    if (next !== from) out = out.replaceAll(from, next);
  }
  return out;
}

export function tokenSet(text) {
  return new Set(
    String(text)
      .replace(/<[^>]+>/g, " ")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 1),
  );
}

export function jaccard(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);
  let inter = 0;
  for (const token of A) if (B.has(token)) inter += 1;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}
