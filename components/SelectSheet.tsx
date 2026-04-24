import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
  type View as RNView,
} from 'react-native';
interface Item { id: number; name: string; [k: string]: unknown }

interface Props<T extends Item> {
  items: T[];
  loading?: boolean;
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
  /** When true, "— Not specified —" is offered as a null option. */
  clearable?: boolean;
  error?: string;
  /** 'dark' (default) renders a translucent-white trigger for use on
   *  the navy submit form. 'light' renders a white bordered trigger
   *  with navy text for use on light surfaces (modals, white cards). */
  variant?: 'dark' | 'light';
}

// Spec palette for the popover surface. Intentionally hard-coded — the
// popover is light-themed regardless of the form background it floats
// over, so tailwind's form-context colours don't apply.
const POP_BG = '#f4f6f9';
const POP_TEXT = '#0d2a4d';
const POP_MUTED = '#6b7f97';
const POP_SEL_BG = '#e8f0ff';
const POP_HOVER_BG = '#eaeef4';
const POP_ROW_BORDER = 'rgba(13,42,77,0.05)';
const AMBER = '#d4a43a';

const POPOVER_MAX_HEIGHT = 320;
const SEARCH_THRESHOLD = 8;
const GAP = 6;
const ANIM_MS = 180;

export function SelectSheet<T extends Item>(props: Props<T>) {
  return <DropdownField {...props} />;
}

function DropdownField<T extends Item>({
  items,
  loading,
  value,
  onChange,
  placeholder,
  label,
  disabled,
  clearable = true,
  error,
  variant = 'dark',
}: Props<T>) {
  const isLight = variant === 'light';
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  // Once mounted, keep the popover mounted for the life of the field so
  // the listbox isn't torn down and re-created on every open.
  const [everOpened, setEverOpened] = useState(false);
  const [anchor, setAnchor] = useState<null | {
    triggerTop: number;
    triggerBottom: number;
    left: number;
    width: number;
    flip: boolean;
  }>(null);

  const triggerRef = useRef<RNView>(null);
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const selected = items.find((i) => i.id === value) ?? null;
  const showSearch = items.length > SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      const screenH = Dimensions.get('window').height;
      const spaceBelow = screenH - (y + h);
      const spaceAbove = y;
      // Flip above if below is too tight AND above has more room.
      const flip = spaceBelow < 220 && spaceAbove > spaceBelow;
      setAnchor({
        triggerTop: y,
        triggerBottom: y + h,
        left: x,
        width: w,
        flip,
      });
      setSearch('');
      setEverOpened(true);
      setOpen(true);
    });
  }

  function close() {
    setOpen(false);
  }

  // Animate the field's chevron while open.
  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: open ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [chevronAnim, open]);

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Light variant: white card on a light modal surface; Dark variant:
  // translucent white over the navy submit form.
  const borderClass = isLight
    ? (error
        ? 'border-red-400'
        : open
          ? ''
          : disabled
            ? 'border-border'
            : 'border-border')
    : (error
        ? 'border-red-400'
        : open
          ? ''
          : disabled
            ? 'border-white/10'
            : 'border-white/20');

  const triggerBg = isLight
    ? (disabled ? 'bg-gray-50' : 'bg-white')
    : (disabled ? 'bg-white/5' : 'bg-white/10');

  const labelClass = isLight ? 'text-muted' : 'text-white/60';
  const valueClass = isLight
    ? (selected ? 'text-navy' : 'text-muted')
    : (selected ? 'text-white' : 'text-white/40');

  return (
    <>
      <View>
        <Pressable
          ref={triggerRef}
          disabled={disabled}
          onPress={toggle}
          accessibilityRole="combobox"
          accessibilityLabel={label}
          accessibilityState={{ expanded: open, disabled: !!disabled }}
          accessibilityHint="Opens a popover to pick a value"
          className={`rounded-xl px-4 py-3 border ${triggerBg} ${borderClass}`}
          style={open ? { borderColor: AMBER } : undefined}
        >
          <Text className={`${labelClass} text-xs uppercase tracking-wider`}>{label}</Text>
          <View className="flex-row items-center justify-between mt-0.5">
            <Text
              className={`flex-1 text-base ${valueClass}`}
              numberOfLines={1}
            >
              {selected ? selected.name : placeholder}
            </Text>
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <Ionicons name="chevron-down" size={16} color={AMBER} />
            </Animated.View>
          </View>
        </Pressable>
        {error ? <Text className="text-red-300 text-xs mt-1 ml-1">{error}</Text> : null}
      </View>

      {everOpened ? (
        <AnchoredPopover
          open={open}
          anchor={anchor}
          onDismiss={close}
          label={label}
          items={filtered}
          rawCount={items.length}
          loading={loading}
          value={value}
          clearable={clearable}
          showSearch={showSearch}
          search={search}
          onChangeSearch={setSearch}
          onSelect={(id) => {
            onChange(id);
            close();
          }}
        />
      ) : null}
    </>
  );
}

