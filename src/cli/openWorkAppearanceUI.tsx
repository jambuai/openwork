import figures from 'figures'
import React, { useCallback, useMemo, useState } from 'react'
import { Select } from '../components/CustomSelect/index.js'
import type { OptionWithDescription } from '../components/CustomSelect/select.js'
import TextInput from '../components/TextInput.js'
import { Dialog } from '../components/design-system/Dialog.js'
import { Box, Text } from '../ink.js'
import {
  loadOpenWorkAppearance,
  OPENWORK_ACCENT_PRESETS,
  OPENWORK_ASCII_MAX_COLS,
  OPENWORK_ASCII_MAX_LINES,
  type OpenWorkAccentPreset,
  type OpenWorkAppearanceV1,
  type OpenWorkAsciiPreset,
  parseAsciiArtPaste,
  saveOpenWorkAppearance,
  welcomeTitleLine,
} from '../utils/openworkAppearance.js'
import { generateAsciiArtWithOpenWorkLlm } from '../utils/openworkAsciiArtLlm.js'

type Step =
  | 'product'
  | 'productCustom'
  | 'prefix'
  | 'prefixCustom'
  | 'accent'
  | 'ascii'
  | 'asciiCustom'
  | 'confirm'

const PRODUCT_PRESETS: { value: string; label: string; hint?: string }[] = [
  { value: 'OpenWork', label: 'OpenWork', hint: 'Default' },
  { value: 'Claude Code', label: 'Claude Code', hint: 'Upstream-style label' },
  { value: '__custom__', label: 'Custom name…', hint: 'Type your product name' },
]

const PREFIX_PRESETS: { value: string; label: string }[] = [
  { value: 'Welcome to', label: 'Welcome to' },
  { value: 'Hi —', label: 'Hi —' },
  { value: '', label: '(no prefix, name only)' },
  { value: '__custom__', label: 'Custom prefix…' },
]

const ASCII_OPTIONS: { value: OpenWorkAsciiPreset; label: string; hint: string }[] = [
  { value: 'full', label: 'Full ASCII art', hint: 'Built-in OpenWork banner (default)' },
  { value: 'custom', label: 'Custom ASCII art', hint: 'Paste your own drawing on the next step' },
  { value: 'minimal', label: 'Minimal frame', hint: 'Rounded box, no ASCII drawing' },
  { value: 'none', label: 'Text only', hint: 'Single line title + version' },
]

type Props = {
  openworkDir: string
  onComplete: () => void
  onCancel: () => void
}

function appearanceJsonBasename(): string {
  return 'appearance.json'
}

