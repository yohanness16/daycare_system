import { mealsApi } from './mealsApi';
import type { Meal, RecordMealDto, UpdateMealDto } from './types';

class MealsStore {
  private meals: Meal[] = [];
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
      meals: [...this.meals],
      isLoading: this.isLoading,
      error: this.error,
      currentDate: this.currentDate,
    };
  }

  async loadDaily(date?: string, force = false): Promise<Meal[]> {
    const targetDate = date || this.currentDate;
    if (this.currentDate === targetDate && this.meals.length > 0 && !force) {
      return [...this.meals];
    }

    this.currentDate = targetDate;
    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const data = await mealsApi.getDaily(targetDate);
      this.meals = data;
      return [...this.meals];
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load meals';
      return [...this.meals];
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  getAll(): Meal[] {
    return [...this.meals];
  }

  getByChild(childId: string): Meal[] {
    return this.meals.filter((m) => m.childId === childId);
  }

  async record(dto: RecordMealDto): Promise<Meal> {
    const created = await mealsApi.record(dto);
    this.meals = [created, ...this.meals];
    this.notify();
    return created;
  }

  async update(id: string, dto: UpdateMealDto): Promise<Meal> {
    const updated = await mealsApi.update(id, dto);
    const index = this.meals.findIndex((m) => m.id === id);
    if (index >= 0) {
      this.meals[index] = updated;
    } else {
      this.meals.push(updated);
    }
    this.notify();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await mealsApi.delete(id);
    this.meals = this.meals.filter((m) => m.id !== id);
    this.notify();
    return true;
  }
}

export const mealsStore = new MealsStore();
