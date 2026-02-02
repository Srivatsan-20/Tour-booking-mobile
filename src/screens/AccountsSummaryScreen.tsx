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
import { Bus, Calendar, DollarSign, RefreshCw } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '../navigation/types';
import type { AccountsSummaryItem } from '../types/accounts';
import { listAccounts } from '../api/accounts';
import { ScreenContainer } from '../components/ScreenContainer';
import { ListCard } from '../components/ListCard';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountsSummary'>;

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '-';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
      <ListCard
        title={item.customerName}
        subtitle={`${item.fromDate} - ${item.toDate}`}
        meta1={{
          text: item.busType,
          icon: <Bus size={14} color="#6B7280" />
        }}
        meta2={{
          text: `${t('accounts.profitOrLoss')}: ${fmtMoney(item.profitOrLoss)}`,
          icon: <DollarSign size={14} color={isProfit ? '#059669' : '#DC2626'} />,
          // Highlight profit/loss
        }}
        status={item.isCancelled ? {
          text: t('allTours.statusCancelled'),
          bg: '#FEF2F2',
          color: '#B91C1C'
        } : undefined}
        onPress={() => navigation.navigate('TourAccount', { agreementId: item.agreementId })}
      />
    );
  };

  return (
    <ScreenContainer style={{ flex: 1 }}>
      <View style={styles.filtersPanel}>
        <Text style={styles.filterTitle}>{t('common.filters', 'Filters')}</Text>
        <View style={styles.filterRow}>
          <Pressable style={styles.filterChip} onPress={() => openPicker('from')}>
            <Calendar size={14} color="#4B5563" />
            <Text style={styles.filterChipText}>
              {t('accounts.filterFrom')}: {from ? formatDateDDMMYYYY(from) : '-'}
            </Text>
          </Pressable>
          <Pressable style={styles.filterChip} onPress={() => openPicker('to')}>
            <Calendar size={14} color="#4B5563" />
            <Text style={styles.filterChipText}>
              {t('accounts.filterTo')}: {to ? formatDateDDMMYYYY(to) : '-'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterChip, includeCancelled ? styles.filterChipOn : null]}
            onPress={() => setIncludeCancelled((v) => !v)}
          >
            <Text style={[styles.filterChipText, includeCancelled && { color: '#4F46E5' }]}>
              {t('accounts.includeCancelled')}
            </Text>
          </Pressable>

          <Pressable style={styles.refreshBtn} onPress={load}>
            <RefreshCw size={14} color="white" />
            <Text style={styles.refreshBtnText}>{t('common.refresh')}</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.small}>{t('common.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.agreementId}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, gap: 10 }}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('common.noData', 'No accounts found.')}</Text>}
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filtersPanel: {
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipOn: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151'
  },

  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  refreshBtnText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '700'
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  error: { color: '#b91c1c', fontWeight: '700', textAlign: 'center' },
  retryBtn: { backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryBtnText: { color: 'white', fontWeight: '700' },
  small: { fontSize: 13, color: '#6B7280' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 20 },

  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 },
  pickerCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, gap: 10 },
  pickerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  pickerBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#f3f4f6' },
  pickerBtnPrimary: { backgroundColor: '#111827' },
  pickerBtnText: { fontWeight: '900', color: '#111827' },
  pickerBtnTextPrimary: { color: 'white' },
});
