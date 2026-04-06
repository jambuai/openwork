import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_OPENAI_BASE_URL } from '../services/api/providerConfig.js'

export const OPENWORK_DIR = join(homedir(), '.openwork')
const KEY_FILE = join(OPENWORK_DIR, '.key')
const PUBLIC_FILE = join(OPENWORK_DIR, 'provider.json')
const SECRETS_FILE = join(OPENWORK_DIR, 'credentials.enc')

const DIR_MODE = 0o700
const FILE_MODE = 0o600

export type OpenWorkPublicConfig = {
  version: 1
  model?: string
  baseUrl?: string
  updatedAt?: string
}

type EncryptedSecrets = {
  openaiApiKey?: string
}

function ensureDir(): void {
  mkdirSync(OPENWORK_DIR, { recursive: true, mode: DIR_MODE })
}

function getOrCreateMasterKey(): Buffer {
  ensureDir()
  if (!existsSync(KEY_FILE)) {
    const buf = randomBytes(32)
    writeFileSync(KEY_FILE, buf.toString('base64'), { mode: FILE_MODE })
    try {
      chmodSync(KEY_FILE, FILE_MODE)
    } catch {
      // Windows may not support chmod the same way
    }
  }
  const text = readFileSync(KEY_FILE, 'utf8').trim()
  return Buffer.from(text, 'base64')
}

