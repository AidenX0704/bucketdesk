import { ipcMain } from 'electron'
import type { AppResult } from '../../shared/types/result'
import { toErrorMessage } from '../../shared/types/result'

type Handler<TOutput, TInput extends unknown[] = unknown[]> = (...input: TInput) => Promise<TOutput> | TOutput

export const registerHandler = <TOutput, TInput extends unknown[] = unknown[]>(
  channel: string,
  handler: Handler<TOutput, TInput>
): void => {
  ipcMain.handle(channel, async (_event, ...input): Promise<AppResult<TOutput>> => {
    try {
      return {
        ok: true,
        data: await handler(...(input as TInput))
      }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'APP_ERROR',
          message: toErrorMessage(error)
        }
      }
    }
  })
}
