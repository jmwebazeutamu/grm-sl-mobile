import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export interface TimelineEntry {
  kind: string;
  occurred_at: string;
  actor: { id: number; name: string } | null;
  data: Record<string, unknown>;
}

type EventType = 'submitted' | 'status' | 'assignment' | 'update' | 'resolution' | 'reopened';
type IoniconName = keyof typeof Ionicons.glyphMap;

interface TypeConfig {
  color: string;
  soft: string;
  border: string;
  icon: IoniconName;
  label: string;
}

// Spec palette. Inline — these colours don't exist in the tailwind theme
// and the timeline renders identically regardless of route/theme context.
const TYPES: Record<EventType, TypeConfig> = {
  submitted:  { color: '#2668c4', soft: '#e6eefb', border: '#c9dbf5', icon: 'add-circle',           label: 'Submitted'  },
  status:     { color: '#d4a43a', soft: '#fdf4db', border: '#f0dfa6', icon: 'swap-horizontal',      label: 'Status'     },
  assignment: { color: '#6b4aa0', soft: '#efeaf7', border: '#d7ccec', icon: 'person',               label: 'Assignment' },
  update:     { color: '#5a6b82', soft: '#f1f4f8', border: '#dde2ea', icon: 'chatbubble-ellipses',  label: 'Update'     },
  resolution: { color: '#1f8d5a', soft: '#e3f3ec', border: '#bfe1cf', icon: 'checkmark-done-circle', label: 'Resolution' },
  reopened:   { color: '#b63a4b', soft: '#fbe7ea', border: '#f2ccd3', icon: 'refresh-circle',       label: 'Reopened'   },
};

// Neutral + body colours.
const RAIL = '#eef1f5';
const CARD_SURFACE = '#ffffff';
const CARD_BORDER = '#e4e8ee';
const MUTED = '#7b8aa0';
const MUTED_LIGHT = '#93a0b5';
const TEXT = '#0d2a4d';
const CANVAS_BG = '#f5f6f8';

export function Timeline({ events }: { events: TimelineEntry[] }) {
  if (events.length === 0) {
    return (
      <View style={styles.canvas}>
        <Text style={styles.empty}>No timeline entries yet.</Text>
      </View>
    );
  }

  const mapped = events.map((e) => ({ entry: e, type: classify(e) }));

  return (
    <View style={styles.canvas}>
      {mapped.map(({ entry, type }, i) => (
        <EventRow
          key={`${entry.kind}-${entry.occurred_at}-${i}`}
          entry={entry}
          type={type}
          isFirst={i === 0}
          isLast={i === mapped.length - 1}
        />
      ))}
    </View>
  );
}

// ─── Row ────────────────────────────────────────────────────────────────────

function EventRow({
  entry,
  type,
  isFirst,
  isLast,
}: {
  entry: TimelineEntry;
  type: EventType;
  isFirst: boolean;
  isLast: boolean;
}) {
  const cfg = TYPES[type];
  return (
    <View style={styles.row}>
      {/* Rail + node column. Each segment of the rail is flush with the
          next row, so the line reads as one continuous stroke from the
          first node centre to the last. */}
      <View style={styles.railCol}>
        <View
          style={[
            styles.railSegment,
            { height: 14, backgroundColor: isFirst ? 'transparent' : RAIL },
          ]}
        />
        <View
          style={[
            styles.node,
            { borderColor: cfg.color, backgroundColor: cfg.soft },
          ]}
        >
          <Ionicons name={cfg.icon} size={10} color={cfg.color} />
        </View>
        <View
          style={[
            styles.railSegment,
            { flex: 1, backgroundColor: isLast ? 'transparent' : RAIL },
          ]}
        />
      </View>

      {/* Card */}
      <View style={[styles.card, { borderLeftColor: cfg.color }]}>
        <View style={styles.cardHead}>
          <Text style={[styles.typeChip, { color: cfg.color }]} numberOfLines={1}>
            {cfg.label.toUpperCase()}
          </Text>
          <Text style={styles.timestamp}>{formatTs(entry.occurred_at)}</Text>
        </View>

        <ActorRow actor={entry.actor} />

        <Body entry={entry} type={type} cfg={cfg} />
      </View>
    </View>
  );
}

