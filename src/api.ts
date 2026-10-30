import { Complaint, DashboardStats, Hotspot, DuplicateCluster, ActionBrief, Category, Priority, Department, ComplaintStatus } from './types/index.ts';

export async function fetchStatus(): Promise<{ status: string; geminiLive: boolean; model: string; totalComplaints: number }> {
  const res = await fetch('/api/status');
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function fetchComplaints(params?: {
  category?: string;
  status?: string;
  priority?: string;
  area?: string;
  search?: string;
  duplicateOnly?: boolean;
}): Promise<Complaint[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.status) query.set('status', params.status);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.area) query.set('area', params.area);
  if (params?.search) query.set('search', params.search);
  if (params?.duplicateOnly) query.set('duplicateOnly', 'true');

  const res = await fetch(`/api/complaints?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch complaints');
  return res.json();
}

export async function fetchComplaintById(id: string): Promise<Complaint> {
  const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Complaint ${id} not found`);
  return res.json();
}

export async function createComplaint(payload: {
  title: string;
  description: string;
  category?: Category | string;
  area: string;
  address?: string;
  imageUrl?: string;
  citizenName?: string;
  citizenPhone?: string;
}): Promise<Complaint> {
  const res = await fetch('/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to submit complaint');
  }
  return res.json();
}

export async function updateComplaint(
  id: string,
  payload: {
    status?: ComplaintStatus;
    department?: Department;
    priority?: Priority;
    note?: string;
    actor?: string;
  }
): Promise<Complaint> {
  const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update complaint');
  return res.json();
}

export async function upvoteComplaint(id: string): Promise<{ id: string; upvotes: number }> {
  const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/upvote`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to upvote complaint');
  return res.json();
}

export async function generateActionBrief(id: string): Promise<ActionBrief> {
  const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/action-brief`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to generate action brief');
  return res.json();
}

export async function resetDemoData(): Promise<{ message: string; count: number }> {
  const res = await fetch('/api/complaints/reset-demo', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset demo data');
  return res.json();
}

export async function fetchDashboardStats(): Promise<{
  stats: DashboardStats;
  hotspots: Hotspot[];
  duplicateClusters: DuplicateCluster[];
}> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}
