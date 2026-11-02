import { enrollmentApi } from './enrollmentApi';
import type {
  EnrollChildDto,
  Enrollment,
  EnrollmentFilterOptions,
  TransferChildClassroomDto,
} from './types';

class EnrollmentStore {
  private enrollments: Enrollment[] = [];
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
      enrollments: [...this.enrollments],
      isLoading: this.isLoading,
      error: this.error,
      isLoaded: this.isLoaded,
    };
  }

  async load(filters?: EnrollmentFilterOptions, force = false): Promise<Enrollment[]> {
    if (this.isLoaded && !filters && !force) {
      return [...this.enrollments];
    }

    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const data = await enrollmentApi.getAll(filters);
      if (!filters) {
        this.enrollments = data;
        this.isLoaded = true;
      }
      return data;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load enrollments';
      return [...this.enrollments];
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  getAll(): Enrollment[] {
    return [...this.enrollments];
  }

  getByClassroom(classroomId: string): Enrollment[] {
    return this.enrollments.filter(
      (e) => e.classroomId === classroomId && e.status === 'Active'
    );
  }

  getByChild(childId: string): Enrollment[] {
    return this.enrollments.filter((e) => e.childId === childId);
  }

  async enroll(dto: EnrollChildDto): Promise<Enrollment> {
    const created = await enrollmentApi.enroll(dto);
    this.enrollments = [created, ...this.enrollments];
    this.notify();
    return created;
  }

  async transfer(dto: TransferChildClassroomDto): Promise<Enrollment> {
    const updated = await enrollmentApi.transfer(dto);
    // Reload enrollments to reflect changed statuses and new assignment
    await this.load(undefined, true);
    return updated;
  }

  async endEnrollment(id: string): Promise<Enrollment> {
    const ended = await enrollmentApi.endEnrollment(id);
    const index = this.enrollments.findIndex((e) => e.id === id);
    if (index >= 0) {
      this.enrollments[index] = ended;
    } else {
      this.enrollments.push(ended);
    }
    this.notify();
    return ended;
  }
}

export const enrollmentStore = new EnrollmentStore();
