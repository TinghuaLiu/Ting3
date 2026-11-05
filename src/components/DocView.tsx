import { useMemo, useState } from 'react';
import { friendlyError, type Settings } from '../base/claude';
import { recheck, usageReport, type Comment, type Doc } from '../lib/engine';
import { CATEGORIES, type Category } from '../lib/prompts';

const STATUS: Record<Comment['status'], [string, string]> = {
  new: ['待处理', ''],
  open: ['未解决', 'bad'],
  partly: ['部分解决', 'ok'],
  resolved: ['已解决', 'good'],
};

/** Splits the draft into plain and highlighted segments (overlaps: first comment wins). */
function segments(text: string, comments: Comment[]) {
  const marks = comments.filter((c) => c.start !== null && c.end !== null && c.status !== 'resolved').sort((a, b) => a.start! - b.start!);
  const out: { text: string; c?: Comment }[] = [];
  let pos = 0;
  for (const c of marks) {
    if (c.start! < pos) continue;
    if (c.start! > pos) out.push({ text: text.slice(pos, c.start!) });
    out.push({ text: text.slice(c.start!, c.end!), c });
    pos = c.end!;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}

interface Props {
  doc: Doc;
  settings: Settings;
  onChange: (d: Doc) => void;
  onBack: () => void;
  onNeedKey: () => void;
}

export function DocView({ doc, settings, onChange, onBack, onNeedKey }: Props) {
  const draft = doc.drafts[doc.drafts.length - 1];
  const [active, setActive] = useState<number | null>(null);
  const [filter, setFilter] = useState<Category | 'all' | 'major'>('all');
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const segs = useMemo(() => segments(draft, doc.comments), [draft, doc.comments]);
  const visible = doc.comments.filter((c) => (filter === 'all' ? true : filter === 'major' ? c.severity === 'major' : c.category === filter));
  const resolved = doc.comments.filter((c) => c.status === 'resolved').length;
  const redacted = doc.log.reduce((n, l) => n + l.redactions, 0);

  const focus = (id: number) => {
    setActive(id);
    document.getElementById(`c-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    document.getElementById(`m-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const submitRevision = async () => {
    if (!settings.apiKey) return onNeedKey();
    if (edit.trim() === draft.trim()) return setErr('原文还没有改动。');
    setBusy(true);
    setErr('');
    try {
      onChange(await recheck(settings, doc, edit));
      setEditing(false);
    } catch (e) {
      setErr(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const exportLog = () => {
    const blob = new Blob([usageReport(doc)], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `AI-usage-${doc.title.replace(/[\\/:*?"<>|]+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="page wide">
      <button className="link" onClick={onBack}>
        ← 全部文稿
      </button>
      <div className="doc-head">
        <div>
          <h1>{doc.title}</h1>
          <p className="muted small">
            第 {doc.drafts.length} 稿 · {doc.comments.length} 条批注 · 已解决 {resolved} · <span title="AI 回复中被程序移除的改写建议数">🛡️ 拦下改写 {redacted} 处</span>
          </p>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={exportLog}>
            导出 AI 使用记录
          </button>
          {!editing && (
            <button
              className="btn primary"
              onClick={() => {
                setEdit(draft);
                setEditing(true);
              }}
            >
              ✍️ 修改原文
            </button>
          )}
        </div>
      </div>

      {doc.priorities.length > 0 && (
        <div className="card prio">
          <b>最该先想清楚的：</b>
          <ol>
            {doc.priorities.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="doc-grid">
        <div className="paper-col">
          {editing ? (
            <>
              <p className="muted small">直接在这里改你的原文。改完点「检查修改」，AI 会逐条核对哪些问题解决了——它仍然不会替你写任何一句话。</p>
              <textarea className="paper edit" value={edit} onChange={(e) => setEdit(e.target.value)} />
              {err && <div className="alert">{err}</div>}
              <div className="row end">
                <button className="btn ghost" onClick={() => setEditing(false)} disabled={busy}>
                  取消
                </button>
                <button className="btn primary" onClick={submitRevision} disabled={busy}>
                  {busy ? <><span className="spinner" /> 核对中…</> : '检查修改'}
                </button>
              </div>
            </>
          ) : (
            <div className="paper">
              {segs.map((s, i) =>
                s.c ? (
                  <mark key={i} id={`m-${s.c.id}`} className={`hl ${s.c.severity} ${active === s.c.id ? 'on' : ''}`} onClick={() => focus(s.c!.id)}>
                    {s.text}
                    <sup>{s.c.id}</sup>
                  </mark>
                ) : (
                  <span key={i}>{s.text}</span>
                ),
              )}
            </div>
          )}
        </div>

        <div className="comments-col">
          <div className="filters">
            {(['all', 'major'] as const).map((f) => (
              <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? '全部' : '重要'}
              </button>
            ))}
            {(Object.keys(CATEGORIES) as Category[])
              .filter((k) => doc.comments.some((c) => c.category === k))
              .map((k) => (
                <button key={k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
                  {CATEGORIES[k]}
                </button>
              ))}
          </div>
          <ul className="list-reset stack">
            {visible.map((c) => (
              <li key={c.id} id={`c-${c.id}`} className={`comment ${active === c.id ? 'on' : ''} ${c.status}`} onClick={() => focus(c.id)}>
                <div className="c-top">
                  <span className="cid">{c.id}</span>
                  <span className={`pill ${c.severity === 'major' ? 'accent' : ''}`}>{CATEGORIES[c.category]}</span>
                  {c.status !== 'new' && <span className={`pill ${STATUS[c.status][1]}`}>{STATUS[c.status][0]}</span>}
                  {c.round > 1 && <span className="pill">第 {c.round} 轮新增</span>}
                </div>
                <blockquote>{c.quote}</blockquote>
                {c.start === null && c.status !== 'resolved' && <div className="muted small">（原句已改动）</div>}
                <p className="q">{c.question}</p>
                <p className="why muted small">{c.why}</p>
                {c.note && <p className="note small">↳ {c.note}</p>}
              </li>
            ))}
          </ul>
          {doc.strengths.length > 0 && (
            <div className="card strengths">
              <b>✅ 写得好、请保留的：</b>
              <ul>
                {doc.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
