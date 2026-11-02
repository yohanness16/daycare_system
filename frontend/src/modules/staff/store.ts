import { staffApi } from './staffApi';
import type { CreateStaffDto, Staff, UpdateStaffDto } from './types';

class StaffStore {
  private staffList: Staff[] = [];
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
      staff: [...this.staffList],
      isLoading: this.isLoading,
      error: this.error,
      isLoaded: this.isLoaded,
    };
  }

  async load(force = false, isActive = 'all'): Promise<Staff[]> {
    if (this.isLoaded && !force) {
      return [...this.staffList];
    }

    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const data = await staffApi.getAll(isActive);
      this.staffList = data;
      this.isLoaded = true;
      return [...this.staffList];
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load staff roster';
      return [...this.staffList];
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  getAll(): Staff[] {
    return [...this.staffList];
  }

  getById(id: string): Staff | undefined {
    return this.staffList.find((s) => s.id === id);
  }

  async fetchById(id: string): Promise<Staff> {
    const s = await staffApi.getById(id);
    const index = this.staffList.findIndex((item) => item.id === id);
    if (index >= 0) {
      this.staffList[index] = s;
    } else {
      this.staffList.push(s);
    }
    this.notify();
    return s;
  }

  async create(dto: CreateStaffDto): Promise<Staff> {
    const created = await staffApi.create(dto);
    this.staffList = [created, ...this.staffList];
    this.notify();
    return created;
  }

  async update(id: string, dto: UpdateStaffDto): Promise<Staff> {
    const updated = await staffApi.update(id, dto);
    const index = this.staffList.findIndex((item) => item.id === id);
    if (index >= 0) {
      this.staffList[index] = updated;
    } else {
      this.staffList.push(updated);
    }
    this.notify();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await staffApi.delete(id);
    this.staffList = this.staffList.filter((s) => s.id !== id);
    this.notify();
    return true;
  }

  async deactivate(id: string): Promise<Staff> {
    const updated = await staffApi.deactivate(id);
    const index = this.staffList.findIndex((item) => item.id === id);
    if (index >= 0) {
      this.staffList[index] = updated;
    }
    this.notify();
    return updated;
  }

  async reactivate(id: string): Promise<Staff> {
    const updated = await staffApi.reactivate(id);
    const index = this.staffList.findIndex((item) => item.id === id);
    if (index >= 0) {
      this.staffList[index] = updated;
    }
    this.notify();
    return updated;
  }

  async updatePhoto(id: string, photoUrl: string): Promise<void> {
    await staffApi.updatePhoto(id, photoUrl);
    const s = this.staffList.find((item) => item.id === id);
    if (s) {
      s.photoUrl = photoUrl;
      this.notify();
    }
  }
}

export const staffStore = new StaffStore();
