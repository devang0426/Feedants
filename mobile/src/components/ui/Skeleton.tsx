import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { Card } from './Card';

interface BlockProps {
  width?: DimensionValue;
  height?: number;
  round?: boolean;
  style?: object;
}

/** A pulsing placeholder block. */
export function SkeletonBlock({ width = '100%', height = 14, round, style }: BlockProps) {
  const pulse = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius: round ? height / 2 : radius.sm, opacity: pulse },
        style,
      ]}
    />
  );
}

/** Mirrors the Competition Details layout so the page does not "jump" when data lands. */
export function DetailsSkeleton() {
  return (
    <View style={styles.page} accessibilityLabel="Loading" accessibilityRole="progressbar">
      <Card>
        <View style={styles.rowBetween}>
          <SkeletonBlock width="60%" height={22} />
          <SkeletonBlock width={96} height={28} round />
        </View>
        <View style={[styles.row, { marginTop: spacing.md }]}>
          <SkeletonBlock width={64} height={26} />
          <SkeletonBlock width={84} height={26} />
          <SkeletonBlock width={150} height={18} />
        </View>
        <View style={[styles.row, { marginTop: spacing.xl }]}>
          <View style={styles.stat}>
            <SkeletonBlock width={70} height={12} />
            <SkeletonBlock width={100} height={28} style={{ marginTop: spacing.sm }} />
          </View>
          <View style={styles.stat}>
            <SkeletonBlock width={70} height={12} />
            <SkeletonBlock width={70} height={28} style={{ marginTop: spacing.sm }} />
          </View>
          <View style={[styles.stat, { flex: 1.4 }]}>
            <SkeletonBlock width={130} height={14} />
            <SkeletonBlock height={5} style={{ marginTop: spacing.sm }} />
            <SkeletonBlock width={90} height={12} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      </Card>
      <Card>
        <View style={styles.row}>
          <SkeletonBlock width={92} height={92} round />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <SkeletonBlock width={50} height={12} />
            <SkeletonBlock width="60%" height={18} />
            <SkeletonBlock width="80%" height={12} />
            <SkeletonBlock width="55%" height={12} />
          </View>
        </View>
      </Card>
      <SkeletonBlock height={52} style={{ borderRadius: radius.md }} />
      <Card>
        <SkeletonBlock width={140} height={16} />
        <SkeletonBlock height={160} style={{ marginTop: spacing.md, borderRadius: radius.md }} />
      </Card>
      <Card>
        <SkeletonBlock width={140} height={16} />
        <View style={[styles.row, { marginTop: spacing.md }]}>
          <SkeletonBlock width={186} height={92} />
          <SkeletonBlock width={186} height={92} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.borderStrong },
  page: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stat: { flex: 1 },
});
