/**
 * Real-model eval for 只批.
 * Three drafts (EN / DE / ZH) with planted problems. Checks, using the app's exact prompts:
 *  - recall: is each planted problem flagged by a comment anchored on it?
 *  - the no-rewrite guarantee: how often the model itself tries to rewrite (LLM judge on the raw
 *    output), and whether anything rewrite-like survives the code guard (judge on guarded output)
 *  - anchoring: every shown comment points at text that exists verbatim
 *  - revision loop: two problems are fixed in a revised draft; they must be marked resolved/partly
 *    and the untouched ones must stay open
 *
 *   npm run eval
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import type { Lang } from '../src/base/claude';
import { processComments, guardList, type Comment, type Doc } from '../src/lib/engine';
import { RecheckSchema, recheckPrompt, ReviewSchema, reviewPrompt, type DraftMeta } from '../src/lib/prompts';
import { checksTable, MODEL, outDir, run, totalCost, type Check } from './claude';

interface Planted {
  key: string; // exact substring of the draft the problem lives in
  issue: string;
  fixedIn?: string; // replacement text in the revised draft (only for fixed problems)
}
interface Case {
  id: string;
  lang: Lang;
  meta: DraftMeta;
  draft: string;
  planted: Planted[];
}

const CASES: Case[] = [
  {
    id: 'en-thesis',
    lang: 'zh',
    meta: { genre: 'thesis', audience: 'supervisor and examiners', focus: 'argument and evidence' },
    draft: `4.1 Effect of scan speed on surface roughness

Surface roughness Ra was measured on twelve cubes printed with scan speeds between 600 and 1400 mm/s. Increasing the scan speed significantly improves the surface quality. This clearly shows that scan speed is the dominant factor for the surface finish of all metal AM parts. The SR values were taken on the top surfaces only. Previous studies have found the same trend. Based on these results, we recommend using the highest scan speed in production.`,
    planted: [
      { key: 'significantly improves the surface quality', issue: '“significantly” without a statistical test / numbers', fixedIn: 'reduced Ra from 11.2 µm to 7.9 µm (mean of three cubes per setting, t-test p = 0.01)' },
      { key: 'scan speed is the dominant factor for the surface finish of all metal AM parts', issue: 'overgeneralisation: one parameter varied, one material, claims "dominant" for all AM', fixedIn: 'scan speed has a strong effect on the top-surface roughness of the 316L cubes studied here' },
      { key: 'The SR values', issue: 'undefined abbreviation / inconsistent with Ra' },
      { key: 'Previous studies have found the same trend.', issue: 'no citation' },
      { key: 'we recommend using the highest scan speed in production', issue: 'recommendation ignores trade-offs (density, top surface only) and goes beyond the data' },
    ],
  },
  {
    id: 'de-bericht',
    lang: 'de',
    meta: { genre: 'report', audience: 'Betreuer am Lehrstuhl', focus: 'Nachvollziehbarkeit' },
    draft: `2 Versuchsaufbau

Für die Messungen wurde die Kamera mit den üblichen Einstellungen betrieben. Die Belichtungszeit war sehr kurz, sodass Bewegungsunschärfe ausgeschlossen werden kann. Das Schlierenbild zeigt deutlich die Gasströmung über dem Schmelzbad. Da die Strömung laminar ist, kann der Einfluss auf die Partikel vernachlässigt werden. Die Ergebnisse werden in Kapitel 5 diskutiert, wobei sich zeigt, dass das System sehr gut funktioniert.`,
    planted: [
      { key: 'mit den üblichen Einstellungen', issue: 'nicht reproduzierbar: welche Einstellungen?' },
      { key: 'Die Belichtungszeit war sehr kurz', issue: 'kein Zahlenwert; "ausgeschlossen" nicht belegt' },
      { key: 'Da die Strömung laminar ist', issue: 'Behauptung ohne Beleg (Reynolds-Zahl?)' },
      { key: 'kann der Einfluss auf die Partikel vernachlässigt werden', issue: 'Fehlschluss: laminar ≠ kein Einfluss auf Partikel' },
      { key: 'dass das System sehr gut funktioniert', issue: 'vage Bewertung ohne Kriterium' },
    ],
  },
  {
    id: 'zh-essay',
    lang: 'zh',
    meta: { genre: 'essay', audience: '课程老师', focus: '论证逻辑' },
    draft: `人工智能对大学教育的影响

随着人工智能的快速发展，越来越多的学生开始使用 ChatGPT 完成作业。调查显示，大部分学生认为 AI 提高了学习效率。因此，学校应该全面禁止 AI 工具。此外，AI 生成的内容经常出错，所以用 AI 的学生成绩一定会下降。总之，AI 对教育弊大于利，这是毋庸置疑的。`,
    planted: [
      { key: '调查显示', issue: '没有说明是哪项调查、样本多大' },
      { key: '因此，学校应该全面禁止 AI 工具', issue: '结论与前一句的证据方向相反（效率提高 → 禁止）' },
      { key: '所以用 AI 的学生成绩一定会下降', issue: '因果跳跃、绝对化' },
      { key: '大部分学生', issue: '模糊量词' },
      { key: '这是毋庸置疑的', issue: '用断言代替论证' },
    ],
  },
];

const overlaps = (c: Comment, draft: string, key: string) => {
  const at = draft.indexOf(key);
  if (at < 0 || c.start === null || c.end === null) return false;
  return c.start < at + key.length && c.end > at;
};

const RewriteJudge = z.object({
  rewrites: z.array(z.string()).describe('every place where the feedback supplies new wording for the draft: a rewritten/rephrased sentence, a replacement word or phrase, a completed sentence, or an example phrasing. Quoting the draft itself is NOT a rewrite; naming a rule is NOT a rewrite.'),
});

async function judgeRewrites(draft: string, texts: string[]) {
  const r = await run(
    { system: ['You audit an AI writing tutor that must never write text for the student. Be strict.'], user: `<draft>\n${draft}\n</draft>\n\n<feedback>\n${texts.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n</feedback>`, effort: 'medium' },
    RewriteJudge,
  );
  return r.rewrites;
}

async function evaluate(c: Case) {
  const raw = await run(reviewPrompt(c.draft, c.meta, c.lang), ReviewSchema);
  const proc = processComments(raw.comments, c.draft, 1, 1);
  const st = guardList(raw.strengths, c.draft);
  const pr = guardList(raw.priorities, c.draft);
  const rawTexts = [...raw.comments.flatMap((x) => [x.question, x.why]), ...raw.strengths, ...raw.priorities];
  const shownTexts = [...proc.comments.flatMap((x) => [x.question, x.why]), ...st.items, ...pr.items];
  const [rawRewrites, shownRewrites] = await Promise.all([judgeRewrites(c.draft, rawTexts), judgeRewrites(c.draft, shownTexts)]);
  const found = c.planted.map((p) => ({ p, hit: proc.comments.some((x) => overlaps(x, c.draft, p.key)) }));

  // revision loop: apply the fixes for planted problems that have fixedIn
  let revision: { p: Planted; status: string }[] = [];
  if (c.planted.some((p) => p.fixedIn)) {
    let revised = c.draft;
    for (const p of c.planted) if (p.fixedIn) revised = revised.replace(p.key, p.fixedIn);
    const doc: Doc = { id: c.id, title: c.id, createdAt: 0, meta: c.meta, drafts: [c.draft], comments: proc.comments, strengths: [], priorities: [], log: [] };
    const out = await run(recheckPrompt(c.draft, revised, doc.comments.map((x) => ({ id: x.id, quote: x.quote, question: x.question })), c.lang), RecheckSchema);
    revision = c.planted.map((p) => {
      const related = proc.comments.filter((x) => overlaps(x, c.draft, p.key));
      const statuses = related.map((x) => out.results.find((r) => r.id === x.id)?.status ?? 'missing');
      return { p, status: statuses.join('/') || 'no comment' };
    });
  }
  console.log(`  ${c.id}: ${proc.comments.length} comments, planted ${found.filter((f) => f.hit).length}/${c.planted.length}, guard removed ${proc.redactions + st.redactions + pr.redactions}`);
  return { c, raw, proc, found, rawRewrites, shownRewrites, guardRemoved: proc.redactions + st.redactions + pr.redactions, revision };
}

async function main() {
  const out = outDir();
  mkdirSync(out, { recursive: true });
  const results = await Promise.all(CASES.map(evaluate));
  const checks: Check[] = [];
  for (const r of results) {
    const t = `[${r.c.id}]`;
    const hits = r.found.filter((f) => f.hit).length;
    checks.push({ name: `${t} 植入问题被指出（≥ 4/5）`, pass: hits >= 4, detail: `${hits}/${r.c.planted.length}；漏掉：${r.found.filter((f) => !f.hit).map((f) => f.p.issue).join('；') || '无'}` });
    checks.push({ name: `${t} 批注全部锚定到原文`, pass: r.proc.dropped === 0, detail: `${r.proc.comments.length}/${r.raw.comments.length} 锚定成功` });
    checks.push({ name: `${t} 显示给用户的内容里没有改写（裁判）`, pass: r.shownRewrites.length === 0, detail: r.shownRewrites.join('；') || '无' });
    checks.push({
      name: `${t} 护栏不误删（移除数 ≤ 模型真实改写数 + 1）`,
      pass: r.guardRemoved <= r.rawRewrites.length + 1,
      detail: `护栏移除 ${r.guardRemoved} 处，裁判认定的真实改写 ${r.rawRewrites.length} 处`,
    });
    checks.push({ name: `${t} 模型本身遵守“不改写”（护栏前，仅供参考）`, pass: r.rawRewrites.length === 0, detail: `模型原始输出中裁判发现 ${r.rawRewrites.length} 处；护栏移除 ${r.guardRemoved} 处${r.rawRewrites.length ? '：' + r.rawRewrites.join('；').slice(0, 200) : ''}` });
    for (const v of r.revision) {
      const want = v.p.fixedIn ? ['resolved', 'partly'] : ['open'];
      const ok = v.status !== 'no comment' && v.status.split('/').every((s) => want.includes(s));
      checks.push({ name: `${t} 复查：${v.p.fixedIn ? '已修改的问题判为已解决' : '未修改的问题仍判为未解决'}`, pass: ok, detail: `${v.p.issue} → ${v.status}` });
    }
  }
  const L = [
    '# 只批 · 真实模型测试报告',
    '',
    `- 模型：\`${MODEL}\`，通过 \`claude -p\` 发送与应用完全相同的提示词（\`src/lib/prompts.ts\`），并经过与应用相同的护栏和锚定（\`src/lib/guard.ts\`、\`src/lib/engine.ts\`）`,
    '- 3 份草稿（英文论文、德文报告、中文短文），每份植入 5 个已知问题；英文稿再做一轮“改掉 2 个、留下 3 个”的复查测试',
    `- 时间：${new Date().toISOString()} · 花费约 $${totalCost.toFixed(2)}`,
    '',
    `**总计：${checks.filter((c) => c.pass).length}/${checks.length} 项通过**`,
    '',
    checksTable(checks),
    '',
    ...results.flatMap((r) => [
      `## ${r.c.id}`,
      '',
      '```',
      r.c.draft,
      '```',
      '',
      ...r.proc.comments.map((x) => `${x.id}. 「${x.quote}」（${x.category}/${x.severity}）${x.question} — _${x.why}_`),
      '',
    ]),
  ];
  writeFileSync(`${out}/report.md`, L.join('\n'));
  writeFileSync(`${out}/raw.json`, JSON.stringify(results, null, 2));
  console.log(`\nreport: ${out}/report.md · cost ≈ $${totalCost.toFixed(2)}`);
}

main();
