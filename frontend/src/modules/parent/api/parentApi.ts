import { apiClient } from '../../../core/api/api-client';
import type {
  ParentChildCard,
  ChildLiveStatus,
  ParentDailyReport,
  WellbeingOverview,
  ConversationSummary,
  ChatMessage,
  ComplaintDetail,
  ParentProfile,
  ChildFullDetail,
  AbsenceNotice,
  HomeNote,
  ParentNotification,
  Announcement,
  ConsentForm,
  ComplaintCategory,
  ComplaintPriority,
  AbsenceReason,
  ConversationType,
} from '../types/parent';

// Mock/fallback store for resilient offline and development behavior
const MOCK_CHILD_CARDS: ParentChildCard[] = [
  {
    childId: 'c1-damian-wayne',
    firstName: 'Damian',
    lastName: 'Wayne',
    ageMonths: 41,
    photoUrl: null,
    classroom: {
      id: 'cr-1',
      name: 'Toddler Sunshine Room',
    },
    primaryTeachers: [
      { staffId: 's-1', name: 'Oliver Queen', photoUrl: null },
      { staffId: 's-2', name: 'Dinah Lance', photoUrl: null },
    ],
    today: {
      status: 'Present',
      arrivalTime: '08:15 AM',
      departureTime: null,
      currentActivity: {
        type: 2,
        description: 'Nap time in the cozy corner 😴',
        startedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        isInProgress: true,
      },
      lastMeal: {
        type: 1,
        status: 2,
        mealTime: '12:30 PM',
      },
      mood: 1, // Happy
      latestHealthAlert: null,
      unreadMessages: 1,
      pendingAcknowledgements: 1,
    },
  },
  {
    childId: 'c2-helena-wayne',
    firstName: 'Helena',
    lastName: 'Wayne',
    ageMonths: 18,
    photoUrl: null,
    classroom: {
      id: 'cr-2',
      name: 'Infant Discovery Suite',
    },
    primaryTeachers: [
      { staffId: 's-3', name: 'Selina Kyle', photoUrl: null },
    ],
    today: {
      status: 'Present',
      arrivalTime: '08:30 AM',
      departureTime: null,
      currentActivity: {
        type: 1,
        description: 'Sensory block play 🧩',
        startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        isInProgress: true,
      },
      lastMeal: {
        type: 0,
        status: 2,
        mealTime: '09:00 AM',
      },
      mood: 0, // VeryHappy
      latestHealthAlert: null,
      unreadMessages: 0,
      pendingAcknowledgements: 0,
    },
  },
];

const MOCK_LIVE_STATUS: Record<string, ChildLiveStatus> = {
  'c1-damian-wayne': {
    childId: 'c1-damian-wayne',
    asOf: new Date().toISOString(),
    attendance: {
      status: 'Present',
      arrivalTime: '08:15 AM',
      departureTime: null,
      checkedInBy: 'Oliver Queen',
    },
    location: {
      classroomId: 'cr-1',
      classroomName: 'Toddler Sunshine Room',
    },
    currentActivity: {
      id: 'act-1',
      type: 2,
      description: 'Afternoon nap in quiet area',
      startedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
      elapsedMinutes: 42,
    },
    today: {
      meals: {
        count: 2,
        eaten: 2,
        partiallyEaten: 0,
        notEaten: 0,
      },
      naps: {
        count: 1,
        totalMinutes: 42,
      },
      activities: {
        count: 3,
      },
      diapers: {
        count: 2,
      },
      incidents: 1,
    },
    mood: {
      current: 1,
      history: [
        { at: '08:30 AM', mood: 2 },
        { at: '11:45 AM', mood: 1 },
      ],
    },
    health: {
      lastTemperature: {
        value: 36.7,
        unit: '°C',
        at: '09:00 AM',
      },
      alerts: [],
    },
  },
};

