import type { EntityTimestamps, UUID } from '../../core/types/common';

export type AllergySeverity = 'Mild' | 'Moderate' | 'Severe' | 'LifeThreatening';

export interface ChildAllergy {
  id?: string;
  allergen: string;
  severity: AllergySeverity;
  reaction?: string;
  hasEpiPen?: boolean;
  epiPenLocation?: string;
  actionPlan?: string;
}

export interface GuardianRelationshipInfo {
  guardianId?: UUID;
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary?: boolean;
  isSecondary?: boolean;
  isEmergencyContact?: boolean;
  emergencyPriority?: number;
  isAuthorizedPickup?: boolean;
  pickupPin?: string;
}

export interface Child extends EntityTimestamps {
  id: UUID;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  guardianId: UUID;
  guardianName: string;
  photoUrl?: string;
  allergies?: ChildAllergy[];
  dietaryRestrictions?: string;
  medicalNotes?: string;
  medications?: string;
  bloodType?: string;
  pediatricianName?: string;
  pediatricianPhone?: string;
  guardians?: GuardianRelationshipInfo[];
}

export interface RegisterChildDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  guardianId: UUID;
  photoUrl?: string;
  allergies?: ChildAllergy[];
  dietaryRestrictions?: string;
  medicalNotes?: string;
  medications?: string;
  bloodType?: string;
  pediatricianName?: string;
  pediatricianPhone?: string;
  guardianRelationship?: {
    relationship?: string;
    isPrimary?: boolean;
    isSecondary?: boolean;
    isEmergencyContact?: boolean;
    emergencyPriority?: number;
    isAuthorizedPickup?: boolean;
    pickupPin?: string;
  };
  guardians?: GuardianRelationshipInfo[];
}

export interface UpdateChildDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  guardianId: UUID;
  photoUrl?: string;
  allergies?: ChildAllergy[];
  dietaryRestrictions?: string;
  medicalNotes?: string;
  medications?: string;
  bloodType?: string;
  pediatricianName?: string;
  pediatricianPhone?: string;
  guardians?: GuardianRelationshipInfo[];
}

export interface ChildDailyAttendanceSummary {
  id: UUID;
  childId: UUID;
  childName: string;
  date: string;
  arrivalTime: string | null;
  departureTime: string | null;
  isPresent: boolean;
  recordedById: UUID | null;
  recordedByName: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChildDailyMealSummary {
  id: UUID;
  childId: UUID;
  childName: string;
  staffId: UUID;
  staffName: string;
  type: number | string;
  food: string;
  mealTime: string;
  status: number | string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChildDailyActivitySummary {
  id: UUID;
  childId: UUID;
  childName: string;
  activityType: number | string;
  startTime: string;
  endTime: string | null;
  activityDescription: string;
  recordedById: UUID | null;
  recordedByName: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChildDailyHistoryResponse {
  childId: UUID;
  childName: string;
  date: string;
  attendance: ChildDailyAttendanceSummary | null;
  meals: ChildDailyMealSummary[];
  activities: ChildDailyActivitySummary[];
}
