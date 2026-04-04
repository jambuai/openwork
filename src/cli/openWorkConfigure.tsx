import { stdin as input, stdout as output } from 'node:process'
import React from 'react'
import { render } from '../ink.js'
import { KeybindingSetup } from '../keybindings/KeybindingProviderSetup.js'
import { AppStateProvider } from '../state/AppState.js'
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
                console.log('\nSaved. Run `openwork` to start.')
                // biome-ignore lint/suspicious/noConsole: CLI output
                console.log(
                  'To use Anthropic only for one session: OPENWORK_SKIP_STORE=1 openwork\n',
                )
                resolve()
              }}
              onCancel={() => {
                instance.unmount()
                process.exit(1)
              }}
            />
          </KeybindingSetup>
        </AppStateProvider>,
        { ...getBaseRenderOptions(true), exitOnCtrlC: true },
      )
    })()
  })
}
