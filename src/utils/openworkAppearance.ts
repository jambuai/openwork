import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { OPENWORK_DIR } from './openworkProviderStore.js'

const APPEARANCE_FILE = join(OPENWORK_DIR, 'appearance.json')
const FILE_MODE = 0o600
const DIR_MODE = 0o700

/** Theme keys safe for welcome title accent (subset of Theme). */
export const OPENWORK_ACCENT_PRESETS = [
  { value: 'claude', label: 'Claude orange (default)' },
  { value: 'suggestion', label: 'Suggestion blue' },
  { value: 'ide', label: 'IDE / cyan' },
  { value: 'permission', label: 'Permission violet' },
  { value: 'success', label: 'Success green' },
  { value: 'warning', label: 'Warning' },
  { value: 'fastMode', label: 'Fast mode' },
  { value: 'professionalBlue', label: 'Professional blue' },
  { value: 'cyan_FOR_SUBAGENTS_ONLY', label: 'Cyan accent' },
] as const

export type OpenWorkAccentPreset = (typeof OPENWORK_ACCENT_PRESETS)[number]['value']

export type OpenWorkAsciiPreset = 'full' | 'minimal' | 'none' | 'custom'

export type OpenWorkAppearanceV1 = {
  version: 1
  productName: string
  welcomePrefix: string
  accentColor: OpenWorkAccentPreset
  asciiPreset: OpenWorkAsciiPreset
  /** When `asciiPreset` is `custom`, these lines render below the title (max width/line count enforced). */
  asciiArtLines: string[]
}

/** Limits for custom ASCII pasted or stored in appearance.json */
export const OPENWORK_ASCII_MAX_LINES = 22
export const OPENWORK_ASCII_MAX_COLS = 78

const DEFAULT_APPEARANCE: OpenWorkAppearanceV1 = {
  version: 1,
  productName: 'OpenWork',
  welcomePrefix: 'Welcome to',
  accentColor: 'claude',
  asciiPreset: 'full',
  asciiArtLines: [],
}

const ACCENT_SET = new Set<string>(
  OPENWORK_ACCENT_PRESETS.map(p => p.value),
)

function ensureOpenWorkDir(): void {
  mkdirSync(OPENWORK_DIR, { recursive: true, mode: DIR_MODE })
}

function sanitizeOneLine(s: string, maxLen: number): string {
  return s
    .replace(/[\r\n]/g, ' ')
    .trim()
    .slice(0, maxLen)
}

export function isValidAccent(value: string): value is OpenWorkAccentPreset {
  return ACCENT_SET.has(value)
}

export function normalizeAccent(value: string): OpenWorkAccentPreset {
  return isValidAccent(value) ? value : 'claude'
}

export function normalizeAsciiPreset(value: string): OpenWorkAsciiPreset {
  if (value === 'minimal' || value === 'none' || value === 'custom') return value
  return 'full'
}

/** Strip control chars and clamp line length (allows Unicode box-drawing etc.). */
export function sanitizeAsciiArtLine(s: string, maxLen: number = OPENWORK_ASCII_MAX_COLS): string {
  return s
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .replace(/\t/g, '  ')
    .trimEnd()
    .slice(0, maxLen)
}

/** Parse a pasted block (e.g. from wizard) into sanitized lines. */
export function parseAsciiArtPaste(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(line => sanitizeAsciiArtLine(line))
    .filter(line => line.length > 0)
    .slice(0, OPENWORK_ASCII_MAX_LINES)
}

function sanitizeAsciiArtLinesFromJson(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .filter((x): x is string => typeof x === 'string')
    .map(line => sanitizeAsciiArtLine(line))
    .filter(line => line.length > 0)
    .slice(0, OPENWORK_ASCII_MAX_LINES)
}

