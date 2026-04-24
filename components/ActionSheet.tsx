import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlideToConfirm } from '@/components/SlideToConfirm';
import {
  useBeginClosure,
  useCloseGrievance,
  useEscalateGrievance,
  usePostAction,
  useReview,
} from '@/hooks/useGrievanceMutations';

// Spec palette. Inline — these tokens are only used by the sheet and
// its inner forms.
const NAVY = '#0a2342';
const TEXT = '#0d2a4d';
const MUTED = '#6b7f97';
const DIVIDER = '#e4e8ee';
const HOVER = '#f5f6f8';
const GREEN = '#1f8d5a';
const GREEN_SOFT = '#e3f3ec';
const GREEN_BORDER = '#bfe1cf';
const AMBER = '#d4a43a';
const AMBER_SOFT = '#fdf4db';
const AMBER_BORDER = '#f0dfa6';
const DANGER = '#b63a4b';
const DANGER_SOFT = '#fbe7ea';
const DANGER_BORDER = '#f2ccd3';
const SLATE = '#5a6b82';
const SLATE_SOFT = '#f1f4f8';
const PURPLE = '#6b4aa0';
const PURPLE_SOFT = '#efeaf7';
const PURPLE_BORDER = '#d7ccec';
const BACKDROP = 'rgba(10,35,66,0.55)';

// Closure comment length guard matches the web admin's ClosureAction
// validation (min 10 chars).
const CLOSURE_MIN_CHARS = 10;

// ─── Types ──────────────────────────────────────────────────────────────────

type SheetState =
  | 'menu'
  | 'review'
  | 'update'
  | 'resolve'
  | 'closure'
  | 'begin_closure'
  | 'resolved';

type ActionTypeValue = 'investigate' | 'contact' | 'update' | 'resolve' | 'escalate';

const ACTION_TYPES: Array<{
  value: ActionTypeValue;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: 'update', label: 'Update', icon: 'chatbubble-ellipses-outline', hint: 'General progress note.' },
  { value: 'investigate', label: 'Investigate', icon: 'search-outline', hint: 'Site visit, evidence, interview.' },
  { value: 'contact', label: 'Contact', icon: 'call-outline', hint: 'Reached out to someone.' },
  { value: 'escalate', label: 'Escalate', icon: 'alert-circle-outline', hint: 'Hand up to a supervisor.' },
];

interface Capabilities {
  can_review?: boolean;
  can_edit?: boolean;
  can_closure_action?: boolean;
  [k: string]: unknown;
}

interface LauncherProps {
  grievanceId: number;
  state: string;
  capabilities: Capabilities;
}

// ─── Launcher ───────────────────────────────────────────────────────────────

export function ActionLauncher({ grievanceId, state, capabilities }: LauncherProps) {
  const [sheetState, setSheetState] = useState<SheetState | null>(null);
  const insets = useSafeAreaInsets();

  const tiles = useMemo(() => availableTiles(state, capabilities), [state, capabilities]);

  // Read-only states — no actions available.
  if (state === 'closed') return <CaseBanner tone="closed" text="Case closed" />;
  if (state === 'rejected') return <CaseBanner tone="rejected" text="Grievance rejected" />;

  // Nothing the user can do — don't paint the launcher at all. Keeps
  // the bottom of the screen clean for roles without capability.
  if (tiles.length === 0) return null;

  return (
    <>
      <View
        style={[
          styles.launcherBar,
          { paddingBottom: 12 + insets.bottom },
        ]}
      >
        <TouchableHighlight
          onPress={() => setSheetState(tiles.length === 1 ? tiles[0].state : 'menu')}
          underlayColor="#1a3152"
          style={styles.launcherBtn}
          accessibilityRole="button"
          accessibilityLabel="Take action"
        >
          <View style={styles.launcherInner}>
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.launcherLabel}>Take action</Text>
          </View>
        </TouchableHighlight>
      </View>

      <ActionSheet
        grievanceId={grievanceId}
        state={state}
        tiles={tiles}
        sheetState={sheetState}
        onChangeState={setSheetState}
        onDismiss={() => setSheetState(null)}
      />
    </>
  );
}

