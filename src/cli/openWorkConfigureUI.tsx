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
const STEP_BACK = '__step_back__'
const CONFIRM_SAVE = '__confirm_save__'

type EncryptedSecretsShape = { openaiApiKey?: string }

export type ConfigureResult = {
  model: string
  baseUrl: string
  openaiApiKey: string | undefined
}

type Step = 'provider' | 'baseUrl' | 'model' | 'apiKey' | 'confirm'

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

function keyLineForReview(k: string | undefined): string {
  if (k === undefined || k === '') {
    return '(none — optional for local URLs)'
  }
  return maskKey(k)
}

function hasDiskProfile(
  pub: OpenWorkPublicConfig | null,
  sec: EncryptedSecretsShape,
): boolean {
  return !!(
    (pub?.baseUrl && pub.baseUrl.trim() !== '') ||
    (pub?.model && pub.model.trim() !== '') ||
    (sec.openaiApiKey != null && sec.openaiApiKey !== '')
  )
}

function ProfileFieldRows({
  pub,
  sec,
}: {
  pub: OpenWorkPublicConfig | null
  sec: EncryptedSecretsShape
}): React.ReactNode {
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Text dimColor>Base URL</Text>
        <Text wrap="wrap">{pub?.baseUrl?.trim() ? pub.baseUrl : '—'}</Text>
      </Box>
      <Box flexDirection="column">
        <Text dimColor>Model</Text>
        <Text wrap="wrap">{pub?.model?.trim() ? pub.model : '—'}</Text>
      </Box>
      <Box flexDirection="column">
        <Text dimColor>API key</Text>
        <Text>{maskKey(sec.openaiApiKey)}</Text>
      </Box>
    </Box>
  )
}

/** Framed summary of what is already stored on disk (initial load). */
function DiskProfilePanel({
  pub,
  sec,
  variant,
}: {
  pub: OpenWorkPublicConfig | null
  sec: EncryptedSecretsShape
  variant: 'hero' | 'strip'
}): React.ReactNode {
  const saved = hasDiskProfile(pub, sec)
  if (variant === 'hero') {
    if (!saved) {
      return (
        <Box
          borderStyle="round"
          borderColor="inactive"
          flexDirection="column"
          paddingX={1}
          paddingY={1}
          marginBottom={1}
        >
          <Text bold color="suggestion">
            No profile on disk yet
          </Text>
          <Text dimColor>
            Pick a provider below to create your first ~/.openwork setup.
          </Text>
        </Box>
      )
    }
    return (
      <Box
        borderStyle="round"
        borderColor="ide"
        flexDirection="column"
        paddingX={1}
        paddingY={1}
        marginBottom={1}
      >
        <Text bold color="suggestion">
          Current profile on disk
        </Text>
        <Text dimColor>
          This is what OpenWork uses today. Continue only if you want to replace
          it.
        </Text>
        <Box
          borderStyle="single"
          borderDimColor
          flexDirection="column"
          paddingX={1}
          paddingY={1}
          marginTop={1}
        >
          <ProfileFieldRows pub={pub} sec={sec} />
        </Box>
      </Box>
    )
  }
  if (!saved) {
    return null
  }
  return (
    <Box
      borderStyle="round"
      borderColor="subtle"
      flexDirection="column"
      paddingX={1}
      paddingY={1}
      marginBottom={1}
    >
      <Text bold dimColor>
        On disk right now
      </Text>
      <ProfileFieldRows pub={pub} sec={sec} />
    </Box>
  )
}

function navHintForStep(step: Step): string {
  const base = `${figures.pointer} arrows or j/k · Enter confirm`
  if (step === 'provider') {
    return `${base} · Esc exit wizard`
  }
  return `${base} · Esc previous step`
}

