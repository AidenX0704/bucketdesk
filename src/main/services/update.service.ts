import { app } from 'electron'
import log from 'electron-log/main'
import { autoUpdater } from 'electron-updater'
import { readFileSync } from 'fs'
import { join } from 'path'
import type {
  UpdateChannel,
  UpdateCheckInput,
  UpdateCheckResult
} from '../../shared/types/update'
import type { SettingService } from './setting.service'

interface DevUpdateConfig {
  provider?: string
  url?: string
}

interface UpdateCheckAttempt {
  reportChannel: UpdateChannel
  updaterChannel: UpdateChannel
  feedUrl: string
  channelFile: string
  channelUrl: string
}

const UPDATE_CHANNEL_SETTING_KEY = 'updateChannel'
const DEFAULT_UPDATE_CHANNEL: UpdateChannel = 'stable'
const UPDATE_CHECK_FAILED_MESSAGE = '升级检查失败，请稍后重试或检查更新服务器配置。'

export class UpdateService {
  constructor(private readonly settings: SettingService) {
    log.initialize()
    autoUpdater.logger = log
    autoUpdater.autoDownload = false
    autoUpdater.on('error', (error, message) => {
      log.error('[updates] Auto updater emitted an error', {
        message,
        error: serializeError(error)
      })
    })
  }

  async check(input?: UpdateCheckInput): Promise<UpdateCheckResult> {
    const channel = normalizeUpdateChannel(input?.channel ?? this.getChannel())
    const baseUrl = this.resolveBaseUrl()
    const attempts = this.createCheckAttempts(baseUrl, channel)

    log.info('[updates] Checking for updates', {
      channel,
      baseUrl,
      attempts,
      currentVersion: app.getVersion()
    })

    const errors: unknown[] = []

    for (const attempt of attempts) {
      try {
        const updateInfo = await this.fetchUpdateInfo(attempt)
        return this.toResult(updateInfo, attempt.reportChannel)
      } catch (error) {
        errors.push(error)
        log.warn('[updates] Update check attempt failed', {
          ...attempt,
          baseUrl,
          error: serializeError(error)
        })
      }
    }

    log.error('[updates] Update check failed', {
      channel,
      baseUrl,
      attempts,
      errors: errors.map(serializeError)
    })
    throw new Error(UPDATE_CHECK_FAILED_MESSAGE)
  }

  getChannel(): UpdateChannel {
    return normalizeUpdateChannel(this.settings.get<UpdateChannel>(UPDATE_CHANNEL_SETTING_KEY))
  }

  private createCheckAttempts(baseUrl: string, channel: UpdateChannel): UpdateCheckAttempt[] {
    if (!baseUrl) {
      throw new Error(UPDATE_CHECK_FAILED_MESSAGE)
    }

    if (channel === DEFAULT_UPDATE_CHANNEL) {
      return [this.createAttempt(baseUrl, channel, DEFAULT_UPDATE_CHANNEL)]
    }

    return [this.createAttempt(baseUrl, channel, channel)]
  }

  private createAttempt(
    feedUrl: string,
    reportChannel: UpdateChannel,
    updaterChannel: UpdateChannel
  ): UpdateCheckAttempt {
    const normalizedFeedUrl = ensureTrailingSlash(feedUrl)
    const channelFile = `${updaterChannel}.yml`

    try {
      return {
        reportChannel,
        updaterChannel,
        feedUrl: normalizedFeedUrl,
        channelFile,
        channelUrl: new URL(channelFile, normalizedFeedUrl).toString()
      }
    } catch {
      throw new Error(UPDATE_CHECK_FAILED_MESSAGE)
    }
  }

  private async fetchUpdateInfo(attempt: UpdateCheckAttempt): Promise<ParsedUpdateInfo> {
    const response = await fetch(attempt.channelUrl, { cache: 'no-store' })

    if (!response.ok) {
      throw new Error(
        `Cannot fetch ${attempt.channelFile}: HTTP ${response.status} ${response.statusText}`
      )
    }

    const rawData = await response.text()
    const updateInfo = parseUpdateInfo(rawData)

    log.info('[updates] Update info loaded', {
      channel: attempt.reportChannel,
      channelFile: attempt.channelFile,
      channelUrl: attempt.channelUrl,
      version: updateInfo.version
    })

    return updateInfo
  }

  private resolveBaseUrl(): string {
    const configPath = app.isPackaged
      ? join(process.resourcesPath, 'app-update.yml')
      : join(app.getAppPath(), 'dev-app-update.yml')

    try {
      const config = parseUpdateConfig(readFileSync(configPath, 'utf8'))
      if (config.provider === 'generic' && config.url) {
        return ensureTrailingSlash(config.url)
      }
    } catch (error) {
      log.warn('[updates] Failed to read update config', { configPath, error })
    }

    return ensureTrailingSlash(this.settings.get<string>('updateUrl') ?? '')
  }

  private toResult(result: ParsedUpdateInfo, channel: UpdateChannel): UpdateCheckResult {
    const currentVersion = app.getVersion()

    return {
      available: isNewerVersion(result.version, currentVersion),
      version: result.version,
      currentVersion,
      channel
    }
  }
}

interface ParsedUpdateInfo {
  version: string
}

const serializeError = (error: unknown): Record<string, unknown> | string => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: 'code' in error ? (error as { code?: unknown }).code : undefined
    }
  }

  return String(error)
}

const normalizeUpdateChannel = (channel: unknown): UpdateChannel => {
  return channel === 'dev' ? 'dev' : DEFAULT_UPDATE_CHANNEL
}

const ensureTrailingSlash = (value: string): string => {
  if (!value) return value
  return value.endsWith('/') ? value : `${value}/`
}

const parseUpdateInfo = (content: string): ParsedUpdateInfo => {
  const versionMatch = content.match(/^\s*version\s*:\s*['"]?([^'"\r\n]+)['"]?\s*$/m)

  if (!versionMatch?.[1]) {
    throw new Error('Update info does not contain a valid version field')
  }

  return {
    version: versionMatch[1].trim()
  }
}

const isNewerVersion = (candidate: string, current: string): boolean => {
  const candidateVersion = parseVersion(candidate)
  const currentVersion = parseVersion(current)

  if (!candidateVersion || !currentVersion) {
    return candidate !== current
  }

  for (const key of ['major', 'minor', 'patch'] as const) {
    if (candidateVersion[key] > currentVersion[key]) return true
    if (candidateVersion[key] < currentVersion[key]) return false
  }

  if (candidateVersion.prerelease === currentVersion.prerelease) return false
  if (!candidateVersion.prerelease) return true
  if (!currentVersion.prerelease) return false

  return candidateVersion.prerelease > currentVersion.prerelease
}

const parseVersion = (
  value: string
): { major: number; minor: number; patch: number; prerelease: string } | undefined => {
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/)
  if (!match) return undefined

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? ''
  }
}

const parseUpdateConfig = (content: string): DevUpdateConfig => {
  const config: DevUpdateConfig = {}

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*(provider|url)\s*:\s*(.+?)\s*$/)
    if (!match) continue
    config[match[1] as keyof DevUpdateConfig] = match[2].replace(/^['"]|['"]$/g, '')
  }

  return config
}
