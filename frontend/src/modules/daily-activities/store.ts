import { dailyActivitiesApi } from './dailyActivitiesApi';
import type { DailyActivity, RecordActivityDto, UpdateActivityDto } from './types';

class DailyActivitiesStore {
  private activities: DailyActivity[] = [];
  private listeners: Set<() => void> = new Set();
  private isLoading = false;
  private error: string | null = null;
  private currentDate: string = new Date().toISOString().split('T')[0];

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getState() {
    return {
      activities: [...this.activities],
      isLoading: this.isLoading,
      error: this.error,
      currentDate: this.currentDate,
    };
  }

  async loadDaily(date?: string, force = false): Promise<DailyActivity[]> {
    const targetDate = date || this.currentDate;
    if (this.currentDate === targetDate && this.activities.length > 0 && !force) {
      return [...this.activities];
    }

    this.currentDate = targetDate;
    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const data = await dailyActivitiesApi.getDaily(targetDate);
      this.activities = data;
      return [...this.activities];
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load activities';
      return [...this.activities];
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  getAll(): DailyActivity[] {
    return [...this.activities];
  }

  getByChild(childId: string): DailyActivity[] {
    return this.activities.filter((a) => a.childId === childId);
  }

  async record(dto: RecordActivityDto): Promise<DailyActivity> {
    const created = await dailyActivitiesApi.record(dto);
    this.activities = [created, ...this.activities];
    this.notify();
    return created;
  }

  async update(id: string, dto: UpdateActivityDto): Promise<DailyActivity> {
    const updated = await dailyActivitiesApi.update(id, dto);
    const index = this.activities.findIndex((a) => a.id === id);
    if (index >= 0) {
      this.activities[index] = updated;
    } else {
      this.activities.push(updated);
    }
    this.notify();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await dailyActivitiesApi.delete(id);
    this.activities = this.activities.filter((a) => a.id !== id);
    this.notify();
    return true;
  }
}

export const dailyActivitiesStore = new DailyActivitiesStore();
