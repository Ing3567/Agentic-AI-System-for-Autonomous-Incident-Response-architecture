export type IncidentStatus = 'Pending' | 'Success' | 'Failed';
export type IncidentSeverity = 'High' | 'Medium' | 'Low';
export type ApprovalStatus = 'waiting' | 'approved' | 'rejected';
export type TimelineEventType = 'detection' | 'analysis' | 'action' | 'resolution' | 'approval';

export interface TimelineEvent {
  id: string;
  step: number;
  title: string;
  time: string;
  description: string;
  type: string;
  createdAt: string;
  incidentId: string;
}

export interface Incident {
  id: string;
  incidentNumber: string;
  timestamp: string;
  threatType: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  sourceIP: string;
  duration: string | null;
  confidenceScore: number;
  description: string | null;

  // Approval - null เมื่อไม่ต้อง approve
  resumeUrl: string | null;
  approvalStatus: ApprovalStatus | null;
  approvedAt: string | null;
  approvedBy: string | null;

  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

// Helper: ต้อง approve ไหม
export function needsApproval(incident: Incident): boolean {
  return incident.resumeUrl !== null && incident.approvalStatus === 'waiting';
}

// Helper: มี approval flow ไหม
export function hasApprovalFlow(incident: Incident): boolean {
  return incident.approvalStatus !== null;
}