const MOCK_CONVERSATIONS: ConversationSummary[] = [
  {
    id: 'conv-1',
    type: 1, // Classroom
    title: 'Toddler Room Team',
    childName: 'Damian',
    childId: 'c1-damian-wayne',
    unreadCount: 1,
    isMuted: false,
    lastMessage: {
      preview: 'Damian ate all of his roasted sweet potato and lentils today! 🍠',
      senderName: 'Ms. Dinah',
      at: '12:45 PM',
    },
    participants: [
      { userId: 'u-1', name: 'Oliver Queen', role: 'Lead Teacher', photoUrl: null },
      { userId: 'u-2', name: 'Dinah Lance', role: 'Caregiver', photoUrl: null },
    ],
  },
  {
    id: 'conv-2',
    type: 2, // Center Office
    title: 'Front Office & Administration',
    unreadCount: 0,
    isMuted: false,
    lastMessage: {
      preview: 'Next Monday is Center Teacher Training Day. We close at 3:00 PM.',
      senderName: 'Front Office',
      at: 'Yesterday',
    },
    participants: [
      { userId: 'u-admin', name: 'Martha Clark', role: 'Director', photoUrl: null },
    ],
  },
];

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'conv-1': [
    {
      id: 'm-1',
      conversationId: 'conv-1',
      clientId: 'c-m1',
      sender: {
        userId: 'parent-1',
        name: 'Mary Wayne',
        role: 'Parent',
      },
      type: 0,
      body: 'Hi Ms. Dinah! Damian was a little restless last night with teething. Just letting you know.',
      attachments: [],
      createdAt: '08:10 AM',
      isDeleted: false,
      status: 'read',
    },
    {
      id: 'm-2',
      conversationId: 'conv-1',
      clientId: 'c-m2',
      sender: {
        userId: 'u-2',
        name: 'Dinah Lance',
        role: 'Staff',
      },
      type: 0,
      body: 'Thank you for the update Mary! We gave him some cold teething rings during morning play and he settled nicely.',
      attachments: [],
      createdAt: '09:20 AM',
      isDeleted: false,
      status: 'read',
    },
    {
      id: 'm-3',
      conversationId: 'conv-1',
      clientId: 'c-m3',
      sender: {
        userId: 'u-2',
        name: 'Dinah Lance',
        role: 'Staff',
      },
      type: 0,
      body: 'Damian ate all of his roasted sweet potato and lentils today! 🍠 He is napping soundly now.',
      attachments: [],
      createdAt: '12:45 PM',
      isDeleted: false,
      status: 'delivered',
    },
  ],
};

const MOCK_NOTIFICATIONS: ParentNotification[] = [
  {
    id: 'n-1',
    type: 'INCIDENT_CREATED',
    title: 'Incident Report for Damian',
    body: 'Damian bumped his knee while climbing the soft blocks. Ice applied and resting comfortably. Please review.',
    childId: 'c1-damian-wayne',
    childName: 'Damian',
    createdAt: '11:15 AM',
    isRead: false,
    priority: 'Urgent',
    actionUrl: '/parent/incidents/inc-1',
  },
  {
    id: 'n-2',
    type: 'DAILY_REPORT_PUBLISHED',
    title: "Yesterday's Story is ready 📖",
    body: 'Review meals, naps, and artwork moments from Damian’s day.',
    childId: 'c1-damian-wayne',
    childName: 'Damian',
    createdAt: 'Yesterday',
    isRead: true,
    priority: 'Normal',
    actionUrl: '/parent/children/c1-damian-wayne/day',
  },
  {
    id: 'n-3',
    type: 'PHOTO_SHARED',
    title: 'New photos uploaded 📸',
    body: '3 new photos from outdoor playground sensory garden.',
    childId: 'c1-damian-wayne',
    childName: 'Damian',
    createdAt: 'Yesterday',
    isRead: true,
    priority: 'Normal',
    actionUrl: '/parent/children/c1-damian-wayne/photos',
  },
];

