export type IncidentSeverity = 0 | 1 | 2; // 0 = Minor, 1 = Moderate, 2 = Critical

export interface IncidentReport {
  id: string;
  childId: string;
  childName: string;
  childPhotoUrl?: string | null;
  classroomId?: string | null;
  classroomName?: string | null;
  reportedByStaffId: string;
  reportedByStaffName: string;
  incidentTime: string;
  incidentType: string;
  location: string;
  description: string;
  firstAidAdministered: string;
  witnessStaffNames?: string | null;
  severity: IncidentSeverity;
  severityName: string;
  parentNotified: boolean;
  parentNotifiedAt?: string | null;
  parentNotifiedMethod: string;
  isAcknowledgedByParent: boolean;
  parentAcknowledgedAt?: string | null;
  parentSignatureName?: string | null;
  parentComments?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentDto {
  childId: string;
  classroomId?: string;
  reportedByStaffId?: string;
  incidentTime?: string;
  incidentType: string;
  location: string;
  description: string;
  firstAidAdministered?: string;
  witnessStaffNames?: string;
  severity: IncidentSeverity;
  parentNotified?: boolean;
  parentNotifiedMethod?: string;
}

export interface AcknowledgeIncidentDto {
  parentSignatureName?: string;
  comment?: string;
}
