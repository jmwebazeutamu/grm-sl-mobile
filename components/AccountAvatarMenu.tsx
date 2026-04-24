import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  type View as RNView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { performSignOut } from '@/lib/auth';
import { useAuthStore, type AuthUser } from '@/stores/authStore';

const AVATAR_SIZE = 32;

// Spec palette — hard-coded because these tokens don't exist in the
// tailwind theme yet and the design requires an exact match.
const AMBER = '#d4a43a';
const AMBER_SOFT = '#fdf4db';
const DEEP_NAVY = '#0a2342';
const TEXT = '#0d2a4d';
const MUTED = '#7b8aa0';
const MUTED_LIGHTER = '#93a0b5';
const ICON_TILE_BG = '#f1f4f8';
const ICON_TILE_FG = '#5a6b82';
const DIVIDER = '#eef1f5';
const ROW_PRESSED = '#f5f6f8';
const DANGER = '#c43b3b';
const DANGER_SOFT = '#fbe7e7';
const BACKDROP_DIM = 'rgba(10,35,66,0.35)';

// Confirmation bottom-sheet palette (kept from the previous implementation).
const SCRIM_SHEET = 'rgba(6,18,36,0.55)';
const GRABBER = '#c5ccd6';
const DANGER_TINT = 'rgba(239,68,68,0.12)';
const DANGER_BRIGHT = '#ef4444';

interface Props {
  /** Colour theme for the avatar ring. The avatar itself is amber in
   *  both variants so it stays legible over either background. */
  theme?: 'dark' | 'light';
}

export function AccountAvatarMenu({ theme = 'dark' }: Props) {
  const user = useAuthStore((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const avatarRef = useRef<RNView>(null);

  const initials = getInitials(user);
  const photo = (user as AuthUser & { photo_url?: string | null } | null)?.photo_url ?? null;

  const openMenu = useCallback(() => {
    avatarRef.current?.measureInWindow((x, y, width) => {
      const screenW = Dimensions.get('window').width;
      setAnchor({
        // Menu sits a little below the avatar bottom edge.
        top: y + width + 8,
        // Spec's "right: 12px from viewport" — the menu's right edge is
        // anchored 12px from the screen edge regardless of the avatar's
        // exact x coord. Fall back to aligning with the avatar if the
        // avatar is somehow further in than 12px.
        right: Math.min(12, Math.max(8, screenW - (x + width))),
      });
      setMenuOpen(true);
    });
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  function onViewProfile() {
    closeMenu();
    router.push('/(staff)/profile');
  }

  function onNotifications() {
    closeMenu();
    // No dedicated in-app notifications screen exists yet; push
    // notifications land in the Android system tray. Keep the entry
    // point for discoverability and tell the user what to expect.
    setTimeout(() => {
      Alert.alert(
        'Notifications',
        'Case updates are delivered as push notifications. Check your phone\'s notification shade for recent alerts.',
      );
    }, 120);
  }

  function onHelp() {
    closeMenu();
    setTimeout(() => {
      Alert.alert(
        'Help & support',
        'Call the GRM hotline on 8515 (free), or ask your GRM administrator.',
      );
    }, 120);
  }

  function onSignOutTap() {
    closeMenu();
    // Let the menu finish fading out before the sheet slides up so they
    // don't visually collide.
    setTimeout(() => setConfirmOpen(true), 120);
  }

  async function onConfirmSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await performSignOut();
    } finally {
      setSigningOut(false);
      setConfirmOpen(false);
    }
  }

  if (!user) return null;

  return (
    <>
      <Pressable
        ref={avatarRef}
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel="Account menu"
        accessibilityHint="Opens the account menu"
        accessibilityState={{ expanded: menuOpen }}
        hitSlop={8}
        // Static style array — no function-form. Open-state visual tie
        // comes from menuOpen alone; press feedback is the small tap on
        // Pressable's default opacity.
        style={[
          styles.avatar,
          {
            backgroundColor: AMBER,
            borderColor:
              theme === 'light' ? DIVIDER : 'rgba(255,255,255,0.2)',
          },
          menuOpen ? styles.avatarPressed : null,
        ]}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </Pressable>

      <ProfileMenu
        open={menuOpen}
        anchor={anchor}
        user={user}
        onClose={closeMenu}
        onViewProfile={onViewProfile}
        onNotifications={onNotifications}
        onHelp={onHelp}
        onSignOut={onSignOutTap}
      />

      <ConfirmSheet
        open={confirmOpen}
        signingOut={signingOut}
        onCancel={() => !signingOut && setConfirmOpen(false)}
        onConfirm={onConfirmSignOut}
      />
    </>
  );
}

// ─── Profile menu ───────────────────────────────────────────────────────────

function ProfileMenu({
  open,
  anchor,
  user,
  onClose,
  onViewProfile,
  onNotifications,
  onHelp,
  onSignOut,
}: {
  open: boolean;
  anchor: { top: number; right: number } | null;
  user: AuthUser;
  onClose: () => void;
  onViewProfile: () => void;
  onNotifications: () => void;
  onHelp: () => void;
  onSignOut: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (open) setRendered(true);
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 120,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!open && finished) setRendered(false);
    });
  }, [anim, open]);

  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!rendered || !anchor) return null;

  const opacity = anim;
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 0],
  });

  const role = user.roles?.[0] ?? 'user';
  const initials = getInitials(user);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.dim, { opacity }]} pointerEvents="box-none">
        <Pressable
          accessibilityLabel="Close account menu"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        accessibilityRole="menu"
        accessibilityLabel="Account menu"
        onStartShouldSetResponder={() => true}
        style={[
          styles.menu,
          { top: anchor.top, right: anchor.right },
          { opacity, transform: [{ translateY }] },
        ]}
      >
        {/* Identity header */}
        <View style={styles.identityBlock}>
          <View style={styles.identityAvatar}>
            <Text style={styles.identityAvatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.identityName} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.identityEmail} numberOfLines={1}>
              {user.email ?? user.username}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Primary actions */}
        <View style={styles.actionGroup}>
          <ActionRow
            icon="person-outline"
            label="View profile"
            subtitle={role}
            onPress={onViewProfile}
          />
          <ActionRow
            icon="notifications-outline"
            label="Notifications"
            onPress={onNotifications}
          />
          <ActionRow
            icon="help-circle-outline"
            label="Help & support"
            onPress={onHelp}
          />
        </View>

        <View style={styles.divider} />

        {/* Destructive action */}
        <View style={styles.actionGroup}>
          <ActionRow
            icon="log-out-outline"
            label="Sign out"
            danger
            onPress={onSignOut}
            accessibilityLabel="Sign out of your account"
          />
        </View>
      </Animated.View>
    </Modal>
  );
}

