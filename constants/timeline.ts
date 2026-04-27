// Timeline noise filter.
//
// The backend emits a row for every state transition the workflow takes,
// including mechanical hops that no human ever decided on (e.g. submitted →
// under_review the moment a reviewer opens the case). Surrounding entries
// (the initial submission row, the categorization note, the assignment
// panel, the officer's action) already convey the meaningful change, so
// these mechanical hops are pure noise.
//
// Applied client-side rather than backend-side because the staff web app
// still wants the full event log for audit purposes — only the mobile
// timeline view collapses it.

import type { TimelineEntry } from '@/components/Timeline';

// Pure mechanical transitions: the surrounding entries already cover the
// information so this state-change row adds nothing.
const HIDDEN_TRANSITIONS = new Set<string>([
    'submitted→under_review',
    'under_review→accepted',
    'accepted→categorized',
    'categorized→assigned',
    'assigned→org_classified',
    'org_classified→in_progress',
]);

// Destination states that always represent a meaningful decision — never
// hide these regardless of the from-state.
const ALWAYS_SHOW_DESTINATION = new Set<string>([
    'rejected',
    'resolved',
    'closed',
    'escalated',
    'reopened',
    'under_admin_review',
]);

const stringField = (data: Record<string, unknown>, key: string): string =>
    typeof data[key] === 'string' ? (data[key] as string) : '';

export function shouldShowTimelineEntry(entry: TimelineEntry): boolean {
    // Initial submission, officer actions (Investigation, Contact, Update,
    // Resolution), assignments, and feedback always carry their own content.
    if (entry.kind !== 'state') return true;

    const from = stringField(entry.data, 'from');
    const to = stringField(entry.data, 'to');

    // Meaningful endpoint — show even when there's no note attached.
    if (ALWAYS_SHOW_DESTINATION.has(to)) return true;

    // Pure mechanical hop with no annotation — the surrounding entries
    // already cover the change.
    if (HIDDEN_TRANSITIONS.has(`${from}→${to}`)) {
        const note = stringField(entry.data, 'note').trim();
        // Operators sometimes attach a note to a mechanical transition (e.g.
        // a categorization comment that lands on the categorize row). When
        // that happens the row earns its keep.
        return note.length > 0;
    }

    // Any other state change — keep, but only if it has content. A pure
    // state hop with no note is noise.
    return stringField(entry.data, 'note').trim().length > 0;
}
