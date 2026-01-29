import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { RootStackParamList } from '../navigation/types';
import type { AccountsSummaryItem } from '../types/accounts';
import { listAccounts } from '../api/accounts';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountsSummary'>;

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '-';
  return String(n); // In real app, format currency better
}

function formatDateDDMMYYYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function formatIsoDate(date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function AccountsSummaryScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [items, setItems] = React.useState<AccountsSummaryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [includeCancelled, setIncludeCancelled] = React.useState(false);
  const [from, setFrom] = React.useState<Date | null>(null);
  const [to, setTo] = React.useState<Date | null>(null);
  const [picker, setPicker] = React.useState<{ field: 'from' | 'to'; date: Date } | null>(null);

  React.useEffect(() => {
    navigation.setOptions({ title: t('accounts.summaryTitle') });
  }, [navigation, t]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAccounts({
        fromIso: from ? formatIsoDate(from) : undefined,
        toIso: to ? formatIsoDate(to) : undefined,
        includeCancelled,
      });
      setItems(data);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : String(e));
    } finally {
      setLoading(false);
    }
  }, [from, includeCancelled, to]);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load]),
  );

  const openPicker = React.useCallback(
    (field: 'from' | 'to') => {
      const current = (field === 'from' ? from : to) ?? new Date();
      setPicker({ field, date: current });
    },
    [from, to],
  );

  const onPick = React.useCallback(
    (field: 'from' | 'to', date: Date) => {
      if (field === 'from') setFrom(date);
      else setTo(date);
      setPicker(null);
    },
    [],
  );

  const renderItem = ({ item }: { item: AccountsSummaryItem }) => {
    const profit = item.profitOrLoss;
    const isProfit = profit >= 0;
    return (
      <Card
        style={{ marginBottom: SPACING.md }}
        onPress={() => navigation.navigate('TourAccount', { agreementId: item.agreementId })}
      >
        <View style={styles.cardTop}>
          <Text style={styles.customer}>{item.customerName}</Text>
          {item.isCancelled ? <View style={styles.cancelledBadge}><Text style={styles.cancelledText}>{t('allTours.statusCancelled')}</Text></View> : null}
        </View>
        <Text style={styles.subText}>
          {item.fromDate} - {item.toDate} • {item.busType}
        </Text>
        <View style={styles.separator} />
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>{t('accounts.income')}</Text>
            <Text style={styles.value}>{fmtMoney(item.incomeTotalAmount)}</Text>
          </View>
          <View>
            <Text style={styles.label}>{t('accounts.totalExpenses')}</Text>
            <Text style={styles.value}>{fmtMoney(item.totalExpenses)}</Text>
          </View>
        </View>
        <View style={[styles.profitBox, isProfit ? styles.profitPosBg : styles.profitNegBg]}>
          <Text style={[styles.profitText, isProfit ? styles.profitPos : styles.profitNeg]}>
            {t('accounts.profitOrLoss')}: {fmtMoney(item.profitOrLoss)}
          </Text>
        </View>
      </Card>
    );
  };

  return (
    <Screen style={styles.container}>
      <Card style={styles.filtersCard} padding="sm" variant="flat">
        <View style={styles.filterRow}>
          <Pressable style={styles.dateChip} onPress={() => openPicker('from')}>
            <MaterialCommunityIcons name="calendar" size={18} color={COLORS.textSecondary} />
            <Text style={styles.dateChipText}>
              {from ? formatDateDDMMYYYY(from) : t('accounts.filterFrom')}
            </Text>
          </Pressable>
          <Text style={{ color: COLORS.textTertiary }}>-</Text>
          <Pressable style={styles.dateChip} onPress={() => openPicker('to')}>
            <MaterialCommunityIcons name="calendar" size={18} color={COLORS.textSecondary} />
            <Text style={styles.dateChipText}>
              {to ? formatDateDDMMYYYY(to) : t('accounts.filterTo')}
            </Text>
          </Pressable>
        </View>
        <View style={styles.filterRowBottom}>
          <Pressable
            style={[styles.toggleChip, includeCancelled ? styles.toggleChipActive : null]}
            onPress={() => setIncludeCancelled((v) => !v)}
          >
            <MaterialCommunityIcons name={includeCancelled ? "checkbox-marked" : "checkbox-blank-outline"} size={18} color={includeCancelled ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.toggleChipText, includeCancelled ? styles.toggleChipTextActive : null, { flexShrink: 1 }]}>{t('accounts.includeCancelled')}</Text>
          </Pressable>
          <Button title={t('common.refresh')} onPress={() => void load()} size="sm" variant="ghost" />
        </View>
      </Card>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Button title={t('common.retry')} onPress={() => void load()} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.agreementId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('common.noData')}</Text>}
        />
      )}

      {picker ? (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" visible>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <DateTimePicker
                  value={picker.date}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => {
                    if (d) setPicker({ field: picker.field, date: d });
                  }}
                />
                <View style={styles.modalActions}>
                  <Button title={t('common.cancel')} onPress={() => setPicker(null)} variant="ghost" style={{ flex: 1 }} />
                  <Button title={t('common.done')} onPress={() => onPick(picker.field, picker.date)} style={{ flex: 1 }} />
                </View>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={picker.date}
            mode="date"
            onChange={(_, d) => {
              if (d) onPick(picker.field, d);
              else setPicker(null);
            }}
          />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filtersCard: { margin: SPACING.md, marginBottom: SPACING.sm, backgroundColor: COLORS.surface },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.background, paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, flex: 1, justifyContent: 'center' },
  dateChipText: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.medium },
  filterRowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: SPACING.sm },
  toggleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.8, flex: 1, minWidth: 150 },
  toggleChipActive: { opacity: 1 },
  toggleChipText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.medium },
  toggleChipTextActive: { color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  loadingText: { marginTop: SPACING.md, color: COLORS.textSecondary },
  error: { color: COLORS.error, fontWeight: 'bold', textAlign: 'center', marginBottom: SPACING.md },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.xl },

  listContent: { padding: SPACING.md, paddingTop: 0 },

  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  customer: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, flex: 1 },
  cancelledBadge: { backgroundColor: COLORS.errorBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm },
  cancelledText: { fontSize: 10, fontWeight: FONT_WEIGHT.bold, color: COLORS.error },

  subText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  separator: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },

  row: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md, flexWrap: 'wrap' },
  label: { fontSize: 10, color: COLORS.textTertiary, textTransform: 'uppercase', fontWeight: FONT_WEIGHT.bold },
  value: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.medium, color: COLORS.textPrimary },

  profitBox: { marginTop: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.sm, alignItems: 'center' },
  profitPosBg: { backgroundColor: COLORS.successBg },
  profitNegBg: { backgroundColor: COLORS.errorBg },
  profitText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  profitPos: { color: COLORS.success },
  profitNeg: { color: COLORS.error },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOWS.medium },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
});