function encryptJson(obj: unknown, key: Buffer): string {
  const plain = JSON.stringify(obj)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

function decryptJson<T>(b64: string, key: Buffer): T {
  const buf = Buffer.from(b64, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString(
    'utf8',
  )
  return JSON.parse(plain) as T
}

export function hasOpenWorkStoreOnDisk(): boolean {
  return existsSync(PUBLIC_FILE) || existsSync(SECRETS_FILE)
}

export function loadOpenWorkPublicConfig(): OpenWorkPublicConfig | null {
  if (!existsSync(PUBLIC_FILE)) return null
  try {
    const raw = JSON.parse(readFileSync(PUBLIC_FILE, 'utf8')) as OpenWorkPublicConfig
    if (raw?.version !== 1) return null
    return raw
  } catch {
    return null
  }
}

export function loadOpenWorkSecrets(): EncryptedSecrets {
  if (!existsSync(SECRETS_FILE)) return {}
  try {
    const key = getOrCreateMasterKey()
    const b64 = readFileSync(SECRETS_FILE, 'utf8').trim()
    return decryptJson<EncryptedSecrets>(b64, key)
  } catch {
    return {}
  }
}

export function saveOpenWorkProviderState(input: {
  model?: string
  baseUrl?: string
  openaiApiKey?: string
}): void {
  ensureDir()
  const key = getOrCreateMasterKey()
  const prevPublic = loadOpenWorkPublicConfig()
  const prevSecrets = loadOpenWorkSecrets()
  const publicCfg: OpenWorkPublicConfig = {
    version: 1,
    model: input.model ?? prevPublic?.model,
    baseUrl: input.baseUrl ?? prevPublic?.baseUrl,
    updatedAt: new Date().toISOString(),
  }
  writeFileSync(PUBLIC_FILE, JSON.stringify(publicCfg, null, 2), { mode: FILE_MODE })
  try {
    chmodSync(PUBLIC_FILE, FILE_MODE)
  } catch {
    // ignore
  }

  const nextSecrets: EncryptedSecrets = {
    ...prevSecrets,
    ...(input.openaiApiKey !== undefined
      ? { openaiApiKey: input.openaiApiKey }
      : {}),
  }
  if (Object.keys(nextSecrets).length > 0) {
    const enc = encryptJson(nextSecrets, key)
    writeFileSync(SECRETS_FILE, enc, { mode: FILE_MODE })
    try {
      chmodSync(SECRETS_FILE, FILE_MODE)
    } catch {
      // ignore
    }
  }
}

/** `openai/gpt-5.2` → namespace + model id for OpenAI-compatible APIs */
export function parseOpenWorkModelToken(
  raw: string | undefined,
): { namespace: string; modelId: string } | null {
  if (!raw?.trim()) return null
  const t = raw.trim()
  const slash = t.indexOf('/')
  if (slash === -1) return null
  const ns = t.slice(0, slash).trim().toLowerCase()
  const modelId = t.slice(slash + 1).trim()
  if (!ns || !modelId) return null
  return { namespace: ns, modelId }
}

export function defaultBaseUrlForNamespace(namespace: string): string | undefined {
  if (namespace === 'ollama' || namespace === 'local') {
    return 'http://localhost:11434/v1'
  }
  if (namespace === 'openai') {
    return DEFAULT_OPENAI_BASE_URL
  }
  return undefined
}

export type ParsedOpenWorkCli = {
  model?: string
  modelNamespace?: string
  baseUrl?: string
  apiKey?: string
  consumedOpenWorkModel: boolean
}

const API_KEY_FLAGS = new Set(['--api-key', '--apiKey'])
const BASE_URL_FLAGS = new Set(['--base-url', '--baseUrl'])

function takeEqualsOrNext(
  argv: string[],
  i: number,
  prefix: string,
): { value: string; nextIndex: number } | null {
  const a = argv[i]!
  if (a === prefix) {
    const v = argv[i + 1]
    if (v === undefined || v.startsWith('-')) return { value: '', nextIndex: i + 1 }
    return { value: v, nextIndex: i + 2 }
  }
  if (a.startsWith(`${prefix}=`)) {
    return { value: a.slice(prefix.length + 1), nextIndex: i + 1 }
  }
  return null
}

/**
 * Pull OpenWork provider flags from argv. Returns a new argv without those tokens.
 */
export function extractOpenWorkProviderCli(argv: string[]): {
  argvOut: string[]
  parsed: ParsedOpenWorkCli
} {
  const skip = new Set<number>()
  const parsed: ParsedOpenWorkCli = { consumedOpenWorkModel: false }

  for (let i = 0; i < argv.length; i++) {
    if (skip.has(i)) continue
    const arg = argv[i]!

    let hit = false
    for (const f of API_KEY_FLAGS) {
      const t = takeEqualsOrNext(argv, i, f)
      if (t) {
        parsed.apiKey = t.value
        for (let j = i; j < t.nextIndex; j++) skip.add(j)
        hit = true
        break
      }
    }
    if (hit) continue

    for (const f of BASE_URL_FLAGS) {
      const t = takeEqualsOrNext(argv, i, f)
      if (t) {
        parsed.baseUrl = t.value
        for (let j = i; j < t.nextIndex; j++) skip.add(j)
        hit = true
        break
      }
    }
    if (hit) continue

    if (arg === '--model' || arg.startsWith('--model=')) {
      let modelVal: string
      let nextIdx: number
      if (arg === '--model') {
        const v = argv[i + 1]
        if (v === undefined || v.startsWith('-')) continue
        modelVal = v
        nextIdx = i + 2
      } else {
        modelVal = arg.slice('--model='.length)
        nextIdx = i + 1
      }
      const split = parseOpenWorkModelToken(modelVal)
      if (split) {
        parsed.model = split.modelId
        parsed.modelNamespace = split.namespace
        parsed.consumedOpenWorkModel = true
        for (let j = i; j < nextIdx; j++) skip.add(j)
      }
    }
  }

  const argvOut = argv.filter((_, idx) => !skip.has(idx))
  return { argvOut, parsed }
}

function isLocalBaseUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false
  try {
    const u = new URL(url.trim())
    const h = u.hostname.toLowerCase()
    return h === 'localhost' || h === '127.0.0.1' || h === '::1'
  } catch {
    return false
  }
}

/**
 * Merge ~/.openwork store + CLI flags into process.env, enable OpenAI shim when appropriate.
 * Mutates process.argv to drop consumed flags (avoids leaking --api-key in ps / shell history replay via argv).
 */
export function applyOpenWorkProviderFromArgvAndStore(): void {
  if (process.env.OPENWORK_SKIP_STORE === '1') {
    return
  }

  const orig = process.argv.slice(2)
  const { argvOut, parsed } = extractOpenWorkProviderCli(orig)

  const diskPublic = loadOpenWorkPublicConfig()
  const diskSecrets = loadOpenWorkSecrets()
  const storePresent = hasOpenWorkStoreOnDisk()

  const useOpenWork =
    storePresent ||
    parsed.apiKey !== undefined ||
    parsed.baseUrl !== undefined ||
    parsed.consumedOpenWorkModel

  if (!useOpenWork) {
    return
  }

  if (argvOut.length !== orig.length) {
    process.argv = [process.argv[0]!, process.argv[1]!, ...argvOut]
  }

  process.env.CLAUDE_CODE_USE_OPENAI = '1'

  const model =
    parsed.model ??
    process.env.OPENAI_MODEL ??
    diskPublic?.model
  const baseUrlFromCli =
    parsed.baseUrl !== undefined ? (parsed.baseUrl.trim() || undefined) : undefined
  const baseUrlRaw =
    baseUrlFromCli ??
    process.env.OPENAI_BASE_URL ??
    diskPublic?.baseUrl

  let baseUrl = baseUrlRaw?.trim() || undefined
  const modelNs = parsed.modelNamespace
  if (!baseUrl && modelNs) {
    baseUrl = defaultBaseUrlForNamespace(modelNs)
  }
  if (!baseUrl) {
    baseUrl = DEFAULT_OPENAI_BASE_URL
  }

  const apiKey =
    (parsed.apiKey !== undefined ? parsed.apiKey : undefined) ??
    process.env.OPENAI_API_KEY ??
    diskSecrets.openaiApiKey

  if (model) {
    process.env.OPENAI_MODEL = model
  }
  process.env.OPENAI_BASE_URL = baseUrl
  if (apiKey) {
    process.env.OPENAI_API_KEY = apiKey
  } else if (isLocalBaseUrl(baseUrl)) {
    delete process.env.OPENAI_API_KEY
  }

  const shouldSave =
    parsed.apiKey !== undefined ||
    parsed.baseUrl !== undefined ||
    parsed.consumedOpenWorkModel

  if (shouldSave && (model || baseUrl || apiKey)) {
    saveOpenWorkProviderState({
      model,
      baseUrl,
      openaiApiKey: apiKey,
    })
  }
}
