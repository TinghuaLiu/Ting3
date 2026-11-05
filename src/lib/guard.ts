/**
 * The code-side half of the "never rewrites" guarantee, plus quote anchoring.
 * Deterministic and model-independent: whatever the model returns, rewritten wording is stripped
 * before the writer sees it. Shared with the eval harness.
 */

export const REDACTED = '［改写建议已移除］';

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

// Opening → closing quote pairs used in zh / en / de text.
const QUOTE_RE = /“([^”]{1,400})”|"([^"]{1,400})"|„([^“”]{1,400})[“”]|‚([^‘’]{1,400})[‘’]|「([^」]{1,400})」|『([^』]{1,400})』|«([^»]{1,400})»|‹([^›]{1,400})›|‘([^’]{1,400})’|(?<![A-Za-z])'([^'\n]{2,400})'(?![A-Za-z])/g;

// Phrases that introduce replacement wording; whatever follows up to the end of the clause is removed.
const CUE_RE =
  /(建议写成|建议改为|可以写成|改为|改成|换成|写成|可以写|可写为|可改为|建议写|不如写|例如写成|比如写成|替换为|rewrite (?:it |this )?as|rephrase (?:it |this )?as|replace (?:it |this )?with|change (?:it |this )?to|could read|might read|instead,? (?:write|say)|for example,? write|e\.g\.,? write|könnte lauten|ersetzen durch|ersetzen Sie (?:es )?durch|umformulieren zu|Vorschlag:|suggestion:|better:)\s*[:：]?\s*([^。.!?！？\n]{2,})/gi;

export interface GuardResult {
  text: string;
  redactions: number;
}

const CJK = /[぀-ヿ㐀-鿿가-힯]/g;
/** true if the text is written mainly in CJK script */
const isCjk = (s: string) => (s.match(CJK)?.length ?? 0) > s.replace(/\s/g, '').length * 0.3;

/** Bigrams of characters (CJK) or words (other scripts). */
function bigrams(s: string): string[] {
  const t = norm(s);
  if (isCjk(t)) {
    const c = [...t.replace(/[\s\p{P}]/gu, '')];
    return c.slice(1).map((x, i) => c[i] + x);
  }
  const w = t.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return w.slice(1).map((x, i) => `${w[i]} ${x}`);
}

/**
 * True when a quoted fragment is essentially the writer's own wording (≥ 75 % of its bigrams occur
 * in the draft). A rewrite introduces new wording and falls well below that.
 */
export function nearQuote(fragment: string, draft: string): boolean {
  const q = bigrams(fragment);
  if (q.length < 2) return false;
  const d = new Set(bigrams(draft));
  return q.filter((b) => d.has(b)).length / q.length >= 0.75;
}

/**
 * True for a short label that only reuses the writer's own words — e.g. “成绩下降” for the draft's
 * “成绩一定会下降”. Short (≤ 12 CJK chars / ≤ 4 words) and ≥ 85 % of its characters (CJK) or words
 * occur in the draft: too short and too unoriginal to be pasted in as new wording.
 */
export function ownWordsLabel(fragment: string, draft: string): boolean {
  const f = norm(fragment);
  const d = norm(draft);
  if (isCjk(f)) {
    const chars = [...f.replace(/[\s\p{P}]/gu, '')];
    if (chars.length === 0 || chars.length > 12) return false;
    return chars.filter((c) => d.includes(c)).length / chars.length >= 0.85;
  }
  const words = f.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (words.length === 0 || words.length > 4) return false;
  const dw = new Set(d.split(/[^\p{L}\p{N}]+/u));
  return words.filter((w) => dw.has(w)).length / words.length >= 0.85;
}

/** Removes quoted wording that is not in the draft, and text introduced by rewrite cues. */
export function redactRewrites(text: string, draft: string): GuardResult {
  const d = norm(draft);
  const draftCjk = isCjk(draft);
  let redactions = 0;
  let out = text.replace(QUOTE_RE, (whole, ...groups) => {
    const inner = groups.slice(0, 10).find((g) => typeof g === 'string') as string | undefined;
    if (!inner) return whole;
    if (d.includes(norm(inner))) return whole; // quoting the writer's own text is fine
    if (nearQuote(inner, draft)) return whole; // a slightly shortened quote of the writer's text is still their text
    if (ownWordsLabel(inner, draft)) return whole; // a short label made of the writer's own words
    // A quote in another script than the draft (e.g. a Chinese gloss of an English phrase) can't be pasted into it.
    if (isCjk(inner) !== draftCjk) return whole;
    redactions++;
    return REDACTED;
  });
  out = out.replace(CUE_RE, (_whole, cue: string) => {
    redactions++;
    return `${cue} ${REDACTED}`;
  });
  return { text: out, redactions };
}

/** Finds a quote in the draft: exact (whitespace-insensitive), then case-insensitive, then fuzzy by sentence. */
export function anchor(quote: string, draft: string): { start: number; end: number } | null {
  const q = quote.trim();
  if (!q) return null;
  const direct = draft.indexOf(q);
  if (direct >= 0) return { start: direct, end: direct + q.length };
  // whitespace-insensitive search with an index map back into the draft
  const map: number[] = [];
  let flat = '';
  for (let i = 0; i < draft.length; i++) {
    const c = draft[i];
    if (/\s/.test(c)) {
      if (flat.endsWith(' ') || flat.length === 0) continue;
      flat += ' ';
    } else flat += c.toLowerCase();
    map.push(i);
  }
  const nq = norm(q);
  const at = flat.indexOf(nq);
  if (at >= 0) return { start: map[at], end: map[at + nq.length - 1] + 1 };
  // fuzzy: best matching sentence by character-trigram Dice coefficient
  const grams = (s: string) => {
    const t = norm(s);
    const g = new Set<string>();
    for (let i = 0; i + 3 <= t.length; i++) g.add(t.slice(i, i + 3));
    return g;
  };
  const gq = grams(q);
  if (gq.size < 3) return null;
  let best: { start: number; end: number } | null = null;
  let bestScore = 0;
  const re = /[^.!?。！？\n]+[.!?。！？]?/g;
  for (let m = re.exec(draft); m; m = re.exec(draft)) {
    const g = grams(m[0]);
    let hit = 0;
    for (const x of gq) if (g.has(x)) hit++;
    const score = (2 * hit) / (gq.size + g.size);
    if (score > bestScore) {
      bestScore = score;
      const lead = m[0].length - m[0].trimStart().length;
      best = { start: m.index + lead, end: m.index + m[0].trimEnd().length };
    }
  }
  return bestScore >= 0.6 ? best : null;
}
