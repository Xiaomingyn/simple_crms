export interface Organization {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contacts?: Contact[];
  deals?: Deal[];
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  organization_id: string | null;
  organization_name?: string | null;
  status: 'lead' | 'qualified' | 'customer';
  created_at: string;
  updated_at: string;
  activities?: Activity[];
  deals?: Deal[];
}

export interface Deal {
  id: string;
  name: string;
  organization_id: string | null;
  organization_name?: string | null;
  contact_id: string | null;
  contact_name?: string | null;
  stage: 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value: number;
  close_date: string | null;
  created_at: string;
  updated_at: string;
  activities?: Activity[];
}

export interface Activity {
  id: string;
  type: 'note' | 'call' | 'email';
  contact_id: string | null;
  contact_name?: string | null;
  deal_id: string | null;
  deal_name?: string | null;
  description: string;
  date: string;
  due_date: string | null;
  done: number;
  created_at: string;
}

export interface DashboardData {
  wonByMonth: { month: string; count: number; revenue: number }[];
  recentActivity: Activity[];
  tasks: Activity[];
  summary: {
    totalDeals: number;
    wonDeals: number;
    totalRevenue: number;
    activeDeals: number;
  };
}

export type Stage = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export const STAGES: Stage[] = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

export const STAGE_LABELS: Record<Stage, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export const STAGE_COLORS: Record<Stage, string> = {
  new: '#6b7280',
  qualified: '#209dd7',
  proposal: '#753991',
  negotiation: '#ecad0a',
  won: '#16a34a',
  lost: '#dc2626',
};