function CaseBanner({ tone, text }: { tone: 'closed' | 'rejected'; text: string }) {
  const insets = useSafeAreaInsets();
  const palette =
    tone === 'closed'
      ? { bg: GREEN_SOFT, fg: GREEN, border: GREEN_BORDER, icon: 'checkmark-done-circle' as const }
      : { bg: DANGER_SOFT, fg: DANGER, border: DANGER_BORDER, icon: 'close-circle' as const };
  return (
    <View
      style={[
        styles.bannerBar,
        { paddingBottom: 12 + insets.bottom, backgroundColor: palette.bg, borderTopColor: palette.border },
      ]}
    >
      <View style={styles.bannerInner}>
        <Ionicons name={palette.icon} size={20} color={palette.fg} />
        <Text style={[styles.bannerLabel, { color: palette.fg }]}>{text}</Text>
      </View>
    </View>
  );
}

// ─── Tile catalogue ─────────────────────────────────────────────────────────

interface Tile {
  state: SheetState;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  tintSoft: string;
}

const TILE_DEFS: Record<string, Tile> = {
  review: {
    state: 'review',
    label: 'Review',
    sub: 'Accept or reject this case',
    icon: 'document-text-outline',
    tint: SLATE,
    tintSoft: SLATE_SOFT,
  },
  update: {
    state: 'update',
    label: 'Add update',
    sub: 'Log a note for reviewers',
    icon: 'chatbubble-ellipses-outline',
    tint: SLATE,
    tintSoft: SLATE_SOFT,
  },
  resolve: {
    state: 'resolve',
    label: 'Resolve',
    sub: 'Close this case',
    icon: 'checkmark-done-circle-outline',
    tint: GREEN,
    tintSoft: GREEN_SOFT,
  },
  begin_closure: {
    state: 'begin_closure',
    label: 'Send for review',
    sub: 'Supervisor reviews before close',
    icon: 'clipboard-outline',
    tint: AMBER,
    tintSoft: AMBER_SOFT,
  },
  closure: {
    state: 'closure',
    label: 'Closure review',
    sub: 'Record satisfaction & close',
    icon: 'ribbon-outline',
    tint: PURPLE,
    tintSoft: PURPLE_SOFT,
  },
};

function availableTiles(state: string, caps: Capabilities): Tile[] {
  const tiles: Tile[] = [];
  const canReview = Boolean(caps.can_review) && (state === 'submitted' || state === 'under_review');
  const canEdit = Boolean(caps.can_edit);
  const canClosure = Boolean(caps.can_closure_action);

  if (canReview) tiles.push(TILE_DEFS.review);

  if (
    canEdit &&
    (state === 'in_progress' || state === 'reopened' || state === 'org_classified' || state === 'assigned')
  ) {
    tiles.push(TILE_DEFS.update);
  }

  if (canEdit && state === 'in_progress') tiles.push(TILE_DEFS.resolve);

  if (canClosure && state === 'resolved') tiles.push(TILE_DEFS.begin_closure);
  if (canClosure && state === 'under_admin_review') tiles.push(TILE_DEFS.closure);

  return tiles;
}

// ─── ActionSheet (shell) ────────────────────────────────────────────────────

