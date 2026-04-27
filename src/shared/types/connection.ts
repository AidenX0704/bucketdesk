import type { ProviderType } from './provider'

export interface ConnectionProfile {
  id: string
  name: string
  providerType: ProviderType
  endpoint: string
  region?: string
  accessKeyId: string
  secretAccessKey?: string
  useSsl: boolean
  pathStyle: boolean
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
}

export type ConnectionSummary = Omit<ConnectionProfile, 'secretAccessKey'> & {
  hasSecret: boolean
}

export interface CreateConnectionInput {
  name: string
  providerType: ProviderType
  endpoint: string
  region?: string
  accessKeyId: string
  secretAccessKey: string
  useSsl: boolean
  pathStyle: boolean
}

export type UpdateConnectionInput = Partial<CreateConnectionInput> & {
  id: string
}
