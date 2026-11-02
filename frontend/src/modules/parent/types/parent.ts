export type AttendanceState =
  | 'NotArrived'
  | 'Present'
  | 'Late'
  | 'Absent'
  | 'Sick'
  | 'ExcusedAbsence'
  | 'CheckedOut'
  | 'CenterClosed';

export const MoodLevel = {
  VeryHappy: 0,
  Happy: 1,
  Calm: 2,
  Tired: 3,
  Fussy: 4,
  Sad: 5,
  Upset: 6,
} as const;
export type MoodLevel = (typeof MoodLevel)[keyof typeof MoodLevel];

export const HealthEventType = {
  Temperature: 0,
  Symptom: 1,
  Medication: 2,
  Illness: 4,
  Injury: 5,
  Other: 6,
} as const;
export type HealthEventType = (typeof HealthEventType)[keyof typeof HealthEventType];

export const HealthSeverity = {
  Info: 0,
  Watch: 1,
  Urgent: 2,
} as const;
export type HealthSeverity = (typeof HealthSeverity)[keyof typeof HealthSeverity];

export const ComplaintStatus = {
  Submitted: 0,
  UnderReview: 1,
  InProgress: 2,
  WaitingOnParent: 3,
  Resolved: 4,
  Closed: 5,
  Reopened: 6,
  Rejected: 7,
} as const;
export type ComplaintStatus = (typeof ComplaintStatus)[keyof typeof ComplaintStatus];

export const ComplaintCategory = {
  Safety: 0,
  StaffConduct: 1,
  Meals: 2,
  Cleanliness: 3,
  Communication: 4,
  Billing: 5,
  Curriculum: 6,
  Facilities: 7,
  Other: 8,
} as const;
export type ComplaintCategory = (typeof ComplaintCategory)[keyof typeof ComplaintCategory];

export const ComplaintPriority = {
  Low: 0,
  Normal: 1,
  High: 2,
  Urgent: 3,
} as const;
export type ComplaintPriority = (typeof ComplaintPriority)[keyof typeof ComplaintPriority];

export const ConversationType = {
  Direct: 0,
  Classroom: 1,
  Center: 2,
} as const;
export type ConversationType = (typeof ConversationType)[keyof typeof ConversationType];

export const ChatMessageType = {
  Text: 0,
  Image: 1,
  File: 2,
  System: 3,
} as const;
export type ChatMessageType = (typeof ChatMessageType)[keyof typeof ChatMessageType];

export const AbsenceReason = {
  Sick: 0,
  Appointment: 1,
  FamilyTrip: 2,
  Other: 3,
} as const;
export type AbsenceReason = (typeof AbsenceReason)[keyof typeof AbsenceReason];

export interface ParentChildCard {
  childId: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  ageMonths: number;
  classroom: {
    id: string;
    name: string;
  };
  primaryTeachers: {
    staffId: string;
    name: string;
    photoUrl?: string | null;
  }[];
  today: {
    status: AttendanceState;
    arrivalTime: string | null;
    departureTime: string | null;
    currentActivity: {
      type: number;
      description: string;
      startedAt: string;
      isInProgress: boolean;
    } | null;
    lastMeal: {
      type: number;
      status: number;
      mealTime: string;
    } | null;
    mood: MoodLevel | null;
    latestHealthAlert: {
      id: string;
      severity: string;
      title: string;
    } | null;
    unreadMessages: number;
    pendingAcknowledgements: number;
  };
}