function ActionSheet({
  grievanceId,
  state,
  tiles,
  sheetState,
  onChangeState,
  onDismiss,
}: {
  grievanceId: number;
  state: string;
  tiles: Tile[];
  sheetState: SheetState | null;
  onChangeState: (s: SheetState | null) => void;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const open = sheetState !== null;

  useEffect(() => {
    if (open) setRendered(true);
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!open && finished) setRendered(false);
    });
  }, [anim, open]);

  // Web: Esc closes the sheet.
  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onDismiss]);

  if (!rendered) return null;

  const scrimOpacity = anim;
  const sheetTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Dimensions.get('window').height, 0],
  });

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, { backgroundColor: BACKDROP, opacity: scrimOpacity }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          accessibilityLabel="Close action sheet"
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
      >
        <Animated.View
          onStartShouldSetResponder={() => true}
          accessibilityRole="menu"
          accessibilityLabel="Take action"
          style={[
            styles.sheet,
            { paddingBottom: 16 + insets.bottom, transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <View style={styles.grabberRow}>
            <View style={styles.grabber} />
          </View>

          <SheetBody
            grievanceId={grievanceId}
            state={state}
            tiles={tiles}
            sheetState={sheetState ?? 'menu'}
            onChangeState={onChangeState}
            onDismiss={onDismiss}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── SheetBody — per-state content ──────────────────────────────────────────

function SheetBody(props: {
  grievanceId: number;
  state: string;
  tiles: Tile[];
  sheetState: SheetState;
  onChangeState: (s: SheetState) => void;
  onDismiss: () => void;
}) {
  const { sheetState } = props;
  switch (sheetState) {
    case 'menu':
      return <MenuView {...props} />;
    case 'review':
      return <ReviewView {...props} />;
    case 'update':
      return <UpdateView {...props} />;
    case 'resolve':
      return <ResolveView {...props} />;
    case 'begin_closure':
      return <BeginClosureView {...props} />;
    case 'closure':
      return <ClosureView {...props} />;
    case 'resolved':
      return <ResolvedView onDismiss={props.onDismiss} />;
    default:
      return null;
  }
}

// ─── Reusable primitives ────────────────────────────────────────────────────

function SheetHeader({
  title,
  subtitle,
  onBack,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} style={styles.headerBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      <Pressable onPress={onClose} hitSlop={8} style={styles.headerBtn} accessibilityLabel="Close">
        <Ionicons name="close" size={22} color={TEXT} />
      </Pressable>
    </View>
  );
}

// ─── Menu ───────────────────────────────────────────────────────────────────

function MenuView({
  tiles,
  onChangeState,
  onDismiss,
}: {
  tiles: Tile[];
  onChangeState: (s: SheetState) => void;
  onDismiss: () => void;
}) {
  return (
    <View>
      <SheetHeader title="Take action" subtitle="Choose what to do next" onClose={onDismiss} />
      <View style={styles.tileGrid}>
        {tiles.map((tile) => (
          <TouchableHighlight
            key={tile.state}
            onPress={() => onChangeState(tile.state)}
            underlayColor={HOVER}
            style={styles.tile}
            accessibilityRole="button"
            accessibilityLabel={tile.label}
          >
            <View>
              <View style={[styles.tileIcon, { backgroundColor: tile.tintSoft }]}>
                <Ionicons name={tile.icon} size={22} color={tile.tint} />
              </View>
              <Text style={styles.tileLabel}>{tile.label}</Text>
              <Text style={styles.tileSub} numberOfLines={2}>
                {tile.sub}
              </Text>
            </View>
          </TouchableHighlight>
        ))}
      </View>
    </View>
  );
}

// ─── Review ─────────────────────────────────────────────────────────────────

function ReviewView({
  grievanceId,
  tiles,
  onChangeState,
  onDismiss,
}: {
  grievanceId: number;
  tiles: Tile[];
  onChangeState: (s: SheetState) => void;
  onDismiss: () => void;
}) {
  const review = useReview(grievanceId);
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const back = tiles.length > 1 ? () => onChangeState('menu') : undefined;

  function onSubmit() {
    if (!decision) return;
    const body = comment.trim() || undefined;
    review.mutate(
      { decision, comment: body },
      {
        onSuccess: onDismiss,
        onError: (err: any) =>
          Alert.alert('Review failed', err?.response?.data?.message ?? 'Please try again.'),
      },
    );
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <SheetHeader title="Review grievance" subtitle="Accept or reject" onBack={back} onClose={onDismiss} />

      <View style={styles.pad}>
        <Text style={styles.fieldLabel}>Decision</Text>
        <View style={styles.decisionRow}>
          <PickCard
            selected={decision === 'accept'}
            tint={GREEN}
            tintSoft={GREEN_SOFT}
            tintBorder={GREEN_BORDER}
            icon="checkmark-circle"
            label="Accept"
            sub="Proceed to categorisation."
            onPress={() => setDecision('accept')}
          />
          <PickCard
            selected={decision === 'reject'}
            tint={DANGER}
            tintSoft={DANGER_SOFT}
            tintBorder={DANGER_BORDER}
            icon="close-circle"
            label="Reject"
            sub="Terminal — cannot be reopened."
            onPress={() => setDecision('reject')}
          />
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
          {decision === 'reject' ? 'Reason (visible to complainant)' : 'Note (optional)'}
        </Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={500}
          placeholder={decision === 'reject' ? 'Why was this rejected?' : 'Add a note for the timeline'}
          placeholderTextColor={MUTED}
          style={styles.textarea}
        />
      </View>

      <View style={styles.footerRow}>
        <TextButton label="Cancel" onPress={onDismiss} />
        <AccentButton
          label={decision === 'reject' ? 'Reject' : 'Accept'}
          tone={decision === 'reject' ? 'danger' : 'green'}
          disabled={!decision || review.isPending}
          pending={review.isPending}
          onPress={onSubmit}
        />
      </View>
    </ScrollView>
  );
}

// ─── Update ─────────────────────────────────────────────────────────────────

function UpdateView({
  grievanceId,
  tiles,
  onChangeState,
  onDismiss,
}: {
  grievanceId: number;
  tiles: Tile[];
  onChangeState: (s: SheetState) => void;
  onDismiss: () => void;
}) {
  const post = usePostAction(grievanceId);
  const [type, setType] = useState<ActionTypeValue>('update');
  const [body, setBody] = useState('');
  const back = tiles.length > 1 ? () => onChangeState('menu') : undefined;
  const canPost = body.trim().length > 0 && !post.isPending;

  function submit() {
    const b = body.trim();
    if (!b) return;
    post.mutate(
      { type, body: b },
      {
        onSuccess: onDismiss,
        onError: (err: any) =>
          Alert.alert('Could not post', err?.response?.data?.message ?? 'Please try again.'),
      },
    );
  }

  const picked = ACTION_TYPES.find((t) => t.value === type)!;

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <SheetHeader
        title="Add update"
        subtitle="Shared with reviewers · not visible to complainant"
        onBack={back}
        onClose={onDismiss}
      />

      <View style={styles.pad}>
        <Text style={styles.fieldLabel}>Type</Text>
        <View style={styles.typeChipRow}>
          {ACTION_TYPES.map((t) => {
            const selected = t.value === type;
            return (
              <TouchableHighlight
                key={t.value}
                onPress={() => setType(t.value)}
                underlayColor={HOVER}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: selected ? SLATE_SOFT : '#ffffff',
                    borderColor: selected ? SLATE : DIVIDER,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={t.icon} size={14} color={selected ? SLATE : MUTED} />
                  <Text
                    style={[
                      styles.typeChipLabel,
                      { color: selected ? TEXT : MUTED, fontWeight: selected ? '700' : '500' },
                    ]}
                  >
                    {t.label}
                  </Text>
                </View>
              </TouchableHighlight>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Note</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={10000}
          placeholder={picked.hint}
          placeholderTextColor={MUTED}
          autoFocus
          style={[styles.textarea, { minHeight: 140 }]}
        />
      </View>

      <View style={styles.footerRow}>
        <TextButton label="Cancel" onPress={onDismiss} />
        <AccentButton
          label={`Post ${picked.label.toLowerCase()}`}
          tone="amber"
          disabled={!canPost}
          pending={post.isPending}
          onPress={submit}
        />
      </View>
    </ScrollView>
  );
}

// ─── Resolve (slide gate) ───────────────────────────────────────────────────

function ResolveView({
  grievanceId,
  tiles,
  onChangeState,
  onDismiss,
}: {
  grievanceId: number;
  tiles: Tile[];
  onChangeState: (s: SheetState) => void;
  onDismiss: () => void;
}) {
  const post = usePostAction(grievanceId);
  const [summary, setSummary] = useState('');
  const back = tiles.length > 1 ? () => onChangeState('menu') : undefined;
  const trimmed = summary.trim();
  const unlocked = trimmed.length >= CLOSURE_MIN_CHARS;
  const charsShort = Math.max(0, CLOSURE_MIN_CHARS - trimmed.length);

  function onConfirm() {
    post.mutate(
      { type: 'resolve', body: trimmed },
      {
        onSuccess: () => onChangeState('resolved'),
        onError: (err: any) => {
          onChangeState('resolve');
          Alert.alert(
            'Could not resolve',
            err?.response?.data?.message ?? 'Please try again.',
          );
        },
      },
    );
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <SheetHeader
        title="Resolve grievance"
        subtitle="This will close the case and notify the complainant"
        onBack={back}
        onClose={onDismiss}
      />

      <View style={styles.pad}>
        <View style={[styles.warningBanner, { backgroundColor: AMBER_SOFT, borderColor: AMBER_BORDER }]}>
          <Ionicons name="warning" size={14} color={AMBER} style={{ marginRight: 6 }} />
          <Text style={[styles.warningText, { color: TEXT }]}>
            Once resolved, only a supervisor can reopen this case after closure review.
          </Text>
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Resolution summary</Text>
        <TextInput
          value={summary}
          onChangeText={setSummary}
          multiline
          maxLength={2000}
          placeholder="Briefly describe how this was resolved — shared with the complainant."
          placeholderTextColor={MUTED}
          style={[styles.textarea, { minHeight: 100 }]}
        />
        <Text style={styles.counter}>
          {unlocked ? 'Ready to resolve.' : `${charsShort} more character${charsShort === 1 ? '' : 's'} needed`}
        </Text>
      </View>

      <View style={[styles.pad, { paddingTop: 0 }]}>
        {unlocked ? (
          <SlideToConfirm
            label="Slide to mark resolved"
            confirmedLabel="RESOLVED"
            tone="green"
            onConfirm={onConfirm}
            disabled={post.isPending}
          />
        ) : (
          <View style={styles.lockedPill}>
            <Ionicons name="lock-closed" size={14} color={MUTED} />
            <Text style={styles.lockedPillText} numberOfLines={1}>
              Write a summary (10+ characters) to unlock
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ─── Begin closure review (send to supervisor) ──────────────────────────────

function BeginClosureView({
  grievanceId,
  tiles,
  onChangeState,
  onDismiss,
}: {
  grievanceId: number;
  tiles: Tile[];
  onChangeState: (s: SheetState) => void;
  onDismiss: () => void;
}) {
  const begin = useBeginClosure(grievanceId);
  const back = tiles.length > 1 ? () => onChangeState('menu') : undefined;

  function onSubmit() {
    begin.mutate(undefined, {
      onSuccess: onDismiss,
      onError: (err: any) =>
        Alert.alert('Could not send', err?.response?.data?.message ?? 'Please try again.'),
    });
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <SheetHeader
        title="Send for closure approval"
        subtitle="Supervisor reviews before the case can close"
        onBack={back}
        onClose={onDismiss}
      />
      <View style={styles.pad}>
        <Text style={styles.bodyText}>
          The supervisor will review the resolution and either close the case or send it back for more work. You can't edit the case while it's under review.
        </Text>
      </View>
      <View style={styles.footerRow}>
        <TextButton label="Cancel" onPress={onDismiss} />
        <AccentButton
          label="Send for approval"
          tone="amber"
          disabled={begin.isPending}
          pending={begin.isPending}
          onPress={onSubmit}
        />
      </View>
    </ScrollView>
  );
}

// ─── Closure review (satisfied / dissatisfied + slide) ──────────────────────

function ClosureView({
  grievanceId,
  tiles,
  onChangeState,
  onDismiss,
}: {
  grievanceId: number;
  tiles: Tile[];
  onChangeState: (s: SheetState) => void;
  onDismiss: () => void;
}) {
  const close = useCloseGrievance(grievanceId);
  const escalate = useEscalateGrievance(grievanceId);
  const [kind, setKind] = useState<null | 'close' | 'escalate'>(null);
  const [comment, setComment] = useState('');
  const back = tiles.length > 1 ? () => onChangeState('menu') : undefined;
  const pending = close.isPending || escalate.isPending;
  const trimmed = comment.trim();
  const unlocked = kind !== null && trimmed.length >= CLOSURE_MIN_CHARS && !pending;
  const charsShort = Math.max(0, CLOSURE_MIN_CHARS - trimmed.length);

  function onConfirm() {
    if (!kind) return;
    const mut = kind === 'close' ? close : escalate;
    mut.mutate(trimmed, {
      onSuccess: () => onChangeState('resolved'),
      onError: (err: any) =>
        Alert.alert(
          kind === 'close' ? 'Could not close' : 'Could not escalate',
          err?.response?.data?.message ?? 'Please try again.',
        ),
    });
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <SheetHeader
        title="Closure review"
        subtitle="Record the complainant's satisfaction"
        onBack={back}
        onClose={onDismiss}
      />

      <View style={styles.pad}>
        <Text style={styles.fieldLabel}>Was the complainant satisfied?</Text>
        <View style={styles.decisionRow}>
          <PickCard
            selected={kind === 'close'}
            tint={GREEN}
            tintSoft={GREEN_SOFT}
            tintBorder={GREEN_BORDER}
            icon="checkmark-circle"
            label="Satisfied"
            sub="Close — no further action."
            onPress={() => setKind('close')}
          />
          <PickCard
            selected={kind === 'escalate'}
            tint={DANGER}
            tintSoft={DANGER_SOFT}
            tintBorder={DANGER_BORDER}
            icon="alert-circle"
            label="Dissatisfied"
            sub="Escalate and reopen."
            onPress={() => setKind('escalate')}
          />
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Closure notes</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={2000}
          placeholder={
            kind === 'escalate'
              ? 'More investigation needed because…'
              : 'Resolution confirmed. Complainant notified…'
          }
          placeholderTextColor={MUTED}
          style={[styles.textarea, { minHeight: 100 }]}
        />
        <Text style={styles.counter}>
          {kind === null
            ? 'Pick an outcome above.'
            : unlocked
              ? 'Ready to submit.'
              : `${charsShort} more character${charsShort === 1 ? '' : 's'} needed`}
        </Text>
      </View>

      <View style={[styles.pad, { paddingTop: 0 }]}>
        {unlocked ? (
          <SlideToConfirm
            label={kind === 'close' ? 'Slide to close grievance' : 'Slide to escalate and reopen'}
            confirmedLabel={kind === 'close' ? 'CLOSED' : 'ESCALATED'}
            tone={kind === 'close' ? 'green' : 'amber'}
            onConfirm={onConfirm}
            disabled={pending}
          />
        ) : (
          <View style={styles.lockedPill}>
            <Ionicons name="lock-closed" size={14} color={MUTED} />
            <Text style={styles.lockedPillText} numberOfLines={1}>
              Pick an outcome and write 10+ characters
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ─── Resolved (success) ─────────────────────────────────────────────────────

function ResolvedView({ onDismiss }: { onDismiss: () => void }) {
  return (
    <View>
      <View style={[styles.pad, { alignItems: 'center', paddingVertical: 28 }]}>
        <View style={styles.successRing}>
          <Ionicons name="checkmark-done-circle" size={40} color={GREEN} />
        </View>
        <Text style={styles.successTitle}>Case closed</Text>
        <Text style={styles.successBody}>
          The complainant will be notified. This case is now read-only.
        </Text>
      </View>
      <View style={styles.footerRow}>
        <AccentButton label="Back to grievance" tone="navy" onPress={onDismiss} />
      </View>
    </View>
  );
}

// ─── Shared buttons ─────────────────────────────────────────────────────────

function PickCard({
  selected,
  tint,
  tintSoft,
  tintBorder,
  icon,
  label,
  sub,
  onPress,
}: {
  selected: boolean;
  tint: string;
  tintSoft: string;
  tintBorder: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={tintSoft}
      style={styles.pickCardWrap}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.pickCard,
          {
            backgroundColor: selected ? tintSoft : '#ffffff',
            borderColor: selected ? tint : DIVIDER,
            borderWidth: selected ? 2 : 1,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name={icon} size={18} color={selected ? tint : MUTED} />
          <Text
            style={{
              marginLeft: 6,
              fontSize: 14,
              fontWeight: '700',
              color: selected ? tint : TEXT,
            }}
          >
            {label}
          </Text>
        </View>
        <Text style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>{sub}</Text>
      </View>
    </TouchableHighlight>
  );
}

function AccentButton({
  label,
  tone,
  disabled,
  pending,
  onPress,
}: {
  label: string;
  tone: 'green' | 'amber' | 'danger' | 'navy';
  disabled?: boolean;
  pending?: boolean;
  onPress: () => void;
}) {
  const bg =
    tone === 'green' ? GREEN : tone === 'amber' ? AMBER : tone === 'danger' ? DANGER : NAVY;
  const fg = tone === 'amber' ? NAVY : '#ffffff';
  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor="rgba(0,0,0,0.08)"
      style={[styles.accentBtn, { backgroundColor: bg, opacity: disabled ? 0.55 : 1 }]}
      disabled={disabled}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {pending ? <ActivityIndicator color={fg} size="small" style={{ marginRight: 8 }} /> : null}
        <Text style={[styles.accentBtnText, { color: fg }]}>{label}</Text>
      </View>
    </TouchableHighlight>
  );
}

function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableHighlight onPress={onPress} underlayColor={HOVER} style={styles.textBtn}>
      <Text style={styles.textBtnText}>{label}</Text>
    </TouchableHighlight>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  launcherBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
  },
  launcherBtn: {
    backgroundColor: NAVY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launcherInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  launcherLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  bannerBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  grabberRow: {
    paddingTop: 8,
    alignItems: 'center',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c5ccd6',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },

  pad: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bodyText: {
    color: TEXT,
    fontSize: 14,
    lineHeight: 21,
  },
  textarea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: DIVIDER,
    borderRadius: 12,
    padding: 12,
    color: TEXT,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 96,
  },
  counter: {
    color: MUTED,
    fontSize: 12,
    marginTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
  },

  // Tiles
  tileGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: DIVIDER,
    borderRadius: 12,
    padding: 14,
    minHeight: 110,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileLabel: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '700',
  },
  tileSub: {
    color: MUTED,
    fontSize: 11.5,
    marginTop: 2,
  },

  // Decision row (Accept/Reject, Satisfied/Dissatisfied)
  decisionRow: {
    flexDirection: 'row',
  },
  pickCardWrap: {
    flex: 1,
    marginRight: 8,
  },
  pickCard: {
    padding: 12,
    borderRadius: 12,
    minHeight: 72,
  },

  // Update — type chips
  typeChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeChip: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  typeChipLabel: {
    fontSize: 12,
    marginLeft: 4,
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },

  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: DIVIDER,
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: HOVER,
  },
  lockedPillText: {
    color: MUTED,
    fontSize: 13,
    fontStyle: 'italic',
    marginLeft: 6,
  },

  accentBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
  },
  accentBtnText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  textBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: DIVIDER,
    backgroundColor: '#ffffff',
  },
  textBtnText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Success screen
  successRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GREEN_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '700',
  },
  successBody: {
    color: MUTED,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});
