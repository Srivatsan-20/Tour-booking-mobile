import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useHeaderHeight } from '@react-navigation/elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Bus, Banknote, Calendar } from 'lucide-react-native';

import { listAgreements } from '../api/agreements';
import type { RootStackParamList } from '../navigation/types';
import type { AgreementResponse } from '../types/api';
import { ListCard } from '../components/ListCard';
import { ScreenContainer } from '../components/ScreenContainer';

type Props = NativeStackScreenProps<RootStackParamList, 'AllTours'>;

type StatusFilter = 'all' | 'upcoming' | 'past' | 'cancelled';
type BalanceFilter = 'any' | 'pending' | 'paid';

function useKeyboardHeight(): number {
  const [height, setHeight] = React.useState(0);

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const h = e?.endCoordinates?.height;
      setHeight(typeof h === 'number' ? h : 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}

function formatDateDDMMYYYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function parseDateDDMMYYYY(input: string): Date | null {
  const m = input.trim().match(/^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

function isPaid(balance: number | null | undefined): boolean {
  if (balance == null) return false;
  return balance <= 0;
}

function statusOf(a: AgreementResponse, todayMs: number): 'cancelled' | 'upcoming' | 'past' | 'unknown' {
  if (a.isCancelled) return 'cancelled';
  const to = parseDateDDMMYYYY(a.toDate);
  if (!to) return 'unknown';
  return to.getTime() >= todayMs ? 'upcoming' : 'past';
}

function compareFromDateAsc(a: AgreementResponse, b: AgreementResponse): number {
  const aFrom = parseDateDDMMYYYY(a.fromDate)?.getTime() ?? Number.POSITIVE_INFINITY;
  const bFrom = parseDateDDMMYYYY(b.fromDate)?.getTime() ?? Number.POSITIVE_INFINITY;
  return aFrom - bFrom;
}

function compareFromDateDesc(a: AgreementResponse, b: AgreementResponse): number {
  return -compareFromDateAsc(a, b);
}

function chipLabelForStatus(t: (key: string) => string, value: StatusFilter): string {
  if (value === 'upcoming') return t('allTours.statusUpcoming');
  if (value === 'past') return t('allTours.statusPast');
  if (value === 'cancelled') return t('allTours.statusCancelled');
  return t('allTours.statusAll');
}

function chipLabelForBalance(t: (key: string) => string, value: BalanceFilter): string {
  if (value === 'pending') return t('allTours.balancePending');
  if (value === 'paid') return t('allTours.balancePaid');
  return t('allTours.balanceAny');
}

export function AllToursScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const headerHeight = useHeaderHeight();
  const listRef = React.useRef<FlatList<AgreementResponse>>(null);

  const keyboardHeight = useKeyboardHeight();
  const compactFilters = keyboardHeight > 0;

  const [all, setAll] = React.useState<AgreementResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [balanceFilter, setBalanceFilter] = React.useState<BalanceFilter>('any');
  const [customerName, setCustomerName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [busType, setBusType] = React.useState('');
  const [rangeFrom, setRangeFrom] = React.useState('');
  const [rangeTo, setRangeTo] = React.useState('');

  const [picker, setPicker] = React.useState<{
    field: 'rangeFrom' | 'rangeTo';
    date: Date;
  } | null>(null);

  React.useEffect(() => {
    navigation.setOptions({ title: t('allTours.title') });
  }, [navigation, t]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listAgreements({ includeCancelled: true });
      setAll(items);
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

  const clearFilters = React.useCallback(() => {
    setStatus('all');
    setBalanceFilter('any');
    setCustomerName('');
    setPhone('');
    setBusType('');
    setRangeFrom('');
    setRangeTo('');
  }, []);

  const activeFilterCount = React.useMemo(() => {
    let n = 0;
    if (status !== 'all') n++;
    if (balanceFilter !== 'any') n++;
    if (customerName.trim()) n++;
    if (phone.trim()) n++;
    if (busType.trim()) n++;
    if (rangeFrom.trim()) n++;
    if (rangeTo.trim()) n++;
    return n;
  }, [balanceFilter, busType, customerName, phone, rangeFrom, rangeTo, status]);

  const filtered = React.useMemo(() => {
    const todayMs = startOfTodayMs();
    const nameNeedle = normalizeText(customerName);
    const phoneNeedle = normalizePhone(phone);
    const busNeedle = normalizeText(busType);
    const fromMs = rangeFrom.trim() ? parseDateDDMMYYYY(rangeFrom)?.getTime() ?? null : null;
    const toMs = rangeTo.trim() ? parseDateDDMMYYYY(rangeTo)?.getTime() ?? null : null;

    const items = all.filter((a) => {
      const st = statusOf(a, todayMs);
      if (status === 'upcoming' && st !== 'upcoming') return false;
      if (status === 'past' && st !== 'past') return false;
      if (status === 'cancelled' && st !== 'cancelled') return false;

      if (nameNeedle) {
        const hay = normalizeText(a.customerName ?? '');
        if (!hay.includes(nameNeedle)) return false;
      }

      if (phoneNeedle) {
        const hay = normalizePhone(a.phone ?? '');
        if (!hay.includes(phoneNeedle)) return false;
      }

      if (busNeedle) {
        const hay = normalizeText(a.busType ?? '');
        if (!hay.includes(busNeedle)) return false;
      }

      if (balanceFilter !== 'any') {
        const paid = isPaid(a.balance);
        if (balanceFilter === 'paid' && !paid) return false;
        if (balanceFilter === 'pending' && paid) return false;
      }

      if (fromMs != null || toMs != null) {
        const tripFrom = parseDateDDMMYYYY(a.fromDate)?.getTime();
        const tripTo = parseDateDDMMYYYY(a.toDate)?.getTime();
        if (tripFrom == null || tripTo == null) return false;

        if (fromMs != null && tripTo < fromMs) return false;
        if (toMs != null && tripFrom > toMs) return false;
      }

      return true;
    });

    if (status === 'upcoming') return items.sort(compareFromDateAsc);
    if (status === 'past' || status === 'cancelled') return items.sort(compareFromDateDesc);
    return items.sort(compareFromDateDesc);
  }, [all, balanceFilter, busType, customerName, phone, rangeFrom, rangeTo, status]);

  const openPicker = React.useCallback(
    (field: 'rangeFrom' | 'rangeTo') => {
      const fallback = parseDateDDMMYYYY(rangeTo) ?? parseDateDDMMYYYY(rangeFrom) ?? new Date();
      const current = parseDateDDMMYYYY(field === 'rangeFrom' ? rangeFrom : rangeTo) ?? fallback;
      setPicker({ field, date: current });
    },
    [rangeFrom, rangeTo],
  );

  const commitPickedDate = React.useCallback(
    (field: 'rangeFrom' | 'rangeTo', date: Date) => {
      const formatted = formatDateDDMMYYYY(date);
      if (field === 'rangeFrom') {
        setRangeFrom(formatted);
        const to = parseDateDDMMYYYY(rangeTo);
        if (to && to.getTime() < date.getTime()) setRangeTo(formatted);
      } else {
        setRangeTo(formatted);
      }
    },
    [rangeTo],
  );

  const scrollResultsToTop = React.useCallback(() => {
    // Keep results visible instantly while typing.
    // (No animation to avoid jitter on every focus.)
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  return (
    <ScreenContainer style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        <FlatList
          ref={listRef}
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={load}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={filtered.length === 0 ? styles.listEmptyContainer : styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={[styles.filtersPanel, compactFilters ? styles.filtersPanelCompact : null]}>
              <View style={styles.headerTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={styles.title}>{t('allTours.title')}</Text>
                  {loading && all.length === 0 ? <ActivityIndicator color="#2563EB" /> : null}
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={clearFilters}
                  style={[styles.smallBtn, activeFilterCount === 0 ? styles.smallBtnDisabled : null]}
                  disabled={activeFilterCount === 0}
                >
                  <Text style={[styles.smallBtnText, activeFilterCount === 0 ? styles.smallBtnTextDisabled : null]}>
                    {t('allTours.clearFilters')}
                    {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                  </Text>
                </Pressable>
              </View>

              {/* When keyboard is open, auto-collapse advanced filters so results are visible instantly. */}
              {!compactFilters ? (
                <>
                  <View style={styles.chipsRow}>
                    <Text style={styles.chipsLabel}>{t('allTours.statusLabel')}</Text>
                    <View style={styles.chipsWrap}>
                      {(['all', 'upcoming', 'past', 'cancelled'] as StatusFilter[]).map((v) => (
                        <Chip key={v} label={chipLabelForStatus(t, v)} active={status === v} onPress={() => setStatus(v)} />
                      ))}
                    </View>
                  </View>

                  <View style={styles.chipsRow}>
                    <Text style={styles.chipsLabel}>{t('allTours.balanceLabel')}</Text>
                    <View style={styles.chipsWrap}>
                      {(['any', 'pending', 'paid'] as BalanceFilter[]).map((v) => (
                        <Chip key={v} label={chipLabelForBalance(t, v)} active={balanceFilter === v} onPress={() => setBalanceFilter(v)} />
                      ))}
                    </View>
                  </View>
                </>
              ) : null}

              <View style={styles.filtersGrid}>
                <LabeledInput
                  label={t('agreement.customerName')}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder={t('allTours.customerNamePlaceholder')}
                  hideLabel={compactFilters}
                  dense={compactFilters}
                  onFocus={scrollResultsToTop}
                />
                <LabeledInput
                  label={t('agreement.phone')}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder={t('allTours.phonePlaceholder')}
                  hideLabel={compactFilters}
                  dense={compactFilters}
                  onFocus={scrollResultsToTop}
                />
                <LabeledInput
                  label={t('agreement.busType')}
                  value={busType}
                  onChangeText={setBusType}
                  placeholder={t('allTours.busTypePlaceholder')}
                  hideLabel={compactFilters}
                  dense={compactFilters}
                  onFocus={scrollResultsToTop}
                />

                {!compactFilters ? (
                  <>
                    <View style={{ gap: 6 }}>
                      <Text style={styles.label}>{t('allTours.dateFrom')}</Text>
                      <Pressable accessibilityRole="button" onPress={() => openPicker('rangeFrom')} style={styles.inputBox}>
                        <Text style={[styles.inputText, !rangeFrom ? styles.placeholderText : null]}>{rangeFrom || 'DD/MM/YYYY'}</Text>
                        <Calendar size={18} color="#6B7280" />
                      </Pressable>
                    </View>
                    <View style={{ gap: 6 }}>
                      <Text style={styles.label}>{t('allTours.dateTo')}</Text>
                      <Pressable accessibilityRole="button" onPress={() => openPicker('rangeTo')} style={styles.inputBox}>
                        <Text style={[styles.inputText, !rangeTo ? styles.placeholderText : null]}>{rangeTo || 'DD/MM/YYYY'}</Text>
                        <Calendar size={18} color="#6B7280" />
                      </Pressable>
                    </View>
                  </>
                ) : null}
              </View>

              {!compactFilters && error ? (
                <View style={styles.stateBox}>
                  <Text style={styles.note}>{t('allTours.error')}</Text>
                  <Text style={styles.noteSmall} numberOfLines={4}>
                    {error}
                  </Text>
                  <Pressable style={styles.retryBtn} onPress={load}>
                    <Text style={styles.retryBtnText}>{t('allTours.retry')}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={!loading && !error ? <Text style={styles.note}>{t('allTours.empty')}</Text> : null}
          renderItem={({ item }) => {
            const st = statusOf(item, startOfTodayMs());

            let statusProps = { text: 'Unknown', bg: '#EFF6FF', color: '#1D4ED8' };
            if (st === 'upcoming') statusProps = { text: t('allTours.statusUpcoming'), bg: '#ECFDF5', color: '#047857' };
            else if (st === 'past') statusProps = { text: t('allTours.statusPast'), bg: '#F3F4F6', color: '#374151' };
            else if (st === 'cancelled') statusProps = { text: t('allTours.statusCancelled'), bg: '#FEF2F2', color: '#B91C1C' };

            return (
              <ListCard
                title={item.customerName}
                subtitle={`${item.fromDate} → ${item.toDate}`}
                meta1={{
                  text: `${item.busType} (${item.busCount || 1})`,
                  icon: <Bus size={14} color="#6B7280" />
                }}
                meta2={item.totalAmount != null ? {
                  text: `Bal: ${item.balance ?? 0}`,
                  icon: <Banknote size={14} color="#6B7280" />
                } : undefined}
                status={statusProps}
                onPress={() => navigation.navigate('BookingDetails', { agreement: item })}
              />
            );
          }}
        />

        {/* Date Picker */}
        {picker && Platform.OS === 'android' ? (
          <DateTimePicker
            value={picker.date}
            mode="date"
            display="default"
            minimumDate={picker.field === 'rangeTo' ? parseDateDDMMYYYY(rangeFrom) ?? undefined : undefined}
            onChange={(event, selectedDate) => {
              setPicker(null);
              if (!selectedDate) return;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((event as any)?.type && (event as any).type !== 'set') return;
              commitPickedDate(picker.field, selectedDate);
            }}
          />
        ) : null}

        {picker && Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" visible onRequestClose={() => setPicker(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <DateTimePicker
                  value={picker.date}
                  mode="date"
                  display="spinner"
                  minimumDate={picker.field === 'rangeTo' ? parseDateDDMMYYYY(rangeFrom) ?? undefined : undefined}
                  onChange={(_, selectedDate) => {
                    if (!selectedDate) return;
                    setPicker((p) => (p ? { ...p, date: selectedDate } : p));
                  }}
                />

                <View style={styles.modalActions}>
                  <Pressable onPress={() => setPicker(null)} style={[styles.modalBtn, styles.modalBtnSecondary]}>
                    <Text style={styles.modalBtnTextSecondary}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      commitPickedDate(picker.field, picker.date);
                      setPicker(null);
                    }}
                    style={[styles.modalBtn, styles.modalBtnPrimary]}
                  >
                    <Text style={styles.modalBtnTextPrimary}>{t('common.done')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        ) : null}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function LabeledInput(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  onFocus?: TextInputProps['onFocus'];
  onBlur?: TextInputProps['onBlur'];
  hideLabel?: boolean;
  dense?: boolean;
}) {
  return (
    <View style={{ gap: props.dense ? 4 : 6 }}>
      {!props.hideLabel ? <Text style={styles.label}>{props.label}</Text> : null}
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        keyboardType={props.keyboardType}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        style={[styles.inputBox, props.dense ? styles.inputBoxDense : null, styles.textInput]}
      />
    </View>
  );
}

function Chip(props: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={[styles.chip, props.active ? styles.chipActive : null]}
    >
      <Text style={[styles.chipText, props.active ? styles.chipTextActive : null]}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filtersPanel: {
    padding: 16,
    paddingBottom: 12,
    gap: 12,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filtersPanelCompact: { paddingBottom: 8, gap: 10 },
  listContainer: { padding: 16, paddingBottom: 24 },
  listEmptyContainer: { flexGrow: 1, padding: 16, paddingBottom: 24 },

  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },

  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  smallBtnDisabled: { backgroundColor: '#f3f4f6', borderColor: 'transparent' },
  smallBtnText: { fontSize: 13, fontWeight: '700', color: '#111827' },
  smallBtnTextDisabled: { color: '#9ca3af' },

  chipsRow: { gap: 8 },
  chipsLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: 'white' },

  filtersGrid: { gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  inputBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputBoxDense: {
    paddingVertical: 8,
  },
  textInput: { color: '#111827', fontSize: 15, flex: 1 },
  inputText: { fontSize: 15, color: '#111827' },
  placeholderText: { color: '#9ca3af' },

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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: 'white', borderRadius: 12, padding: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  modalBtnPrimary: { backgroundColor: '#111827' },
  modalBtnSecondary: { backgroundColor: '#f3f4f6' },
  modalBtnTextPrimary: { color: 'white', fontWeight: '800' },
  modalBtnTextSecondary: { color: '#111827', fontWeight: '800' },
});
