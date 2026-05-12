export type UpdateChannel = 'stable' | 'dev'

export interface UpdateSettings {
  channel: UpdateChannel
}

export interface UpdateCheckInput {
  channel?: UpdateChannel
}

export interface UpdateCheckResult {
  available: boolean
  version?: string
  currentVersion: string
  channel: UpdateChannel
}
