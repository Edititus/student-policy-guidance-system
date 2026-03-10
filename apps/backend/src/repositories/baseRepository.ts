export interface IRepository<T> {
  findAll(): Promise<T[]>
  findById(id: string): Promise<T | null>
  create(data: Partial<T>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T | null>
  delete(id: string): Promise<boolean>
}

// Example: a simple in-memory repository for demonstration
export class InMemoryRepository<T extends { id: string }> implements IRepository<T> {
  private store: Map<string, T> = new Map()

  async findAll(): Promise<T[]> {
    return Array.from(this.store.values())
  }

  async findById(id: string): Promise<T | null> {
    return this.store.get(id) || null
  }

  async create(data: Partial<T>): Promise<T> {
    const id = Math.random().toString(36).substring(7)
    const entity = { id, ...data } as T
    this.store.set(id, entity)
    return entity
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const existing = this.store.get(id)
    if (!existing) return null
    const updated = { ...existing, ...data }
    this.store.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id)
  }
}