const backOption: OptionWithDescription<string> = {
  label: '← Back',
  value: STEP_BACK,
  description: 'Previous step without losing earlier choices',
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
  const [pendingResult, setPendingResult] = useState<ConfigureResult | null>(
    null,
  )

  const baseUrlInputRef = useRef('')
  const modelOtherRef = useRef('')
  const apiKeyRef = useRef('')

  const hasSavedKey = sec.openaiApiKey != null && sec.openaiApiKey !== ''

  const goBack = useCallback(() => {
    setApiKeyError(null)
    setUrlError(null)
    setModelError(null)
    if (step === 'confirm') {
      setPendingResult(null)
      setStep('apiKey')
      return
    }
    if (step === 'apiKey') {
      apiKeyRef.current = ''
      setApiKeyAttempt(0)
      setStep('model')
      return
    }
    if (step === 'model') {
      setModelState('')
      modelOtherRef.current = ''
      setModelRetry(0)
      setStep('baseUrl')
      return
    }
    if (step === 'baseUrl') {
      setPreset(null)
      setBaseUrlState('')
      setModelState('')
      baseUrlInputRef.current = ''
      modelOtherRef.current = ''
      setUrlRetry(0)
      setStep('provider')
      return
    }
    onCancel()
  }, [step, onCancel])

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
      if (value === STEP_BACK) {
        goBack()
        return
      }
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
    [preset, goModel, goBack],
  )

  const handleModelChoice = useCallback(
    (value: string) => {
      if (value === STEP_BACK) {
        goBack()
        return
      }
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
    [preset, goBack],
  )

  const goConfirm = useCallback(
    (openaiApiKey: string | undefined) => {
      if (!preset) return
      setPendingResult({
        model,
        baseUrl,
        openaiApiKey,
      })
      setStep('confirm')
    },
    [preset, model, baseUrl],
  )

  const handleConfirmChoice = useCallback(
    (value: string) => {
      if (value === STEP_BACK) {
        goBack()
        return
      }
      if (value === CONFIRM_SAVE && pendingResult) {
        onComplete(pendingResult)
      }
    },
    [pendingResult, onComplete, goBack],
  )

  const handleApiKeyChoice = useCallback(
    (value: string) => {
      if (value === STEP_BACK) {
        goBack()
        return
      }
      const local = isLocalBaseUrl(baseUrl)
      if (local) {
        if (value !== KEY_FIELD) return
        goConfirm(apiKeyRef.current.trim() === '' ? '' : apiKeyRef.current.trim())
        return
      }
      if (hasSavedKey) {
        if (value === KEY_KEEP) {
          goConfirm(sec.openaiApiKey)
          return
        }
        if (value === KEY_NEW) {
          const k = apiKeyRef.current.trim()
          if (!k) {
            setApiKeyError(
              'New API key cannot be empty. Enter a key, or Esc / ← Back to change model.',
            )
            setApiKeyAttempt(a => a + 1)
            return
          }
          goConfirm(k)
        }
        return
      }
      if (value === KEY_FIELD) {
        const k = apiKeyRef.current.trim()
        if (!k) {
          setApiKeyError(
            'API key required for this provider. Paste a key, or Esc / ← Back to revise earlier steps.',
          )
          setApiKeyAttempt(a => a + 1)
          return
        }
        goConfirm(k)
      }
    },
    [baseUrl, hasSavedKey, sec.openaiApiKey, goConfirm, goBack],
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
          <DiskProfilePanel pub={pub} sec={sec} variant="hero" />
          <Text dimColor>{navHintForStep('provider')}</Text>
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
        backOption,
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
        <Dialog title="Base URL" color="suggestion" onCancel={goBack}>
          <Box flexDirection="column" gap={1}>
            <DiskProfilePanel pub={pub} sec={sec} variant="strip" />
            <Text dimColor>{preset.keyHint}</Text>
            <Text dimColor>{navHintForStep('baseUrl')}</Text>
            {urlError && <Text color="error">{urlError}</Text>}
            <Select
              key={`custom-url-${urlRetry}`}
              layout="compact-vertical"
              options={opts}
              onChange={handleBaseUrlChoice}
              onCancel={goBack}
            />
          </Box>
        </Dialog>
      )
    }

    const opts: OptionWithDescription<string>[] = [
      backOption,
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
      <Dialog title={`Base URL — ${preset.label}`} color="suggestion" onCancel={goBack}>
        <Box flexDirection="column" gap={1}>
          <DiskProfilePanel pub={pub} sec={sec} variant="strip" />
          <Text dimColor>{preset.keyHint}</Text>
          <Text dimColor>{navHintForStep('baseUrl')}</Text>
          {urlError && <Text color="error">{urlError}</Text>}
          <Select
            key={`base-${preset.id}-${urlRetry}`}
            layout="compact-vertical"
            options={opts}
            onChange={handleBaseUrlChoice}
            onCancel={goBack}
          />
        </Box>
      </Dialog>
    )
  }

  if (step === 'model' && preset) {
    const opts: OptionWithDescription<string>[] = [
      backOption,
      ...preset.models.map(m => ({
        label: m,
        value: m,
        description: 'Recommended for this provider',
      })),
      {
        type: 'input',
        label: 'Other model id',
        value: MODEL_OTHER,
        description: 'Exact id your API expects (e.g. openai/gpt-5.2 on OpenRouter)',
        initialValue: '',
        onChange: v => {
          modelOtherRef.current = v
        },
        allowEmptySubmitToCancel: true,
      },
    ]
    return (
      <Dialog title={`Model — ${preset.label}`} color="suggestion" onCancel={goBack}>
        <Box flexDirection="column" gap={1}>
          <DiskProfilePanel pub={pub} sec={sec} variant="strip" />
          <Text dimColor>{navHintForStep('model')}</Text>
          {modelError && <Text color="error">{modelError}</Text>}
          <Select
            key={`model-${modelRetry}`}
            layout="compact-vertical"
            visibleOptionCount={8}
            options={opts}
            onChange={handleModelChoice}
            onCancel={goBack}
          />
        </Box>
      </Dialog>
    )
  }

  if (step === 'apiKey' && preset) {
    const local = isLocalBaseUrl(baseUrl)
    if (local) {
      const opts: OptionWithDescription<string>[] = [
        backOption,
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
        <Dialog title="API key (optional)" color="suggestion" onCancel={goBack}>
          <Box flexDirection="column" gap={1}>
            <DiskProfilePanel pub={pub} sec={sec} variant="strip" />
            <Text dimColor>{preset.keyHint}</Text>
            <Text dimColor>{navHintForStep('apiKey')}</Text>
            <Select
              key={`api-local-${apiKeyAttempt}`}
              layout="compact-vertical"
              options={opts}
              onChange={handleApiKeyChoice}
              onCancel={goBack}
            />
          </Box>
        </Dialog>
      )
    }

    if (hasSavedKey) {
      const opts: OptionWithDescription<string>[] = [
        backOption,
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
        <Dialog title="API key" color="suggestion" onCancel={goBack}>
          <Box flexDirection="column" gap={1}>
            <DiskProfilePanel pub={pub} sec={sec} variant="strip" />
            <Text dimColor>{preset.keyHint}</Text>
            <Text dimColor>{navHintForStep('apiKey')}</Text>
            {apiKeyError && <Text color="error">{apiKeyError}</Text>}
            <Select
              key={`api-saved-${apiKeyAttempt}`}
              layout="compact-vertical"
              options={opts}
              onChange={handleApiKeyChoice}
              onCancel={goBack}
            />
          </Box>
        </Dialog>
      )
    }

    const opts: OptionWithDescription<string>[] = [
      backOption,
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
      <Dialog title="API key" color="suggestion" onCancel={goBack}>
        <Box flexDirection="column" gap={1}>
          <DiskProfilePanel pub={pub} sec={sec} variant="strip" />
          <Text dimColor>{preset.keyHint}</Text>
          <Text dimColor>{navHintForStep('apiKey')}</Text>
          {apiKeyError && <Text color="error">{apiKeyError}</Text>}
          <Select
            key={`api-req-${apiKeyAttempt}`}
            layout="compact-vertical"
            options={opts}
            onChange={handleApiKeyChoice}
            onCancel={goBack}
          />
        </Box>
      </Dialog>
    )
  }

  if (step === 'confirm' && preset && pendingResult) {
    const confirmOpts: OptionWithDescription<string>[] = [
      {
        label: 'Save and finish',
        value: CONFIRM_SAVE,
        description: `Write provider.json + credentials under ${openworkDir}/`,
      },
      backOption,
    ]
    return (
      <Dialog title="Review & save" color="suggestion" onCancel={goBack}>
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Compare with what is on disk, then save or go back.</Text>
          {hasDiskProfile(pub, sec) && (
            <Box
              borderStyle="round"
              borderColor="inactive"
              flexDirection="column"
              paddingX={1}
              paddingY={1}
            >
              <Text bold dimColor>
                Before (on disk)
              </Text>
              <ProfileFieldRows pub={pub} sec={sec} />
            </Box>
          )}
          <Box
            borderStyle="round"
            borderColor="suggestion"
            flexDirection="column"
            paddingX={1}
            paddingY={1}
          >
            <Text bold color="suggestion">
              After save
            </Text>
            <Box flexDirection="column" gap={1} marginTop={1}>
              <Box flexDirection="column">
                <Text dimColor>Provider</Text>
                <Text wrap="wrap">{preset.label}</Text>
              </Box>
              <Box flexDirection="column">
                <Text dimColor>Base URL</Text>
                <Text wrap="wrap">{pendingResult.baseUrl}</Text>
              </Box>
              <Box flexDirection="column">
                <Text dimColor>Model</Text>
                <Text wrap="wrap">{pendingResult.model}</Text>
              </Box>
              <Box flexDirection="column">
                <Text dimColor>API key</Text>
                <Text>{keyLineForReview(pendingResult.openaiApiKey)}</Text>
              </Box>
            </Box>
          </Box>
          <Text dimColor>{navHintForStep('confirm')}</Text>
          <Select
            layout="compact-vertical"
            options={confirmOpts}
            onChange={handleConfirmChoice}
            onCancel={goBack}
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
