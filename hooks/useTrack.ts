import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TrackPayload {
  grm_number: string;
  summary: string;
  state: string;
  state_value: string;
  submitted_at: string | null;
  last_updated: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  assigned_org: string | null;
  timeline: { state: string; state_value: string; date: string | null }[];
}

export function useTrack(ref: string | null) {
  return useQuery<TrackPayload>({
    queryKey: ['track', ref],
    queryFn: async () => (await api.get<TrackPayload>(`/grievances/${encodeURIComponent(ref!)}/track`)).data,
    enabled: !!ref,
    retry: false,
  });
}
