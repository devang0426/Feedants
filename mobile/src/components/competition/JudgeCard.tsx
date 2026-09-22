import React from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import type { Judge } from '../../api/types';
import { useLanguage } from '../../i18n';
import { colors, radius, spacing, typography } from '../../theme';
import { Card } from '../ui/Card';

export function JudgeCard({ judge }: { judge: Judge }) {
  const { t } = useLanguage();
  const openVideo = () => {
    if (judge.introVideoUrl) Linking.openURL(judge.introVideoUrl).catch(() => undefined);
  };

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.avatarRing}>
          {judge.avatarUrl ? (
            <Image source={{ uri: judge.avatarUrl }} style={styles.avatar} accessibilityLabel={judge.name} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={36} color={colors.textMuted} />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={typography.eyebrow}>{t('judge')}</Text>
          <Text style={styles.name}>{judge.name}</Text>
          <Text style={typography.bodySecondary}>{judge.title}</Text>
          {judge.experience ? <Text style={typography.bodySecondary}>{judge.experience}</Text> : null}
        </View>
        {judge.introVideoUrl ? (
          <Pressable onPress={openVideo} style={styles.video} accessibilityRole="button" accessibilityLabel={t('intro_video')}>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={22} color={colors.primary} />
            </View>
            <Text style={styles.videoLabel}>{t('intro_video')}</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

const AVATAR = 84;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarRing: {
    width: AVATAR + 6,
    height: AVATAR + 6,
    borderRadius: (AVATAR + 6) / 2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: colors.chip },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: spacing.lg },
  name: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  video: { alignItems: 'center', marginLeft: spacing.sm },
  playCircle: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  videoLabel: { ...typography.captionMuted, marginTop: spacing.sm },
});
