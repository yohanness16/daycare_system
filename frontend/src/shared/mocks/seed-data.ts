import { ActivityType, EnrollmentStatus, MealStatus, MealType, StaffRole } from '../../core/types/enums';

export const INITIAL_GUARDIANS = [
  {
    id: 'g1111111-1111-1111-1111-111111111111',
    firstName: 'Sarah',
    lastName: 'Connor',
    phone: '+1-555-0192',
    email: 'sarah.connor@example.com',
    address: '42 Skynet Blvd, Los Angeles, CA',
  },
  {
    id: 'g2222222-2222-2222-2222-222222222222',
    firstName: 'John',
    lastName: 'Smith',
    phone: '+1-555-0184',
    email: 'john.smith@example.com',
    address: '100 Sunset Ave, Pasadena, CA',
  },
];

export const INITIAL_STAFF = [
  {
    id: 's1111111-1111-1111-1111-111111111111',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1-555-0100',
    email: 'admin@daycare.local',
    address: '1 Daycare Center Way',
    role: StaffRole.Administrator,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 's2222222-2222-2222-2222-222222222222',
    firstName: 'Emma',
    lastName: 'Watson',
    phone: '+1-555-0102',
    email: 'emma.watson@daycare.local',
    address: '12 Sunshine Dr',
    role: StaffRole.Teacher,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 's3333333-3333-3333-3333-333333333333',
    firstName: 'Michael',
    lastName: 'Brown',
    phone: '+1-555-0103',
    email: 'michael.brown@daycare.local',
    address: '45 Pine St',
    role: StaffRole.Assistant,
    createdAt: '2026-02-01T08:00:00Z',
  },
];

export const INITIAL_CLASSROOMS = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Infants (Sunshine Room)',
    capacity: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    name: 'Toddlers (Rainbow Room)',
    capacity: 15,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    name: 'Pre-K (Explorers Room)',
    capacity: 20,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_CHILDREN = [
  {
    id: 'ch111111-1111-1111-1111-111111111111',
    firstName: 'John',
    lastName: 'Connor',
    dateOfBirth: '2024-03-15',
    gender: 'Male',
    guardianId: 'g1111111-1111-1111-1111-111111111111',
    guardianName: 'Sarah Connor',
    allergies: [
      {
        id: 'alg-1',
        allergen: 'Peanuts & Tree Nuts',
        severity: 'LifeThreatening' as const,
        reaction: 'Severe anaphylaxis, throat swelling, hives within 5 minutes',
        hasEpiPen: true,
        epiPenLocation: 'Room 2 First Aid Cabinet (Shelf A - Red Bag)',
        actionPlan: 'Administer Epi-Pen Jr immediately into outer mid-thigh. Hold 3 seconds. Call 911 immediately. Notify Sarah Connor.',
      },
    ],
    dietaryRestrictions: 'Strict Nut-Free facility policy',
    medicalNotes: 'Has mild asthma triggered by intense cold air.',
    medications: 'EpiPen Jr 0.15mg, Albuterol Inhaler',
    bloodType: 'O+',
    pediatricianName: 'Dr. Evelyn Reed (Metro Pediatrics)',
    pediatricianPhone: '(555) 234-8900',
    guardians: [
      {
        guardianId: 'g1111111-1111-1111-1111-111111111111',
        firstName: 'Sarah',
        lastName: 'Connor',
        relationship: 'Mother',
        phone: '+1-555-0192',
        email: 'sarah.connor@example.com',
        isPrimary: true,
        isSecondary: false,
        isEmergencyContact: true,
        emergencyPriority: 1,
        isAuthorizedPickup: true,
        pickupPin: '4821',
      },
    ],
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'ch222222-2222-2222-2222-222222222222',
    firstName: 'Emily',
    lastName: 'Smith',
    dateOfBirth: '2023-08-20',
    gender: 'Female',
    guardianId: 'g2222222-2222-2222-2222-222222222222',
    guardianName: 'John Smith',
    allergies: [
      {
        id: 'alg-2',
        allergen: 'Dairy / Cow Milk',
        severity: 'Moderate' as const,
        reaction: 'Digestive upset, facial rash, hives',
        hasEpiPen: false,
        actionPlan: 'Avoid all cow milk and cheese products. Provide oat/soy alternative.',
      },
    ],
    dietaryRestrictions: 'Dairy-Free diet',
    medicalNotes: 'Sensitive skin, hypoallergenic soap recommended.',
    bloodType: 'A+',
    pediatricianName: 'Dr. Michael Chen',
    pediatricianPhone: '(555) 987-6543',
    guardians: [
      {
        guardianId: 'g2222222-2222-2222-2222-222222222222',
        firstName: 'John',
        lastName: 'Smith',
        relationship: 'Father',
        phone: '+1-555-0184',
        email: 'john.smith@example.com',
        isPrimary: true,
        isSecondary: false,
        isEmergencyContact: true,
        emergencyPriority: 1,
        isAuthorizedPickup: true,
        pickupPin: '1234',
      },
    ],
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
];

export const INITIAL_ENROLLMENTS = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    childId: 'ch111111-1111-1111-1111-111111111111',
    childName: 'John Connor',
    classroomId: 'c2222222-2222-2222-2222-222222222222',
    classroomName: 'Toddlers (Rainbow Room)',
    status: EnrollmentStatus.Active,
    enrollmentDate: '2026-02-01T00:00:00Z',
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    childId: 'ch222222-2222-2222-2222-222222222222',
    childName: 'Emily Smith',
    classroomId: 'c3333333-3333-3333-3333-333333333333',
    classroomName: 'Pre-K (Explorers Room)',
    status: EnrollmentStatus.Active,
    enrollmentDate: '2026-02-15T00:00:00Z',
    createdAt: '2026-02-15T00:00:00Z',
  },
];

