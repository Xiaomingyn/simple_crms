import { Organization, Contact, Deal, Activity, DashboardData } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Organizations
export const getOrganizations = (search?: string) =>
  request<Organization[]>(`/organizations${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getOrganization = (id: string) =>
  request<Organization & { contacts: Contact[]; deals: Deal[] }>(`/organizations/${id}`);

export const createOrganization = (data: Partial<Organization>) =>
  request<Organization>('/organizations', { method: 'POST', body: JSON.stringify(data) });

export const updateOrganization = (id: string, data: Partial<Organization>) =>
  request<Organization>(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteOrganization = (id: string) =>
  request<{ success: boolean }>(`/organizations/${id}`, { method: 'DELETE' });

// Contacts
export const getContacts = (search?: string, status?: string) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  const qs = params.toString();
  return request<Contact[]>(`/contacts${qs ? `?${qs}` : ''}`);
};

export const getContact = (id: string) =>
  request<Contact & { activities: Activity[]; deals: Deal[] }>(`/contacts/${id}`);

export const createContact = (data: Partial<Contact>) =>
  request<Contact>('/contacts', { method: 'POST', body: JSON.stringify(data) });

export const updateContact = (id: string, data: Partial<Contact>) =>
  request<Contact>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteContact = (id: string) =>
  request<{ success: boolean }>(`/contacts/${id}`, { method: 'DELETE' });

// Deals
export const getDeals = (search?: string) =>
  request<Deal[]>(`/deals${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getDealsByStage = () =>
  request<Record<string, Deal[]>>('/deals/stages');

export const getDeal = (id: string) =>
  request<Deal & { activities: Activity[] }>(`/deals/${id}`);

export const createDeal = (data: Partial<Deal>) =>
  request<Deal>('/deals', { method: 'POST', body: JSON.stringify(data) });

export const updateDeal = (id: string, data: Partial<Deal>) =>
  request<Deal>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const updateDealStage = (id: string, stage: string) =>
  request<Deal>(`/deals/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) });

export const deleteDeal = (id: string) =>
  request<{ success: boolean }>(`/deals/${id}`, { method: 'DELETE' });

// Activities
export const getActivities = (limit?: number) =>
  request<Activity[]>(`/activities${limit ? `?limit=${limit}` : ''}`);

export const getTasks = () =>
  request<Activity[]>('/activities/tasks');

export const createActivity = (data: Partial<Activity>) =>
  request<Activity>('/activities', { method: 'POST', body: JSON.stringify(data) });

export const toggleActivityDone = (id: string) =>
  request<Activity>(`/activities/${id}/toggle`, { method: 'PATCH' });

// Dashboard
export const getDashboard = () =>
  request<DashboardData>('/dashboard');
