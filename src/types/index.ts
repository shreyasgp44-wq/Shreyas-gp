export type Category =
  | 'Roads'
  | 'Water'
  | 'Waste'
  | 'Electricity'
  | 'Drainage'
  | 'Public Safety';

export type Department =
  | 'Roads & Infrastructure'
  | 'Water Supply & Sewerage'
  | 'Solid Waste Management'
  | 'Electricity & Energy Board'
  | 'Stormwater & Drainage'
  | 'Public Safety & Vigilance';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ActionBrief {
  recommendedAction: string;
  assignedCrew: string;
  estimatedResolutionHours: number;
  equipmentRequired: string[];
  safetyPrecautions: string;
  dispatchCode: string;
  generatedAt: string;
  aiModel: string;
}

export interface TimelineEvent {
  status: ComplaintStatus;
  timestamp: string;
  note: string;
  actor: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: Category;
  department: Department;
  status: ComplaintStatus;
  priority: Priority;
  priorityScore: number; // 0 to 100
  urgencyScore: number; // 1 to 10
  publicImpactScore: number; // 1 to 10
  priorityExplanation: string;
  aiSummary: string;
  area: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  imageUrl?: string;
  citizenName: string;
  citizenPhone?: string;
  createdAt: string;
  updatedAt: string;
  isDuplicate?: boolean;
  duplicateGroupId?: string;
  duplicateOfId?: string;
  duplicateConfidence?: number;
  duplicateReason?: string;
  actionBrief?: ActionBrief;
  timeline: TimelineEvent[];
  aiModelUsed?: string;
  citizenUpvotes?: number;
}

export interface Hotspot {
  area: string;
  totalComplaints: number;
  activeComplaints: number;
  criticalCount: number;
  topCategory: Category;
  coordinates: {
    lat: number;
    lng: number;
  };
  riskLevel: 'Severe' | 'Elevated' | 'Moderate' | 'Low';
  commonIssues: string[];
}

export interface DuplicateCluster {
  groupId: string;
  primaryComplaint: Complaint;
  duplicates: Complaint[];
  similarityScore: number;
  reason: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  resolved: number;
  highPriority: number;
  underReview: number;
  inProgress: number;
  assigned: number;
  duplicatesDetected: number;
  avgResolutionHours: number;
  byCategory: Record<Category, number>;
  byPriority: Record<Priority, number>;
  byArea: Record<string, number>;
}
