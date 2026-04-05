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
  type OpenWorkAccentPreset,
  type OpenWorkAsciiPreset,
  saveOpenWorkAppearance,
  welcomeTitleLine,
} from '../utils/openworkAppearance.js'

type Step =
  | 'product'
  | 'productCustom'
  | 'prefix'
  | 'prefixCustom'
  | 'accent'
  | 'ascii'
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
  { value: 'full', label: 'Full ASCII art', hint: 'Large claw banner (default)' },
  { value: 'minimal', label: 'Minimal frame', hint: 'Rounded box, no ASCII drawing' },
  { value: 'none', label: 'Text only', hint: 'Single line title + version' },
]

type Props = {
  openworkDir: string
  onComplete: () => void
  onCancel: () => void
}

export function OpenWorkAppearanceWizard({ openworkDir, onComplete, onCancel }: Props): React.ReactNode {
  const initial = useMemo(() => loadOpenWorkAppearance(), [])
  const [step, setStep] = useState<Step>('product')
  const [productName, setProductName] = useState(initial.productName)
  const [welcomePrefix, setWelcomePrefix] = useState(initial.welcomePrefix)
  const [accentColor, setAccentColor] = useState<OpenWorkAccentPreset>(initial.accentColor)
  const [asciiPreset, setAsciiPreset] = useState<OpenWorkAsciiPreset>(initial.asciiPreset)
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
      }),
    [productName, welcomePrefix, accentColor, asciiPreset],
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
    })
    onComplete()
  }, [productName, welcomePrefix, accentColor, asciiPreset, onComplete])

  if (step === 'productCustom') {
    return (
      <Dialog title="Custom product name" onCancel={onCancel}>
        <Box flexDirection="column" gap={1}>
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
          <Text dimColor>Line preview: «{previewLine}»</Text>
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

  if (step === 'accent') {
    return (
      <Dialog title="Appearance — accent color" onCancel={onCancel}>
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Color for the title segment in the welcome line.</Text>
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
          <Text dimColor>How much ASCII art to show on first screen / doctor.</Text>
          <Select
            layout="compact-vertical"
            visibleOptionCount={6}
            options={ASCII_OPTIONS.map<OptionWithDescription<OpenWorkAsciiPreset>>(o => ({
              value: o.value,
              label: o.label,
              description: o.hint,
            }))}
            onChange={v => {
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
        <Box borderStyle="round" borderColor="subtle" flexDirection="column" paddingX={1} paddingY={1}>
          <Text dimColor>Preview</Text>
          <Text>
            <Text color={accentColor}>{previewLine}</Text>
            <Text dimColor> v{MACRO.DISPLAY_VERSION ?? MACRO.VERSION}</Text>
          </Text>
          <Text dimColor>
            ASCII: {asciiPreset} · accent: {accentColor}
          </Text>
        </Box>
        <Text dimColor>Writes appearance.json under {openworkDir}</Text>
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
