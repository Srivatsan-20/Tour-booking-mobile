import * as React from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronRight, Calendar, User, Truck, MapPin, DollarSign, FileText, Check } from 'lucide-react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

import { KeyboardAvoidingScrollView, useScrollToFocusedInput } from '../components/KeyboardAvoidingScrollView';
import type { RootStackParamList } from '../navigation/types';
import { updateAgreement } from '../api/agreements';
import { ApiError } from '../api/ApiError';
import type { BusAssignmentConflictResponse } from '../types/api';
import type { IndividualBusRateDraft } from '../types/agreement';
import { ScreenContainer } from '../components/ScreenContainer';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingEdit'>;

export function BookingEditScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const a = route.params.agreement;

  const [busy, setBusy] = React.useState(false);
  const [customerName, setCustomerName] = React.useState(a.customerName ?? '');
  const [phone, setPhone] = React.useState(a.phone ?? '');
  const [fromDate, setFromDate] = React.useState(a.fromDate ?? '');
  const [toDate, setToDate] = React.useState(a.toDate ?? '');
  const [busType, setBusType] = React.useState(a.busType ?? '');
  const [busCount, setBusCount] = React.useState(a.busCount == null ? '' : String(a.busCount));
  const [passengers, setPassengers] = React.useState(a.passengers == null ? '' : String(a.passengers));
  const [placesToCover, setPlacesToCover] = React.useState(a.placesToCover ?? '');

  // Rent calculator inputs (persisted in DB)
  const [perDayRent, setPerDayRent] = React.useState(a.perDayRent == null ? '' : String(a.perDayRent));
  const [includeMountainRent, setIncludeMountainRent] = React.useState(a.includeMountainRent ?? false);
  const [mountainRent, setMountainRent] = React.useState(a.mountainRent == null ? '' : String(a.mountainRent));
  const [useIndividualBusRates, setUseIndividualBusRates] = React.useState(a.useIndividualBusRates ?? false);
  const [individualBusRates, setIndividualBusRates] = React.useState<IndividualBusRateDraft[]>(
    (a.busRates ?? []).map((r) => ({
      perDayRent: r.perDayRent == null ? '' : String(r.perDayRent),
      includeMountainRent: r.includeMountainRent ?? false,
      mountainRent: r.mountainRent == null ? '' : String(r.mountainRent),
    }))
  );

  // Fallback/manual total (prefilled from saved record)
  const [manualTotalAmount, setManualTotalAmount] = React.useState(a.totalAmount == null ? '' : String(a.totalAmount));

  const advancePaid = a.advancePaid == null ? '' : String(a.advancePaid);
  const [notes, setNotes] = React.useState(a.notes ?? '');

  const [picker, setPicker] = React.useState<{
    field: 'fromDate' | 'toDate';
    date: Date;
  } | null>(null);

  React.useEffect(() => {
    navigation.setOptions({ title: t('bookingEdit.title') });
  }, [navigation, t]);

  const totalDays = computeTripDaysInclusive(fromDate, toDate);

  // Keep individual rates array in sync when user edits busCount / toggles modes.
  const syncRates = React.useCallback(
    (nextBusCount: string, next: IndividualBusRateDraft[]): IndividualBusRateDraft[] => {
      const currentCount = parsePositiveInt(nextBusCount);
      // Allow the user to temporarily clear the input while editing.
      // In that case, keep the existing rates array as-is.
      if (!currentCount) return next;
      const targetCount = currentCount;
      if (Array.isArray(next) && next.length === targetCount) return next;

      let rates = Array.isArray(next) ? [...next] : [];
      while (rates.length < targetCount) {
        rates.push({ perDayRent, includeMountainRent, mountainRent });
      }
      if (rates.length > targetCount) {
        rates = rates.slice(0, targetCount);
      }
      return rates;
    },
    [includeMountainRent, mountainRent, perDayRent]
  );

  React.useEffect(() => {
    if (!useIndividualBusRates) return;
    // When entering individual mode (or initial load), ensure busCount is at least 1.
    const normalizedBusCount = String(parsePositiveInt(busCount) ?? 1);
    if (normalizedBusCount !== busCount) setBusCount(normalizedBusCount);
    setIndividualBusRates((r) => syncRates(normalizedBusCount, r));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useIndividualBusRates]);

  const computedTotal = React.useMemo(() => {
    const total = computeTotalAmountMaybe({
      fromDate,
      toDate,
      busCount,
      perDayRent,
      includeMountainRent,
      mountainRent,
      useIndividualBusRates,
      individualBusRates,
    });
    return total;
  }, [
    busCount,
    fromDate,
    includeMountainRent,
    individualBusRates,
    mountainRent,
    perDayRent,
    toDate,
    useIndividualBusRates,
  ]);

  const displayTotalAmount = computedTotal ?? manualTotalAmount;
  const displayBalance = computeBalance(displayTotalAmount, advancePaid);

  const openPicker = (field: 'fromDate' | 'toDate') => {
    const fallback = parseDateDDMMYYYY(fromDate) ?? new Date();
    const current = parseDateDDMMYYYY(field === 'toDate' ? toDate : fromDate) ?? fallback;
    setPicker({ field, date: current });
  };

  const commitPickedDate = (field: 'fromDate' | 'toDate', date: Date) => {
    const formatted = formatDateDDMMYYYY(date);
    if (field === 'fromDate') {
      setFromDate(formatted);
      const to = parseDateDDMMYYYY(toDate);
      if (to && to.getTime() < date.getTime()) {
        setToDate(formatted);
      }
      return;
    }
    setToDate(formatted);
  };

  const onSave = async () => {
    if (!customerName.trim()) {
      Alert.alert(t('common.validationTitle'), t('agreement.validation.customerName'));
      return;
    }

    const parsedBusCount = parsePositiveInt(busCount);
    if (!parsedBusCount) {
      Alert.alert(t('common.validationTitle'), t('agreement.validation.busCount'));
      return;
    }
    const normalizedBusCount = String(parsedBusCount);
    const normalizedRates = useIndividualBusRates ? syncRates(normalizedBusCount, individualBusRates) : individualBusRates;

    if (!displayTotalAmount.trim() || parseAmount(displayTotalAmount) == null) {
      Alert.alert(t('common.validationTitle'), t('bookingEdit.validationTotalAmount'));
      return;
    }

    setBusy(true);
    try {
      const updated = await updateAgreement(a.id, {
        customerName,
        phone,
        fromDate,
        toDate,
        busType,
        busCount: normalizedBusCount,
        passengers,
        placesToCover,

        perDayRent,
        includeMountainRent,
        mountainRent,
        useIndividualBusRates,
        busRates: useIndividualBusRates
          ? normalizedRates.map((r) => ({
            perDayRent: r.perDayRent,
            includeMountainRent: r.includeMountainRent,
            mountainRent: r.mountainRent,
          }))
          : [],

        totalAmount: displayTotalAmount,
        // Advance is recorded via the "Add Advance" flow, so don't overwrite it during edit.
        advancePaid: '',
        notes,
      });

      Alert.alert(t('common.successTitle'), t('bookingEdit.saved'), [
        { text: t('common.ok'), onPress: () => navigation.replace('BookingDetails', { agreement: updated }) },
      ]);
    } catch (e: any) {
      const err = e as unknown;
      const isConflictBody = (x: any): x is BusAssignmentConflictResponse =>
        !!x && typeof x === 'object' && typeof x.message === 'string' && Array.isArray(x.conflicts);

      if (err instanceof ApiError && err.status === 409 && isConflictBody(err.body)) {
        const lines = err.body.conflicts
          .slice(0, 8)
          .map((c) => `• ${c.busVehicleNumber}: ${c.conflictingCustomerName} (${c.conflictingFromDate} - ${c.conflictingToDate})`);

        Alert.alert(
          t('busAvailability.conflictsTitle'),
          [err.body.message, ...lines].join('\n'),
          [
            {
              text: t('home.busAvailability'),
              onPress: () => navigation.navigate('BusAvailability', { focusAgreementId: a.id }),
            },
            { text: t('common.ok') },
          ],
        );
        return;
      }

      Alert.alert(t('common.errorTitle'), (e as any)?.message ? String((e as any).message) : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer style={{ paddingHorizontal: 0 }}>
      <KeyboardAvoidingScrollView contentContainerStyle={styles.scrollContent}>

        <Section title={t('agreement.customerDetails')} icon={<User size={18} color="#4F46E5" />}>
          <Field label={t('agreement.customerName')} value={customerName} onChangeText={setCustomerName} placeholder={t('allTours.customerNamePlaceholder')} />
          <Field label={t('agreement.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder={t('allTours.phonePlaceholder')} />
        </Section>

        <Section title={t('agreement.tripDetails')} icon={<Calendar size={18} color="#4F46E5" />}>
          <View style={styles.row2}>
            <Field label={t('agreement.fromDate')} value={fromDate} placeholder="DD/MM/YYYY" onPress={() => openPicker('fromDate')} icon={<Calendar size={16} color="#6B7280" />} />
            <Field label={t('agreement.toDate')} value={toDate} placeholder="DD/MM/YYYY" onPress={() => openPicker('toDate')} icon={<Calendar size={16} color="#6B7280" />} />
          </View>
          <Field label={t('agreement.busType')} value={busType} onChangeText={setBusType} placeholder={t('allTours.busTypePlaceholder')} />
          <View style={styles.row2}>
            <Field
              label={t('agreement.busCount')}
              value={busCount}
              onChangeText={(v) => {
                setBusCount(v);
                if (useIndividualBusRates) {
                  const n = parsePositiveInt(v);
                  if (n) setIndividualBusRates((r) => syncRates(String(n), r));
                }
              }}
              keyboardType="number-pad"
              placeholder="e.g. 1"
            />
            <Field label={t('agreement.passengers')} value={passengers} onChangeText={setPassengers} keyboardType="number-pad" placeholder="e.g. 20" />
          </View>
          <Field label={t('agreement.placesToCover')} value={placesToCover} onChangeText={setPlacesToCover} placeholder="e.g. Ooty, Mysore" />
        </Section>

        <Section title={t('agreement.rentDetails')} icon={<DollarSign size={18} color="#4F46E5" />}>
          <Field label={t('agreement.totalDays')} value={totalDays ? String(totalDays) : '-'} editable={false} />

          <ToggleField
            label={t('agreement.useIndividualBusRates')}
            value={useIndividualBusRates}
            onValueChange={(value) => {
              setUseIndividualBusRates(value);
              if (value) {
                const normalized = String(parsePositiveInt(busCount) ?? 1);
                setBusCount(normalized);
                setIndividualBusRates((r) => syncRates(normalized, r));
              }
            }}
          />

          {!useIndividualBusRates ? (
            <>
              <Field label={t('agreement.perDayRent')} value={perDayRent} onChangeText={setPerDayRent} keyboardType="number-pad" placeholder="0.00" />
              <ToggleField
                label={t('agreement.includeMountainRent')}
                value={includeMountainRent}
                onValueChange={setIncludeMountainRent}
              />
              {includeMountainRent && (
                <Field
                  label={t('agreement.mountainRent')}
                  value={mountainRent}
                  onChangeText={setMountainRent}
                  keyboardType="number-pad"
                  placeholder="0.00"
                />
              )}
            </>
          ) : (
            <View style={{ gap: 12, marginTop: 4 }}>
              {individualBusRates.map((r, idx) => (
                <View key={idx} style={styles.busRateCard}>
                  <Text style={styles.busRateTitle}>
                    {t('agreement.bus')} {idx + 1}
                  </Text>
                  <Field
                    label={t('agreement.perDayRent')}
                    value={r.perDayRent}
                    onChangeText={(v) =>
                      setIndividualBusRates((prev) => {
                        const next = [...prev];
                        const current = next[idx] ?? { perDayRent: '', includeMountainRent: false, mountainRent: '' };
                        next[idx] = { ...current, perDayRent: v };
                        return next;
                      })
                    }
                    keyboardType="number-pad"
                    placeholder="0.00"
                  />
                  <ToggleField
                    label={t('agreement.includeMountainRent')}
                    value={r.includeMountainRent}
                    onValueChange={(v) =>
                      setIndividualBusRates((prev) => {
                        const next = [...prev];
                        const current = next[idx] ?? { perDayRent: '', includeMountainRent: false, mountainRent: '' };
                        next[idx] = { ...current, includeMountainRent: v };
                        return next;
                      })
                    }
                  />
                  {r.includeMountainRent && (
                    <Field
                      label={t('agreement.mountainRent')}
                      value={r.mountainRent}
                      onChangeText={(v) =>
                        setIndividualBusRates((prev) => {
                          const next = [...prev];
                          const current = next[idx] ?? { perDayRent: '', includeMountainRent: false, mountainRent: '' };
                          next[idx] = { ...current, mountainRent: v };
                          return next;
                        })
                      }
                      keyboardType="number-pad"
                      placeholder="0.00"
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </Section>

        <Section title={t('agreement.paymentDetails')} icon={<FileText size={18} color="#4F46E5" />}>
          <Field
            label={t('agreement.totalAmount')}
            value={displayTotalAmount}
            onChangeText={computedTotal ? undefined : setManualTotalAmount}
            editable={!computedTotal}
            keyboardType="number-pad"
            placeholder="0.00"
          />
          <Field label={t('agreement.advancePaid')} value={advancePaid} editable={false} keyboardType="number-pad" />
          <Field label={t('agreement.balance')} value={displayBalance} editable={false} keyboardType="number-pad" />
          <Field label={t('agreement.notes')} value={notes} onChangeText={setNotes} multiline placeholder={t('bookingDetails.advanceNotePlaceholder')} />
        </Section>

        <View style={{ height: 80 }} />
      </KeyboardAvoidingScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryBtn, busy && styles.disabled]}
          onPress={onSave}
          disabled={busy}
        >
          <Check size={20} color="white" />
          <Text style={styles.primaryBtnText}>{t('common.save')}</Text>
        </Pressable>
      </View>

      {/* Date Picker */}
      {picker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={picker.date}
          mode="date"
          display="default"
          minimumDate={picker.field === 'toDate' ? parseDateDDMMYYYY(fromDate) ?? undefined : undefined}
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
                minimumDate={picker.field === 'toDate' ? parseDateDDMMYYYY(fromDate) ?? undefined : undefined}
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
    </ScreenContainer>
  );
}

function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parsePositiveInt(input: string): number | null {
  const cleaned = input.replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  const n = Number.parseInt(cleaned, 10);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  return n;
}

function computeBalance(totalAmount: string, advancePaid: string): string {
  if (!totalAmount && !advancePaid) return '';
  const total = parseAmount(totalAmount) ?? 0;
  const advance = parseAmount(advancePaid) ?? 0;
  const balance = total - advance;
  const normalized = Object.is(balance, -0) ? 0 : balance;
  return String(normalized);
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

function computeTripDaysInclusive(fromDate: string, toDate: string): number | null {
  const from = parseDateDDMMYYYY(fromDate);
  const to = parseDateDDMMYYYY(toDate);
  if (!from || !to) return null;

  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  if (toUtc < fromUtc) return null;

  const msDay = 24 * 60 * 60 * 1000;
  return Math.floor((toUtc - fromUtc) / msDay) + 1;
}

function computeTotalAmountMaybe(input: {
  fromDate: string;
  toDate: string;
  busCount: string;
  perDayRent: string;
  includeMountainRent: boolean;
  mountainRent: string;
  useIndividualBusRates: boolean;
  individualBusRates: IndividualBusRateDraft[];
}): string | null {
  const days = computeTripDaysInclusive(input.fromDate, input.toDate);
  if (!days) return null;

  if (input.useIndividualBusRates) {
    if (!input.individualBusRates?.length) return null;
    let sum = 0;
    for (const r of input.individualBusRates) {
      const perDay = parseAmount(r.perDayRent);
      if (perDay == null) return null;
      const mountain = r.includeMountainRent ? (parseAmount(r.mountainRent) ?? 0) : 0;
      if (r.includeMountainRent && parseAmount(r.mountainRent) == null) return null;
      sum += perDay * days + mountain;
    }
    return formatMoney(sum);
  }

  const buses = parsePositiveInt(input.busCount);
  const perDay = parseAmount(input.perDayRent);
  if (!buses || perDay == null) return null;
  const mountainPerBus = input.includeMountainRent ? (parseAmount(input.mountainRent) ?? 0) : 0;
  if (input.includeMountainRent && parseAmount(input.mountainRent) == null) return null;
  const total = buses * perDay * days + buses * mountainPerBus;
  return formatMoney(total);
}

function formatMoney(n: number): string {
  const normalized = Object.is(n, -0) ? 0 : n;
  return String(Number(normalized.toFixed(2)));
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function Field(
  props: {
    label: string;
    value: string;
    onChangeText?: (v: string) => void;
    onPress?: () => void;
    editable?: boolean;
    placeholder?: string;
    keyboardType?: 'default' | 'number-pad' | 'phone-pad';
    multiline?: boolean;
    icon?: React.ReactNode;
  }
) {
  const isPressable = typeof props.onPress === 'function';
  const disabled = !isPressable && props.editable === false;
  const scrollOnFocus = useScrollToFocusedInput(props.multiline ? 140 : 90);
  return (
    <View style={[styles.fieldContainer, props.multiline && { flex: 1 }]}>
      <Text style={styles.label}>{props.label}</Text>
      {isPressable ? (
        <Pressable accessibilityRole="button" onPress={props.onPress} style={styles.input}>
          <Text style={[styles.inputText, !props.value ? styles.placeholderText : null]}>
            {props.value || props.placeholder || ''}
          </Text>
          {props.icon}
        </Pressable>
      ) : (
        <TextInput
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder}
          keyboardType={props.keyboardType}
          multiline={props.multiline}
          editable={!disabled}
          onFocus={scrollOnFocus}
          style={[
            styles.input,
            disabled ? styles.inputDisabled : null,
            props.multiline ? styles.multiline : null,
          ]}
        />
      )}
    </View>
  );
}

function ToggleField(props: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.label}>{props.label}</Text>
      <Switch
        value={props.value}
        onValueChange={props.onValueChange}
        trackColor={{ false: '#767577', true: '#4F46E5' }}
        thumbColor={props.value ? 'white' : '#f4f3f4'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 16 },

  section: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sectionContent: { padding: 16, gap: 12 },

  row2: { flexDirection: 'row', gap: 12 },
  fieldContainer: { flex: 1, gap: 6 },

  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  inputText: { fontSize: 15, color: '#111827' },
  placeholderText: { color: '#9CA3AF' },
  inputDisabled: { backgroundColor: '#F3F4F6', color: '#6B7280', borderColor: '#E5E7EB' },
  multiline: { minHeight: 100, textAlignVertical: 'top' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },

  busRateCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 10
  },
  busRateTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryBtn: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

  disabled: { opacity: 0.6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, gap: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  modalBtnPrimary: { backgroundColor: '#111827' },
  modalBtnSecondary: { backgroundColor: '#f3f4f6' },
  modalBtnTextPrimary: { color: 'white', fontWeight: '700' },
  modalBtnTextSecondary: { color: '#111827', fontWeight: '700' },
});
