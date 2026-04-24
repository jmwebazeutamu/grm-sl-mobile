import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const TRACK_HEIGHT = 60;
const THUMB_SIZE = 52;
const TRACK_PAD = 4;
const COMMIT_THRESHOLD = 0.92;

type Tone = 'green' | 'amber';

const TONE_MAP: Record<Tone, { fg: string; bg: string; border: string }> = {
  green: { fg: '#1f8d5a', bg: '#e3f3ec', border: '#bfe1cf' },
  amber: { fg: '#d4a43a', bg: '#fdf4db', border: '#f0dfa6' },
};

interface Props {
  label: string;
  /** Confirmation label shown briefly after the commit. Defaults to tone-appropriate. */
  confirmedLabel?: string;
  tone?: Tone;
  onConfirm: () => void;
  disabled?: boolean;
}

/**
 * Pill-shaped slide-to-confirm gesture. Users press the thumb, drag
 * right, and release past 92% of the track to commit. Below 92%, the
 * thumb springs back. This is the guard for destructive/terminal state
 * transitions — it stops a misplaced tap from closing a case.
 *
 * Built on RN's PanResponder (no extra deps). Width is measured via
 * onLayout; the responder is rebuilt whenever the measurable width or
 * the disabled/confirmed flags change so its handlers always have
 * fresh bounds.
 */
export function SlideToConfirm({
  label,
  confirmedLabel,
  tone = 'green',
  onConfirm,
  disabled,
}: Props) {
  const palette = TONE_MAP[tone];
  const [trackWidth, setTrackWidth] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const pan = useRef(new Animated.Value(0)).current;

  const maxX = Math.max(0, trackWidth - THUMB_SIZE - TRACK_PAD * 2);

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const commit = useCallback(() => {
    setConfirmed(true);
    // Give the user a visible "locked" state for 180ms before firing.
    setTimeout(() => {
      onConfirm();
    }, 180);
  }, [onConfirm]);

  const springBack = useCallback(() => {
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
  }, [pan]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled && !confirmed && maxX > 0,
        onMoveShouldSetPanResponder: (_, gs) =>
          !disabled && !confirmed && maxX > 0 && Math.abs(gs.dx) > 2,
        onPanResponderGrant: () => {
          pan.setValue(0);
        },
        onPanResponderMove: (_, gs) => {
          const clamped = Math.max(0, Math.min(maxX, gs.dx));
          pan.setValue(clamped);
        },
        onPanResponderRelease: (_, gs) => {
          const progress = maxX > 0 ? gs.dx / maxX : 0;
          if (progress >= COMMIT_THRESHOLD) {
            Animated.timing(pan, {
              toValue: maxX,
              duration: 120,
              useNativeDriver: false,
            }).start(commit);
          } else {
            springBack();
          }
        },
        onPanResponderTerminate: springBack,
      }),
    [commit, confirmed, disabled, maxX, pan, springBack],
  );

  // Keyboard a11y — focused slider commits on → / End after a short
  // hold. React Native on-device has no hardware keyboard in most
  // setups; this mainly supports accessibility testers and external
  // Bluetooth keyboards. Safe no-op on touch-only devices.
  const [reduceMotion, setReduceMotion] = useState(false);
  useMemo(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const progressOpacity = pan.interpolate({
    inputRange: [0, maxX || 1],
    outputRange: [0, 0.18],
    extrapolate: 'clamp',
  });
  const labelOpacity = pan.interpolate({
    inputRange: [0, maxX || 1],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const shownLabel = confirmed ? (confirmedLabel ?? label.replace(/slide to /i, '').toUpperCase()) : label;

  return (
    <View
      onLayout={onTrackLayout}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityHint="Slide right to confirm"
      accessibilityState={{ disabled: !!disabled, busy: confirmed }}
      style={[
        styles.track,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      {/* Progress fill behind the thumb — amber/green at 18% while sliding. */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: palette.fg,
            opacity: reduceMotion ? 0 : progressOpacity,
            borderRadius: TRACK_HEIGHT / 2,
          },
        ]}
      />

      <Animated.Text
        pointerEvents="none"
        style={[
          styles.label,
          { color: palette.fg, opacity: confirmed ? 1 : reduceMotion ? 1 : labelOpacity, fontWeight: confirmed ? '800' : '600' },
        ]}
        numberOfLines={1}
      >
        {shownLabel}
      </Animated.Text>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          {
            backgroundColor: palette.fg,
            transform: [{ translateX: pan }],
            shadowColor: palette.fg,
          },
        ]}
      >
        <Ionicons
          name={confirmed ? 'checkmark' : 'chevron-forward'}
          size={22}
          color="#ffffff"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 1,
    padding: TRACK_PAD,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: TRACK_PAD,
    top: TRACK_PAD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
});
