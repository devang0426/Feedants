import React from 'react';
import { FlatList, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Winner } from '../../api/types';
import { useLanguage } from '../../i18n';
import { colors, hairline, radius, spacing, typography } from '../../theme';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';

function WinnerTile({ winner }: { winner: Winner }) {
  const open = () => {
    if (winner.videoUrl) Linking.openURL(winner.videoUrl).catch(() => undefined);
  };
  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${winner.name}, ${winner.positionLabel}`}
    >
      <View>
        <Image source={{ uri: winner.imageUrl }} style={styles.image} />
        {winner.videoUrl ? (
          <View style={styles.play}>
            <Ionicons name="play" size={10} color={colors.primary} />
          </View>
        ) : null}
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={2}>
          {winner.name}
        </Text>
        <Text style={typography.captionMuted}>{winner.positionLabel}</Text>
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

const IMG = 72;

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.xl },
  title: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.xl },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: hairline,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: 6,
    paddingRight: spacing.md,
    width: 180,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.primarySofter },
  image: { width: IMG, height: IMG, borderRadius: radius.sm, backgroundColor: colors.chip },
  play: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: hairline,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 1,
  },
  meta: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 2 },
});