export interface ChildLiveStatus {
  childId: string;
  asOf: string;
  attendance: {
    status: AttendanceState;
    arrivalTime: string | null;
    departureTime: string | null;
    checkedInBy?: string;
  };
  location: {
    classroomId: string;
    classroomName: string;
  };
  currentActivity: {
    id: string;
    type: number;
    description: string;
    startedAt: string;
    elapsedMinutes: number;
  } | null;
  today: {
    meals: {
      count: number;
      eaten: number;
      partiallyEaten: number;
      notEaten: number;
    };
    naps: {
      count: number;
      totalMinutes: number;
    };
    activities: {
      count: number;
    };
    diapers?: {
      count: number;
    };
    incidents: number;
  };
  mood: {
    current: MoodLevel | null;
    history: { at: string; mood: MoodLevel }[];
  };
  health: {
    lastTemperature?: {
      value: number;
      unit: string;
      at: string;
    } | null;
    alerts: Array<{
      id: string;
      title: string;
      severity: string;
      description?: string;
      time?: string;
    }>;
  };
}

export interface TimelineItem {
  time: string;
  kind: 'meal' | 'activity' | 'nap' | 'health' | 'attendance' | 'incident' | 'mood' | 'photo' | 'diaper';
  refId: string;
  title: string;
  subtitle?: string;
  details?: Record<string, unknown>;
  author?: string;
}

export interface ParentDailyReport {
  childId: string;
  childName: string;
  date: string;
  isPublished: boolean;
  publishedAt?: string | null;
  liveOnly?: boolean;
  summary?: string | null;
  overallMood?: MoodLevel | null;
  attendance: {
    status: AttendanceState;
    arrivalTime: string | null;
    departureTime: string | null;
    pickedUpBy?: string | null;
  };
  meals: Array<{
    id: string;
    mealType: string;
    food: string;
    portionEaten: number; // 0=None, 1=Some, 2=All
    notes?: string;
    recordedAt: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    durationMinutes?: number;
    photos?: string[];
  }>;
  wellbeing: Array<{
    id: string;
    mood: MoodLevel;
    note?: string;
    recordedAt: string;
  }>;
  healthEvents: Array<{
    id: string;
    type: number;
    title: string;
    severity: string;
    value?: string;
    actionTaken?: string;
  }>;
  diapers: Array<{
    id: string;
    type: string;
    time: string;
    note?: string;
  }>;
  incidents: Array<{
    id: string;
    severity: string;
    summary: string;
    acknowledged: boolean;
    acknowledgedAt?: string | null;
  }>;
  photos: Array<{
    id: string;
    url: string;
    caption?: string;
    takenAt: string;
  }>;
  timeline: TimelineItem[];
}

export interface WellbeingOverview {
  childId: string;
  from: string;
  to: string;
  score: {
    value: number;
    label: string;
    explanation: string;
  };
  mood: {
    average: number;
    distribution: Record<string, number>;
    trend: 'Up' | 'Down' | 'Stable';
  };
  sleep: {
    avgMinutesPerDay: number;
    avgNaps: number;
    trend: string;
  };
  nutrition: {
    eatenRate: number;
    partialRate: number;
    notEatenRate: number;
    trend: string;
  };
  attendance: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
  };
  health: {
    illnessEvents: number;
    maxTemperature?: number | null;
    medicationDoses: number;
  };
  incidents: {
    total: number;
    unacknowledged: number;
  };
  flags: Array<{
    type: string;
    severity: 'Info' | 'Watch' | 'Urgent';
    message: string;
  }>;
  disclaimer: string;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  title: string;
  childName?: string;
  childId?: string;
  unreadCount: number;
  isMuted: boolean;
  lastMessage?: {
    preview: string;
    senderName: string;
    at: string;
  };
  participants: Array<{
    userId: string;
    name: string;
    role: string;
    photoUrl?: string | null;
  }>;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  clientId: string;
  sender: {
    userId: string;
    name: string;
    role: 'Parent' | 'Staff' | 'Admin' | 'System';
    photoUrl?: string | null;
  };
  type: number;
  body: string;
  replyTo?: {
    id: string;
    preview: string;
  } | null;
  attachments: Array<{
    id: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    thumbnailUrl?: string;
    url: string;
  }>;
  createdAt: string;
  editedAt?: string | null;
  isDeleted: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  deliveredAt?: string | null;
  readAt?: string | null;
}

