import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SubmitPayload {
  summary: string;
  description?: string;
  grievance_type_id: number;
  how_reported_id?: number | null;
  is_anonymous?: boolean;
  implementing_organization_id?: number | null;
  programme_id?: number | null;
  region_id?: number | null;
  district_id?: number | null;
  chiefdom_id?: number | null;
  section_id?: number | null;
  locality_id?: number | null;
  complainer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    address?: string;
  };
  suspects?: Array<{
    first_name?: string;
    last_name?: string;
    title?: string;
    phone_number?: string;
  }>;
  // Dummy; backend accepts the word "dev" when no reCAPTCHA is wired.
  recaptcha_token?: string;
}

export interface SubmitResult {
  grm_number: string;
  state: string;
  state_label: string;
  received_at: string;
}

export function useSubmitGrievance() {
  return useMutation({
    mutationFn: async (payload: SubmitPayload) => {
      const res = await api.post<SubmitResult>('/grievances', { ...payload, recaptcha_token: 'dev' });
      return res.data;
    },
  });
}