function AnchoredPopover({
  open,
  anchor,
  onDismiss,
  label,
  items,
  rawCount,
  loading,
  value,
  clearable,
  showSearch,
  search,
  onChangeSearch,
  onSelect,
}: {
  open: boolean;
  anchor: null | {
    triggerTop: number;
    triggerBottom: number;
    left: number;
    width: number;
    flip: boolean;
  };
  onDismiss: () => void;
  label: string;
  items: Item[];
  rawCount: number;
  loading?: boolean;
  value: number | null;
  clearable: boolean;
  showSearch: boolean;
  search: string;
  onChangeSearch: (s: string) => void;
  onSelect: (id: number | null) => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Keep the modal mounted while animating closed so the exit tween
  // actually plays.
  useEffect(() => {
    if (open) setRendered(true);
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: reduceMotion ? 80 : ANIM_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!open && finished) setRendered(false);
    });
  }, [anim, open, reduceMotion]);

  // Web: close on Esc. Native: RN Modal's onRequestClose handles Android back.
  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onDismiss]);

  if (!rendered || !anchor) return null;

  const opacity = anim;
  const scale = reduceMotion
    ? 1
    : anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const translateY = reduceMotion
    ? 0
    : anim.interpolate({ inputRange: [0, 1], outputRange: [anchor.flip ? 6 : -6, 0] });

  const screenH = Dimensions.get('window').height;
  // Flip-above uses `bottom` so the popover grows upward from the
  // trigger's top edge. Non-flip uses `top` measured from the trigger's
  // bottom edge plus GAP.
  const posStyle = anchor.flip
    ? { bottom: screenH - anchor.triggerTop + GAP }
    : { top: anchor.triggerBottom + GAP };

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      {/* Full-screen tap-away scrim. Transparent so the form stays visible. */}
      <Pressable
        onPress={onDismiss}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        accessible={false}
      >
        <Animated.View
          // `onStartShouldSetResponder` on the popover surface stops taps
          // inside from bubbling to the scrim.
          onStartShouldSetResponder={() => true}
          accessibilityRole="menu"
          accessibilityLabel={label}
          style={[
            {
              position: 'absolute',
              left: anchor.left,
              width: anchor.width,
              backgroundColor: POP_BG,
              borderRadius: 12,
              maxHeight: POPOVER_MAX_HEIGHT,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 32,
              elevation: 16,
              opacity,
              transform: [{ translateY }, { scale }],
            },
            posStyle,
          ]}
        >
          {showSearch ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: POP_ROW_BORDER,
                backgroundColor: POP_BG,
              }}
            >
              <Ionicons name="search" size={16} color={AMBER} />
              <TextInput
                value={search}
                onChangeText={onChangeSearch}
                placeholder="Search"
                placeholderTextColor={POP_MUTED}
                autoFocus
                style={{
                  flex: 1,
                  marginLeft: 8,
                  color: POP_TEXT,
                  fontSize: 14,
                  paddingVertical: 4,
                }}
              />
            </View>
          ) : null}

          {loading && rawCount === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: POP_MUTED, fontSize: 13, fontStyle: 'italic' }}>Loading…</Text>
            </View>
          ) : rawCount === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: POP_MUTED, fontSize: 13, fontStyle: 'italic' }}>
                No options available
              </Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(i) => String(i.id)}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                clearable ? (
                  <OptionRow
                    label="— Not specified —"
                    italic
                    selected={value === null}
                    onPress={() => onSelect(null)}
                  />
                ) : null
              }
              renderItem={({ item }) => (
                <OptionRow
                  label={item.name}
                  selected={value === item.id}
                  onPress={() => onSelect(item.id)}
                />
              )}
              ListEmptyComponent={
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ color: POP_MUTED, fontSize: 13 }}>No matches.</Text>
                </View>
              }
            />
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function OptionRow({
  label,
  selected,
  italic,
  onPress,
}: {
  label: string;
  selected: boolean;
  italic?: boolean;
  onPress: () => void;
}) {
  // TouchableHighlight + static StyleSheet — avoids the function-form
  // Pressable style bug that collapses row layout on some Android devices.
  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={POP_HOVER_BG}
      accessibilityRole="menuitem"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={selected ? rowStyles.rowSelected : rowStyles.row}
    >
      <View style={rowStyles.inner}>
        <Text
          style={[
            rowStyles.label,
            italic ? rowStyles.labelItalic : rowStyles.labelNormal,
            selected ? rowStyles.labelSelected : null,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {selected ? (
          <Ionicons
            name="checkmark"
            size={18}
            color={AMBER}
            style={rowStyles.check}
          />
        ) : null}
      </View>
    </TouchableHighlight>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    // 3px transparent left border so unselected rows align horizontally
    // with the amber left bar on the selected row.
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    backgroundColor: POP_BG,
  },
  rowSelected: {
    borderLeftWidth: 3,
    borderLeftColor: AMBER,
    backgroundColor: POP_SEL_BG,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    // padding-left 13 = 16 - 3 border reserve so text stays aligned.
    paddingLeft: 13,
    paddingRight: 16,
    minHeight: 44,
  },
  label: {
    flex: 1,
    fontSize: 15,
  },
  labelNormal: { color: POP_TEXT, fontWeight: '400' },
  labelItalic: { color: POP_MUTED, fontWeight: '400', fontStyle: 'italic' },
  labelSelected: { fontWeight: '600' },
  check: { marginLeft: 8 },
});
