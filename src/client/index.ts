import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { TYPERT_REMOTE } from '../remote.js'
import type { MathInputRemote } from '../remote.js'
import { MATH_INPUT_NS, en, zh } from './strings.js'
import { SettingsController, useSettingsSnapshot, type SettingsFace } from './settings-controller.js'
import { MathInputSettingsSection } from './settings.jsx'
import { MathInputUiStore } from './ui-store.js'
import { Launcher } from './launcher.jsx'
import { LatexEditorDock } from './latex-editor.jsx'
import { InlineRendererStrip } from './inline-renderer.jsx'

export const inject = ['slots', 'remote', 'locale', 'conversation']

export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE)
  const disposeLocaleDicts = ctx.locale.register(MATH_INPUT_NS, { zh, en })

  await ctx.inject(['slots', 'remote', 'remote.mathInput', 'conversation'], async (remoteCtx) => {
    const remote = remoteCtx.remote.mathInput as MathInputRemote
    const controller = new SettingsController(remote)
    const uiStore = new MathInputUiStore()

    remoteCtx.effect(() => () => controller.dispose(), 'dsh-math-input settings lifecycle')

    void controller.refreshSettings()

    const useSettings = (): SettingsFace => {
      const snapshot = useSettingsSnapshot(controller)
      return { status: snapshot.status, settings: snapshot.view.settings }
    }

    remoteCtx.slots.inject('settings.section', () =>
      remoteCtx.slots.register(
        {
          name: 'settings.section',
          id: 'dsh-math-input',
          order: 17,
          label: () => ctx.locale.bind(MATH_INPUT_NS)('settingsTitle'),
          locale: MATH_INPUT_NS,
          inject: () => ({ settingsController: controller }),
        },
        MathInputSettingsSection
      )
    )

    remoteCtx.slots.inject('conversation.input.left', () =>
      remoteCtx.slots.register(
        {
          name: 'conversation.input.left',
          id: 'math-input-launcher',
          order: 10,
          locale: MATH_INPUT_NS,
          inject: () => ({ useSettings, uiStore }),
        },
        Launcher
      )
    )

    remoteCtx.slots.inject('conversation.input.dock', () =>
      remoteCtx.slots.register(
        {
          name: 'conversation.input.dock',
          id: 'math-input-preview-strip',
          order: 25,
          locale: MATH_INPUT_NS,
          inject: () => ({}),
        },
        InlineRendererStrip
      )
    )

    remoteCtx.slots.inject('conversation.input.dock', () =>
      remoteCtx.slots.register(
        {
          name: 'conversation.input.dock',
          id: 'math-input-latex-editor',
          order: 30,
          locale: MATH_INPUT_NS,
          inject: () => ({ uiStore }),
        },
        LatexEditorDock
      )
    )

    return () => undefined
  })

  return async () => {
    disposeLocaleDicts()
    await disposeRemote()
  }
}
