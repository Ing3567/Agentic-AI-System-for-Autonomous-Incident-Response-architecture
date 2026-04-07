export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateIncidentRequest {
  threatType: string;
  severity: 'High' | 'Medium' | 'Low';
  sourceIP: string;
  description?: string;
  confidenceScore?: number;
  resumeUrl?: string;  // ถ้าส่งมา = ต้อง approve, ถ้าไม่ส่ง = ไม่ต้อง
}

export interface UpdateIncidentRequest {
  status?: 'Pending' | 'Success' | 'Failed';
  confidenceScore?: number;
  duration?: string;
  resolution?: string;
  resumeUrl?: string;
  timeline?: {
    title: string;
    description: string;
    type: string;
  };
}

export interface ApproveRequest {
  action: 'approve' | 'reject';
  approvedBy?: string;
  reason?: string;
}