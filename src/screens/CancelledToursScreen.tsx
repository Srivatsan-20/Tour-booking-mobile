import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { listAgreements } from '../api/agreements';
import type { RootStackParamList } from '../navigation/types';
import type { AgreementResponse } from '../types/api';

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
    <View style={styles.container}>
      <Text style={styles.title}>{t('cancelledTours.title')}</Text>

      {error && items.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.note}>{t('cancelledTours.error')}</Text>
          <Text style={styles.noteSmall} numberOfLines={4}>
            {error}
          </Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>{t('cancelledTours.retry')}</Text>
          </Pressable>
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <View style={styles.stateBox}>
          <ActivityIndicator />
          <Text style={styles.note}>{t('cancelledTours.loading')}</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={items.length === 0 ? styles.listEmptyContainer : undefined}
        ListEmptyComponent={!loading && !error ? <Text style={styles.note}>{t('cancelledTours.empty')}</Text> : null}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('BookingDetails', { agreement: item })}
          >
            <Text style={styles.cardTitle}>{item.customerName}</Text>
            <Text style={styles.cardSub}>{`${item.fromDate} → ${item.toDate}`}</Text>
            <Text style={styles.cardMeta}>{`${t('cancelledTours.cancelledAt')}: ${formatCancelledAt(
              item.cancelledAtUtc,
            )}`}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 18, fontWeight: '800' },
  note: { color: '#6b7280', textAlign: 'center' },
  noteSmall: { color: '#6b7280', fontSize: 12, textAlign: 'center' },

  stateBox: { paddingVertical: 18, gap: 10, alignItems: 'center' },
  retryBtn: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  retryBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },

  listEmptyContainer: { flexGrow: 1, justifyContent: 'center' },

  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4, color: '#111827' },
  cardSub: { color: '#374151', marginBottom: 8 },
  cardMeta: { color: '#6b7280', fontWeight: '600' },
});