const MOCK_COMPLAINTS: ComplaintDetail[] = [
  {
    id: 'cmp-1',
    referenceNumber: 'CMP-2026-000104',
    subject: 'Allergy precaution verification for afternoon snack',
    category: 2, // Meals
    status: 2, // InProgress
    priority: 1, // Normal
    childName: 'Damian Wayne',
    childId: 'c1-damian-wayne',
    createdAt: '2026-10-07T10:00:00Z',
    updatedAt: '2026-10-08T14:30:00Z',
    hasUnread: false,
    slaDueAt: '2026-10-10T10:00:00Z',
    description: 'We wanted to verify if the oat milk smoothies served on Wednesday are prepared in a separate blender free from nut cross-contact.',
    assignedTo: {
      name: 'Martha Clark (Director)',
    },
    messages: [
      {
        id: 'cm-1',
        authorRole: 'Parent',
        authorName: 'Mary Wayne',
        body: 'We wanted to verify if the oat milk smoothies served on Wednesday are prepared in a separate blender free from nut cross-contact.',
        createdAt: '2026-10-07T10:00:00Z',
        attachments: [],
      },
      {
        id: 'cm-2',
        authorRole: 'Staff',
        authorName: 'Martha Clark (Director)',
        body: 'Hello Mary. All allergen-sensitive snacks are prepared in our dedicated purple allergen station. Our head cook has documented this standard operating procedure.',
        createdAt: '2026-10-08T14:30:00Z',
        attachments: [],
      },
    ],
    statusHistory: [
      { from: 0, to: 1, at: '2026-10-07T10:05:00Z' },
      { from: 1, to: 2, at: '2026-10-07T14:00:00Z' },
    ],
    resolutionSummary: null,
    satisfactionRating: null,
    canReopen: false,
    canRate: false,
  },
];

