import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { ChipPicker } from '@/components/ChipPicker';

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
  /** 'dropdown' (default) opens the full-screen modal picker; 'chips'
   *  renders all options inline as tappable pills — intended for short
   *  static enums. Placeholder + `disabled` are ignored in chips mode. */
  selectionStyle?: 'dropdown' | 'chips';
}

export function SelectSheet<T extends Item>({
  items,
  loading,
  value,
  onChange,
  placeholder,
  label,
  disabled,
  clearable = true,
  error,
  selectionStyle = 'dropdown',
}: Props<T>) {
  if (selectionStyle === 'chips') {
    return (
      <ChipPicker
        items={items}
        loading={loading}
        value={value}
        onChange={onChange}
        label={label}
        clearable={clearable}
        error={error}
      />
    );
  }
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  const selected = items.find((i) => i.id === value);

  return (
    <>
      <View>
        <Pressable
          disabled={disabled}
          onPress={() => setOpen(true)}
          className={`rounded-xl px-4 py-3 border ${
            error
              ? 'bg-white/10 border-red-400'
              : disabled
                ? 'bg-white/5 border-white/10'
                : 'bg-white/10 border-white/20'
          }`}
        >
          <Text className="text-white/60 text-xs uppercase tracking-wider">{label}</Text>
          <View className="flex-row items-center justify-between mt-0.5">
            <Text className={`flex-1 text-base ${selected ? 'text-white' : 'text-white/40'}`} numberOfLines={1}>
              {selected ? selected.name : placeholder}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#c9a84c" />
          </View>
        </Pressable>
        {error ? <Text className="text-red-300 text-xs mt-1 ml-1">{error}</Text> : null}
      </View>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 bg-surface">
          <View className="bg-navy px-4 pt-12 pb-3">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-bold text-base">{label}</Text>
              <Pressable onPress={() => setOpen(false)} className="p-2">
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>

            <View className="bg-white/10 rounded-xl flex-row items-center px-3">
              <Ionicons name="search" size={16} color="#c9a84c" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search"
                placeholderTextColor="#94a3b8"
                className="flex-1 px-2 py-2.5 text-white"
                autoFocus
              />
            </View>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted">Loading…</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(i) => i.id.toString()}
              ListHeaderComponent={
                clearable ? (
                  <Pressable
                    onPress={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                    className="px-4 py-3 border-b border-border flex-row items-center justify-between"
                  >
                    <Text className="text-muted italic">— Not specified —</Text>
                    {value === null ? <Ionicons name="checkmark" size={18} color="#22c55e" /> : null}
                  </Pressable>
                ) : null
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className="px-4 py-3 border-b border-border flex-row items-center justify-between"
                >
                  <Text className="text-navy flex-1">{item.name}</Text>
                  {value === item.id ? <Ionicons name="checkmark" size={18} color="#22c55e" /> : null}
                </Pressable>
              )}
              ListEmptyComponent={
                <View className="px-4 py-12 items-center">
                  <Text className="text-muted">No matches.</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </>
  );
}
