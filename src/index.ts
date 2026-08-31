import type { Context } from '@deepseek-ai/cordis'
import { MathInputSettingsService } from './settings-service.js'

export const name = 'dsh-math-input'

export async function apply(ctx: Context): Promise<void> {
  await ctx.plugin(MathInputSettingsService)
  ctx.effect(() => () => undefined, 'dsh-math-input lifecycle')
}
