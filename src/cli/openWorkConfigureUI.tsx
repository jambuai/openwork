import figures from 'figures'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Select } from '../components/CustomSelect/index.js'
import type { OptionWithDescription } from '../components/CustomSelect/select.js'
import { Dialog } from '../components/design-system/Dialog.js'
import { Box, Text } from '../ink.js'
import type { OpenWorkPublicConfig } from '../utils/openworkProviderStore.js'
import type { OpenWorkConfigurePreset } from './openWorkConfigurePresets.js'

const BASE_DEF = '__base_def__'
const BASE_ALT = '__base_alt__'
const MODEL_OTHER = '__model_other__'
const KEY_FIELD = '__key_field__'
const KEY_KEEP = '__key_keep__'
const KEY_NEW = '__key_new__'

type EncryptedSecretsShape = { openaiApiKey?: string }

export type ConfigureResult = {
  model: string
  baseUrl: string
  openaiApiKey: string | undefined
}

type Step = 'provider' | 'baseUrl' | 'model' | 'apiKey'

function isLocalBaseUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    const h = u.hostname.toLowerCase()
    return h === 'localhost' || h === '127.0.0.1' || h === '::1'
  } catch {
    return false
  }
}

function maskKey(key: string | undefined): string {
  if (!key) return '(none saved)'
  if (key.length <= 8) return '********'
  return `${key.slice(0, 4)}…${key.slice(-4)}`
}

function validateUrl(raw: string): string | null {
  const u = raw.trim()
  if (!u) return null
  try {
    void new URL(u)
    return u
  } catch {
    return null
  }
}

export type OpenWorkConfigureWizardProps = {
  presets: readonly OpenWorkConfigurePreset[]
  pub: OpenWorkPublicConfig | null
  sec: EncryptedSecretsShape
  openworkDir: string
  onComplete: (result: ConfigureResult) => void
  onCancel: () => void
}

