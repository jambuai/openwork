import { stdin as input, stdout as output } from 'node:process'
import React from 'react'
import { render } from '../ink.js'
import { KeybindingSetup } from '../keybindings/KeybindingProviderSetup.js'
import { AppStateProvider } from '../state/AppState.js'
import { enableConfigs } from '../utils/config.js'
import { OPENWORK_DIR } from '../utils/openworkProviderStore.js'
import { getBaseRenderOptions } from '../utils/renderOptions.js'
import { OpenWorkAppearanceWizard } from './openWorkAppearanceUI.js'

/**
 * Interactive branding wizard: writes ~/.openwork/appearance.json.
 */
export async function runOpenWorkAppearance(): Promise<void> {
  if (!input.isTTY || !output.isTTY) {
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.error(
      'openwork appearance requires an interactive terminal. Edit ~/.openwork/appearance.json manually if needed.',
    )
    process.exit(1)
  }

  enableConfigs()

  await new Promise<void>(resolve => {
    void (async () => {
      const instance = await render(
        <AppStateProvider>
          <KeybindingSetup>
            <OpenWorkAppearanceWizard
              openworkDir={OPENWORK_DIR}
              onComplete={() => {
                instance.unmount()
                // biome-ignore lint/suspicious/noConsole: CLI output after Ink teardown
                console.log('\nSaved. Welcome screen will use these settings on next run.')
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
          themeInitialSetting: 'dark',
        },
      )
    })()
  })
  // eslint-disable-next-line custom-rules/no-process-exit -- leaf command
  process.exit(0)
}
