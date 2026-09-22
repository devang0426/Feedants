import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import type { CompetitionDetails } from '../../api/types';
import { useLanguage } from '../../i18n';
import { colors, spacing, typography } from '../../theme';
import { Card } from '../ui/Card';

type TabKey = 'about' | 'judging' | 'rules';
const COLLAPSED_LINES = 3;

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.bullets}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function InfoTabs({ competition }: { competition: CompetitionDetails }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<TabKey>('about');
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'about', label: t('about_competition') },
    { key: 'judging', label: t('judging_parameters') },
    { key: 'rules', label: t('rules_eligibility') },
  ];

  return (
    <Card>
      <View style={styles.tabRow} accessibilityRole="tablist">
        {tabs.map((item) => {
          const active = item.key === tab;
          return (
            <Pressable
              key={item.key}
              onPress={() => {
                setTab(item.key);
                setExpanded(false);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.content}>
        {tab === 'about' ? (
          <>
            <Text
              style={styles.about}
              numberOfLines={expanded ? undefined : COLLAPSED_LINES}
              onTextLayout={(e) => {
                if (!expanded) setNeedsToggle(e.nativeEvent.lines.length > COLLAPSED_LINES);
              }}
            >
              {competition.about}
            </Text>
            {needsToggle || expanded ? (
              <Pressable onPress={() => setExpanded((v) => !v)} style={styles.more} accessibilityRole="button">
                <Text style={styles.moreText}>{expanded ? t('view_less') : t('view_more')}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
              </Pressable>
            ) : null}
          </>
        ) : tab === 'judging' ? (
          <BulletList items={competition.judgingParameters} />
        ) : (
          <BulletList items={competition.rules} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingBottom: spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabLabelActive: { color: colors.primary },
  content: { paddingTop: spacing.lg },
  about: { ...typography.bodySecondary, lineHeight: 22 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md },
  moreText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  bullets: { gap: spacing.sm },
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  bulletDot: { color: colors.primary, fontSize: 16, lineHeight: 22 },
  bulletText: { ...typography.bodySecondary, flex: 1, lineHeight: 22 },
});
