import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text } from '../ui/text';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

type Props = {
  visible: boolean;
  /** Short label shown before dots, e.g. participant first name */
  label?: string;
};

/**
 * WhatsApp-style typing row above the composer (animated dots).
 */
export function TypingIndicatorRow({ visible, label }: Props) {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildTypingStyles(t), [t]);
  const dot1 = useRef(new Animated.Value(0.35)).current;
  const dot2 = useRef(new Animated.Value(0.35)).current;
  const dot3 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!visible) {
      dot1.setValue(0.35);
      dot2.setValue(0.35);
      dot3.setValue(0.35);
      return;
    }

    const makeLoop = (v: Animated.Value, delayMs: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(v, {
            toValue: 1,
            duration: 320,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0.35,
            duration: 320,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

    const l1 = makeLoop(dot1, 0);
    const l2 = makeLoop(dot2, 110);
    const l3 = makeLoop(dot3, 220);
    l1.start();
    l2.start();
    l3.start();

    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, [visible, dot1, dot2, dot3]);

  if (!visible) return null;

  const dots = [dot1, dot2, dot3];
  const dotColor = t.textMuted;

  return (
    <View style={styles.wrap} accessibilityLabel="Other person is typing">
      <View style={styles.bubble}>
        {label ? (
          <Text style={styles.prefix} numberOfLines={1}>
            {label}
          </Text>
        ) : null}
        <View style={styles.dots}>
          {dots.map((op, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: op, backgroundColor: dotColor }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

function buildTypingStyles(t: AppScreenTheme) {
  const bubbleBg = t.isDark ? '#334155' : '#E5E7EB';
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: 12,
      paddingBottom: 6,
      alignItems: 'flex-start',
    },
    bubble: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: bubbleBg,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      maxWidth: '88%',
      gap: 8,
    },
    prefix: {
      fontSize: 13,
      color: t.textSecondary,
      fontWeight: '500',
      maxWidth: 120,
    },
    dots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
  });
}
