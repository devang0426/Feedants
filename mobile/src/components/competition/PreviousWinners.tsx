import React from 'react';
import { FlatList, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import type { Winner } from '../../api/types';
import { useLanguage } from '../../i18n';
import { colors, radius, spacing, typography } from '../../theme';
import { Card } from '../ui/Card';

function WinnerTile({ winner }: { winner: Winner }) {
  const open = () => {
    if (winner.videoUrl) Linking.openURL(winner.videoUrl).catch(() => undefined);
  };
  return (
    <Pressable onPress={open} style={styles.tile} accessibilityRole="button" accessibilityLabel={`${winner.name}, ${winner.positionLabel}`}>
      <View>
        <Image source={{ uri: winner.imageUrl }} style={styles.image} />
        {winner.videoUrl ? (
          <View style={styles.play}>
            <Ionicons name="play" size={12} color={colors.surface} />
          </View>
        ) : null}
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={2}>
          {winner.name}
        </Text>
        <Text style={typography.caption}>{winner.positionLabel}</Text>
      </View>
    </Pressable>
  );
}

export function PreviousWinners({ winners }: { winners: Winner[] }) {
  const { t } = useLanguage();
  if (!winners.length) return null;
  return (
    <Card padded={false} style={styles.card}>
      <Text style={[typography.h2, styles.title]}>{t('previous_winners')}</Text>
      <FlatList
        horizontal
        data={winners}
        keyExtractor={(w, i) => `${w.name}-${i}`}
        renderItem={({ item }) => <WinnerTile winner={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
      />
    </Card>
  );
}

const IMG = 84;

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.lg },
  title: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySofter,
    borderRadius: radius.md,
    padding: 4,
    paddingRight: spacing.md,
    width: 186,
  },
  image: { width: IMG, height: IMG, borderRadius: radius.sm, backgroundColor: colors.chip },
  play: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  meta: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
});
