import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface GrievanceListItem {
  id: number;
  g_number: string;
  summary: string;
  state: string;
  state_label: string;
  grievance_type: string | null;
  organisation: string | null;
  programme: string | null;
  org_classification: string | null;
  district: string | null;
  received_at: string | null;
  days_open: number | null;
  sla_status: string | null;
}

interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export function useGrievances(filters: { search?: string; state?: string } = {}) {
  return useInfiniteQuery({
    queryKey: ['grievances', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get<Paginated<GrievanceListItem>>('/grievances', {
        params: { ...filters, page: pageParam },
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.current_page < last.last_page ? last.current_page + 1 : undefined),
  });
}

export interface GrievanceDetail {
  id: number;
  g_number: string;
  summary: string;
  description: string | null;
  state: string;
  state_label: string;
  is_anonymous: boolean;
  grievance_type: { id: number; name: string } | null;
  organisation: { id: number; name: string; acronym: string | null } | null;
  programme: { id: number; name: string } | null;
  org_classification: { id: number; label: string } | null;
  location: Record<string, string | null>;
  complainer: Record<string, string | null> | null;
  suspects: Array<{ id: number; first_name: string; last_name: string; title: string | null; is_beneficiary: boolean }>;
  attachments: Array<{ id: number; original_name: string; mime_type: string; size_bytes: number; uploaded_by: string | null; created_at: string | null }>;
  assigned_officer: { id: number; name: string } | null;
  received_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  days_open: number | null;
  sla_status: string | null;
  sla_days: number;
  capabilities: Record<string, boolean>;
  timeline: Array<{
    kind: string;
    occurred_at: string;
    actor: { id: number; name: string } | null;
    data: Record<string, unknown>;
  }>;
}

export function useGrievanceDetail(id: number | null) {
  return useQuery<GrievanceDetail>({
    queryKey: ['grievance', id],
    queryFn: async () => (await api.get<GrievanceDetail>(`/grievances/${id}`)).data,
    enabled: id !== null,
    staleTime: 30_000,
  });
}
