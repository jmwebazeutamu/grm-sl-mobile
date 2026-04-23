import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';

const ACC_LOGO = require('@/assets/images/acc-logo.png');
const HOTLINE = '8515';

const C = {
  amber: '#d4a43a',
  navyBg: '#0d2a4d',
  deepNavy: '#0a2342',
  white: '#ffffff',
  textDim1: '#cfe0f5',
  textDim2: '#9fb4cd',
  mutedLight: '#6b7f97',
  amberPillBg: 'rgba(212,164,58,0.12)',
  amberPillBorder: 'rgba(212,164,58,0.33)',
  amberTint: 'rgba(212,164,58,0.15)',
  whiteTileBg: 'rgba(255,255,255,0.06)',
  whiteTileBorder: 'rgba(255,255,255,0.10)',
};

export default function Landing() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Redirect href="/(staff)/dashboard" />;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── HERO ───────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Image
            source={ACC_LOGO}
            resizeMode="contain"
            accessibilityLabel="Anti-Corruption Commission Sierra Leone crest"
            style={styles.crest}
          />
          <Text accessibilityRole="header" style={styles.heroTitle}>
            Grievance Redress{'\n'}Mechanism
          </Text>
          <Text style={styles.heroSubtitle}>
            Anti-Corruption Commission · Sierra Leone
          </Text>

          <View style={styles.pill} accessibilityLabel="Private and anonymous">
            <Ionicons name="lock-closed" size={12} color={C.amber} />
            <Text style={styles.pillText}>Private & anonymous</Text>
          </View>
        </View>

        {/* ── ACTION CARDS ────────────────────────────────────────────── */}
        <View style={styles.cards}>
          <TouchableOpacity
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Submit a grievance anonymously"
            onPress={() => router.push('/(public)/submit')}
            style={[styles.actionCard, styles.actionCardPrimary]}
          >
            <View style={[styles.iconTile, styles.iconTileNavy]}>
              <Ionicons name="create" size={26} color={C.white} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Submit a grievance</Text>
              <Text style={styles.actionSub}>Report a concern anonymously</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={C.deepNavy} />
          </TouchableOpacity>

          <View style={{ height: 12 }} />

          <TouchableOpacity
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Track your grievance by reference number"
            onPress={() => router.push('/(public)/track')}
            style={[styles.actionCard, styles.actionCardSecondary]}
          >
            <View style={[styles.iconTile, styles.iconTileAmber]}>
              <Ionicons name="search" size={26} color={C.deepNavy} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Track your grievance</Text>
              <Text style={styles.actionSub}>
                Check status with your reference number
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={C.mutedLight} />
          </TouchableOpacity>
        </View>

        {/* ── WHAT HAPPENS NEXT ──────────────────────────────────────── */}
        <View style={styles.stepsBlock}>
          <Text style={styles.stepsLabel}>WHAT HAPPENS NEXT</Text>
          <View style={styles.stepsRow}>
            <StepTile num={1} label="You submit" />
            <View style={{ width: 8 }} />
            <StepTile num={2} label="We review" />
            <View style={{ width: 8 }} />
            <StepTile num={3} label="You're updated" />
          </View>
        </View>

        {/* ── HOTLINE CARD ───────────────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`Call hotline ${HOTLINE}, free`}
          onPress={() => { void Linking.openURL(`tel:${HOTLINE}`); }}
          style={styles.hotline}
        >
          <View style={styles.hotlineIcon}>
            <Ionicons name="call" size={20} color={C.amber} />
          </View>
          <View style={styles.hotlineText}>
            <Text style={styles.hotlineLabel}>Prefer to talk to someone?</Text>
            <Text style={styles.hotlineNumber}>Call {HOTLINE} · Free</Text>
          </View>
        </TouchableOpacity>

        {/* ── STAFF LOGIN ────────────────────────────────────────────── */}
        <View style={styles.staffLogin}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Staff login"
            hitSlop={10}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.staffLoginText}>Staff login →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StepTile({ num, label }: { num: number; label: string }) {
  return (
    <View style={styles.stepTile}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{num}</Text>
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navyBg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },

  // Hero
  hero: { alignItems: 'center' },
  crest: { width: 110, height: 92 },
  heroTitle: {
    color: C.white,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
    lineHeight: 28,
  },
  heroSubtitle: { color: C.amber, fontSize: 13, marginTop: 4, textAlign: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.amberPillBg,
    borderWidth: 1,
    borderColor: C.amberPillBorder,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 14,
  },
  pillText: { color: C.amber, fontSize: 12, fontWeight: '600', marginLeft: 6 },

  // Action cards — both stretch full width via alignSelf
  cards: { width: '100%', marginTop: 18 },
  actionCard: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 82,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  actionCardPrimary: { backgroundColor: C.amber },
  actionCardSecondary: { backgroundColor: C.white },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileNavy: { backgroundColor: C.deepNavy },
  iconTileAmber: { backgroundColor: C.amber },
  actionText: { flex: 1, marginLeft: 14, marginRight: 8 },
  actionTitle: { color: C.deepNavy, fontSize: 17, fontWeight: '700' },
  actionSub: { color: C.mutedLight, fontSize: 13, marginTop: 2 },

  // What happens next
  stepsBlock: { marginTop: 18 },
  stepsLabel: {
    color: C.textDim2,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  stepsRow: { flexDirection: 'row' },
  stepTile: {
    flex: 1,
    backgroundColor: C.whiteTileBg,
    borderWidth: 1,
    borderColor: C.whiteTileBorder,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { color: C.deepNavy, fontSize: 13, fontWeight: '700' },
  stepLabel: {
    color: C.textDim1,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },

  // Hotline
  hotline: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: C.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  hotlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.amberTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotlineText: { flex: 1, marginLeft: 12 },
  hotlineLabel: { fontSize: 12, color: C.mutedLight },
  hotlineNumber: { fontSize: 15, fontWeight: '700', color: C.deepNavy, marginTop: 1 },

  // Staff login
  staffLogin: { alignItems: 'center', paddingVertical: 10, marginTop: 8 },
  staffLoginText: { color: C.amber, fontSize: 13, fontWeight: '600' },
});
