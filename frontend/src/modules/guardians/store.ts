import { guardiansApi } from './guardiansApi';
import type { CreateGuardianDto, Guardian, UpdateGuardianDto } from './types';

class GuardiansStore {
  private guardians: Guardian[] = [];
  private listeners: Set<() => void> = new Set();
  private isLoading = false;
  private error: string | null = null;
  private isLoaded = false;

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getState() {
    return {
      guardians: [...this.guardians],
      isLoading: this.isLoading,
      error: this.error,
      isLoaded: this.isLoaded,
    };
  }

  async load(searchTerm?: string, force = false): Promise<Guardian[]> {
    if (this.isLoaded && !searchTerm && !force) {
      return [...this.guardians];
    }

    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const data = await guardiansApi.getAll(searchTerm);
      if (!searchTerm) {
        this.guardians = data;
        this.isLoaded = true;
      }
      return data;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load guardians';
      return [...this.guardians];
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  getAll(): Guardian[] {
    return [...this.guardians];
  }

  getById(id: string): Guardian | undefined {
    return this.guardians.find((g) => g.id === id);
  }

  async fetchById(id: string): Promise<Guardian> {
    const guardian = await guardiansApi.getById(id);
    const index = this.guardians.findIndex((g) => g.id === id);
    if (index >= 0) {
      this.guardians[index] = guardian;
    } else {
      this.guardians.push(guardian);
    }
    this.notify();
    return guardian;
  }

  async create(dto: CreateGuardianDto): Promise<Guardian> {
    const created = await guardiansApi.create(dto);
    this.guardians = [created, ...this.guardians];
    this.notify();
    return created;
  }

  async update(id: string, dto: UpdateGuardianDto): Promise<Guardian> {
    const updated = await guardiansApi.update(id, dto);
    const index = this.guardians.findIndex((g) => g.id === id);
    if (index >= 0) {
      this.guardians[index] = updated;
    } else {
      this.guardians.push(updated);
    }
    this.notify();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await guardiansApi.delete(id);
    this.guardians = this.guardians.filter((g) => g.id !== id);
    this.notify();
    return true;
  }

  async updatePhoto(id: string, photoUrl: string): Promise<void> {
    await guardiansApi.updatePhoto(id, photoUrl);
    const guardian = this.guardians.find((g) => g.id === id);
    if (guardian) {
      guardian.photoUrl = photoUrl;
      this.notify();
    }
  }
}

export const guardiansStore = new GuardiansStore();
