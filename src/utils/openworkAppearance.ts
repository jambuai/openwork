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

export type OpenWorkAsciiPreset = 'full' | 'minimal' | 'none'

export type OpenWorkAppearanceV1 = {
  version: 1
  productName: string
  welcomePrefix: string
  accentColor: OpenWorkAccentPreset
  asciiPreset: OpenWorkAsciiPreset
}

const DEFAULT_APPEARANCE: OpenWorkAppearanceV1 = {
  version: 1,
  productName: 'OpenWork',
  welcomePrefix: 'Welcome to',
  accentColor: 'claude',
  asciiPreset: 'full',
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
  if (value === 'minimal' || value === 'none') return value
  return 'full'
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
    const asciiPreset = normalizeAsciiPreset(
      typeof o.asciiPreset === 'string' ? o.asciiPreset : 'full',
    )
    if (!productName) {
      return { ...DEFAULT_APPEARANCE }
    }
    return {
      version: 1,
      productName,
      welcomePrefix: welcomePrefix || DEFAULT_APPEARANCE.welcomePrefix,
      accentColor,
      asciiPreset,
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
      'productName' | 'welcomePrefix' | 'accentColor' | 'asciiPreset'
    >
  >,
): void {
  const cur = loadOpenWorkAppearance()
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
    asciiPreset:
      input.asciiPreset !== undefined
        ? normalizeAsciiPreset(input.asciiPreset)
        : cur.asciiPreset,
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
