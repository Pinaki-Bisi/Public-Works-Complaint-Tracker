export interface User {
  id: number;
  username: string;
  email: string;
  phoneNumber: string | null;
  fullName: string;
  departmentId: number | null;
  departmentName: string | null;
  roles: string[];
  enabled: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface Analytics {
  total: number; pending: number; resolved: number; averageResolutionHours: number | null;
  byDepartment: Record<string, number>; byPriority: Record<string, number>;
  departmentPerformance: Record<string, Record<string, number>>;
  monthlyTrend: Array<{ month: string; total: number }>;
}

export interface OverdueComplaint {
  ticketNo: string;
  title: string;
  department: string;
  status: string;
  assignee: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: number; complaintId: number | null; ticketNo: string | null; message: string;
  createdAt: string; readAt: string | null;
}

export interface Attachment {
  id: number; fileName: string; contentType: string; sizeBytes: number; uploadedBy: string; createdAt: string;
}

export interface WorkOrder {
  id: number;
  assigneeId: number;
  assigneeName: string;
  scheduledAt: string | null;
  status: string;
  notes: string | null;
}

export interface HistoryItem {
  id: number;
  oldStatus: string | null;
  newStatus: string;
  comment: string | null;
  actorName: string;
  createdAt: string;
}

export interface CommentItem {
  id: number;
  body: string;
  authorName: string;
  createdAt: string;
}

export interface Complaint {
  id: number;
  ticketNo: string;
  title: string;
  description: string | null;
  location: string;
  status: string;
  priority: string;
  category: Category;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  workOrder: WorkOrder | null;
  history: HistoryItem[];
  comments: CommentItem[];
}
