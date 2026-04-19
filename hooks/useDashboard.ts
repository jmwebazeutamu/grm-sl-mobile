import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DashboardPayload {
  active_cases: number;
  sla_breached: number;
  sla_approaching: number;
  sla_within: number;
  resolved_this_month: number;
  closed: number;
  resolution_rate: number | null;
  my_assigned: number;
  by_state: Record<string, number>;
  submissions: { days: number; series: { date: string; count: number }[] };
  recent_activity: {
    id: number;
    g_number: string;
    summary: string;
    state: string;
    state_label: string;
    updated_at: string | null;
  }[];
}

export function useDashboard() {
  return useQuery<DashboardPayload>({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardPayload>('/dashboard')).data,
    staleTime: 60_000,
  });
}
