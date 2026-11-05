/**
 * Prompts and schemas for 只批. Pure, shared with the eval harness.
 */
import { z } from 'zod';
import { LANG_NAME, type Lang, type Prompt } from '../base/claude';

export const GENRES = {
  thesis: '学位论文 / 学术论文',
  report: '实验报告 / 技术报告',
  application: '申请材料（动机信、简历陈述）',
  essay: '议论文 / 课程论文',
  email: '正式邮件',
} as const;
export type Genre = keyof typeof GENRES;

export const CATEGORIES = {
  argument: '论证',
  evidence: '证据',
  clarity: '清晰',
  structure: '结构',
  precision: '精确',
  terminology: '术语',
  audience: '读者',
  language: '语言',
} as const;
export type Category = keyof typeof CATEGORIES;

export interface DraftMeta {
  genre: Genre;
  audience: string;
  focus: string;
}

export const ReviewSchema = z.object({
  comments: z.array(
    z.object({
      quote: z.string().describe('an exact, contiguous excerpt from the draft that this comment is about, copied character for character (a phrase or one sentence, never longer than needed)'),
      category: z.enum(Object.keys(CATEGORIES) as [Category, ...Category[]]),
      severity: z.enum(['major', 'minor']),
      question: z.string().describe('a question or observation that makes the writer see the problem themselves'),
      why: z.string().describe('one short sentence: why this matters to the reader'),
    }),
  ),
  strengths: z.array(z.string()).describe('2-3 specific things the draft does well, so the writer keeps them'),
  priorities: z.array(z.string()).describe('the 1-3 most important things to work on, as questions or goals — not rewritten text'),
});
export type ReviewOut = z.infer<typeof ReviewSchema>;

export const NO_REWRITE_RULES = `You are a writing tutor who never writes for the student. The student must stay the sole author of every sentence, so:
- Never rewrite, rephrase, complete or "suggest a better version" of any sentence, phrase or word — not even a single replacement word, not even as an example.
- Never put new wording in quotation marks. The only text you may quote is text that already appears in the draft — copy it exactly instead of paraphrasing it inside quotation marks.
- Instead, ask a question or name the problem so precisely that the writer can fix it themselves (e.g. "Which measurement supports 'significantly'?" rather than proposing a phrasing).
Grammar and spelling: point to the place and name the rule (e.g. "subject–verb agreement"), but don't give the corrected form.`;

const metaBlock = (m: DraftMeta) => `Genre: ${GENRES[m.genre]}\nIntended reader: ${m.audience || '(not stated)'}\nThe writer wants feedback especially on: ${m.focus || '(no preference)'}`;

export function reviewPrompt(draft: string, m: DraftMeta, lang: Lang): Prompt {
  return {
    system: [
      `<draft>\n${draft}\n</draft>`,
      `${NO_REWRITE_RULES}

Review the draft above as an experienced, demanding reader of this genre would. Prioritise what most affects the reader: unsupported claims, missing evidence or references, logical gaps, unclear structure, vague or imprecise wording, undefined terms and inconsistent terminology — before style and language. Anchor every comment to an exact quote from the draft. Aim for the 6-15 most useful comments, not every nit.

${metaBlock(m)}

Write questions, explanations, strengths and priorities in ${LANG_NAME[lang]} (quotes stay in the draft's language).`,
    ],
    user: 'Review the draft.',
    effort: 'medium',
  };
}

export const RecheckSchema = z.object({
  results: z.array(
    z.object({
      id: z.number().describe('the comment number'),
      status: z.enum(['resolved', 'partly', 'open']),
      note: z.string().describe('one sentence on what changed or what is still missing — again no rewritten text'),
    }),
  ),
  new_comments: z.array(
    z.object({
      quote: z.string().describe('exact excerpt from the REVISED draft'),
      category: z.enum(Object.keys(CATEGORIES) as [Category, ...Category[]]),
      severity: z.enum(['major', 'minor']),
      question: z.string(),
      why: z.string(),
    }),
  ).describe('only serious new problems introduced by the revision; usually empty'),
});
export type RecheckOut = z.infer<typeof RecheckSchema>;

export function recheckPrompt(oldDraft: string, newDraft: string, comments: { id: number; quote: string; question: string }[], lang: Lang): Prompt {
  return {
    system: [
      `<original_draft>\n${oldDraft}\n</original_draft>\n\n<revised_draft>\n${newDraft}\n</revised_draft>`,
      `${NO_REWRITE_RULES}

The writer revised their draft in response to your earlier comments. For each comment, decide whether the problem is resolved in the revised draft, partly resolved, or still open. Judge the substance (is the claim now supported, the term defined, the logic complete?), not whether the words changed. If the passage a comment refers to is unchanged and nothing elsewhere addresses the problem, it is still open — improvements to other parts of the text don't count for it. Only flag new problems if the revision introduced something serious. Write in ${LANG_NAME[lang]}.`,
    ],
    user: `Earlier comments:\n${comments.map((c) => `#${c.id} on "${c.quote}": ${c.question}`).join('\n')}`,
    effort: 'medium',
  };
}
