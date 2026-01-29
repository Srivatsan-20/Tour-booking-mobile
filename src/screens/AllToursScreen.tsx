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
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useHeaderHeight } from '@react-navigation/elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { listAgreements } from '../api/agreements';
import type { RootStackParamList } from '../navigation/types';
import type { AgreementResponse } from '../types/api';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS } from '../theme';

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
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
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
        ListHeaderComponent={
          <View style={[styles.filtersPanel, compactFilters ? styles.filtersPanelCompact : null]}>
            <View style={styles.headerTopRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                {loading && all.length === 0 ? <ActivityIndicator color={COLORS.primary} size="small" /> : null}
              </View>

              <Button
                title={t('allTours.clearFilters') + (activeFilterCount > 0 ? ` (${activeFilterCount})` : '')}
                onPress={clearFilters}
                variant="ghost"
                size="sm"
                disabled={activeFilterCount === 0}
              />
            </View>

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
              <Input
                label={compactFilters ? undefined : t('agreement.customerName')}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder={t('allTours.customerNamePlaceholder')}
                containerStyle={{ marginBottom: compactFilters ? SPACING.xs : SPACING.sm }}
                onFocus={scrollResultsToTop}
              />
              <Input
                label={compactFilters ? undefined : t('agreement.phone')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder={t('allTours.phonePlaceholder')}
                rightIcon={<MaterialCommunityIcons name="phone" size={20} color={COLORS.textTertiary} />}
                containerStyle={{ marginBottom: compactFilters ? SPACING.xs : SPACING.sm }}
                onFocus={scrollResultsToTop}
              />
              <Input
                label={compactFilters ? undefined : t('agreement.busType')}
                value={busType}
                onChangeText={setBusType}
                placeholder={t('allTours.busTypePlaceholder')}
                rightIcon={<MaterialCommunityIcons name="bus" size={20} color={COLORS.textTertiary} />}
                containerStyle={{ marginBottom: compactFilters ? SPACING.xs : SPACING.sm }}
                onFocus={scrollResultsToTop}
              />

              {!compactFilters ? (
                <>
                  <Pressable onPress={() => openPicker('rangeFrom')}>
                    <View pointerEvents="none">
                      <Input label={t('allTours.dateFrom')} value={rangeFrom} placeholder="DD/MM/YYYY" editable={false} rightIcon={<MaterialCommunityIcons name="calendar" size={20} color={COLORS.textTertiary} />} />
                    </View>
                  </Pressable>
                  <Pressable onPress={() => openPicker('rangeTo')}>
                    <View pointerEvents="none">
                      <Input label={t('allTours.dateTo')} value={rangeTo} placeholder="DD/MM/YYYY" editable={false} rightIcon={<MaterialCommunityIcons name="calendar" size={20} color={COLORS.textTertiary} />} />
                    </View>
                  </Pressable>
                </>
              ) : null}
            </View>

            {!compactFilters && error ? (
              <View style={styles.stateBox}>
                <Text style={styles.note}>{t('allTours.error')}</Text>
                <Text style={styles.noteSmall}>{error}</Text>
                <Button title={t('allTours.retry')} onPress={() => void load()} size="sm" />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={!loading && !error ? <Text style={styles.note}>{t('allTours.empty')}</Text> : null}
        renderItem={({ item }) => {
          const st = statusOf(item, startOfTodayMs());
          return (
            <Card style={styles.card} onPress={() => navigation.navigate('BookingDetails', { agreement: item })}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle}>{item.customerName}</Text>
                <StatusBadge status={st} t={t} />
              </View>
              <Text style={styles.cardSub}>{`${item.fromDate} → ${item.toDate}`}</Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardMeta}>{item.phone || '-'}</Text>
                <Text style={styles.cardMeta}>{`${item.busType || '-'} · ${t('agreement.busCount')}: ${item.busCount ?? '-'}`}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardMeta}>{`${t('agreement.totalAmount')}: ${item.totalAmount ?? '-'}`}</Text>
                <Text style={[styles.cardMeta, { color: isPaid(item.balance) ? COLORS.success : COLORS.error }]}>{`${t('agreement.balance')}: ${item.balance ?? '-'}`}</Text>
              </View>
            </Card>
          );
        }}
      />

      {/* Date Picker */}
      {(picker && Platform.OS !== 'android') && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setPicker(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <DateTimePicker
                value={picker.date}
                mode="date"
                display="spinner"
                minimumDate={picker.field === 'rangeTo' ? parseDateDDMMYYYY(rangeFrom) ?? undefined : undefined}
                onChange={(_, selectedDate) => {
                  if (selectedDate) setPicker((p) => (p ? { ...p, date: selectedDate } : p));
                }}
              />
              <View style={styles.modalActions}>
                <Button title={t('common.cancel')} onPress={() => setPicker(null)} variant="ghost" size="sm" style={{ flex: 1 }} />
                <Button title={t('common.done')} onPress={() => { commitPickedDate(picker.field, picker.date); setPicker(null); }} size="sm" style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>
      )}
      {(picker && Platform.OS === 'android') && (
        <DateTimePicker
          value={picker.date}
          mode="date"
          display="default"
          minimumDate={picker.field === 'rangeTo' ? parseDateDDMMYYYY(rangeFrom) ?? undefined : undefined}
          onChange={(event, selectedDate) => {
            setPicker(null);
            if (selectedDate && event.type === 'set') commitPickedDate(picker.field, selectedDate);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function Chip(props: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.chip,
        props.active ? styles.chipActive : null,
      ]}
    >
      <Text style={[styles.chipText, props.active ? styles.chipTextActive : null]}>{props.label}</Text>
    </Pressable>
  );
}

function StatusBadge(props: {
  status: 'cancelled' | 'upcoming' | 'past' | 'unknown';
  t: (key: string) => string;
}) {
  const label =
    props.status === 'cancelled'
      ? props.t('allTours.statusCancelled')
      : props.status === 'past'
        ? props.t('allTours.statusPast')
        : props.status === 'upcoming'
          ? props.t('allTours.statusUpcoming')
          : props.t('allTours.statusUnknown');

  const badgeStyle =
    props.status === 'cancelled'
      ? styles.badgeCancelled
      : props.status === 'past'
        ? styles.badgePast
        : props.status === 'upcoming'
          ? styles.badgeUpcoming
          : styles.badgeUnknown;

  const textStyle =
    props.status === 'cancelled'
      ? styles.badgeTextCancelled
      : props.status === 'past'
        ? styles.badgeTextPast
        : props.status === 'upcoming'
          ? styles.badgeTextUpcoming
          : styles.badgeTextUnknown;

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filtersPanel: {
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.soft,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  filtersPanelCompact: { paddingBottom: SPACING.sm, gap: SPACING.sm },
  listContainer: { padding: SPACING.md, paddingBottom: SPACING.xl },
  listEmptyContainer: { flexGrow: 1, padding: SPACING.md, paddingBottom: SPACING.xl },

  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },

  chipsRow: { gap: SPACING.xs },
  chipsLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },

  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  chipTextActive: { color: COLORS.surface },

  filtersGrid: { gap: SPACING.xs },

  note: { color: COLORS.textSecondary, textAlign: 'center', marginVertical: SPACING.lg },
  noteSmall: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, textAlign: 'center', marginBottom: SPACING.sm },
  stateBox: { paddingVertical: SPACING.md, gap: SPACING.sm, alignItems: 'center' },

  card: { marginBottom: SPACING.md },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, flex: 1 },
  cardSub: { color: COLORS.textSecondary, marginTop: 4, marginBottom: 8, fontSize: FONT_SIZE.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm, marginTop: 2 },
  cardMeta: { color: COLORS.textTertiary, fontWeight: FONT_WEIGHT.medium, fontSize: FONT_SIZE.xs, flexShrink: 1 },

  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.round },
  badgeText: { fontSize: 10, fontWeight: FONT_WEIGHT.bold },
  badgeUpcoming: { backgroundColor: COLORS.successBg },
  badgeTextUpcoming: { color: COLORS.success },
  badgePast: { backgroundColor: COLORS.background }, // Was gray
  badgeTextPast: { color: COLORS.textSecondary },
  badgeCancelled: { backgroundColor: COLORS.errorBg },
  badgeTextCancelled: { color: COLORS.error },
  badgeUnknown: { backgroundColor: COLORS.primaryLight },
  badgeTextUnknown: { color: COLORS.primary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOWS.medium },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
});
