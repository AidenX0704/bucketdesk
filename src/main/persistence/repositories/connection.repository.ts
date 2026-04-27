import type {
  ConnectionProfile,
  CreateConnectionInput,
  UpdateConnectionInput
} from '../../../shared/types/connection'
import type { JsonStore } from '../json-store'

type StoredConnection = Omit<ConnectionProfile, 'secretAccessKey'> & {
  encryptedSecretAccessKey: string
}

export class ConnectionRepository {
  private readonly connections = new Map<string, StoredConnection>()

  constructor(private readonly store: JsonStore) {
    for (const connection of this.store.getConnections<StoredConnection>()) {
      this.connections.set(connection.id, connection)
    }
  }

  list(): StoredConnection[] {
    return [...this.connections.values()].sort((left, right) => left.name.localeCompare(right.name))
  }

  findById(id: string): StoredConnection | undefined {
    return this.connections.get(id)
  }

  create(input: CreateConnectionInput, encryptedSecretAccessKey: string): StoredConnection {
    const now = new Date().toISOString()
    const connection: StoredConnection = {
      id: crypto.randomUUID(),
      name: input.name,
      providerType: input.providerType,
      endpoint: input.endpoint,
      region: input.region,
      accessKeyId: input.accessKeyId,
      encryptedSecretAccessKey,
      useSsl: input.useSsl,
      pathStyle: input.pathStyle,
      createdAt: now,
      updatedAt: now
    }

    this.connections.set(connection.id, connection)
    this.persist()
    return connection
  }

  update(input: UpdateConnectionInput, encryptedSecretAccessKey?: string): StoredConnection {
    const current = this.connections.get(input.id)

    if (!current) {
      throw new Error('Connection not found')
    }

    const updated: StoredConnection = {
      ...current,
      ...input,
      encryptedSecretAccessKey: encryptedSecretAccessKey ?? current.encryptedSecretAccessKey,
      updatedAt: new Date().toISOString()
    }

    this.connections.set(updated.id, updated)
    this.persist()
    return updated
  }

  delete(id: string): void {
    this.connections.delete(id)
    this.persist()
  }

  private persist(): void {
    this.store.setConnections([...this.connections.values()])
  }
}

export type { StoredConnection }
