import { Pressable, Text, View } from 'react-native';

interface Item {
  id: number;
  name: string;
  [k: string]: unknown;
}

interface Props<T extends Item> {
  items: T[];
  loading?: boolean;
  value: number | null;
  onChange: (id: number | null) => void;
  label: string;
  /** When true (default), optional-field Clear chip is appended so users
   *  can unset the value. Required fields pass `clearable={false}`. */
  clearable?: boolean;
  error?: string;
}

// Design-spec colour tokens — intentionally inline (not in the tailwind
// config yet) so the picker renders identically even on screens where the
// global theme vars haven't loaded.
const SELECTED_BG = '#d4a43a';
const SELECTED_TEXT = '#0a2342';
const UNSELECTED_TEXT = '#cfe0f5';
const BORDER = '#254b75';
const LABEL = '#a9bfd9';
const ERROR = '#fca5a5';

/**
 * Inline chip picker for short single-select enums (≤ ~8 options). Renders
 * every option as a tappable pill directly in the form — no modal. Keep
 * the public API signature-compatible with SelectSheet so form state stays
 * identical (the caller still gets `onChange(id | null)`).
 *
 * Accessibility: each chip is a radio inside an implicit radiogroup.
 * React Native Web translates `accessibilityRole="radio"` to
 * `role="radio"` + keyboard focus, which covers the a11y requirement
 * on both native and web.
 */
export function ChipPicker<T extends Item>({
  items,
  loading,
  value,
  onChange,
  label,
  clearable = true,
  error,
}: Props<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text
        style={{
          color: LABEL,
          fontSize: 10.5,
          fontWeight: '600',
          letterSpacing: 0.9,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {label}
      </Text>

      {loading && items.length === 0 ? (
        <Text style={{ color: LABEL, fontSize: 13, fontStyle: 'italic' }}>
          Loading…
        </Text>
      ) : items.length === 0 ? (
        <Text style={{ color: LABEL, fontSize: 13, fontStyle: 'italic' }}>
          No options
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {items.map((item) => {
            const selected = value === item.id;
            return (
              <Pressable
                key={item.id}
                // Tapping the already-selected chip is a no-op per the spec;
                // the Clear chip is the only unset affordance.
                onPress={() => {
                  if (!selected) onChange(item.id);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={item.name}
                style={({ pressed }) => ({
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 100,
                  minHeight: 44,
                  justifyContent: 'center',
                  backgroundColor: selected ? SELECTED_BG : 'transparent',
                  borderWidth: selected ? 0 : 1,
                  borderColor: BORDER,
                  opacity: pressed && !selected ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    color: selected ? SELECTED_TEXT : UNSELECTED_TEXT,
                    fontSize: 13,
                    fontWeight: selected ? '700' : '500',
                  }}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          })}

          {clearable && value !== null ? (
            <Pressable
              onPress={() => onChange(null)}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${label}`}
              style={({ pressed }) => ({
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 100,
                minHeight: 44,
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: BORDER,
                borderStyle: 'dashed',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  color: UNSELECTED_TEXT,
                  fontSize: 13,
                  fontStyle: 'italic',
                  fontWeight: '500',
                }}
              >
                Clear
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {error ? (
        <Text style={{ color: ERROR, fontSize: 12, marginTop: 6, marginLeft: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
