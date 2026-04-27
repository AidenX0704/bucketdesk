import type { TransferTask } from '../../../shared/types/transfer'
import type { JsonStore } from '../json-store'

export class TransferRepository {
  private readonly tasks = new Map<string, TransferTask>()

  constructor(private readonly store: JsonStore) {
    for (const task of this.store.getTransfers<TransferTask>()) {
      this.tasks.set(task.id, task)
    }
  }

  list(): TransferTask[] {
    return [...this.tasks.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }

  findById(id: string): TransferTask | undefined {
    return this.tasks.get(id)
  }

  upsert(task: TransferTask): TransferTask {
    this.tasks.set(task.id, task)
    this.persist()
    return task
  }

  delete(id: string): void {
    this.tasks.delete(id)
    this.persist()
  }

  clearCompleted(): void {
    for (const task of this.tasks.values()) {
      if (task.status === 'completed' || task.status === 'cancelled') {
        this.tasks.delete(task.id)
      }
    }

    this.persist()
  }

  private persist(): void {
    this.store.setTransfers([...this.tasks.values()])
  }
}
