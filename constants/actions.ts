export const ACTION_TYPES = [
  { value: 'investigate', label: 'Investigation', icon: 'search', hint: 'Notes from digging into the case.' },
  { value: 'contact', label: 'Contact', icon: 'call', hint: 'You called or met the complainant / other party.' },
  { value: 'update', label: 'Update', icon: 'chatbubble-ellipses', hint: 'Progress note, no state change.' },
  { value: 'resolve', label: 'Resolve', icon: 'checkmark-circle', hint: 'The case is resolved — this will mark it Resolved.' },
  { value: 'escalate', label: 'Escalate', icon: 'arrow-up-circle', hint: 'Hand off to a higher authority.' },
] as const;

export type ActionTypeValue = (typeof ACTION_TYPES)[number]['value'];
