import { classroomsApi } from './classroomsApi';
import type {
  AssignStaffToClassroomDto,
  Classroom,
  ClassroomStaffAssignment,
  CreateClassroomDto,
  UpdateClassroomDto,
} from './types';

class ClassroomsStore {
  private classrooms: Classroom[] = [];
  private staffAssignments: Record<string, ClassroomStaffAssignment[]> = {};
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
      classrooms: [...this.classrooms],
      staffAssignments: { ...this.staffAssignments },
      isLoading: this.isLoading,
      error: this.error,
      isLoaded: this.isLoaded,
    };
  }

  async load(force = false): Promise<Classroom[]> {
    if (this.isLoaded && !force) {
      return [...this.classrooms];
    }

    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const data = await classroomsApi.getAll();
      this.classrooms = data;
      this.isLoaded = true;
      return [...this.classrooms];
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load classrooms';
      return [...this.classrooms];
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  getAll(): Classroom[] {
    return [...this.classrooms];
  }

  getById(id: string): Classroom | undefined {
    return this.classrooms.find((c) => c.id === id);
  }

  async fetchById(id: string): Promise<Classroom> {
    const room = await classroomsApi.getById(id);
    const index = this.classrooms.findIndex((c) => c.id === id);
    if (index >= 0) {
      this.classrooms[index] = room;
    } else {
      this.classrooms.push(room);
    }
    this.notify();
    return room;
  }

  async create(dto: CreateClassroomDto): Promise<Classroom> {
    const created = await classroomsApi.create(dto);
    this.classrooms = [created, ...this.classrooms];
    this.notify();
    return created;
  }

  async update(id: string, dto: UpdateClassroomDto): Promise<Classroom> {
    const updated = await classroomsApi.update(id, dto);
    const index = this.classrooms.findIndex((c) => c.id === id);
    if (index >= 0) {
      this.classrooms[index] = updated;
    } else {
      this.classrooms.push(updated);
    }
    this.notify();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await classroomsApi.delete(id);
    this.classrooms = this.classrooms.filter((c) => c.id !== id);
    this.notify();
    return true;
  }

  async loadStaffForClassroom(
    classroomId: string,
    activeOnly = true
  ): Promise<ClassroomStaffAssignment[]> {
    const assignments = await classroomsApi.getStaffByClassroom(classroomId, activeOnly);
    this.staffAssignments[classroomId] = assignments;
    this.notify();
    return assignments;
  }

  getStaffForClassroom(classroomId: string): ClassroomStaffAssignment[] {
    return this.staffAssignments[classroomId] || [];
  }

  async assignStaff(dto: AssignStaffToClassroomDto): Promise<ClassroomStaffAssignment> {
    const assignment = await classroomsApi.assignStaff(dto);
    const current = this.staffAssignments[dto.classroomId] || [];
    this.staffAssignments[dto.classroomId] = [assignment, ...current];
    this.notify();
    return assignment;
  }

  async removeStaffAssignment(
    classroomId: string,
    assignmentId: string
  ): Promise<ClassroomStaffAssignment> {
    const removed = await classroomsApi.removeStaffAssignment(assignmentId);
    if (this.staffAssignments[classroomId]) {
      this.staffAssignments[classroomId] = this.staffAssignments[classroomId].filter(
        (a) => a.id !== assignmentId
      );
    }
    this.notify();
    return removed;
  }
}

export const classroomsStore = new ClassroomsStore();
