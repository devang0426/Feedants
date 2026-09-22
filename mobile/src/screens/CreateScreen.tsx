import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import { useLanguage } from '../i18n';
import { colors, spacing, typography } from '../theme';
import { Text } from '../components/ui/Text';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { ScreenHeader } from '../components/competition/ScreenHeader';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Organiser flow is out of scope for this module; the tab is kept so the
 * bottom navigation matches the design and tells the user what to expect.
 */
export function CreateScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader />
      <View style={styles.center}>
        <View style={styles.icon}>
          <Ionicons name="add-circle-outline" size={40} color={colors.primary} />
        </View>
        <Chip label={t('coming_soon')} tone="success" />
        <Text style={[typography.h1, styles.title]}>{t('create_title')}</Text>
        <Text style={[typography.bodySecondary, styles.body]}>{t('create_body')}</Text>
        <Button label={t('browse_competitions')} variant="outline" onPress={() => navigation.navigate('MainTabs', { screen: 'Competitions' })} style={styles.cta} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  icon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', lineHeight: 20 },
  cta: { marginTop: spacing.sm, minWidth: 200 },
});
