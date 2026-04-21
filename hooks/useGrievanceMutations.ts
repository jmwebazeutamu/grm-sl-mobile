import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * All mutations that change a grievance's state or post to its timeline.
 * Each invalidates the detail + list queries so the UI reflects the change
 * on the next render without a manual refetch.
 */

function useInvalidate(id: number | null) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['grievance', id] });
    qc.invalidateQueries({ queryKey: ['grievances'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export interface PostActionBody {
  type: 'investigate' | 'contact' | 'update' | 'resolve' | 'escalate';
  body: string;
  assigned_to_id?: number | null;
}

export function usePostAction(id: number | null) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: async (payload: PostActionBody) => {
      const res = await api.post(`/grievances/${id}/actions`, payload);
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useReview(id: number | null) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: async (payload: { decision: 'accept' | 'reject'; comment?: string }) => {
      const res = await api.post(`/grievances/${id}/review`, payload);
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useBeginClosure(id: number | null) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: async () => (await api.post(`/grievances/${id}/closure/begin`)).data,
    onSuccess: invalidate,
  });
}

export function useCloseGrievance(id: number | null) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: async (comment: string) =>
      (await api.post(`/grievances/${id}/closure/close`, { comment })).data,
    onSuccess: invalidate,
  });
}

export function useEscalateGrievance(id: number | null) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: async (comment: string) =>
      (await api.post(`/grievances/${id}/closure/escalate`, { comment })).data,
    onSuccess: invalidate,
  });
}

export function useAssignOfficer(id: number | null) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: async (officerId: number) =>
      (await api.post(`/grievances/${id}/assign`, { officer_id: officerId })).data,
    onSuccess: invalidate,
  });
}

export interface CategorizePayload {
  category: 'corruption' | 'administrative';
  classified_organization_id: number;
}

export function useCategorize(id: number | null) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: async (payload: CategorizePayload) =>
      (await api.post(`/grievances/${id}/categorize`, payload)).data,
    onSuccess: invalidate,
  });
}

export function useClassify(id: number | null) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: async (orgClassificationId: number) =>
      (await api.post(`/grievances/${id}/classify`, { org_classification_id: orgClassificationId })).data,
    onSuccess: invalidate,
  });
}
