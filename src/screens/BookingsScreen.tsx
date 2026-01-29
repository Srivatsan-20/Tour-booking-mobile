import * as React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { listAgreements } from '../api/agreements';
import type { RootStackParamList } from '../navigation/types';
import type { AgreementResponse } from '../types/api';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../theme';

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

  const renderItem = ({ item }: { item: AgreementResponse }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('BookingDetails', { agreement: item })}
      padding="md"
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="bus-side" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.customerName} numberOfLines={1}>{item.customerName}</Text>
          <Text style={styles.busType}>{item.busType}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textTertiary} />
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="calendar-range" size={16} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{item.fromDate} - {item.toDate}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="map-marker-distance" size={16} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>
            {t('agreement.pickup')}: <Text style={styles.highlight}>{item.pickupLocation}</Text>
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('bookings.title')}</Text>
        <Text style={styles.subtitle}>Upcoming trips and reservations</Text>
      </View>

      {error && !loading && items.length === 0 ? (
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{t('bookings.error')}</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <Button title={t('bookings.retry')} onPress={load} size="sm" style={{ marginTop: SPACING.md }} />
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>{t('bookings.loading')}</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.centerBox}>
              <MaterialCommunityIcons name="bus-stop" size={64} color={COLORS.border} />
              <Text style={styles.emptyText}>{t('bookings.empty')}</Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  header: {
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  customerName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  busType: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  highlight: {
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingTop: 100,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  errorDetail: {
    marginTop: SPACING.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textTertiary,
  },
});
