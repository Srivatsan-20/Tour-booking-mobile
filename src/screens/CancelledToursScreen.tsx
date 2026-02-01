import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { CalendarX } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { listAgreements } from '../api/agreements';
import type { RootStackParamList } from '../navigation/types';
import type { AgreementResponse } from '../types/api';
import { ScreenContainer } from '../components/ScreenContainer';
import { ListCard } from '../components/ListCard';

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
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('cancelledTours.title')}</Text>
        <Text style={styles.subtitle}>{items.length} {t('common.cancelled', 'Cancelled')}</Text>
      </View>

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
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.note}>{t('cancelledTours.loading')}</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && styles.listEmptyContainer
        ]}
        ListEmptyComponent={!loading && !error ? <Text style={styles.note}>{t('cancelledTours.empty')}</Text> : null}
        renderItem={({ item }) => (
          <ListCard
            title={item.customerName}
            subtitle={`${item.fromDate} → ${item.toDate}`}
            meta1={{
              text: `${t('cancelledTours.cancelledAt')}: ${formatCancelledAt(item.cancelledAtUtc)}`,
              icon: <CalendarX size={14} color="#EF4444" />
            }}
            status={{
              text: 'Cancelled',
              bg: '#FEF2F2',
              color: '#B91C1C'
            }}
            onPress={() => navigation.navigate('BookingDetails', { agreement: item })}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  note: { color: '#6b7280', textAlign: 'center', marginTop: 10 },
  noteSmall: { color: '#6b7280', fontSize: 12, textAlign: 'center' },

  stateBox: { paddingVertical: 40, gap: 10, alignItems: 'center' },
  retryBtn: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  retryBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
  listEmptyContainer: { flexGrow: 1, justifyContent: 'center' },
});