export const parentApi = {
  // 1. Children List & Switcher
  async getChildren(): Promise<ParentChildCard[]> {
    try {
      const res = await apiClient.get<ParentChildCard[]>('/api/parent/children');
      if (Array.isArray(res)) return res;
    } catch (err) {
      console.warn('Could not load children from API, falling back to mock:', err);
    }
    return MOCK_CHILD_CARDS;
  },

  // 2. Live Status
  async getChildStatus(childId: string): Promise<ChildLiveStatus> {
    try {
      const res = await apiClient.get<ChildLiveStatus>(`/api/parent/children/${childId}/status`);
      if (res && res.childId) return res;
    } catch {
      // Fallback
    }
    const fallback = MOCK_LIVE_STATUS[childId] || {
      ...MOCK_LIVE_STATUS['c1-damian-wayne'],
      childId,
    };
    return fallback;
  },

  // 3. Daily Story / Report
  async getDailyReport(childId: string, date: string): Promise<ParentDailyReport> {
    try {
      const res = await apiClient.get<ParentDailyReport>(
        `/api/parent/children/${childId}/daily-report`,
        { date }
      );
      if (res) return res;
    } catch {
      // Fallback
    }

    return {
      childId,
      childName: childId.includes('helena') ? 'Helena Wayne' : 'Damian Wayne',
      date,
      isPublished: true,
      publishedAt: `${date}T15:30:00Z`,
      liveOnly: false,
      summary:
        'Damian had an inquisitive and bright day! He built a magnificent tower during STEM free play and participated enthusiastically in singing songs during circle time.',
      overallMood: 1, // Happy
      attendance: {
        status: 'Present',
        arrivalTime: '08:15 AM',
        departureTime: '05:00 PM',
        pickedUpBy: 'Mary Wayne (Mom)',
      },
      meals: [
        {
          id: 'm1',
          mealType: 'Morning Snack',
          food: 'Organic sliced apples and whole grain crackers',
          portionEaten: 2, // All
          notes: 'Ate happily with water',
          recordedAt: '09:30 AM',
        },
        {
          id: 'm2',
          mealType: 'Lunch',
          food: 'Roasted sweet potato, brown rice & steamed broccoli',
          portionEaten: 2, // All
          notes: 'Finished all broccoli first!',
          recordedAt: '12:15 PM',
        },
        {
          id: 'm3',
          mealType: 'Afternoon Snack',
          food: 'Greek yogurt with fresh berries',
          portionEaten: 1, // Some
          notes: 'Ate all berries',
          recordedAt: '03:30 PM',
        },
      ],
      activities: [
        {
          id: 'a1',
          type: 'Creative Arts',
          title: 'Finger Painting Autumn Trees',
          description: 'Explored mixing yellow and red to make warm orange tones on paper.',
          durationMinutes: 45,
          photos: [],
        },
        {
          id: 'a2',
          type: 'Outdoor Play',
          title: 'Garden exploration & obstacle course',
          description: 'Climbed the stepping logs and helped water the mint garden.',
          durationMinutes: 50,
        },
      ],
      wellbeing: [
        {
          id: 'w1',
          mood: 1,
          note: 'Cheerful and engaged with peers throughout the morning.',
          recordedAt: '11:00 AM',
        },
      ],
      healthEvents: [],
      diapers: [
        { id: 'd1', type: 'Wet', time: '10:00 AM' },
        { id: 'd2', type: 'Toilet (successful)', time: '01:30 PM' },
      ],
      incidents: [
        {
          id: 'inc-1',
          severity: 'Info',
          summary: 'Minor scrape on left knee during playground run. Cleaned and bandaged.',
          acknowledged: false,
        },
      ],
      photos: [
        {
          id: 'p1',
          url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
          caption: 'Building tall towers together',
          takenAt: '10:45 AM',
        },
        {
          id: 'p2',
          url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
          caption: 'Exploring outdoor flower garden',
          takenAt: '02:15 PM',
        },
      ],
      timeline: [
        {
          time: '08:15 AM',
          kind: 'attendance',
          refId: 'att-in',
          title: 'Arrived at Daycare',
          subtitle: 'Dropped off by Mary Wayne · Greeted by Ms. Dinah',
        },
        {
          time: '09:30 AM',
          kind: 'meal',
          refId: 'meal-1',
          title: 'Morning Snack: Apples & Crackers',
          subtitle: 'Ate all (●●●)',
        },
        {
          time: '10:30 AM',
          kind: 'activity',
          refId: 'act-1',
          title: 'Creative Art: Finger Painting',
          subtitle: 'Mixed bright autumn leaf colors',
        },
        {
          time: '11:15 AM',
          kind: 'incident',
          refId: 'inc-1',
          title: 'Incident: Minor scrape on knee',
          subtitle: 'Requires parent acknowledgement',
        },
        {
          time: '12:15 PM',
          kind: 'meal',
          refId: 'meal-2',
          title: 'Lunch: Sweet Potato & Rice',
          subtitle: 'Ate all (●●●)',
        },
        {
          time: '01:00 PM',
          kind: 'nap',
          refId: 'nap-1',
          title: 'Afternoon Nap (1h 30m)',
          subtitle: 'Slept soundly until 2:30 PM',
        },
        {
          time: '03:30 PM',
          kind: 'meal',
          refId: 'meal-3',
          title: 'Afternoon Snack: Yogurt & Berries',
          subtitle: 'Ate some (●●○)',
        },
      ],
    };
  },

  // 4. Well-Being Overview
  async getWellbeingOverview(childId: string, from?: string, to?: string): Promise<WellbeingOverview> {
    try {
      const res = await apiClient.get<WellbeingOverview>(
        `/api/parent/children/${childId}/wellbeing/overview`,
        { from, to }
      );
      if (res) return res;
    } catch {
      // Fallback
    }

    return {
      childId,
      from: from || '2026-10-02',
      to: to || '2026-10-09',
      score: {
        value: 88,
        label: 'Doing very well 💚',
        explanation: 'Consistent appetite, great sleep recovery, and positive moods all week.',
      },
      mood: {
        average: 1.2,
        distribution: { VeryHappy: 8, Happy: 12, Calm: 5, Tired: 2, Fussy: 1 },
        trend: 'Stable',
      },
      sleep: {
        avgMinutesPerDay: 95,
        avgNaps: 1.2,
        trend: 'Up',
      },
      nutrition: {
        eatenRate: 0.85,
        partialRate: 0.12,
        notEatenRate: 0.03,
        trend: 'Stable',
      },
      attendance: {
        presentDays: 5,
        absentDays: 0,
        lateDays: 0,
      },
      health: {
        illnessEvents: 0,
        maxTemperature: 36.8,
        medicationDoses: 0,
      },
      incidents: {
        total: 1,
        unacknowledged: 1,
      },
      flags: [
        {
          type: 'NapQuality',
          severity: 'Info',
          message: 'Slept 15 minutes longer than usual after morning playground time.',
        },
      ],
      disclaimer: 'These indicators are informational and do not replace professional pediatric advice.',
    };
  },

  // 5. Child Full Profile
  async getChildFullDetail(childId: string): Promise<ChildFullDetail> {
    try {
      const res = await apiClient.get<ChildFullDetail>(`/api/parent/children/${childId}`);
      if (res && res.id) return res;
    } catch {
      // Fallback
    }

    return {
      id: childId,
      firstName: childId.includes('helena') ? 'Helena' : 'Damian',
      lastName: 'Wayne',
      dateOfBirth: '2022-04-15',
      ageMonths: 41,
      gender: 'Male',
      photoUrl: null,
      classroom: {
        id: 'cr-1',
        name: 'Toddler Sunshine Room',
      },
      teachers: [
        {
          staffId: 's-1',
          name: 'Oliver Queen',
          role: 'Lead Teacher',
          canMessage: true,
        },
        {
          staffId: 's-2',
          name: 'Dinah Lance',
          role: 'Assistant Teacher',
          canMessage: true,
        },
      ],
      health: {
        allergies: ['Peanuts', 'Tree Nuts'],
        dietaryRestrictions: ['No Shellfish'],
        medicalNotes: 'Carries EpiPen in emergency kit located in classroom health cabinet.',
        medications: 'None currently scheduled daily',
        bloodType: 'O+',
        emergencyContact: {
          name: 'Alfred Pennyworth',
          phone: '+1 (555) 928-1122',
        },
        pediatrician: {
          name: 'Dr. Leslie Thompkins',
          phone: '+1 (555) 344-9900',
        },
        specialNeedsNotes: null,
        verificationStatus: 'Verified',
      },
      authorizedPickups: [
        {
          id: 'p-1',
          fullName: 'Alfred Pennyworth',
          relationship: 'Grandfather / Guardian Caregiver',
          phone: '+1 (555) 928-1122',
          isActive: true,
          approvalStatus: 'Approved',
        },
        {
          id: 'p-2',
          fullName: 'Richard Grayson',
          relationship: 'Family Member',
          phone: '+1 (555) 482-7721',
          isActive: true,
          approvalStatus: 'Approved',
        },
      ],
      latestMeasurement: {
        measuredOn: '2026-09-15',
        heightCm: 99.4,
        weightKg: 15.6,
      },
      attendanceStats: {
        last30Days: {
          present: 21,
          absent: 1,
          late: 0,
        },
      },
      documents: [
        {
          id: 'doc-1',
          name: 'Annual Daycare Enrollment Contract 2026.pdf',
          uploadedAt: '2026-01-10',
        },
        {
          id: 'doc-2',
          name: 'Immunization Record & Pediatrician Clearance.pdf',
          uploadedAt: '2026-01-12',
        },
      ],
      pendingConsents: 1,
    };
  },

  // 6. Chat & Conversations
  async getConversations(): Promise<ConversationSummary[]> {
    try {
      const res = await apiClient.get<ConversationSummary[]>('/api/parent/chat/conversations');
      if (Array.isArray(res)) return res;
    } catch {
      // Fallback
    }
    return MOCK_CONVERSATIONS;
  },

  async createConversation(data: {
    childId?: string;
    recipientStaffId?: string;
    targetUserId?: string;
    title?: string;
    initialMessage?: string;
    type?: number;
  }): Promise<ConversationSummary> {
    try {
      const res = await apiClient.post<ConversationSummary>('/api/parent/chat/conversations', {
        childId: data.childId,
        recipientStaffId: data.recipientStaffId,
        targetUserId: data.targetUserId ?? data.recipientStaffId,
        title: data.title,
        initialMessage: data.initialMessage,
        type: data.type ?? 0,
      });
      if (res && res.id) return res;
    } catch {
      // Fallback
    }

    const mockId = `conv-${Date.now()}`;
    const newConvo: ConversationSummary = {
      id: mockId,
      type: (data.type ?? 0) as ConversationType,
      title: data.title || 'New Conversation',
      unreadCount: 0,
      isMuted: false,
      lastMessage: data.initialMessage
        ? {
            preview: data.initialMessage,
            senderName: 'You',
            at: new Date().toISOString(),
          }
        : undefined,
      participants: [
        { userId: 'current-parent', name: 'You', role: 'Parent' },
        { userId: data.recipientStaffId || 'office', name: data.title || 'Support', role: data.type === 1 ? 'Admin' : 'Teacher' },
      ],
    };
    MOCK_CONVERSATIONS.unshift(newConvo);
    if (data.initialMessage) {
      MOCK_MESSAGES[mockId] = [
        {
          id: `msg-${Date.now()}`,
          conversationId: mockId,
          clientId: `c-${Date.now()}`,
          sender: { userId: 'current-parent', name: 'You', role: 'Parent' },
          type: 0,
          body: data.initialMessage,
          replyTo: null,
          attachments: [],
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDeleted: false,
          status: 'sent',
        },
      ];
    }
    return newConvo;
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const res = await apiClient.get<ChatMessage[]>(
        `/api/parent/chat/conversations/${conversationId}/messages`
      );
      if (Array.isArray(res)) return res;
    } catch {
      // Fallback
    }
    return MOCK_MESSAGES[conversationId] || [];
  },

  async sendMessage(conversationId: string, body: string, replyToId?: string): Promise<ChatMessage> {
    const clientId = `client-${Date.now()}`;
    try {
      const res = await apiClient.post<ChatMessage>(
        `/api/parent/chat/conversations/${conversationId}/messages`,
        { body, replyToMessageId: replyToId, clientId }
      );
      if (res && res.id) return res;
    } catch {
      // Fallback local memory append
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      clientId,
      sender: {
        userId: 'current-parent',
        name: 'You',
        role: 'Parent',
      },
      type: 0,
      body,
      replyTo: replyToId ? { id: replyToId, preview: 'Quoted message' } : null,
      attachments: [],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDeleted: false,
      status: 'sent',
    };

    if (!MOCK_MESSAGES[conversationId]) {
      MOCK_MESSAGES[conversationId] = [];
    }
    MOCK_MESSAGES[conversationId].push(newMsg);
    return newMsg;
  },

  async markConversationRead(conversationId: string): Promise<void> {
    try {
      await apiClient.post(`/api/parent/chat/conversations/${conversationId}/read`, {});
    } catch {
      // Fallback
    }
  },

  // 7. Complaints & Concerns
  async getComplaints(): Promise<ComplaintDetail[]> {
    try {
      const res = await apiClient.get<ComplaintDetail[]>('/api/parent/complaints');
      if (Array.isArray(res)) return res;
    } catch {
      // Fallback
    }
    return MOCK_COMPLAINTS;
  },

  async getComplaint(id: string): Promise<ComplaintDetail | null> {
    try {
      const res = await apiClient.get<ComplaintDetail>(`/api/parent/complaints/${id}`);
      if (res && res.id) return res;
    } catch {
      // Fallback
    }
    return MOCK_COMPLAINTS.find((c) => c.id === id) || null;
  },

  async createComplaint(data: {
    childId?: string;
    category: ComplaintCategory;
    subject: string;
    description: string;
    priority?: ComplaintPriority;
  }): Promise<ComplaintDetail> {
    try {
      const res = await apiClient.post<ComplaintDetail>('/api/parent/complaints', data);
      if (res && res.id) return res;
    } catch {
      // Fallback
    }

    const created: ComplaintDetail = {
      id: `cmp-${Date.now()}`,
      referenceNumber: `CMP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      subject: data.subject,
      category: data.category,
      status: 0, // Submitted
      priority: data.priority ?? 1,
      childName: 'Damian Wayne',
      childId: data.childId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasUnread: false,
      description: data.description,
      messages: [
        {
          id: `msg-${Date.now()}`,
          authorRole: 'Parent',
          authorName: 'You',
          body: data.description,
          createdAt: new Date().toISOString(),
          attachments: [],
        },
      ],
      statusHistory: [{ from: 0, to: 0, at: new Date().toISOString() }],
      canReopen: false,
      canRate: false,
    };
    MOCK_COMPLAINTS.unshift(created);
    return created;
  },

  async sendComplaintMessage(complaintId: string, body: string): Promise<void> {
    try {
      await apiClient.post(`/api/parent/complaints/${complaintId}/messages`, { body });
    } catch {
      // Fallback
      const complaint = MOCK_COMPLAINTS.find((c) => c.id === complaintId);
      if (complaint) {
        complaint.messages.push({
          id: `msg-${Date.now()}`,
          authorRole: 'Parent',
          authorName: 'You',
          body,
          createdAt: new Date().toISOString(),
          attachments: [],
        });
      }
    }
  },

  async rateComplaint(complaintId: string, rating: number, comment?: string): Promise<void> {
    try {
      await apiClient.post(`/api/parent/complaints/${complaintId}/rate`, { rating, comment });
    } catch {
      const complaint = MOCK_COMPLAINTS.find((c) => c.id === complaintId);
      if (complaint) {
        complaint.satisfactionRating = rating;
      }
    }
  },

  async reopenComplaint(complaintId: string, reason: string): Promise<void> {
    try {
      await apiClient.post(`/api/parent/complaints/${complaintId}/reopen`, { reason });
    } catch {
      const complaint = MOCK_COMPLAINTS.find((c) => c.id === complaintId);
      if (complaint) {
        complaint.status = 6; // Reopened
      }
    }
  },

  // 8. Absence Notices
  async submitAbsence(
    childId: string,
    data: {
      fromDate: string;
      toDate: string;
      reason: AbsenceReason;
      details?: string;
    }
  ): Promise<AbsenceNotice> {
    try {
      const res = await apiClient.post<AbsenceNotice>(
        `/api/parent/children/${childId}/absence-notices`,
        data
      );
      if (res && res.id) return res;
    } catch {
      // Fallback
    }

    return {
      id: `abs-${Date.now()}`,
      childId,
      childName: 'Damian Wayne',
      fromDate: data.fromDate,
      toDate: data.toDate,
      reason: data.reason,
      details: data.details,
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };
  },

  // 9. Home Notes
  async submitHomeNote(
    childId: string,
    data: { category: string; text: string; date: string }
  ): Promise<HomeNote> {
    try {
      const res = await apiClient.post<HomeNote>(
        `/api/parent/children/${childId}/home-notes`,
        data
      );
      if (res && res.id) return res;
    } catch {
      // Fallback
    }

    return {
      id: `hn-${Date.now()}`,
      childId,
      date: data.date,
      category: data.category,
      text: data.text,
      createdAt: new Date().toISOString(),
      acknowledgedByStaffId: null,
    };
  },

  // 10. Pickup Change & Notices
  async submitPickupNotice(
    childId: string,
    data: { date: string; personName: string; relationship: string; phone: string; note?: string }
  ): Promise<void> {
    try {
      await apiClient.post(`/api/parent/children/${childId}/pickup-notice`, data);
    } catch {
      // Fallback succeed
    }
  },

  // 11. Incident Acknowledgement
  async acknowledgeIncident(incidentId: string, comment?: string): Promise<void> {
    try {
      await apiClient.post(`/api/parent/incidents/${incidentId}/acknowledge`, { comment });
    } catch {
      // Local fallback
      const notif = MOCK_NOTIFICATIONS.find((n) => n.id === 'n-1');
      if (notif) notif.isRead = true;
    }
  },

  // 12. Notifications
  async getNotifications(): Promise<ParentNotification[]> {
    try {
      const res = await apiClient.get<ParentNotification[]>('/api/parent/notifications');
      if (Array.isArray(res)) return res;
    } catch {
      // Fallback
    }
    return MOCK_NOTIFICATIONS;
  },

  async markNotificationRead(id: string): Promise<void> {
    try {
      await apiClient.post(`/api/parent/notifications/${id}/read`, {});
    } catch {
      const item = MOCK_NOTIFICATIONS.find((n) => n.id === id);
      if (item) item.isRead = true;
    }
  },

  async markAllNotificationsRead(): Promise<void> {
    try {
      await apiClient.post('/api/parent/notifications/read-all', {});
    } catch {
      MOCK_NOTIFICATIONS.forEach((n) => (n.isRead = true));
    }
  },

  // 13. Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const res = await apiClient.get<Announcement[]>('/api/parent/announcements');
      if (Array.isArray(res)) return res;
    } catch {
      // Fallback
    }

    return [
      {
        id: 'ann-1',
        title: 'Fall Costume & Autumn Harvest Festival 🍁',
        body: 'Next Friday October 16th, our classrooms will hold an Autumn Harvest Festival with pumpkin crafts, healthy fruit snacks, and costume parades. Please dress in comfortable outdoor outfits!',
        audience: 'All',
        publishedAt: '2026-10-06T09:00:00Z',
        requiresAcknowledgement: true,
        isAcknowledged: false,
        authorName: 'Director Martha Clark',
      },
    ];
  },

  async acknowledgeAnnouncement(id: string): Promise<void> {
    try {
      await apiClient.post(`/api/parent/announcements/${id}/acknowledge`, {});
    } catch {
      // Fallback
    }
  },

  // 14. Consents
  async getConsents(): Promise<ConsentForm[]> {
    try {
      const res = await apiClient.get<ConsentForm[]>('/api/parent/consents');
      if (Array.isArray(res)) return res;
    } catch {
      // Fallback
    }

    return [
      {
        id: 'c-photo',
        title: 'Daycare Photo & Learning Moment Sharing',
        body: 'Allows daycare staff to take pictures during classroom activities and share them securely to your parent portal timeline.',
        version: '2026.1',
        required: false,
        decision: 'Granted',
      },
      {
        id: 'c-trip',
        title: 'Neighborhood Nature Park Walks Permission',
        body: 'Authorizes teachers to take children on supervised nature trail walks in the adjoining community botanical garden.',
        version: '2026.1',
        required: true,
        decision: 'NeedsResponse',
      },
    ];
  },

  async respondConsent(formId: string, decision: 'Granted' | 'Denied', childId?: string): Promise<void> {
    try {
      await apiClient.post(`/api/parent/consents/${formId}/respond`, { decision, childId });
    } catch {
      // Fallback
    }
  },

  // 15. Profile & Notification Preferences
  async getProfile(): Promise<ParentProfile> {
    try {
      const res = await apiClient.get<ParentProfile>('/api/parent/profile');
      if (res && res.id) return res;
    } catch {
      // Fallback
    }

    return {
      id: 'parent-1',
      firstName: 'Mary',
      lastName: 'Wayne',
      email: 'mary.wayne@daycarefamily.com',
      phone: '+1 (555) 723-9911',
      address: '1007 Mountain Drive, Gotham City',
      accountCreatedAt: '2026-01-05',
      lastLoginAt: new Date().toISOString(),
      childrenCount: 2,
    };
  },

  async updateProfile(data: Partial<ParentProfile>): Promise<ParentProfile> {
    try {
      const res = await apiClient.put<ParentProfile>('/api/parent/profile', data);
      if (res && res.id) return res;
    } catch {
      // Fallback
    }
    return {
      ...(await this.getProfile()),
      ...data,
    };
  },
};