function WizardContextPanel({
  initial,
  productName,
  welcomePrefix,
  accentColor,
  asciiPreset,
  asciiArtLines,
  openworkDir,
  draftHint,
  /** Live preview while typing a custom product name (before state commit). */
  draftProductName,
  /** Live preview while typing a custom prefix. */
  draftWelcomePrefix,
  /** While editing custom ASCII (preset not committed yet). */
  draftAsciiPreset,
  draftAsciiArtLines,
}: {
  initial: OpenWorkAppearanceV1
  productName: string
  welcomePrefix: string
  accentColor: OpenWorkAccentPreset
  asciiPreset: OpenWorkAsciiPreset
  asciiArtLines: string[]
  openworkDir: string
  draftHint?: string
  draftProductName?: string
  draftWelcomePrefix?: string
  draftAsciiPreset?: OpenWorkAsciiPreset
  draftAsciiArtLines?: string[]
}): React.ReactNode {
  const ver = MACRO.DISPLAY_VERSION ?? MACRO.VERSION
  const effName = draftProductName ?? productName
  const effPrefix = draftWelcomePrefix ?? welcomePrefix
  const effAsciiPreset = draftAsciiPreset ?? asciiPreset
  const effAsciiLines = draftAsciiArtLines ?? asciiArtLines
  const diskLine = useMemo(() => welcomeTitleLine(initial), [initial])
  const draftLine = useMemo(
    () =>
      welcomeTitleLine({
        version: 1,
        productName: effName,
        welcomePrefix: effPrefix,
        accentColor,
        asciiPreset: effAsciiPreset,
        asciiArtLines: effAsciiLines,
      }),
    [effName, effPrefix, accentColor, effAsciiPreset, effAsciiLines],
  )
  const draftDiffers = useMemo(
    () =>
      initial.productName !== effName ||
      initial.welcomePrefix !== effPrefix ||
      initial.accentColor !== accentColor ||
      initial.asciiPreset !== effAsciiPreset ||
      JSON.stringify(initial.asciiArtLines) !== JSON.stringify(effAsciiLines),
    [initial, effName, effPrefix, accentColor, effAsciiPreset, effAsciiLines],
  )
  const borderColor = draftDiffers ? 'suggestion' : 'inactive'

  return (
    <Box borderStyle="round" borderColor={borderColor} flexDirection="column" marginBottom={1} paddingX={1} paddingY={1}>
      <Text bold color="subtle">
        Saved on disk ({openworkDir}/{appearanceJsonBasename()})
      </Text>
      <Text>
        <Text color={initial.accentColor}>{diskLine}</Text>
        <Text dimColor> v{ver}</Text>
      </Text>
      <Text dimColor wrap="wrap">
        productName: {initial.productName} · prefix: {initial.welcomePrefix === '' ? '∅' : initial.welcomePrefix} ·
        accent: {initial.accentColor} · banner: {initial.asciiPreset}
        {initial.asciiArtLines.length > 0
          ? ` · custom ASCII: ${initial.asciiArtLines.length} line(s)`
          : ''}
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text bold color="subtle">
          {draftDiffers ? 'Draft (will be saved if you finish)' : 'Draft'}
        </Text>
        <Text>
          <Text color={accentColor}>{draftLine}</Text>
          <Text dimColor> v{ver}</Text>
        </Text>
        <Text dimColor wrap="wrap">
          productName: {effName} · prefix: {effPrefix === '' ? '∅' : effPrefix} · accent: {accentColor} · banner:{' '}
          {effAsciiPreset}
          {effAsciiLines.length > 0 ? ` · custom ASCII: ${effAsciiLines.length} line(s)` : ''}
        </Text>
        {draftHint ? (
          <Text dimColor wrap="wrap">
            {draftHint}
          </Text>
        ) : null}
        {!draftDiffers ? (
          <Text dimColor italic>
            Same as disk — change options below to alter the welcome screen.
          </Text>
        ) : null}
      </Box>
    </Box>
  )
}

