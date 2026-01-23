import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { listAgreements } from '../api/agreements';
import type { RootStackParamList } from '../navigation/types';
import type { AgreementResponse } from '../types/api';

function parseDdMmYyyy(value: string): Date | null {
  const parts = value.split('/').map((p) => p.trim());
  if (parts.length !== 3) return null;
  const [ddRaw, mmRaw, yyyyRaw] = parts;
  const dd = Number.parseInt(ddRaw ?? '', 10);
  const mm = Number.parseInt(mmRaw ?? '', 10);
  const yyyy = Number.parseInt(yyyyRaw ?? '', 10);
  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null;
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1900) return null;

  const d = new Date(yyyy, mm - 1, dd);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Bookings'>;

export function BookingsScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [items, setItems] = React.useState<AgreementResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await listAgreements();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = all
        .filter((a) => {
          const to = parseDdMmYyyy(a.toDate);
          return !!to && to.getTime() >= today.getTime();
        })
        .sort((a, b) => {
          const aFrom = parseDdMmYyyy(a.fromDate)?.getTime() ?? Number.POSITIVE_INFINITY;
          const bFrom = parseDdMmYyyy(b.fromDate)?.getTime() ?? Number.POSITIVE_INFINITY;
          return aFrom - bFrom;
        });

      setItems(upcoming);
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
      <Text style={styles.title}>{t('bookings.title')}</Text>

      {error && items.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.note}>{t('bookings.error')}</Text>
          <Text style={styles.noteSmall} numberOfLines={4}>
            {error}
          </Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>{t('bookings.retry')}</Text>
          </Pressable>
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <View style={styles.stateBox}>
          <ActivityIndicator />
          <Text style={styles.note}>{t('bookings.loading')}</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={items.length === 0 ? styles.listEmptyContainer : undefined}
        ListEmptyComponent={
          !loading && !error ? <Text style={styles.note}>{t('bookings.empty')}</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('BookingDetails', { agreement: item })}
          >
            <Text style={styles.cardTitle}>{item.customerName}</Text>
            <Text style={styles.cardSub}>{`${item.fromDate} → ${item.toDate}`}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardMeta}>{item.busType}</Text>
              {item.totalAmount != null ? (
                <Text style={styles.cardMeta}>{`${t('agreement.totalAmount')}: ${item.totalAmount}`}</Text>
              ) : null}
            </View>
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
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cardMeta: { color: '#6b7280', fontWeight: '600' },
});

