import {
  DEFAULT_OPENAI_BASE_URL,
  resolveProviderRequest,
} from '../services/api/providerConfig.js'
import {
  OPENWORK_ASCII_MAX_COLS,
  OPENWORK_ASCII_MAX_LINES,
  parseAsciiArtPaste,
} from './openworkAppearance.js'
import { loadOpenWorkPublicConfig, loadOpenWorkSecrets } from './openworkProviderStore.js'

export type GenerateAsciiArtInput = {
  /** Visible product / welcome line context for the model */
  brandLine: string
  /** Optional creative direction */
  extraHint?: string
}

/**
 * Resolves OpenAI-compatible URL, key, and model from env + ~/.openwork (no argv parsing).
 * For full CLI flag merging (e.g. `--apiKey`), call `applyOpenWorkProviderFromArgvAndStore()` earlier in the process.
 */
export function resolveOpenWorkLlmForUtilities(): {
  baseUrl: string
  apiKey: string | undefined
  model: string
} {
  const pub = loadOpenWorkPublicConfig()
  const sec = loadOpenWorkSecrets()
  const model =
    process.env.OPENAI_MODEL?.trim() || pub?.model?.trim() || 'gpt-5-mini'
  const baseUrlRaw =
    process.env.OPENAI_BASE_URL?.trim() ||
    pub?.baseUrl?.trim() ||
    DEFAULT_OPENAI_BASE_URL
  const apiKey =
    process.env.OPENAI_API_KEY?.trim() || sec.openaiApiKey?.trim() || undefined
  return {
    baseUrl: baseUrlRaw.replace(/\/+$/, ''),
    apiKey,
    model,
  }
}

function isLocalBaseUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const h = u.hostname.toLowerCase()
    return h === 'localhost' || h === '127.0.0.1' || h === '::1'
  } catch {
    return false
  }
}

function openAiMessageContentToString(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (
          part &&
          typeof part === 'object' &&
          'text' in part &&
          typeof (part as { text: unknown }).text === 'string'
        ) {
          return (part as { text: string }).text
        }
        return ''
      })
      .join('')
  }
  return ''
}

function stripOptionalMarkdownFence(s: string): string {
  const t = s.trim()
  const m = /^```(?:[a-z]*)\s*\n?([\s\S]*?)```\s*$/im.exec(t)
  return m ? m[1].trim() : t
}

/**
 * One non-streaming chat completion; returns sanitized ASCII lines for `appearance.json`.
 * Uses the same OpenAI-compatible stack as the rest of OpenWork (not Anthropic-native).
 */
export async function generateAsciiArtWithOpenWorkLlm(
  input: GenerateAsciiArtInput,
): Promise<string[]> {
  const cfg = resolveOpenWorkLlmForUtilities()
  const req = resolveProviderRequest({
    model: cfg.model,
    baseUrl: cfg.baseUrl,
  })
  if (req.transport !== 'chat_completions') {
    throw new Error(
      'AI banner generation needs an OpenAI-compatible API (chat/completions). Switch model/base URL in `openwork configure` or use env; Codex-only transport is not supported here.',
    )
  }
  if (!cfg.apiKey && !isLocalBaseUrl(cfg.baseUrl)) {
    throw new Error(
      'No API key: run `openwork configure`, set OPENAI_API_KEY, or point OPENAI_BASE_URL at a local server.',
    )
  }

  const system = `You write terminal ASCII art only.
Output rules:
- At most ${OPENWORK_ASCII_MAX_LINES} non-empty lines.
- Each line at most ${OPENWORK_ASCII_MAX_COLS} characters (monospace).
- No markdown, no explanation, no code fences — output only the drawing lines.
- Use Unicode box-drawing (─ │ ╭ ╮ ╯ ╰ · ░ ▓ █ ○) and spaces; design a compact logo block that can sit to the LEFT of a text title in a CLI welcome screen.`

  const hint = input.extraHint?.trim()
  const user = `Create an original ASCII logo block for this dev CLI welcome line: "${input.brandLine.replace(/"/g, "'")}".
${hint ? `Style / motif: ${hint.replace(/"/g, "'")}` : 'Tone: professional tool, memorable silhouette, fits a dark terminal.'}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (cfg.apiKey) {
    headers.Authorization = `Bearer ${cfg.apiKey}`
  }

  const url = `${cfg.baseUrl}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.9,
      max_tokens: 1600,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(
      `Model request failed (${res.status}): ${errText.slice(0, 280)}`,
    )
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>
  }
  const raw = openAiMessageContentToString(data.choices?.[0]?.message?.content)
  if (!raw.trim()) {
    throw new Error('Model returned empty content.')
  }

  const cleaned = stripOptionalMarkdownFence(raw)
  const lines = parseAsciiArtPaste(cleaned)
  if (lines.length === 0) {
    throw new Error('Model output had no usable lines after sanitization.')
  }
  return lines
}
