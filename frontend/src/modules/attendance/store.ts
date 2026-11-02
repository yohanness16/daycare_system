import { attendanceApi } from './attendanceApi';
import type { Attendance, CheckOutAttendanceDto, RecordAttendanceDto } from './types';

class AttendanceStore {
  private records: Attendance[] = [];
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
      records: [...this.records],
      isLoading: this.isLoading,
      error: this.error,
      currentDate: this.currentDate,
    };
  }

  async loadDaily(date?: string, force = false): Promise<Attendance[]> {
    const targetDate = date || this.currentDate;
    if (this.currentDate === targetDate && this.records.length > 0 && !force) {
      return [...this.records];
    }

    this.currentDate = targetDate;
    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const data = await attendanceApi.getDaily(targetDate);
      this.records = data;
      return [...this.records];
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load attendance';
      return [...this.records];
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  getAll(): Attendance[] {
    return [...this.records];
  }

  getByDate(dateStr: string): Attendance[] {
    return this.records.filter((r) => r.date === dateStr);
  }

  getByChild(childId: string): Attendance[] {
    return this.records.filter((r) => r.childId === childId);
  }

  async loadChildAttendance(childId: string): Promise<Attendance[]> {
    try {
      const data = await attendanceApi.getByChild(childId);
      data.forEach((rec) => {
        const idx = this.records.findIndex((r) => r.id === rec.id);
        if (idx >= 0) {
          this.records[idx] = rec;
        } else {
          this.records.push(rec);
        }
      });
      this.notify();
      return data;
    } catch {
      return this.getByChild(childId);
    }
  }

  async checkIn(dto: RecordAttendanceDto): Promise<Attendance> {
    const created = await attendanceApi.record(dto);
    const index = this.records.findIndex((r) => r.id === created.id || (r.childId === created.childId && r.date === created.date));
    if (index >= 0) {
      this.records[index] = created;
    } else {
      this.records = [created, ...this.records];
    }
    this.notify();
    return created;
  }

  async checkOut(dto: CheckOutAttendanceDto): Promise<Attendance> {
    const updated = await attendanceApi.checkOut(dto);
    const index = this.records.findIndex((r) => r.id === updated.id || (r.childId === updated.childId && r.date === updated.date));
    if (index >= 0) {
      this.records[index] = updated;
    } else {
      this.records = [updated, ...this.records];
    }
    this.notify();
    return updated;
  }
}

export const attendanceStore = new AttendanceStore();
