import { colors } from './colors';

export const STATE_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  accepted: 'Accepted',
  categorized: 'Categorized',
  assigned: 'Assigned',
  org_classified: 'Org classified',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
  trashed: 'Trashed',
  escalated: 'Escalated',
  under_admin_review: 'Under admin review',
  reopened: 'Reopened',
};

export function stateColor(state: string): string {
  switch (state) {
    case 'submitted':
    case 'under_review':
    case 'accepted':
    case 'categorized':
    case 'assigned':
    case 'org_classified':
      return colors.stateSubmitted;
    case 'in_progress':
    case 'reopened':
    case 'under_admin_review':
      return colors.stateProgress;
    case 'escalated':
      return colors.stateEscalated;
    case 'resolved':
      return colors.stateResolved;
    case 'closed':
      return colors.stateClosed;
    case 'rejected':
    case 'trashed':
      return colors.stateRejected;
    default:
      return colors.muted;
  }
}

export function slaColor(status: string | null | undefined): string {
  switch (status) {
    case 'green': return colors.slaGreen;
    case 'amber': return colors.slaAmber;
    case 'red':   return colors.slaRed;
    default:      return colors.slaGrey;
  }
}
