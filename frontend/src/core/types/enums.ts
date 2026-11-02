export const StaffRole = {
  Admin: 'Admin',
  Teacher: 'Teacher',
  Caregiver: 'Caregiver',
  SupportStaff: 'SupportStaff',
  Assistant: 'Assistant',
  Feeder: 'Feeder',
  Administrator: 'Administrator',
  Manager: 'Manager',
} as const;
export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

export const EnrollmentStatus = {
  Active: 'Active',
  Inactive: 'Inactive',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
} as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

export const MealType = {
  Breakfast: 'Breakfast',
  Lunch: 'Lunch',
  Snack: 'Snack',
  Dinner: 'Dinner',
  Other: 'Other',
} as const;
export type MealType = (typeof MealType)[keyof typeof MealType];

export const MealStatus = {
  Eaten: 'Eaten',
  PartiallyEaten: 'PartiallyEaten',
  NotEaten: 'NotEaten',
} as const;
export type MealStatus = (typeof MealStatus)[keyof typeof MealStatus];

export const ActivityType = {
  Learning: 'Learning',
  Play: 'Play',
  Nap: 'Nap',
  Outdoor: 'Outdoor',
  Art: 'Art',
  Music: 'Music',
  Playing: 'Playing',
  Sleeping: 'Sleeping',
  Resting: 'Resting',
  Eating: 'Eating',
  Ill: 'Ill',
  Other: 'Other',
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

// Backend Enum Number Mappings (.NET enum order)
export const StaffRoleToBackend: Record<StaffRole, number> = {
  Admin: 0,
  Teacher: 1,
  Caregiver: 2,
  SupportStaff: 3,
  Assistant: 4,
  Feeder: 5,
  Administrator: 6,
  Manager: 7,
};

export const BackendToStaffRole: Record<number, StaffRole> = {
  0: StaffRole.Admin,
  1: StaffRole.Teacher,
  2: StaffRole.Caregiver,
  3: StaffRole.SupportStaff,
  4: StaffRole.Assistant,
  5: StaffRole.Feeder,
  6: StaffRole.Administrator,
  7: StaffRole.Manager,
};

export function staffRoleToNumber(val: StaffRole | number | string): number {
  if (typeof val === 'number') return val;
  return StaffRoleToBackend[val as StaffRole] ?? 3;
}

export function staffRoleToString(val: number | string): StaffRole {
  if (typeof val === 'number') return BackendToStaffRole[val] ?? StaffRole.SupportStaff;
  return (val as StaffRole) || StaffRole.SupportStaff;
}

export const EnrollmentStatusToBackend: Record<EnrollmentStatus, number> = {
  Active: 0,
  Inactive: 1,
  Completed: 2,
  Cancelled: 3,
};

export const BackendToEnrollmentStatus: Record<number, EnrollmentStatus> = {
  0: EnrollmentStatus.Active,
  1: EnrollmentStatus.Inactive,
  2: EnrollmentStatus.Completed,
  3: EnrollmentStatus.Cancelled,
};

export function enrollmentStatusToNumber(val: EnrollmentStatus | number | string): number {
  if (typeof val === 'number') return val;
  return EnrollmentStatusToBackend[val as EnrollmentStatus] ?? 0;
}

export function enrollmentStatusToString(val: number | string): EnrollmentStatus {
  if (typeof val === 'number') return BackendToEnrollmentStatus[val] ?? EnrollmentStatus.Active;
  return (val as EnrollmentStatus) || EnrollmentStatus.Active;
}

export const MealTypeToBackend: Record<MealType, number> = {
  Breakfast: 0,
  Lunch: 1,
  Snack: 2,
  Dinner: 3,
  Other: 4,
};

export const BackendToMealType: Record<number, MealType> = {
  0: MealType.Breakfast,
  1: MealType.Lunch,
  2: MealType.Snack,
  3: MealType.Dinner,
  4: MealType.Other,
};

export function mealTypeToNumber(val: MealType | number | string): number {
  if (typeof val === 'number') return val;
  return MealTypeToBackend[val as MealType] ?? 1;
}

export function mealTypeToString(val: number | string): MealType {
  if (typeof val === 'number') return BackendToMealType[val] ?? MealType.Lunch;
  return (val as MealType) || MealType.Lunch;
}

export const MealStatusToBackend: Record<MealStatus, number> = {
  Eaten: 0,
  PartiallyEaten: 1,
  NotEaten: 2,
};

export const BackendToMealStatus: Record<number, MealStatus> = {
  0: MealStatus.Eaten,
  1: MealStatus.PartiallyEaten,
  2: MealStatus.NotEaten,
};

export function mealStatusToNumber(val: MealStatus | number | string): number {
  if (typeof val === 'number') return val;
  return MealStatusToBackend[val as MealStatus] ?? 0;
}

export function mealStatusToString(val: number | string): MealStatus {
  if (typeof val === 'number') return BackendToMealStatus[val] ?? MealStatus.Eaten;
  return (val as MealStatus) || MealStatus.Eaten;
}

export const ActivityTypeToBackend: Record<ActivityType, number> = {
  Learning: 0,
  Play: 1,
  Nap: 2,
  Outdoor: 3,
  Art: 4,
  Music: 5,
  Playing: 6,
  Sleeping: 7,
  Resting: 8,
  Eating: 9,
  Ill: 10,
  Other: 11,
};

export const BackendToActivityType: Record<number, ActivityType> = {
  0: ActivityType.Learning,
  1: ActivityType.Play,
  2: ActivityType.Nap,
  3: ActivityType.Outdoor,
  4: ActivityType.Art,
  5: ActivityType.Music,
  6: ActivityType.Playing,
  7: ActivityType.Sleeping,
  8: ActivityType.Resting,
  9: ActivityType.Eating,
  10: ActivityType.Ill,
  11: ActivityType.Other,
};

export function activityTypeToNumber(val: ActivityType | number | string): number {
  if (typeof val === 'number') return val;
  return ActivityTypeToBackend[val as ActivityType] ?? 0;
}

export function activityTypeToString(val: number | string): ActivityType {
  if (typeof val === 'number') return BackendToActivityType[val] ?? ActivityType.Learning;
  return (val as ActivityType) || ActivityType.Learning;
}