function ActorRow({ actor }: { actor: TimelineEntry['actor'] }) {
  if (!actor) return null;
  const initials = initialsOf(actor.name);
  return (
    <View style={styles.actorRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <Text style={styles.actorName} numberOfLines={1}>
        {actor.name}
      </Text>
    </View>
  );
}

// ─── Body renderers ─────────────────────────────────────────────────────────

function Body({
  entry,
  type,
  cfg,
}: {
  entry: TimelineEntry;
  type: EventType;
  cfg: TypeConfig;
}) {
  switch (type) {
    case 'submitted':
      return <SubmittedBody data={entry.data} />;
    case 'status':
      return <StatusBody data={entry.data} />;
    case 'assignment':
      return <AssignmentBody data={entry.data} />;
    case 'resolution':
      return <ResolutionBody data={entry.data} cfg={cfg} />;
    case 'reopened':
      return <ReopenedBody data={entry.data} cfg={cfg} />;
    case 'update':
    default:
      return <UpdateBody data={entry.data} />;
  }
}

function SubmittedBody({ data }: { data: Record<string, unknown> }) {
  const channel = typeof data.channel === 'string' ? data.channel : null;
  const ref = typeof data.ref === 'string' ? data.ref : null;
  const location = typeof data.location === 'string' ? data.location : null;
  return (
    <View style={styles.bodyBlock}>
      {channel ? (
        <Text style={styles.bodyText}>
          <Text style={{ color: MUTED }}>via </Text>
          <Text style={{ fontWeight: '700', color: TEXT }}>{channel}</Text>
        </Text>
      ) : null}
      {ref || location ? (
        <Text style={[styles.bodyText, { color: MUTED, marginTop: 2 }]}>
          {[ref, location].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}

function StatusBody({ data }: { data: Record<string, unknown> }) {
  const from = typeof data.from === 'string' ? String(data.from) : null;
  const toLabel =
    (typeof data.to_label === 'string' && data.to_label) ||
    (typeof data.to === 'string' && data.to) ||
    'updated';
  const note = typeof data.note === 'string' ? data.note : null;
  return (
    <View style={styles.bodyBlock}>
      <View style={styles.pillRow}>
        {from ? <StatusPill label={stateLabel(from)} /> : null}
        {from ? (
          <Ionicons name="chevron-forward" size={14} color={MUTED} style={{ marginHorizontal: 4 }} />
        ) : null}
        <StatusPill label={toLabel} />
      </View>
      {note ? <Text style={[styles.bodyText, { marginTop: 8 }]}>{note}</Text> : null}
    </View>
  );
}

function AssignmentBody({ data }: { data: Record<string, unknown> }) {
  const to = typeof data.assigned_to === 'string' ? data.assigned_to : null;
  const body = typeof data.body === 'string' ? data.body : null;
  return (
    <View>
      <View style={styles.assignPanel}>
        <View style={styles.assignAvatar}>
          <Text style={styles.assignAvatarText}>{initialsOf(to ?? '?')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.assignName}>{to ?? 'Unassigned'}</Text>
          <Text style={styles.assignRole}>assigned to work the case</Text>
        </View>
      </View>
      {body ? <Text style={[styles.bodyText, { marginTop: 8 }]}>{body}</Text> : null}
    </View>
  );
}

function UpdateBody({ data }: { data: Record<string, unknown> }) {
  const body = typeof data.body === 'string' ? data.body : null;
  const comment = typeof data.comment === 'string' ? data.comment : null;
  const ratingLabel = typeof data.rating_label === 'string' ? data.rating_label : null;
  const text = body ?? comment;
  return (
    <View style={styles.bodyBlock}>
      {ratingLabel ? (
        <Text style={[styles.bodyText, { color: MUTED, marginBottom: 4 }]}>
          Complainant feedback — {ratingLabel}
        </Text>
      ) : null}
      {text ? <Text style={styles.bodyText}>{text}</Text> : null}
    </View>
  );
}

function ResolutionBody({ data, cfg }: { data: Record<string, unknown>; cfg: TypeConfig }) {
  const body = typeof data.body === 'string' ? data.body : null;
  const note = typeof data.note === 'string' ? data.note : null;
  const outcome = typeof data.outcome === 'string' ? data.outcome : null;
  const label = outcome === 'satisfied' ? 'RESOLVED — COMPLAINANT SATISFIED' : 'RESOLVED';
  return (
    <View
      style={[styles.banner, { backgroundColor: cfg.soft, borderColor: cfg.border }]}
    >
      <Text style={[styles.bannerLabel, { color: cfg.color }]}>{label}</Text>
      {(body || note) ? (
        <Text style={[styles.bannerText, { marginTop: 4 }]}>{body ?? note}</Text>
      ) : null}
    </View>
  );
}

function ReopenedBody({ data, cfg }: { data: Record<string, unknown>; cfg: TypeConfig }) {
  const body = typeof data.body === 'string' ? data.body : null;
  const note = typeof data.note === 'string' ? data.note : null;
  const toLabel = typeof data.to_label === 'string' ? data.to_label : null;
  const heading = toLabel && toLabel.toLowerCase().includes('reopen') ? toLabel : 'REOPENED';
  return (
    <View
      style={[styles.banner, { backgroundColor: cfg.soft, borderColor: cfg.border }]}
    >
      <Text style={[styles.bannerLabel, { color: cfg.color }]}>
        {heading.toUpperCase()}
      </Text>
      {(body || note) ? (
        <Text style={[styles.bannerText, { marginTop: 4 }]}>{body ?? note}</Text>
      ) : null}
    </View>
  );
}

// ─── StatusPill ─────────────────────────────────────────────────────────────

function StatusPill({ label }: { label: string }) {
  const tone = pillTone(label);
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: tone.bg, borderColor: tone.border },
      ]}
    >
      <Text style={[styles.pillText, { color: tone.fg }]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function pillTone(label: string): { fg: string; bg: string; border: string } {
  const l = label.toLowerCase();
  if (l.includes('submit') || l.includes('review')) {
    return { fg: '#2668c4', bg: '#e6eefb', border: '#c9dbf5' };
  }
  if (l.includes('classif')) {
    return { fg: '#6b4aa0', bg: '#efeaf7', border: '#d7ccec' };
  }
  if (l.includes('invest') || l.includes('progress') || l.includes('assign')) {
    return { fg: '#a87d20', bg: '#fdf4db', border: '#f0dfa6' };
  }
  if (l.includes('resolv') || l.includes('closed')) {
    return { fg: '#1f8d5a', bg: '#e3f3ec', border: '#bfe1cf' };
  }
  if (l.includes('reopen') || l.includes('escalat') || l.includes('reject')) {
    return { fg: '#b63a4b', bg: '#fbe7ea', border: '#f2ccd3' };
  }
  return { fg: '#5a6b82', bg: '#eef1f5', border: '#dde2ea' };
}

// ─── Classification ─────────────────────────────────────────────────────────

function classify(entry: TimelineEntry): EventType {
  if (entry.kind === 'submitted') return 'submitted';

  if (entry.kind === 'state') {
    const to = String(entry.data.to ?? '');
    const outcome = entry.data.outcome;
    const toLabel = String(entry.data.to_label ?? '').toLowerCase();
    if (outcome === 'dissatisfied' || toLabel.includes('reopen')) return 'reopened';
    if (outcome === 'satisfied' || to === 'closed' || to === 'resolved') return 'resolution';
    return 'status';
  }

  if (entry.kind === 'action') {
    const actionType = String(entry.data.type ?? '');
    if (actionType === 'resolve') return 'resolution';
    if (actionType === 'escalate') return 'reopened';
    // An action whose `assigned_to` flipped is effectively an assignment
    // note — render it as the assignment body so the assignee is the
    // visual focus, not the free-text comment.
    if (actionType === 'contact' && entry.data.assigned_to) return 'assignment';
    return 'update';
  }

  return 'update'; // feedback + unknown kinds
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} · ${hh}:${mm}`;
}

function stateLabel(raw: string): string {
  return raw.replace(/_/g, ' ');
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: CANVAS_BG,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  empty: {
    color: MUTED,
    fontSize: 13,
    paddingVertical: 8,
    textAlign: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  railCol: {
    width: 30,
    alignItems: 'center',
  },
  railSegment: {
    width: 2,
  },
  node: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    flex: 1,
    marginLeft: 8,
    marginTop: 6,
    marginBottom: 6,
    backgroundColor: CARD_SURFACE,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderLeftWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },

  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeChip: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  timestamp: {
    fontSize: 11.5,
    fontWeight: '500',
    color: MUTED_LIGHT,
    marginLeft: 8,
  },

  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#eef3fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT,
  },
  actorName: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
  },

  bodyBlock: {
    marginTop: 8,
  },
  bodyText: {
    fontSize: 14,
    color: TEXT,
    lineHeight: 21,
  },

  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  assignPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#efeaf7',
    borderWidth: 1,
    borderColor: '#d7ccec',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  assignAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  assignAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b4aa0',
  },
  assignName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: TEXT,
  },
  assignRole: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },

  banner: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  bannerLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bannerText: {
    fontSize: 13.5,
    color: TEXT,
    lineHeight: 20,
  },
});
