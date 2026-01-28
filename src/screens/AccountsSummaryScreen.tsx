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

import type { RootStackParamList } from '../navigation/types';
import type { AccountsSummaryItem } from '../types/accounts';
import { listAccounts } from '../api/accounts';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountsSummary'>;

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '-';
  return String(n);
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
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('TourAccount', { agreementId: item.agreementId })}
      >
        <View style={styles.cardTop}>
          <Text style={styles.customer}>{item.customerName}</Text>
          {item.isCancelled ? <Text style={styles.cancelledBadge}>{t('allTours.statusCancelled')}</Text> : null}
        </View>
        <Text style={styles.small}>
          {item.fromDate} - {item.toDate} • {item.busType}
        </Text>
        <View style={styles.row}>
          <Text style={styles.small}>{t('accounts.income')}: {fmtMoney(item.incomeTotalAmount)}</Text>
          <Text style={styles.small}>{t('accounts.totalExpenses')}: {fmtMoney(item.totalExpenses)}</Text>
        </View>
        <Text style={[styles.profit, isProfit ? styles.profitPos : styles.profitNeg]}>
          {t('accounts.profitOrLoss')}: {fmtMoney(item.profitOrLoss)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <Pressable style={styles.filterChip} onPress={() => openPicker('from')}>
          <Text style={styles.filterChipText}>
            {t('accounts.filterFrom')}: {from ? formatDateDDMMYYYY(from) : '-'}
          </Text>
        </Pressable>
        <Pressable style={styles.filterChip} onPress={() => openPicker('to')}>
          <Text style={styles.filterChipText}>
            {t('accounts.filterTo')}: {to ? formatDateDDMMYYYY(to) : '-'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, includeCancelled ? styles.filterChipOn : null]}
          onPress={() => setIncludeCancelled((v) => !v)}
        >
          <Text style={styles.filterChipText}>{t('accounts.includeCancelled')}</Text>
        </Pressable>

        <Pressable style={styles.refreshBtn} onPress={load}>
          <Text style={styles.refreshBtnText}>{t('common.refresh')}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.small}>{t('common.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.refreshBtn} onPress={load}>
            <Text style={styles.refreshBtnText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.agreementId}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, gap: 10 }}
        />
      )}

      {picker ? (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" visible>
            <View style={styles.pickerBackdrop}>
              <View style={styles.pickerCard}>
                <DateTimePicker
                  value={picker.date}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => {
                    if (d) setPicker({ field: picker.field, date: d });
                  }}
                />
                <View style={styles.pickerActions}>
                  <Pressable style={styles.pickerBtn} onPress={() => setPicker(null)}>
                    <Text style={styles.pickerBtnText}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable style={[styles.pickerBtn, styles.pickerBtnPrimary]} onPress={() => onPick(picker.field, picker.date)}>
                    <Text style={[styles.pickerBtnText, styles.pickerBtnTextPrimary]}>{t('common.done')}</Text>
                  </Pressable>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filters: { padding: 14, gap: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterChip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#f3f4f6' },
  filterChipOn: { backgroundColor: '#e0e7ff' },
  filterChipText: { fontWeight: '700', color: '#111827' },
  refreshBtn: { backgroundColor: '#111827', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  refreshBtnText: { color: 'white', fontWeight: '800' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  error: { color: '#b91c1c', fontWeight: '700', textAlign: 'center' },
  card: { backgroundColor: 'white', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  customer: { fontSize: 16, fontWeight: '900', color: '#111827', flex: 1 },
  cancelledBadge: { fontSize: 11, fontWeight: '900', color: '#991b1b' },
  small: { fontSize: 12, color: '#374151', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  profit: { fontSize: 13, fontWeight: '900' },
  profitPos: { color: '#065f46' },
  profitNeg: { color: '#b91c1c' },

  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 },
  pickerCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, gap: 10 },
  pickerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  pickerBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#f3f4f6' },
  pickerBtnPrimary: { backgroundColor: '#111827' },
  pickerBtnText: { fontWeight: '900', color: '#111827' },
  pickerBtnTextPrimary: { color: 'white' },
});
