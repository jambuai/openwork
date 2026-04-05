import { stdin as input, stdout as output } from 'node:process'
import React from 'react'
import { render } from '../ink.js'
import { KeybindingSetup } from '../keybindings/KeybindingProviderSetup.js'
import { AppStateProvider } from '../state/AppState.js'
import { enableConfigs } from '../utils/config.js'
import {
  loadOpenWorkPublicConfig,
  loadOpenWorkSecrets,
  OPENWORK_DIR,
  saveOpenWorkProviderState,
} from '../utils/openworkProviderStore.js'
import { getBaseRenderOptions } from '../utils/renderOptions.js'
import { OPENWORK_CONFIGURE_PRESETS } from './openWorkConfigurePresets.js'
import { OpenWorkConfigureWizard } from './openWorkConfigureUI.js'

export type { OpenWorkConfigurePreset as Preset } from './openWorkConfigurePresets.js'

/**
 * Interactive OpenWork provider wizard (Ink + Select). Writes ~/.openwork/provider.json and encrypted credentials.
 */
export async function runOpenWorkConfigure(): Promise<void> {
  if (!input.isTTY || !output.isTTY) {
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.error(
      'openwork configure requires an interactive terminal. Set OPENAI_API_KEY, OPENAI_BASE_URL, and OPENAI_MODEL in your environment, or use:\n' +
        '  openwork --model openai/MODEL --baseUrl=URL --apiKey=KEY',
    )
    process.exit(1)
  }

  // ThemeProvider reads ~/.claude config for theme; Ink render wraps the tree with it.
  enableConfigs()

  const pub = loadOpenWorkPublicConfig()
  const sec = loadOpenWorkSecrets()

  await new Promise<void>(resolve => {
    void (async () => {
      const instance = await render(
        <AppStateProvider>
          <KeybindingSetup>
            <OpenWorkConfigureWizard
              presets={OPENWORK_CONFIGURE_PRESETS}
              pub={pub}
              sec={sec}
              openworkDir={OPENWORK_DIR}
              onComplete={result => {
                saveOpenWorkProviderState({
                  model: result.model,
                  baseUrl: result.baseUrl,
                  openaiApiKey: result.openaiApiKey,
                })
                instance.unmount()
                // biome-ignore lint/suspicious/noConsole: CLI output after Ink teardown
                console.log('\nSaved. Run `openwork`.')
                resolve()
              }}
              onCancel={() => {
                instance.unmount()
                process.exit(1)
              }}
            />
          </KeybindingSetup>
        </AppStateProvider>,
        {
          ...getBaseRenderOptions(true),
          exitOnCtrlC: true,
          // Avoid getGlobalConfig() on mount (ThemeProvider lazy init + config gate).
          themeInitialSetting: 'dark',
        },
      )
    })()
  })
  // Ink leaves TTY watchers / handles alive; exit so the shell prompt returns immediately.
  // eslint-disable-next-line custom-rules/no-process-exit -- configure is a leaf command
  process.exit(0)
}
