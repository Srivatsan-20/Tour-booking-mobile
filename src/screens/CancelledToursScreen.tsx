import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { listAgreements } from '../api/agreements';
import type { RootStackParamList } from '../navigation/types';
import type { AgreementResponse } from '../types/api';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CancelledTours'>;

function formatCancelledAt(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function cancelledAtMs(value: string | null | undefined): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const d = new Date(value);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

export function CancelledToursScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [items, setItems] = React.useState<AgreementResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await listAgreements({ includeCancelled: true });
      const cancelled = all
        .filter((a) => a.isCancelled)
        .sort((a, b) => cancelledAtMs(b.cancelledAtUtc) - cancelledAtMs(a.cancelledAtUtc));
      setItems(cancelled);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen style={styles.container}>
      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.note}>{t('cancelledTours.loading')}</Text>
        </View>
      ) : null}

      {error && items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.note}>{t('cancelledTours.error')}</Text>
          <Text style={styles.noteSmall} numberOfLines={4}>
            {error}
          </Text>
          <Button title={t('cancelledTours.retry')} onPress={() => void load()} />
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading && !error ? <Text style={styles.emptyText}>{t('cancelledTours.empty')}</Text> : null}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('BookingDetails', { agreement: item })}
          >
            <View style={styles.row}>
              <Text style={styles.cardTitle}>{item.customerName}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t('allTours.statusCancelled')}</Text>
              </View>
            </View>

            <Text style={styles.cardSub}>{`${item.fromDate} → ${item.toDate}`}</Text>
            <Text style={styles.cardMeta}>{`${t('cancelledTours.cancelledAt')}: ${formatCancelledAt(
              item.cancelledAtUtc,
            )}`}</Text>
            <View style={styles.reasonBox}>
              <Text style={styles.reasonText}>{t('cancelledTours.reason')}: {item.cancellationReason || '-'}</Text>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: SPACING.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg, gap: SPACING.md },

  note: { color: COLORS.textSecondary, textAlign: 'center' },
  noteSmall: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, textAlign: 'center' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.xl },

  card: { marginBottom: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },

  cardSub: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: 4 },
  cardMeta: { color: COLORS.textTertiary, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium },

  badge: { backgroundColor: COLORS.errorBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  badgeText: { fontSize: 10, fontWeight: FONT_WEIGHT.bold, color: COLORS.error },

  reasonBox: { marginTop: SPACING.sm, padding: SPACING.sm, backgroundColor: COLORS.background, borderRadius: RADIUS.sm },
  reasonText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontStyle: 'italic' },
});
