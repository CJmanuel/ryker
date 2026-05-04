// src/types.ts
// Global TypeScript types and interfaces

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  department: 'IT' | 'HR' | 'Finance';
  role: 'admin' | 'department_user';
}

export interface FileMetadata {
  filename: string;
  department: string;
  uploadedBy: string;
  uploadDate: {
    seconds: number;
    nanoseconds: number;
  };
  fileSize: number;
  downloadURL: string;
}

export interface UploadResult {
  success: boolean;
  error?: string;
}

// Campaign Management Types
export interface Campaign {
  id: string;
  name: string;
  clientId: string;
  description: string;
  status: 'draft' | 'planning' | 'creative' | 'approval' | 'active' | 'completed' | 'paused';
  budget: {
    total: number;
    spent: number;
    remaining: number;
    currency: string;
  };
  timeline: {
    startDate: Date;
    endDate: Date;
    milestones: Milestone[];
  };
  channels: string[];
  team: {
    manager: string;
    members: string[];
    roles: Record<string, string>;
  };
  creatives: Creative[];
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo: string;
}

export interface Creative {
  id: string;
  name: string;
  type: 'image' | 'video' | 'text' | 'banner';
  assetUrl: string;
  status: 'draft' | 'review' | 'approved' | 'rejected';
  version: number;
  feedback: Feedback[];
}

export interface Feedback {
  id: string;
  userId: string;
  comment: string;
  rating?: number;
  timestamp: Date;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roi: number;
  lastUpdated: Date;
}

// Client Tracking Types
export interface Client {
  id: string;
  companyName: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  status: 'lead' | 'prospect' | 'active' | 'inactive' | 'lost';
  contacts: Contact[];
  address: Address;
  financials: {
    annualRevenue: number;
    contractValue: number;
    paymentTerms: string;
    currency: string;
  };
  preferences: {
    communicationFrequency: string;
    preferredChannels: string[];
    timezone: string;
  };
  campaigns: string[];
  interactions: Interaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  department: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Interaction {
  id: string;
  type: 'meeting' | 'call' | 'email' | 'presentation';
  date: Date;
  summary: string;
  participants: string[];
  followUpDate?: Date;
  outcome: string;
}

// Budget Monitoring Types
export interface Budget {
  id: string;
  name: string;
  clientId?: string;
  campaignId?: string;
  type: 'client' | 'campaign' | 'department' | 'project';
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalAmount: number;
  currency: string;
  allocations: BudgetAllocation[];
  expenses: Expense[];
  status: 'draft' | 'approved' | 'active' | 'completed';
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAllocation {
  id: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  description: string;
}

export interface Expense {
  id: string;
  budgetId: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  vendor: string;
  receiptUrl?: string;
  approved: boolean;
  approvedBy?: string;
  createdBy: string;
}

// Team Collaboration Types
export interface Project {
  id: string;
  name: string;
  description: string;
  clientId?: string;
  campaignId?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  team: {
    manager: string;
    members: string[];
  };
  timeline: {
    startDate: Date;
    endDate: Date;
    milestones: Milestone[];
  };
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string[];
  dueDate: Date;
  estimatedHours: number;
  actualHours: number;
  dependencies: string[];
  comments: Comment[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  timestamp: Date;
  mentions: string[];
}

export interface TimeEntry {
  id: string;
  userId: string;
  taskId: string;
  projectId: string;
  date: Date;
  hours: number;
  description: string;
  billable: boolean;
}

// Media Asset Organization Types
export interface MediaAsset {
  id: string;
  filename: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'audio' | 'other';
  department: string;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
  fileSize: number;
  downloadURL: string;
  path: string;
  tags: string[];
  clientId?: string;
  campaignId?: string;
  projectId?: string;
  license: string;
  expirationDate?: Date;
}

export interface AssetVersion {
  id: string;
  versionNumber: number;
  fileUrl: string;
  changes: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface AssetCollection {
  id: string;
  name: string;
  description: string;
  assets: string[];
  sharedWith: string[];
  permissions: 'view' | 'download' | 'edit';
  createdBy: string;
  createdAt: Date;
}

export interface AssetUsage {
  assetId: string;
  usedIn: string;
  usageType: string;
  usedBy: string;
  usedAt: Date;
  performance?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
  };
}
