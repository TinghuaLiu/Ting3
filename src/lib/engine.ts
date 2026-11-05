import { callJson, toSpec, type Settings } from '../base/claude';
import { anchor, redactRewrites } from './guard';
import { RecheckSchema, recheckPrompt, ReviewSchema, reviewPrompt, type Category, type DraftMeta, type ReviewOut } from './prompts';

export interface Comment {
  id: number;
  quote: string;
  /** position in the latest draft; null when the quoted text no longer exists there */
  start: number | null;
  end: number | null;
  category: Category;
  severity: 'major' | 'minor';
  question: string;
  why: string;
  round: number;
  status: 'new' | 'resolved' | 'partly' | 'open';
  note?: string;
}

export interface LogEntry {
  at: number;
  action: 'review' | 'recheck';
  model: string;
  comments: number;
  redactions: number;
  dropped: number;
}

export interface Doc {
  id: string;
  title: string;
  createdAt: number;
  meta: DraftMeta;
  drafts: string[];
  comments: Comment[];
  strengths: string[];
  priorities: string[];
  log: LogEntry[];
  demo?: boolean;
}

type RawComment = ReviewOut['comments'][number];

/**
 * Guards and anchors raw model comments against a draft. Comments whose quote can't be found are
 * dropped (they would point at nothing). Shared with the eval harness.
 */
export function processComments(raw: RawComment[], draft: string, round: number, firstId: number) {
  let redactions = 0;
  let dropped = 0;
  const comments: Comment[] = [];
  for (const c of raw) {
    const pos = anchor(c.quote, draft);
    if (!pos) {
      dropped++;
      continue;
    }
    const q = redactRewrites(c.question, draft);
    const w = redactRewrites(c.why, draft);
    redactions += q.redactions + w.redactions;
    comments.push({ id: firstId + comments.length, quote: draft.slice(pos.start, pos.end), start: pos.start, end: pos.end, category: c.category, severity: c.severity, question: q.text, why: w.text, round, status: 'new' });
  }
  return { comments, redactions, dropped };
}

export function guardList(items: string[], draft: string) {
  let redactions = 0;
  const out = items.map((t) => {
    const r = redactRewrites(t, draft);
    redactions += r.redactions;
    return r.text;
  });
  return { items: out, redactions };
}

export async function review(s: Settings, draft: string, meta: DraftMeta) {
  const out = await callJson(s, toSpec(reviewPrompt(draft, meta, s.lang)), ReviewSchema);
  const c = processComments(out.comments, draft, 1, 1);
  const st = guardList(out.strengths, draft);
  const pr = guardList(out.priorities, draft);
  const log: LogEntry = { at: Date.now(), action: 'review', model: s.model, comments: c.comments.length, redactions: c.redactions + st.redactions + pr.redactions, dropped: c.dropped };
  return { comments: c.comments, strengths: st.items, priorities: pr.items, log };
}

/** Re-anchors every comment on the new draft and asks the model which issues the revision resolved. */
export async function recheck(s: Settings, doc: Doc, newDraft: string): Promise<Doc> {
  const oldDraft = doc.drafts[doc.drafts.length - 1];
  const pending = doc.comments.filter((c) => c.status !== 'resolved');
  const out = await callJson(s, toSpec(recheckPrompt(oldDraft, newDraft, pending.map((c) => ({ id: c.id, quote: c.quote, question: c.question })), s.lang)), RecheckSchema);
  const round = Math.max(...doc.comments.map((c) => c.round), 1) + 1;
  let redactions = 0;
  const updated = doc.comments.map((c) => {
    const pos = anchor(c.quote, newDraft);
    const r = out.results.find((x) => x.id === c.id);
    let note = c.note;
    if (r) {
      const g = redactRewrites(r.note, newDraft);
      redactions += g.redactions;
      note = g.text;
    }
    return { ...c, start: pos?.start ?? null, end: pos?.end ?? null, status: r ? r.status : c.status, note };
  });
  const fresh = processComments(out.new_comments, newDraft, round, Math.max(0, ...doc.comments.map((c) => c.id)) + 1);
  redactions += fresh.redactions;
  return {
    ...doc,
    drafts: [...doc.drafts, newDraft],
    comments: [...updated, ...fresh.comments],
    log: [...doc.log, { at: Date.now(), action: 'recheck', model: s.model, comments: fresh.comments.length, redactions, dropped: fresh.dropped }],
  };
}

/** Markdown appendix documenting how AI was (and was not) used. */
export function usageReport(doc: Doc): string {
  const L = [
    `# AI 使用记录 / KI-Nutzungsprotokoll — ${doc.title}`,
    '',
    '本文档使用「只批」获取写作反馈。该工具的 AI **只以提问和批注的形式**给出反馈，没有生成、改写或补全任何正文内容；任何像改写建议的文字都会在显示前被程序自动移除。',
    '',
    'Für dieses Dokument wurde „只批“ ausschließlich für Feedback in Form von Fragen und Anmerkungen genutzt. Die KI hat keinen Text des Dokuments erzeugt, umformuliert oder ergänzt; als Umformulierung erkennbare Vorschläge wurden vor der Anzeige automatisch entfernt.',
    '',
    '| 时间 / Zeit | 操作 / Aktion | 模型 / Modell | 批注数 / Anmerkungen | 已移除的改写 / entfernte Umformulierungen |',
    '|---|---|---|---|---|',
    ...doc.log.map((l) => `| ${new Date(l.at).toLocaleString()} | ${l.action === 'review' ? '审阅 / Review' : '复查修改 / Nachprüfung'} | ${l.model} | ${l.comments} | ${l.redactions} |`),
    '',
    `版本数 / Fassungen: ${doc.drafts.length} · 已解决的批注 / gelöste Anmerkungen: ${doc.comments.filter((c) => c.status === 'resolved').length}/${doc.comments.length}`,
    '',
    '> 提示：是否以及如何声明 AI 的使用，请以你所在学校和课程的规定为准。 / Hinweis: Maßgeblich sind die Regeln deiner Hochschule bzw. Lehrveranstaltung.',
  ];
  return L.join('\n');
}
