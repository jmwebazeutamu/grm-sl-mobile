import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';

const AMBER = '#d4a43a';
const NAVY_BG = '#0d2a4d';
const DEEP_NAVY = '#0a2342';
const WHITE = '#ffffff';
const TEXT_DIM_1 = '#cfe0f5';
const TEXT_DIM_2 = '#9fb4cd';
const MUTED_LIGHT = '#6b7f97';
const AMBER_PILL_BG = 'rgba(212,164,58,0.12)';
const AMBER_PILL_BORDER = 'rgba(212,164,58,0.33)';
const AMBER_TINT = 'rgba(212,164,58,0.15)';
const WHITE_TILE_BG = 'rgba(255,255,255,0.06)';
const WHITE_TILE_BORDER = 'rgba(255,255,255,0.10)';

const HOTLINE = '8515';

export default function Landing() {
  const user = useAuthStore((s) => s.user);

  // Signed-in staff skip the public landing.
  if (user) return <Redirect href="/(staff)/dashboard" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NAVY_BG }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
          justifyContent: 'space-between',
        }}
      >
        <Hero />
        <ActionCards />
        <WhatHappensNext />
        <HotlineCard />
        <StaffLogin />
      </View>
    </SafeAreaView>
  );
}

function Hero() {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: AMBER,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Ionicons name="shield-checkmark" size={40} color={DEEP_NAVY} />
      </View>

      <Text
        accessibilityRole="header"
        style={{
          color: WHITE,
          fontSize: 22,
          fontWeight: '700',
          marginTop: 14,
          textAlign: 'center',
          lineHeight: 28,
        }}
      >
        Grievance Redress{'\n'}Mechanism
      </Text>

      <Text style={{ color: AMBER, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
        Anti-Corruption Commission · Sierra Leone
      </Text>

      <View
        accessibilityLabel="Private and anonymous"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: AMBER_PILL_BG,
          borderWidth: 1,
          borderColor: AMBER_PILL_BORDER,
          borderRadius: 100,
          paddingHorizontal: 14,
          paddingVertical: 8,
          marginTop: 14,
        }}
      >
        <Ionicons name="lock-closed" size={12} color={AMBER} />
        <Text style={{ color: AMBER, fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
          Private & anonymous
        </Text>
      </View>
    </View>
  );
}

function ActionCards() {
  return (
    <View style={{ gap: 12 }}>
      <ActionCard
        variant="primary"
        icon="create"
        title="Submit a grievance"
        subtitle="Report a concern anonymously"
        onPress={() => router.push('/(public)/submit')}
        accessibilityLabel="Submit a grievance anonymously"
      />
      <ActionCard
        variant="secondary"
        icon="search"
        title="Track your grievance"
        subtitle="Check status with your reference number"
        onPress={() => router.push('/(public)/track')}
        accessibilityLabel="Track your grievance by reference number"
      />
    </View>
  );
}

function ActionCard({
  variant,
  icon,
  title,
  subtitle,
  onPress,
  accessibilityLabel,
}: {
  variant: 'primary' | 'secondary';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const cardBg = variant === 'primary' ? AMBER : WHITE;
  const tileBg = variant === 'primary' ? DEEP_NAVY : AMBER;
  const tileIconColor = variant === 'primary' ? WHITE : DEEP_NAVY;
  const chevronColor = variant === 'primary' ? DEEP_NAVY : MUTED_LIGHT;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        backgroundColor: cardBg,
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 64,
        opacity: pressed ? 0.92 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 6,
      })}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          backgroundColor: tileBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={22} color={tileIconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: DEEP_NAVY, fontSize: 17, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: MUTED_LIGHT, fontSize: 13, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={chevronColor} />
    </Pressable>
  );
}

function WhatHappensNext() {
  return (
    <View>
      <Text
        style={{
          color: TEXT_DIM_2,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.2,
          marginBottom: 10,
        }}
      >
        WHAT HAPPENS NEXT
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StepTile num={1} label="You submit" />
        <StepTile num={2} label="We review" />
        <StepTile num={3} label="You're updated" />
      </View>
    </View>
  );
}

function StepTile({ num, label }: { num: number; label: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: WHITE_TILE_BG,
        borderWidth: 1,
        borderColor: WHITE_TILE_BORDER,
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: AMBER,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: DEEP_NAVY, fontSize: 13, fontWeight: '700' }}>{num}</Text>
      </View>
      <Text
        style={{
          color: TEXT_DIM_1,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 6,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function HotlineCard() {
  return (
    <Pressable
      onPress={() => { void Linking.openURL(`tel:${HOTLINE}`); }}
      accessibilityRole="button"
      accessibilityLabel={`Call hotline ${HOTLINE}, free`}
      hitSlop={4}
      style={({ pressed }) => ({
        backgroundColor: WHITE,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 64,
        opacity: pressed ? 0.9 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 3,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: AMBER_TINT,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="call" size={20} color={AMBER} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: MUTED_LIGHT }}>Prefer to talk to someone?</Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: DEEP_NAVY, marginTop: 1 }}>
          Call {HOTLINE} · Free
        </Text>
      </View>
    </Pressable>
  );
}

function StaffLogin() {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 4 }}>
      <Pressable
        onPress={() => router.push('/(auth)/login')}
        accessibilityRole="link"
        accessibilityLabel="Staff login"
        hitSlop={10}
      >
        <Text style={{ color: AMBER, fontSize: 13, fontWeight: '600' }}>Staff login →</Text>
      </Pressable>
    </View>
  );
}
