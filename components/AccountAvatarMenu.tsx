import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type View as RNView,
} from 'react-native';
import { performSignOut } from '@/lib/auth';
import { useAuthStore, type AuthUser } from '@/stores/authStore';

const AVATAR_SIZE = 32;

// Spec palette — intentionally inline; some values don't exist in the
// tailwind theme and the design requires an exact match.
const AMBER = '#d4a43a';
const DEEP_NAVY = '#0a2342';
const NAVY_BG = '#0d2a4d';
const MUTED = '#6b7f97';
const DANGER = '#ef4444';
const DIVIDER = '#e4e8ee';
const HOVER = '#eef1f5';
const MENU_SURFACE = '#ffffff';
const SCRIM_SHEET = 'rgba(6,18,36,0.55)';
const GRABBER = '#c5ccd6';
const DANGER_TINT = 'rgba(239,68,68,0.12)';

interface Props {
  /** Colour theme for the avatar border/ring. The avatar itself is amber
   *  in both variants so it stays legible over either background. */
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
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      // measureInWindow returns screen coords, which is what the Modal
      // overlay uses. Anchor the menu's right edge to the avatar's right
      // edge so the menu extends leftward from the avatar.
      const screenW = Dimensions.get('window').width;
      setAnchor({
        top: y + height + 8,
        right: Math.max(8, screenW - (x + width)),
      });
      setMenuOpen(true);
    });
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  function onViewProfile() {
    closeMenu();
    router.push('/(staff)/profile');
  }

  function onSignOutTap() {
    closeMenu();
    // Small delay lets the dropdown finish fading before the sheet slides
    // up — otherwise they visually crash into each other.
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
        accessibilityHint="Opens the account menu with sign out"
        accessibilityState={{ expanded: menuOpen }}
        hitSlop={8}
        style={[
          styles.avatar,
          { backgroundColor: AMBER, borderColor: theme === 'light' ? DIVIDER : 'rgba(255,255,255,0.2)' },
        ]}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </Pressable>

      <DropdownMenu
        open={menuOpen}
        anchor={anchor}
        user={user}
        onClose={closeMenu}
        onViewProfile={onViewProfile}
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

function DropdownMenu({
  open,
  anchor,
  user,
  onClose,
  onViewProfile,
  onSignOut,
}: {
  open: boolean;
  anchor: { top: number; right: number } | null;
  user: AuthUser;
  onClose: () => void;
  onViewProfile: () => void;
  onSignOut: () => void;
}) {
  // Close on route-change side-effect: expo-router navigation tears down
  // the modal when the parent unmounts, so no extra subscription needed.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // web-only — RN Modal already handles Android back on native.
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [open, onClose]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.fullscreenScrim} onPress={onClose} accessible={false}>
        <View
          // stopPropagation: tapping the menu card itself must not close it
          onStartShouldSetResponder={() => true}
          style={[
            styles.menu,
            anchor
              ? { top: anchor.top, right: anchor.right }
              : { top: 56, right: 16 },
          ]}
          accessibilityRole="menu"
          accessibilityLabel="Account menu"
        >
          <View style={styles.menuHeader}>
            <Text style={styles.menuHeaderName} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.menuHeaderEmail} numberOfLines={1}>
              {user.email ?? user.username}
            </Text>
          </View>

          <MenuItem
            icon="person-circle-outline"
            label="View profile"
            onPress={onViewProfile}
          />

          <View style={styles.menuDivider} />

          <MenuItem
            icon="log-out-outline"
            label="Sign out"
            danger
            onPress={onSignOut}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.menuItem,
        pressed ? { backgroundColor: HOVER } : null,
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={danger ? DANGER : DEEP_NAVY}
        style={{ marginRight: 10 }}
      />
      <Text
        style={[
          styles.menuItemText,
          danger
            ? { color: DANGER, fontWeight: '600' }
            : { color: DEEP_NAVY, fontWeight: '500' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

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
        style={[styles.fullscreenScrim, { backgroundColor: SCRIM_SHEET }]}
        onPress={onCancel}
        accessibilityLabel="Dismiss sign out confirmation"
      >
        <View
          onStartShouldSetResponder={() => true}
          style={styles.sheet}
          accessibilityRole="alert"
          accessibilityLabel="Sign out of GRM confirmation"
        >
          <View style={styles.grabber} />

          <View style={styles.sheetIconWrap}>
            <Ionicons name="log-out-outline" size={24} color={DANGER} />
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
              style={[styles.sheetBtn, { backgroundColor: HOVER }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.sheetBtnText, { color: DEEP_NAVY, fontWeight: '600' }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={signingOut}
              style={[
                styles.sheetBtn,
                { backgroundColor: DANGER, opacity: signingOut ? 0.6 : 1 },
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
  fullscreenScrim: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  menu: {
    position: 'absolute',
    minWidth: 248,
    backgroundColor: MENU_SURFACE,
    borderRadius: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 12,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  menuHeaderName: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY_BG,
  },
  menuHeaderEmail: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 13,
  },
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
    color: NAVY_BG,
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
