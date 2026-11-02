import { childrenApi } from './childrenApi';
import type { Child, RegisterChildDto, UpdateChildDto } from './types';

class ChildrenStore {
  private children: Child[] = [];
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
      children: [...this.children],
      isLoading: this.isLoading,
      error: this.error,
      isLoaded: this.isLoaded,
    };
  }

  async load(force = false): Promise<Child[]> {
    if (this.isLoaded && !force) {
      return [...this.children];
    }

    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const data = await childrenApi.getAll();
      this.children = data;
      this.isLoaded = true;
      return [...this.children];
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load children';
      return [...this.children];
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  getAll(): Child[] {
    return [...this.children];
  }

  getById(id: string): Child | undefined {
    return this.children.find((c) => c.id === id);
  }

  async fetchById(id: string): Promise<Child> {
    const child = await childrenApi.getById(id);
    const index = this.children.findIndex((c) => c.id === id);
    if (index >= 0) {
      this.children[index] = child;
    } else {
      this.children.push(child);
    }
    this.notify();
    return child;
  }

  async register(dto: RegisterChildDto): Promise<Child> {
    const created = await childrenApi.register(dto);
    const merged: Child = {
      ...dto,
      ...created,
      photoUrl: dto.photoUrl || created.photoUrl,
      allergies: dto.allergies || created.allergies,
      dietaryRestrictions: dto.dietaryRestrictions || created.dietaryRestrictions,
      medicalNotes: dto.medicalNotes || created.medicalNotes,
      medications: dto.medications || created.medications,
      bloodType: dto.bloodType || created.bloodType,
      pediatricianName: dto.pediatricianName || created.pediatricianName,
      pediatricianPhone: dto.pediatricianPhone || created.pediatricianPhone,
      guardians: dto.guardians || created.guardians,
    };
    this.children = [merged, ...this.children.filter((c) => c.id !== merged.id)];
    this.notify();
    return merged;
  }

  async update(id: string, dto: UpdateChildDto): Promise<Child> {
    const updated = await childrenApi.update(id, dto);
    const merged: Child = {
      ...dto,
      ...updated,
      photoUrl: dto.photoUrl || updated.photoUrl,
      allergies: dto.allergies || updated.allergies,
      dietaryRestrictions: dto.dietaryRestrictions || updated.dietaryRestrictions,
      medicalNotes: dto.medicalNotes || updated.medicalNotes,
      medications: dto.medications || updated.medications,
      bloodType: dto.bloodType || updated.bloodType,
      pediatricianName: dto.pediatricianName || updated.pediatricianName,
      pediatricianPhone: dto.pediatricianPhone || updated.pediatricianPhone,
      guardians: dto.guardians || updated.guardians,
    };
    const index = this.children.findIndex((c) => c.id === id);
    if (index >= 0) {
      this.children[index] = merged;
    } else {
      this.children.push(merged);
    }
    this.notify();
    return merged;
  }

  async delete(id: string): Promise<boolean> {
    await childrenApi.delete(id);
    this.children = this.children.filter((c) => c.id !== id);
    this.notify();
    return true;
  }

  async updatePhoto(id: string, photoUrl: string): Promise<void> {
    await childrenApi.updatePhoto(id, photoUrl);
    const child = this.children.find((c) => c.id === id);
    if (child) {
      child.photoUrl = photoUrl;
      this.notify();
    }
  }
}

export const childrenStore = new ChildrenStore();
