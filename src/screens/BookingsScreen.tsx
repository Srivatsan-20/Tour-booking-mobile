import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { listAgreements } from '../api/agreements';
import type { RootStackParamList } from '../navigation/types';
import type { AgreementResponse } from '../types/api';
import { Card } from '../components/ui/Card';
import { COLORS, SPACING, FONT_SIZE, GLOBAL_STYLES } from '../theme';

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
    <View style={GLOBAL_STYLES.container}>
      <View style={styles.header}>
        <Text style={GLOBAL_STYLES.title}>{t('bookings.title')}</Text>
      </View>

      {error && items.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.note}>{t('bookings.error')}</Text>
          <Text style={styles.noteSmall} numberOfLines={4}>
            {error}
          </Text>
          <Pressable style={GLOBAL_STYLES.btnPrimary} onPress={load}>
            <Text style={GLOBAL_STYLES.btnText}>{t('bookings.retry')}</Text>
          </Pressable>
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.note}>{t('bookings.loading')}</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          !loading && !error ? <Text style={styles.note}>{t('bookings.empty')}</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('BookingDetails', { agreement: item })}
          >
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons name="bus" size={24} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.customerName}</Text>
                  <Text style={styles.cardSub}>{item.busType}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
              </View>

              <View style={styles.divider} />

              <View style={styles.cardRow}>
                <View style={styles.rowItem}>
                  <MaterialCommunityIcons name="calendar" size={16} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.cardMeta}>{`${item.fromDate} → ${item.toDate}`}</Text>
                </View>
              </View>

              {item.totalAmount != null ? (
                <View style={[styles.cardRow, { marginTop: 8 }]}>
                  <View style={styles.rowItem}>
                    <MaterialCommunityIcons name="cash" size={16} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.cardMeta, { fontWeight: 'bold', color: COLORS.success }]}>{`${t('agreement.totalAmount')}: ${item.totalAmount}`}</Text>
                  </View>
                </View>
              ) : null}
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  stateBox: { paddingVertical: SPACING.xl, gap: SPACING.md, alignItems: 'center' },
  note: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, textAlign: 'center' },
  noteSmall: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, textAlign: 'center' },

  card: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  cardSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: SPACING.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMeta: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: FONT_SIZE.md
  },
});

