/**
 * Runs the app's own prompts (src/lib/prompts.ts → Prompt) against a real Claude model through the
 * Claude Code CLI (`claude -p`, custom system prompt, no tools). Needs a logged-in Claude Code, no API key.
 */
import { spawn } from 'node:child_process';
import { z } from 'zod';
import type { Prompt } from '../src/base/claude';

export const MODEL = process.env.EVAL_MODEL ?? 'claude-opus-5-5';
export let totalCost = 0;
let running = 0;
const queue: (() => void)[] = [];
const MAX_PARALLEL = Number(process.env.EVAL_PARALLEL ?? 6);

export interface RunOpts {
  sessionId?: string;
  resume?: string;
}

/** Runs a Prompt; with a schema returns the parsed object, otherwise the text. */
export async function run<S extends z.ZodType>(p: Prompt, schema: S, opts?: RunOpts): Promise<z.infer<S>>;
export async function run(p: Prompt, schema?: undefined, opts?: RunOpts): Promise<string>;
export async function run(p: Prompt, schema?: z.ZodType, opts: RunOpts = {}): Promise<unknown> {
  if (running >= MAX_PARALLEL) await new Promise<void>((r) => queue.push(r));
  running++;
  try {
    for (let attempt = 1; ; attempt++) {
      try {
        const out = await once(p, schema, opts);
        return schema ? schema.parse(out.json) : out.text.trim();
      } catch (e) {
        if (attempt >= 3) throw e;
        console.warn(`  retry ${attempt}: ${(e as Error).message.slice(0, 200)}`);
      }
    }
  } finally {
    running--;
    queue.shift()?.();
  }
}

function once(p: Prompt, schema: z.ZodType | undefined, opts: RunOpts): Promise<{ text: string; json?: unknown }> {
  const system = p.system.join('\n\n') || 'You are Claude, a helpful assistant.';
  const args = ['-p', '--model', MODEL, '--effort', p.effort, '--system-prompt', system, '--tools', '', '--strict-mcp-config', '--setting-sources', '', '--disable-slash-commands', '--output-format', 'json'];
  if (schema) {
    const { $schema: _drop, ...js } = z.toJSONSchema(schema) as Record<string, unknown>;
    args.push('--json-schema', JSON.stringify(js));
  }
  if (opts.resume) args.push('--resume', opts.resume);
  else if (opts.sessionId) args.push('--session-id', opts.sessionId);
  else args.push('--no-session-persistence');
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => (out += d));
    proc.stderr.on('data', (d) => (err += d));
    proc.on('close', (code) => {
      try {
        const d = JSON.parse(out);
        totalCost += d.total_cost_usd ?? 0;
        if (d.is_error) return reject(new Error(`claude error: ${d.result}`));
        resolve({ text: String(d.result ?? ''), json: d.structured_output });
      } catch {
        reject(new Error(`claude exited ${code}: ${err.slice(0, 400)} ${out.slice(0, 400)}`));
      }
    });
    proc.stdin.end(p.user);
  });
}

export async function download(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status} ${url}`);
  return res.text();
}

export interface Check {
  name: string;
  pass: boolean;
  detail: string;
}

export function checksTable(checks: Check[]): string {
  const rows = checks.map((c) => `| ${c.name} | ${c.pass ? '✅' : '❌'} | ${c.detail.replace(/\|/g, '/').replace(/\n/g, ' ')} |`);
  return ['| 检查项 | 结果 | 详情 |', '|---|---|---|', ...rows].join('\n');
}

export const outDir = (label = '') => `eval/results/${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}${label ? '-' + label : ''}`;