export interface ComplaintSummary {
  id: string;
  referenceNumber: string;
  subject: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  childName?: string;
  childId?: string;
  createdAt: string;
  updatedAt: string;
  hasUnread: boolean;
  slaDueAt?: string;
}

export interface ComplaintDetail extends ComplaintSummary {
  description: string;
  assignedTo?: {
    name: string;
  };
  messages: Array<{
    id: string;
    authorRole: 'Parent' | 'Staff' | 'Admin' | 'System';
    authorName: string;
    body: string;
    createdAt: string;
    attachments: Array<{
      fileName: string;
      url: string;
      sizeBytes?: number;
    }>;
  }>;
  statusHistory: Array<{
    from: ComplaintStatus;
    to: ComplaintStatus;
    at: string;
    reason?: string | null;
  }>;
  resolutionSummary?: string | null;
  satisfactionRating?: number | null;
  canReopen: boolean;
  canRate: boolean;
}

export interface ParentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  accountCreatedAt: string;
  lastLoginAt?: string | null;
  childrenCount: number;
}

export interface ChildFullDetail {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ageMonths: number;
  gender: string;
  photoUrl?: string | null;
  classroom: {
    id: string;
    name: string;
  };
  teachers: Array<{
    staffId: string;
    name: string;
    role: string;
    photoUrl?: string | null;
    canMessage: boolean;
  }>;
  health: {
    allergies: string[];
    dietaryRestrictions: string[];
    medicalNotes?: string | null;
    medications?: string | null;
    bloodType?: string | null;
    emergencyContact: {
      name: string;
      phone: string;
    };
    pediatrician: {
      name: string;
      phone: string;
    };
    specialNeedsNotes?: string | null;
    verificationStatus: 'Verified' | 'Pending';
  };
  authorizedPickups: Array<{
    id: string;
    fullName: string;
    relationship: string;
    phone: string;
    photoUrl?: string | null;
    isActive: boolean;
    validUntil?: string | null;
    approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  }>;
  latestMeasurement?: {
    measuredOn: string;
    heightCm: number;
    weightKg: number;
  };
  attendanceStats?: {
    last30Days: {
      present: number;
      absent: number;
      late: number;
    };
  };
  documents?: Array<{
    id: string;
    name: string;
    uploadedAt: string;
    url?: string;
  }>;
  pendingConsents: number;
}

export interface AbsenceNotice {
  id: string;
  childId: string;
  childName: string;
  fromDate: string;
  toDate: string;
  reason: AbsenceReason;
  details?: string;
  status: 'Submitted' | 'Acknowledged' | 'Cancelled';
  acknowledgedAt?: string | null;
  createdAt: string;
}

export interface HomeNote {
  id: string;
  childId: string;
  date: string;
  category: string;
  text: string;
  createdAt: string;
  acknowledgedByStaffId?: string | null;
  acknowledgedAt?: string | null;
}

export interface ParentNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  childId?: string;
  childName?: string;
  createdAt: string;
  isRead: boolean;
  priority?: 'Normal' | 'High' | 'Urgent';
  actionUrl?: string;
}

export interface NotificationPreferences {
  channels: {
    dailyUpdates: { inApp: boolean; push: boolean; email: boolean; sms: boolean };
    healthAndSafety: { inApp: boolean; push: boolean; email: boolean; sms: boolean };
    messagesAndFeedback: { inApp: boolean; push: boolean; email: boolean; sms: boolean };
    announcements: { inApp: boolean; push: boolean; email: boolean; sms: boolean };
  };
  deliveryStyle: 'Instant' | 'Digest';
  digestTime: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  hideDetailsOnLockScreen: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'All' | 'Classroom' | 'Child';
  publishedAt: string;
  requiresAcknowledgement: boolean;
  isAcknowledged: boolean;
  authorName: string;
}

export interface ConsentForm {
  id: string;
  title: string;
  body: string;
  version: string;
  required: boolean;
  decision?: 'Granted' | 'Denied' | 'NeedsResponse';
  respondedAt?: string | null;
  childId?: string;
}