export const INITIAL_ATTENDANCE = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    childId: 'ch111111-1111-1111-1111-111111111111',
    childName: 'John Connor',
    date: '2026-10-07',
    arrivalTime: '2026-10-07T08:15:00Z',
    departureTime: undefined,
    isPresent: true,
    recordedById: 's2222222-2222-2222-2222-222222222222',
    recordedByName: 'Emma Watson',
    note: 'Arrived happily with mother',
    createdAt: '2026-10-07T08:15:00Z',
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    childId: 'ch222222-2222-2222-2222-222222222222',
    childName: 'Emily Smith',
    date: '2026-10-07',
    arrivalTime: '2026-10-07T08:30:00Z',
    departureTime: undefined,
    isPresent: true,
    recordedById: 's2222222-2222-2222-2222-222222222222',
    recordedByName: 'Emma Watson',
    note: 'Brought lunchbox',
    createdAt: '2026-10-07T08:30:00Z',
  },
];

export const INITIAL_MEALS = [
  {
    id: 'm1111111-1111-1111-1111-111111111111',
    childId: 'ch111111-1111-1111-1111-111111111111',
    childName: 'John Connor',
    staffId: 's2222222-2222-2222-2222-222222222222',
    staffName: 'Emma Watson',
    type: MealType.Breakfast,
    food: 'Oatmeal and sliced bananas',
    mealTime: '2026-10-07T09:00:00Z',
    status: MealStatus.Eaten,
    notes: 'Finished all food',
  },
];

export const INITIAL_ACTIVITIES = [
  {
    id: 'act11111-1111-1111-1111-111111111111',
    childId: 'ch111111-1111-1111-1111-111111111111',
    childName: 'John Connor',
    activityType: ActivityType.Learning,
    startTime: '2026-10-07T10:00:00Z',
    endTime: '2026-10-07T10:45:00Z',
    activityDescription: 'Color recognition blocks',
    recordedById: 's2222222-2222-2222-2222-222222222222',
    recordedByName: 'Emma Watson',
    note: 'Very engaged during building',
  },
];