export function loadOpenWorkAppearance(): OpenWorkAppearanceV1 {
  if (!existsSync(APPEARANCE_FILE)) {
    return { ...DEFAULT_APPEARANCE }
  }
  try {
    const raw = JSON.parse(readFileSync(APPEARANCE_FILE, 'utf8')) as unknown
    if (!raw || typeof raw !== 'object') {
      return { ...DEFAULT_APPEARANCE }
    }
    const o = raw as Record<string, unknown>
    if (o.version !== 1) {
      return { ...DEFAULT_APPEARANCE }
    }
    const productName =
      typeof o.productName === 'string'
        ? sanitizeOneLine(o.productName, 48)
        : DEFAULT_APPEARANCE.productName
    const welcomePrefix =
      typeof o.welcomePrefix === 'string'
        ? sanitizeOneLine(o.welcomePrefix, 32)
        : DEFAULT_APPEARANCE.welcomePrefix
    const accentColor = normalizeAccent(
      typeof o.accentColor === 'string' ? o.accentColor : 'claude',
    )
    let asciiPreset = normalizeAsciiPreset(
      typeof o.asciiPreset === 'string' ? o.asciiPreset : 'full',
    )
    const asciiArtLines = sanitizeAsciiArtLinesFromJson(o.asciiArtLines)
    if (asciiPreset === 'custom' && asciiArtLines.length === 0) {
      asciiPreset = 'minimal'
    }
    if (!productName) {
      return { ...DEFAULT_APPEARANCE }
    }
    return {
      version: 1,
      productName,
      welcomePrefix: welcomePrefix || DEFAULT_APPEARANCE.welcomePrefix,
      accentColor,
      asciiPreset,
      asciiArtLines,
    }
  } catch {
    return { ...DEFAULT_APPEARANCE }
  }
}

export function welcomeTitleLine(a: OpenWorkAppearanceV1): string {
  const prefix = a.welcomePrefix.trim()
  const name = a.productName.trim()
  if (!prefix) return name
  if (!name) return prefix
  return `${prefix} ${name}`.trim()
}

export function saveOpenWorkAppearance(
  input: Partial<
    Pick<
      OpenWorkAppearanceV1,
      | 'productName'
      | 'welcomePrefix'
      | 'accentColor'
      | 'asciiPreset'
      | 'asciiArtLines'
    >
  >,
): void {
  const cur = loadOpenWorkAppearance()
  let asciiPreset =
    input.asciiPreset !== undefined
      ? normalizeAsciiPreset(input.asciiPreset)
      : cur.asciiPreset
  const asciiArtLines =
    input.asciiArtLines !== undefined
      ? input.asciiArtLines
          .filter((line): line is string => typeof line === 'string')
          .map(line => sanitizeAsciiArtLine(line))
          .filter(line => line.length > 0)
          .slice(0, OPENWORK_ASCII_MAX_LINES)
      : cur.asciiArtLines
  if (asciiPreset === 'custom' && asciiArtLines.length === 0) {
    asciiPreset = 'minimal'
  }
  const next: OpenWorkAppearanceV1 = {
    version: 1,
    productName:
      input.productName !== undefined
        ? sanitizeOneLine(input.productName, 48) || cur.productName
        : cur.productName,
    welcomePrefix:
      input.welcomePrefix !== undefined
        ? sanitizeOneLine(input.welcomePrefix, 32) || cur.welcomePrefix
        : cur.welcomePrefix,
    accentColor:
      input.accentColor !== undefined
        ? normalizeAccent(input.accentColor)
        : cur.accentColor,
    asciiPreset,
    asciiArtLines,
  }
  if (!next.productName) {
    next.productName = DEFAULT_APPEARANCE.productName
  }
  ensureOpenWorkDir()
  writeFileSync(APPEARANCE_FILE, `${JSON.stringify(next, null, 2)}\n`, {
    encoding: 'utf8',
    mode: FILE_MODE,
  })
  try {
    chmodSync(APPEARANCE_FILE, FILE_MODE)
  } catch {
    // Windows
  }
}