function ActionRow({
  icon,
  label,
  subtitle,
  onPress,
  danger,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  accessibilityLabel?: string;
}) {
  // TouchableHighlight + static StyleSheet. Pressable with a function-
  // form style prop (style={({pressed}) => (...)}) silently collapses
  // row layout on some Android builds — same bug that hit the landing
  // page cards and the popover option rows. Static style avoids it.
  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={danger ? DANGER_SOFT : ROW_PRESSED}
      accessibilityRole="menuitem"
      accessibilityLabel={accessibilityLabel ?? label}
      style={styles.actionRowWrap}
    >
      <View style={styles.actionRow}>
        <View
          style={[
            styles.actionIconTile,
            { backgroundColor: danger ? DANGER_SOFT : ICON_TILE_BG },
          ]}
        >
          <Ionicons
            name={icon}
            size={16}
            color={danger ? DANGER : ICON_TILE_FG}
          />
        </View>
        <View style={styles.actionTextCol}>
          <Text
            style={[styles.actionLabel, danger ? { color: DANGER } : null]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {subtitle ? (
            <Text style={styles.actionSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {/* Destructive rows execute — no chevron. */}
        {!danger ? (
          <Ionicons name="chevron-forward" size={14} color={MUTED_LIGHTER} />
        ) : null}
      </View>
    </TouchableHighlight>
  );
}

// ─── Confirmation sheet (unchanged visual treatment) ────────────────────────

function ConfirmSheet({
  open,
  signingOut,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  signingOut: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !signingOut) onCancel();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [open, signingOut, onCancel]);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM_SHEET, justifyContent: 'flex-end' }]}
        onPress={onCancel}
        accessibilityLabel="Dismiss sign out confirmation"
      >
        <View
          onStartShouldSetResponder={() => true}
          style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}
          accessibilityRole="alert"
          accessibilityLabel="Sign out of GRM confirmation"
        >
          <View style={styles.grabber} />

          <View style={styles.sheetIconWrap}>
            <Ionicons name="log-out-outline" size={24} color={DANGER_BRIGHT} />
          </View>

          <Text nativeID="signout-title" style={styles.sheetTitle}>
            Sign out of GRM?
          </Text>
          <Text style={styles.sheetBody}>
            You'll need to log back in to submit or review grievances.
          </Text>

          <View style={styles.sheetButtons}>
            <Pressable
              onPress={onCancel}
              disabled={signingOut}
              style={[styles.sheetBtn, { backgroundColor: ROW_PRESSED }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.sheetBtnText, { color: TEXT, fontWeight: '600' }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={signingOut}
              style={[
                styles.sheetBtn,
                { backgroundColor: DANGER_BRIGHT, opacity: signingOut ? 0.6 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Text style={[styles.sheetBtnText, { color: '#fff', fontWeight: '700' }]}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function getInitials(user: AuthUser | null): string {
  if (!user) return '?';
  const parts = (user.name || user.username || '?').trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + second).toUpperCase() || '?';
}

const styles = StyleSheet.create({
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarPressed: { opacity: 0.8 },
  avatarImg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarText: {
    color: DEEP_NAVY,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  dim: { backgroundColor: BACKDROP_DIM },

  menu: {
    position: 'absolute',
    width: 276,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    // Primary drop shadow + subtle secondary. RN flattens multiple
    // shadow layers on iOS; on Android elevation gives the equivalent
    // raised effect.
    shadowColor: '#0a2342',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 40,
    elevation: 18,
  },

  // Identity header
  identityBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: AMBER_SOFT,
  },
  identityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
    // Amber-soft halo approximating the spec's box-shadow 0 0 0 3px ring.
    borderWidth: 3,
    borderColor: AMBER_SOFT,
  },
  identityAvatarText: {
    color: DEEP_NAVY,
    fontSize: 16,
    fontWeight: '700',
  },
  identityName: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  identityEmail: {
    color: MUTED,
    fontSize: 11.5,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: DIVIDER,
  },

  // Action rows
  actionGroup: {
    paddingVertical: 4,
  },
  actionRowWrap: {
    // TouchableHighlight paints its underlayColor on its own bounds, so
    // give it the outer padding and let the inner row lay its children
    // out horizontally.
    backgroundColor: 'transparent',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  actionIconTile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: 12,
  },
  actionTextCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  actionLabel: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 17,
  },
  actionSubtitle: {
    color: MUTED,
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 14,
  },

  // Confirmation sheet (kept)
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    alignItems: 'center',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: GRABBER,
    marginBottom: 18,
  },
  sheetIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DANGER_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
  },
  sheetBody: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    marginTop: 20,
  },
  sheetBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetBtnText: {
    fontSize: 15,
  },
});
