import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, friendlyError, type Settings } from './base/claude';
import { downloadJson, uid, usePersisted } from './base/store';
import { Hero, How, MaterialInput, SettingsDialog, Shell } from './base/ui';
import { DocView } from './components/DocView';
import { demoDoc } from './lib/demo';
import { review, type Doc } from './lib/engine';
import { GENRES, type Genre } from './lib/prompts';

type View = { name: 'home' } | { name: 'doc'; id: string };

export default function App() {
  const [settings, setSettings] = usePersisted<Settings>('zhipi.settings', DEFAULT_SETTINGS);
  const [docs, setDocs, storageErr] = usePersisted<Doc[]>('zhipi.docs', []);
  const [view, setView] = useState<View>({ name: 'home' });
  const [showSettings, setShowSettings] = useState(false);
  const [genre, setGenre] = useState<Genre>('thesis');
  const [audience, setAudience] = useState('');
  const [focus, setFocus] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const upsert = (d: Doc) => setDocs((ds) => (ds.some((x) => x.id === d.id) ? ds.map((x) => (x.id === d.id ? d : x)) : [d, ...ds]));

  const start = async (text: string, name: string) => {
    if (!settings.apiKey) return setShowSettings(true);
    setBusy(true);
    setErr('');
    try {
      const meta = { genre, audience: audience.trim(), focus: focus.trim() };
      const r = await review(settings, text, meta);
      const title = name !== '粘贴的文本' ? name.replace(/\.[a-z]+$/i, '') : text.trim().split('\n')[0].slice(0, 40);
      const d: Doc = { id: uid(), title, createdAt: Date.now(), meta, drafts: [text], comments: r.comments, strengths: r.strengths, priorities: r.priorities, log: [r.log] };
      upsert(d);
      setView({ name: 'doc', id: d.id });
    } catch (e) {
      setErr(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const doc = view.name === 'doc' ? docs.find((d) => d.id === view.id) : undefined;

  return (
    <Shell logo="批" name="只批" tagline="只提问，不代写" needsKey={!settings.apiKey} onHome={() => setView({ name: 'home' })} onSettings={() => setShowSettings(true)} storageError={storageErr}>
      {doc ? (
        <DocView key={doc.id} doc={doc} settings={settings} onChange={upsert} onBack={() => setView({ name: 'home' })} onNeedKey={() => setShowSettings(true)} />
      ) : (
        <section className="page">
          <Hero
            title="你的文字，"
            accent="只由你来写。"
            actions={
              <button
                className="btn ghost lg"
                onClick={() => {
                  if (!docs.some((d) => d.id === 'demo-thesis')) upsert(demoDoc());
                  setView({ name: 'doc', id: 'demo-thesis' });
                }}
              >
                看示例：论文一节的批注（无需 Key）
              </button>
            }
          >
            <p>
              大多数 AI 写作工具会直接帮你改写——写作能力没长进，还可能违反学术诚信。只批的 AI <strong>只在你的原文上批注和提问</strong>，告诉你哪里站不住、读者会卡在哪，
              <strong>绝不给出改写后的句子</strong>：这一点由程序强制保证，任何像改写的文字都会在显示前被移除。你改完之后，它<strong>逐条核对</strong>问题有没有真正解决。
            </p>
          </Hero>

          <div className="card form">
            <div className="row meta">
              <label className="field">
                <span>文体</span>
                <select value={genre} onChange={(e) => setGenre(e.target.value as Genre)}>
                  {(Object.keys(GENRES) as Genre[]).map((g) => (
                    <option key={g} value={g}>
                      {GENRES[g]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>读者是谁</span>
                <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="例如：导师和答辩委员会" />
              </label>
              <label className="field">
                <span>最想听哪方面的意见</span>
                <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="例如：论证是否站得住" />
              </label>
            </div>
            <MaterialInput placeholder="粘贴你的草稿（任何语言），或拖入 PDF / TXT / MD / TeX 文件……" busy={busy} actionLabel="开始批注 →" busyLabel="正在读你的稿子…" onSubmit={(m) => start(m.text, m.name)} />
            {err && <div className="alert">{err}</div>}
          </div>

          {docs.length > 0 && (
            <>
              <h2 className="sub">我的文稿</h2>
              <ul className="history list-reset">
                {docs.map((d) => (
                  <li key={d.id}>
                    <button className="history-item" onClick={() => setView({ name: 'doc', id: d.id })}>
                      <span className="grow">{d.title}</span>
                      <span className="muted small">
                        第 {d.drafts.length} 稿 · 已解决 {d.comments.filter((c) => c.status === 'resolved').length}/{d.comments.length}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <How
            items={[
              ['批注锚定原文', '每条意见都指向原文里的一句话，点高亮就能看到对应的问题；找不到出处的意见会被丢弃。'],
              ['提问代替改写', '“这个 significantly 有统计检验吗？”而不是“改成……”。你自己想清楚，再自己写。'],
              ['程序保证不代写', '引号里出现原文没有的新句子、或者“改为……”之类的改写，都会在显示前被自动移除，并计数。'],
              ['修改后逐条核对', '改完一稿，AI 判断每个问题是已解决、部分解决还是没解决；可以导出 AI 使用记录，附在你的声明里。'],
            ]}
          />
        </section>
      )}
      {showSettings && (
        <SettingsDialog
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
          onExport={() => downloadJson('zhipi-backup.json', { app: 'zhipi', docs })}
          onImport={(json) => {
            const d = JSON.parse(json);
            if (d.app !== 'zhipi' || !Array.isArray(d.docs)) throw new Error('不是只批的备份文件');
            setDocs(d.docs);
          }}
        />
      )}
    </Shell>
  );
}