export function OpenWorkAppearanceWizard({ openworkDir, onComplete, onCancel }: Props): React.ReactNode {
  const initial = useMemo(() => loadOpenWorkAppearance(), [])
  const [step, setStep] = useState<Step>('product')
  const [productName, setProductName] = useState(initial.productName)
  const [welcomePrefix, setWelcomePrefix] = useState(initial.welcomePrefix)
  const [accentColor, setAccentColor] = useState<OpenWorkAccentPreset>(initial.accentColor)
  const [asciiPreset, setAsciiPreset] = useState<OpenWorkAsciiPreset>(initial.asciiPreset)
  const [asciiArtLines, setAsciiArtLines] = useState<string[]>(initial.asciiArtLines)
  const [asciiPaste, setAsciiPaste] = useState(() => initial.asciiArtLines.join('\n'))
  const [asciiPasteCursor, setAsciiPasteCursor] = useState(() => initial.asciiArtLines.join('\n').length)
  const [asciiCustomError, setAsciiCustomError] = useState<string | null>(null)
  const [asciiGenBusy, setAsciiGenBusy] = useState(false)
  const [asciiGenError, setAsciiGenError] = useState<string | null>(null)
  const [customName, setCustomName] = useState(
    PRODUCT_PRESETS.some(p => p.value === initial.productName) ? '' : initial.productName,
  )
  const [customPrefix, setCustomPrefix] = useState(
    PREFIX_PRESETS.some(p => p.value === initial.welcomePrefix) ? '' : initial.welcomePrefix,
  )

  const previewLine = useMemo(
    () =>
      welcomeTitleLine({
        version: 1,
        productName,
        welcomePrefix,
        accentColor,
        asciiPreset,
        asciiArtLines,
      }),
    [productName, welcomePrefix, accentColor, asciiPreset, asciiArtLines],
  )

  const accentOptions: OptionWithDescription<OpenWorkAccentPreset>[] = useMemo(
    () =>
      OPENWORK_ACCENT_PRESETS.map(p => ({
        value: p.value,
        label: p.label,
        description: `Theme key: ${p.value}`,
      })),
    [],
  )

  const handleSave = useCallback(() => {
    saveOpenWorkAppearance({
      productName,
      welcomePrefix,
      accentColor,
      asciiPreset,
      asciiArtLines,
    })
    onComplete()
  }, [productName, welcomePrefix, accentColor, asciiPreset, asciiArtLines, onComplete])

  if (step === 'productCustom') {
    return (
      <Dialog title="Custom product name" onCancel={onCancel}>
        <Box flexDirection="column" gap={1}>
          <WizardContextPanel
            initial={initial}
            productName={productName}
            welcomePrefix={welcomePrefix}
            accentColor={accentColor}
            asciiPreset={asciiPreset}
            asciiArtLines={asciiArtLines}
            openworkDir={openworkDir}
            draftProductName={customName.trim() || productName}
          />
          <Text dimColor>Shown in the welcome line (max ~48 chars, one line).</Text>
          <TextInput
            value={customName}
            onChange={setCustomName}
            onSubmit={v => {
              const t = v.trim()
              if (t) setProductName(t)
              setStep('prefix')
            }}
            placeholder={`e.g. My Dev Console${figures.ellipsis}`}
            columns={56}
            cursorOffset={customName.length}
            onChangeCursorOffset={() => {}}
            focus
            showCursor
          />
        </Box>
      </Dialog>
    )
  }

  if (step === 'prefixCustom') {
    return (
      <Dialog title="Custom welcome prefix" onCancel={onCancel}>
        <Box flexDirection="column" gap={1}>
          <WizardContextPanel
            initial={initial}
            productName={productName}
            welcomePrefix={welcomePrefix}
            accentColor={accentColor}
            asciiPreset={asciiPreset}
            asciiArtLines={asciiArtLines}
            openworkDir={openworkDir}
            draftWelcomePrefix={customPrefix}
          />
          <Text dimColor>Text before the product name (e.g. "Welcome to"). Leave empty for name only.</Text>
          <TextInput
            value={customPrefix}
            onChange={setCustomPrefix}
            onSubmit={v => {
              setWelcomePrefix(v.trim())
              setStep('accent')
            }}
            placeholder={`Welcome to${figures.ellipsis}`}
            columns={56}
            cursorOffset={customPrefix.length}
            onChangeCursorOffset={() => {}}
            focus
            showCursor
          />
        </Box>
      </Dialog>
    )
  }

  if (step === 'product') {
    return (
      <Dialog title="Appearance — product name" subtitle={openworkDir} onCancel={onCancel}>
        <Box flexDirection="column" gap={1}>
          <WizardContextPanel
            initial={initial}
            productName={productName}
            welcomePrefix={welcomePrefix}
            accentColor={accentColor}
            asciiPreset={asciiPreset}
            asciiArtLines={asciiArtLines}
            openworkDir={openworkDir}
          />
          <Text dimColor>What should the welcome line call this tool?</Text>
          <Select
            layout="compact-vertical"
            visibleOptionCount={10}
            options={PRODUCT_PRESETS.map<OptionWithDescription<string>>(p => ({
              value: p.value,
              label: p.label,
              description: p.hint,
            }))}
            onChange={v => {
              if (v === '__custom__') {
                setCustomName(prev => prev || productName)
                setStep('productCustom')
                return
              }
              setProductName(v)
              setStep('prefix')
            }}
            onCancel={onCancel}
          />
        </Box>
      </Dialog>
    )
  }

  if (step === 'prefix') {
    return (
      <Dialog title="Appearance — welcome prefix" onCancel={onCancel}>
        <Box flexDirection="column" gap={1}>
          <WizardContextPanel
            initial={initial}
            productName={productName}
            welcomePrefix={welcomePrefix}
            accentColor={accentColor}
            asciiPreset={asciiPreset}
            asciiArtLines={asciiArtLines}
            openworkDir={openworkDir}
          />
          <Text dimColor>Pick the text before the product name (see Draft above).</Text>
          <Select
            layout="compact-vertical"
            visibleOptionCount={8}
            options={PREFIX_PRESETS.map<OptionWithDescription<string>>(p => ({
              value: p.value,
              label: p.label,
            }))}
            onChange={v => {
              if (v === '__custom__') {
                setCustomPrefix(p => p || welcomePrefix)
                setStep('prefixCustom')
                return
              }
              setWelcomePrefix(v)
              setStep('accent')
            }}
            onCancel={onCancel}
          />
        </Box>
      </Dialog>
    )
  }

  if (step === 'asciiCustom') {
    const pasteLines = parseAsciiArtPaste(asciiPaste)
    return (
      <Dialog title="Appearance — custom ASCII" onCancel={onCancel}>
        <Box flexDirection="column" gap={1}>
          <WizardContextPanel
            initial={initial}
            productName={productName}
            welcomePrefix={welcomePrefix}
            accentColor={accentColor}
            asciiPreset={asciiPreset}
            asciiArtLines={asciiArtLines}
            openworkDir={openworkDir}
            draftAsciiPreset="custom"
            draftAsciiArtLines={pasteLines}
            draftHint="Continue applies the textarea as custom ASCII (trimmed to limits)."
          />
          <Text dimColor>
            Paste your own art, or let OpenWork call your configured OpenAI-compatible model to propose a banner
            (same keys as the main CLI — a small “harness configures itself” loop). Edit the result below before
            continuing.
          </Text>
          <Text dimColor>
            Max {OPENWORK_ASCII_MAX_COLS} columns × {OPENWORK_ASCII_MAX_LINES} lines (extra is trimmed). Codex-only
            profiles are not supported for generation.
          </Text>
          {asciiGenError && !asciiGenBusy ? <Text color="error">{asciiGenError}</Text> : null}
          {asciiCustomError ? <Text color="error">{asciiCustomError}</Text> : null}
          {asciiGenBusy ? (
            <Text color="suggestion">Calling your configured model…</Text>
          ) : null}
          <TextInput
            multiline
            value={asciiPaste}
            onChange={setAsciiPaste}
            onSubmit={() => {}}
            placeholder="························"
            columns={OPENWORK_ASCII_MAX_COLS}
            cursorOffset={asciiPasteCursor}
            onChangeCursorOffset={setAsciiPasteCursor}
            focus
            showCursor
          />
          <Select
            layout="compact-vertical"
            visibleOptionCount={6}
            options={[
              {
                value: 'generate',
                label: asciiGenBusy ? 'Generating…' : 'Generate with LLM',
                description: 'Uses OPENAI_BASE_URL + model from configure / env',
              },
              {
                value: 'next',
                label: 'Continue to review',
                description: 'Requires at least one non-empty line',
              },
              { value: 'back', label: 'Back to banner style', description: '' },
            ]}
            onChange={v => {
              if (v === 'generate') {
                if (asciiGenBusy) {
                  return
                }
                void (async () => {
                  setAsciiGenBusy(true)
                  setAsciiGenError(null)
                  setAsciiCustomError(null)
                  try {
                    const lines = await generateAsciiArtWithOpenWorkLlm({
                      brandLine: previewLine,
                    })
                    setAsciiArtLines(lines)
                    const text = lines.join('\n')
                    setAsciiPaste(text)
                    setAsciiPasteCursor(text.length)
                  } catch (e) {
                    setAsciiGenError(e instanceof Error ? e.message : String(e))
                  } finally {
                    setAsciiGenBusy(false)
                  }
                })()
                return
              }
              if (v === 'back') {
                setAsciiCustomError(null)
                setAsciiGenError(null)
                setStep('ascii')
                return
              }
              const lines = parseAsciiArtPaste(asciiPaste)
              if (lines.length === 0) {
                setAsciiCustomError('Add at least one line of ASCII (or pick another style).')
                return
              }
              setAsciiCustomError(null)
              setAsciiArtLines(lines)
              setAsciiPreset('custom')
              setStep('confirm')
            }}
            onCancel={onCancel}
          />
        </Box>
      </Dialog>
    )
  }

  if (step === 'accent') {
    return (
      <Dialog title="Appearance — accent color" onCancel={onCancel}>
        <Box flexDirection="column" gap={1}>
          <WizardContextPanel
            initial={initial}
            productName={productName}
            welcomePrefix={welcomePrefix}
            accentColor={accentColor}
            asciiPreset={asciiPreset}
            asciiArtLines={asciiArtLines}
            openworkDir={openworkDir}
          />
          <Text dimColor>Color for the title segment in the welcome line (see Draft above).</Text>
          <Select
            layout="compact-vertical"
            visibleOptionCount={10}
            options={accentOptions}
            onChange={v => {
              setAccentColor(v)
              setStep('ascii')
            }}
            onCancel={onCancel}
          />
        </Box>
      </Dialog>
    )
  }

  if (step === 'ascii') {
    return (
      <Dialog title="Appearance — banner style" onCancel={onCancel}>
        <Box flexDirection="column" gap={1}>
          <WizardContextPanel
            initial={initial}
            productName={productName}
            welcomePrefix={welcomePrefix}
            accentColor={accentColor}
            asciiPreset={asciiPreset}
            asciiArtLines={asciiArtLines}
            openworkDir={openworkDir}
          />
          <Text dimColor>How much ASCII art to show on first screen / doctor.</Text>
          <Select
            layout="compact-vertical"
            visibleOptionCount={8}
            options={ASCII_OPTIONS.map<OptionWithDescription<OpenWorkAsciiPreset>>(o => ({
              value: o.value,
              label: o.label,
              description: o.hint,
            }))}
            onChange={v => {
              if (v === 'custom') {
                setAsciiPaste(asciiArtLines.join('\n'))
                setAsciiPasteCursor(asciiArtLines.join('\n').length)
                setAsciiCustomError(null)
                setStep('asciiCustom')
                return
              }
              setAsciiPreset(v)
              setStep('confirm')
            }}
            onCancel={onCancel}
          />
        </Box>
      </Dialog>
    )
  }

  return (
    <Dialog title="Appearance — save" onCancel={onCancel}>
      <Box flexDirection="column" gap={1}>
        <WizardContextPanel
          initial={initial}
          productName={productName}
          welcomePrefix={welcomePrefix}
          accentColor={accentColor}
          asciiPreset={asciiPreset}
          asciiArtLines={asciiArtLines}
          openworkDir={openworkDir}
        />
        {asciiPreset === 'custom' && asciiArtLines.length > 0 ? (
          <Box borderStyle="round" borderColor="subtle" flexDirection="column" paddingX={1} paddingY={1}>
            <Text dimColor>Custom ASCII (first lines)</Text>
            <Box flexDirection="column" marginTop={1}>
              {asciiArtLines.slice(0, 6).map((l, i) => (
                <Text key={i} dimColor>
                  {l}
                </Text>
              ))}
              {asciiArtLines.length > 6 ? (
                <Text dimColor>… {asciiArtLines.length - 6} more line(s)</Text>
              ) : null}
            </Box>
          </Box>
        ) : null}
        <Text dimColor>Writes {appearanceJsonBasename()} under {openworkDir}</Text>
        <Select
          layout="compact-vertical"
          visibleOptionCount={4}
          options={[
            { value: 'save', label: 'Save', description: 'Write ~/.openwork/appearance.json' },
            { value: 'back', label: 'Go back (restart wizard)', description: 'Change choices from the start' },
          ]}
          onChange={v => {
            if (v === 'save') handleSave()
            else setStep('product')
          }}
          onCancel={onCancel}
        />
      </Box>
    </Dialog>
  )
}
