import type {
  ConnectionProfile,
  ConnectionSummary,
  CreateConnectionInput,
  UpdateConnectionInput
} from '../../shared/types/connection'
import type { TestConnectionResult } from '../../shared/types/provider'
import { ConnectionRepository, type StoredConnection } from '../persistence/repositories/connection.repository'
import type { ProviderRegistry } from '../providers/registry'
import { CredentialService } from './credential.service'

export class ConnectionService {
  constructor(
    private readonly repository: ConnectionRepository,
    private readonly credentials: CredentialService,
    private readonly providers: ProviderRegistry
  ) {}

  list(): ConnectionSummary[] {
    return this.repository.list().map((connection) => this.toSummary(connection))
  }

  create(input: CreateConnectionInput): ConnectionSummary {
    const encryptedSecretAccessKey = this.credentials.encrypt(input.secretAccessKey)
    return this.toSummary(this.repository.create(input, encryptedSecretAccessKey))
  }

  update(input: UpdateConnectionInput): ConnectionSummary {
    const encryptedSecretAccessKey = input.secretAccessKey
      ? this.credentials.encrypt(input.secretAccessKey)
      : undefined

    return this.toSummary(this.repository.update(input, encryptedSecretAccessKey))
  }

  delete(id: string): void {
    this.repository.delete(id)
  }

  async test(id: string): Promise<TestConnectionResult> {
    const profile = this.getProfile(id)
    const provider = this.providers.get(profile.providerType)
    return provider.testConnection(profile)
  }

  getProfile(id: string): ConnectionProfile {
    const connection = this.repository.findById(id)

    if (!connection) {
      throw new Error('Connection not found')
    }

    return {
      ...connection,
      secretAccessKey: this.credentials.decrypt(connection.encryptedSecretAccessKey)
    }
  }

  private toSummary(connection: StoredConnection): ConnectionSummary {
    const { encryptedSecretAccessKey, ...summary } = connection

    return {
      ...summary,
      hasSecret: Boolean(encryptedSecretAccessKey)
    }
  }
}