export function OpenWorkConfigureWizard({
  presets,
  pub,
  sec,
  openworkDir,
  onComplete,
  onCancel,
}: OpenWorkConfigureWizardProps): React.ReactNode {
  const [step, setStep] = useState<Step>('provider')
  const [preset, setPreset] = useState<OpenWorkConfigurePreset | null>(null)
  const [baseUrl, setBaseUrlState] = useState('')
  const [model, setModelState] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [urlRetry, setUrlRetry] = useState(0)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  const [apiKeyAttempt, setApiKeyAttempt] = useState(0)
  const [modelError, setModelError] = useState<string | null>(null)
  const [modelRetry, setModelRetry] = useState(0)

  const baseUrlInputRef = useRef('')
  const modelOtherRef = useRef('')
  const apiKeyRef = useRef('')

  const hasSavedKey = sec.openaiApiKey != null && sec.openaiApiKey !== ''

  const goModel = useCallback(() => {
    setUrlError(null)
    setModelError(null)
    setModelRetry(0)
    setStep('model')
  }, [])

  const handleProviderChoice = useCallback(
    (id: string) => {
      const p = presets.find(x => x.id === id)
      if (!p) return
      setPreset(p)
      setUrlError(null)
      setUrlRetry(0)
      setStep('baseUrl')
    },
    [presets],
  )

  const handleBaseUrlChoice = useCallback(
    (value: string) => {
      if (!preset) return
      if (preset.id === 'custom') {
        if (value !== KEY_FIELD) return
        const u = validateUrl(baseUrlInputRef.current)
        if (!u) {
          setUrlError('Enter a valid URL (include https:// and usually /v1).')
          setUrlRetry(r => r + 1)
          return
        }
        setBaseUrlState(u)
        goModel()
        return
      }
      if (value === BASE_DEF) {
        setBaseUrlState(preset.baseUrl)
        goModel()
        return
      }
      if (value === BASE_ALT) {
        const u = validateUrl(baseUrlInputRef.current)
        if (!u) {
          setUrlError('Invalid URL. Try again or pick the default.')
          setUrlRetry(r => r + 1)
          return
        }
        setBaseUrlState(u)
        goModel()
      }
    },
    [preset, goModel],
  )

  const handleModelChoice = useCallback(
    (value: string) => {
      if (!preset) return
      if (value === MODEL_OTHER) {
        const m = modelOtherRef.current.trim()
        if (!m) {
          setModelError('Enter a model id (or pick a preset above).')
          setModelRetry(r => r + 1)
          return
        }
        setModelState(m)
      } else {
        setModelState(value)
      }
      setModelError(null)
      setApiKeyError(null)
      setApiKeyAttempt(0)
      setStep('apiKey')
    },
    [preset],
  )

  const finish = useCallback(
    (openaiApiKey: string | undefined) => {
      if (!preset) return
      onComplete({
        model,
        baseUrl,
        openaiApiKey,
      })
    },
    [preset, model, baseUrl, onComplete],
  )

  const handleApiKeyChoice = useCallback(
    (value: string) => {
      const local = isLocalBaseUrl(baseUrl)
      if (local) {
        if (value !== KEY_FIELD) return
        finish(apiKeyRef.current.trim() === '' ? '' : apiKeyRef.current.trim())
        return
      }
      if (hasSavedKey) {
        if (value === KEY_KEEP) {
          finish(sec.openaiApiKey)
          return
        }
        if (value === KEY_NEW) {
          const k = apiKeyRef.current.trim()
          if (!k) {
            setApiKeyError('New API key cannot be empty.')
            setApiKeyAttempt(a => a + 1)
            return
          }
          finish(k)
        }
        return
      }
      if (value === KEY_FIELD) {
        const k = apiKeyRef.current.trim()
        if (!k) {
          setApiKeyError('An API key is required for this provider.')
          setApiKeyAttempt(a => a + 1)
          return
        }
        finish(k)
      }
    },
    [baseUrl, hasSavedKey, sec.openaiApiKey, finish],
  )

  const providerOptions: OptionWithDescription<string>[] = useMemo(
    () =>
      presets.map(p => ({
        label: p.label,
        value: p.id,
        description: p.id === 'custom' ? 'Any OpenAI-compatible Chat Completions URL' : p.keyHint,
      })),
    [presets],
  )

  if (step === 'provider') {
    return (
      <Dialog
        title="OpenWork — LLM provider"
        subtitle={`Settings: ${openworkDir}/`}
        color="suggestion"
        onCancel={onCancel}
      >
        <Box flexDirection="column" gap={1}>
          {(pub?.baseUrl || pub?.model || hasSavedKey) && (
            <Box flexDirection="column" marginBottom={1}>
              <Text bold>Current profile</Text>
              <Text dimColor>
                URL: {pub?.baseUrl ?? '(not set)'} · Model: {pub?.model ?? '(not set)'} · Key:{' '}
                {maskKey(sec.openaiApiKey)}
              </Text>
            </Box>
          )}
          <Text dimColor>
            {figures.pointer} arrows / j k · Enter to confirm · Esc to cancel
          </Text>
          <Select
            layout="compact-vertical"
            visibleOptionCount={8}
            options={providerOptions}
            onChange={handleProviderChoice}
            onCancel={onCancel}
          />
        </Box>
      </Dialog>
    )
  }

  if (step === 'baseUrl' && preset) {
    if (preset.id === 'custom') {
      const opts: OptionWithDescription<string>[] = [
        {
          type: 'input',
          label: 'Base URL',
          value: KEY_FIELD,
          description: 'Must include scheme; most APIs use a …/v1 suffix',
          initialValue: '',
          onChange: v => {
            baseUrlInputRef.current = v
          },
          allowEmptySubmitToCancel: false,
        },
      ]
      return (
        <Dialog title="Base URL" color="suggestion" onCancel={onCancel}>
          <Box flexDirection="column" gap={1}>
            <Text dimColor>{preset.keyHint}</Text>
            {urlError && <Text color="error">{urlError}</Text>}
            <Select
              key={`custom-url-${urlRetry}`}
              layout="compact-vertical"
              options={opts}
              onChange={handleBaseUrlChoice}
              onCancel={onCancel}
            />
          </Box>
        </Dialog>
      )
    }

    const opts: OptionWithDescription<string>[] = [
      {
        label: `Use default`,
        value: BASE_DEF,
        description: preset.baseUrl,
      },
      {
        type: 'input',
        label: 'Custom base URL',
        value: BASE_ALT,
        initialValue: preset.baseUrl,
        onChange: v => {
          baseUrlInputRef.current = v
        },
        allowEmptySubmitToCancel: false,
      },
    ]
    return (
      <Dialog title={`Base URL — ${preset.label}`} color="suggestion" onCancel={onCancel}>
        <Box flexDirection="column" gap={1}>
          <Text dimColor>{preset.keyHint}</Text>
          {urlError && <Text color="error">{urlError}</Text>}
          <Select
            key={`base-${preset.id}-${urlRetry}`}
            layout="compact-vertical"
            options={opts}
            onChange={handleBaseUrlChoice}
            onCancel={onCancel}
          />
        </Box>
      </Dialog>
    )
  }

  if (step === 'model' && preset) {
    const opts: OptionWithDescription<string>[] = [
      ...preset.models.map(m => ({
        label: m,
        value: m,
        description: 'Recommended for this provider',
      })),
      {
        type: 'input',
        label: 'Other model id',
        value: MODEL_OTHER,
        description: 'Exact id your API expects (e.g. openai/gpt-4o on OpenRouter)',
        initialValue: '',
        onChange: v => {
          modelOtherRef.current = v
        },
        allowEmptySubmitToCancel: true,
      },
    ]
    return (
      <Dialog title={`Model — ${preset.label}`} color="suggestion" onCancel={onCancel}>
        <Box flexDirection="column" gap={1}>
          {modelError && <Text color="error">{modelError}</Text>}
          <Select
            key={`model-${modelRetry}`}
            layout="compact-vertical"
            visibleOptionCount={8}
            options={opts}
            onChange={handleModelChoice}
            onCancel={onCancel}
          />
        </Box>
      </Dialog>
    )
  }

  if (step === 'apiKey' && preset) {
    const local = isLocalBaseUrl(baseUrl)
    if (local) {
      const opts: OptionWithDescription<string>[] = [
        {
          type: 'input',
          label: 'API key',
          value: KEY_FIELD,
          description: 'Optional for localhost — press Enter with empty field to skip / clear saved key',
          initialValue: '',
          onChange: v => {
            apiKeyRef.current = v
          },
          allowEmptySubmitToCancel: true,
        },
      ]
      return (
        <Dialog title="API key (optional)" color="suggestion" onCancel={onCancel}>
          <Box flexDirection="column" gap={1}>
            <Text dimColor>{preset.keyHint}</Text>
            <Select
              key={`api-local-${apiKeyAttempt}`}
              layout="compact-vertical"
              options={opts}
              onChange={handleApiKeyChoice}
              onCancel={onCancel}
            />
          </Box>
        </Dialog>
      )
    }

    if (hasSavedKey) {
      const opts: OptionWithDescription<string>[] = [
        {
          label: 'Keep saved API key',
          value: KEY_KEEP,
          description: maskKey(sec.openaiApiKey),
        },
        {
          type: 'input',
          label: 'Replace with new API key',
          value: KEY_NEW,
          initialValue: '',
          onChange: v => {
            apiKeyRef.current = v
          },
          allowEmptySubmitToCancel: false,
        },
      ]
      return (
        <Dialog title="API key" color="suggestion" onCancel={onCancel}>
          <Box flexDirection="column" gap={1}>
            <Text dimColor>{preset.keyHint}</Text>
            {apiKeyError && <Text color="error">{apiKeyError}</Text>}
            <Select
              key={`api-saved-${apiKeyAttempt}`}
              layout="compact-vertical"
              options={opts}
              onChange={handleApiKeyChoice}
              onCancel={onCancel}
            />
          </Box>
        </Dialog>
      )
    }

    const opts: OptionWithDescription<string>[] = [
      {
        type: 'input',
        label: 'API key',
        value: KEY_FIELD,
        description: 'Required for remote providers',
        initialValue: '',
        onChange: v => {
          apiKeyRef.current = v
        },
        allowEmptySubmitToCancel: false,
      },
    ]
    return (
      <Dialog title="API key" color="suggestion" onCancel={onCancel}>
        <Box flexDirection="column" gap={1}>
          <Text dimColor>{preset.keyHint}</Text>
          {apiKeyError && <Text color="error">{apiKeyError}</Text>}
          <Select
            key={`api-req-${apiKeyAttempt}`}
            layout="compact-vertical"
            options={opts}
            onChange={handleApiKeyChoice}
            onCancel={onCancel}
          />
        </Box>
      </Dialog>
    )
  }

  return (
    <Dialog title="OpenWork configure" onCancel={onCancel}>
      <Text dimColor>Loading…</Text>
    </Dialog>
  )
}
