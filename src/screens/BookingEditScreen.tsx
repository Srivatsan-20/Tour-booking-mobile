import * as React from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { KeyboardAvoidingScrollView, useScrollToFocusedInput } from '../components/KeyboardAvoidingScrollView';
import type { RootStackParamList } from '../navigation/types';
import { updateAgreement } from '../api/agreements';
import { ApiError } from '../api/ApiError';
import type { BusAssignmentConflictResponse } from '../types/api';
import type { IndividualBusRateDraft } from '../types/agreement';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS } from '../theme';

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
    const normalizedBusCount = String(parsePositiveInt(busCount) ?? 1);
    if (normalizedBusCount !== busCount) setBusCount(normalizedBusCount);
    setIndividualBusRates((r) => syncRates(normalizedBusCount, r));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useIndividualBusRates]);

  const computedTotal = React.useMemo(() => {
    return computeTotalAmountMaybe({
      fromDate,
      toDate,
      busCount,
      perDayRent,
      includeMountainRent,
      mountainRent,
      useIndividualBusRates,
      individualBusRates,
    });
  }, [busCount, fromDate, includeMountainRent, individualBusRates, mountainRent, perDayRent, toDate, useIndividualBusRates]);

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
        advancePaid: '', // Don't overwrite
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
    <Screen style={styles.container}>
      <KeyboardAvoidingScrollView contentContainerStyle={styles.scrollContent}>

        <Card>
          <Text style={styles.cardTitle}>{t('agreement.customerDetails')}</Text>
          <Input label={t('agreement.customerName')} value={customerName} onChangeText={setCustomerName} placeholder="Enter name" />
          <Input label={t('agreement.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Enter phone" />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>{t('agreement.tripDetails')}</Text>
          <Pressable onPress={() => openPicker('fromDate')}>
            <View pointerEvents="none">
              <Input label={t('agreement.fromDate')} value={fromDate} placeholder="DD/MM/YYYY" rightIcon={<MaterialCommunityIcons name="calendar" size={20} color={COLORS.textTertiary} />} editable={false} />
            </View>
          </Pressable>
          <Pressable onPress={() => openPicker('toDate')}>
            <View pointerEvents="none">
              <Input label={t('agreement.toDate')} value={toDate} placeholder="DD/MM/YYYY" rightIcon={<MaterialCommunityIcons name="calendar" size={20} color={COLORS.textTertiary} />} editable={false} />
            </View>
          </Pressable>

          <Input label={t('agreement.busType')} value={busType} onChangeText={setBusType} placeholder="AC / Non-AC" />

          <Input
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
            placeholder="Number of buses"
          />

          <Input label={t('agreement.passengers')} value={passengers} onChangeText={setPassengers} keyboardType="number-pad" placeholder="Count" />
          <Input label={t('agreement.placesToCover')} value={placesToCover} onChangeText={setPlacesToCover} placeholder="Route details" />
        </Card>

        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{t('agreement.rentDetails')}</Text>
            {totalDays ? <Text style={styles.badge}>{totalDays} Days</Text> : null}
          </View>

          <View style={[styles.toggleRow, { marginBottom: SPACING.md }]}>
            <Text style={styles.label}>{t('agreement.useIndividualBusRates')}</Text>
            <Switch
              value={useIndividualBusRates}
              onValueChange={(value) => {
                setUseIndividualBusRates(value);
                if (value) {
                  const normalized = String(parsePositiveInt(busCount) ?? 1);
                  setBusCount(normalized);
                  setIndividualBusRates((r) => syncRates(normalized, r));
                }
              }}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={useIndividualBusRates ? COLORS.primary : '#f4f3f4'}
            />
          </View>

          {!useIndividualBusRates ? (
            <>
              <Input label={t('agreement.perDayRent')} value={perDayRent} onChangeText={setPerDayRent} keyboardType="number-pad" prefix="₹" />

              <View style={[styles.toggleRow, { marginBottom: SPACING.sm }]}>
                <Text style={styles.label}>{t('agreement.includeMountainRent')}</Text>
                <Switch
                  value={includeMountainRent}
                  onValueChange={setIncludeMountainRent}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={includeMountainRent ? COLORS.primary : '#f4f3f4'}
                />
              </View>

              {includeMountainRent && (
                <Input label={t('agreement.mountainRent')} value={mountainRent} onChangeText={setMountainRent} keyboardType="number-pad" />
              )}
            </>
          ) : (
            <View style={{ gap: SPACING.md }}>
              {individualBusRates.map((r, idx) => (
                <View key={idx} style={styles.subCard}>
                  <Text style={styles.subCardTitle}>{t('agreement.bus')} {idx + 1}</Text>

                  <Input
                    label={t('agreement.perDayRent')}
                    value={r.perDayRent}
                    onChangeText={(v) =>
                      setIndividualBusRates((prev) => {
                        const next = [...prev];
                        next[idx] = { ...(next[idx] ?? { perDayRent: '', includeMountainRent: false, mountainRent: '' }), perDayRent: v };
                        return next;
                      })
                    }
                    keyboardType="number-pad"
                  />

                  <View style={[styles.toggleRow, { marginBottom: SPACING.sm }]}>
                    <Text style={styles.label}>{t('agreement.includeMountainRent')}</Text>
                    <Switch
                      value={r.includeMountainRent}
                      onValueChange={(v) =>
                        setIndividualBusRates((prev) => {
                          const next = [...prev];
                          next[idx] = { ...(next[idx] ?? { perDayRent: '', includeMountainRent: false, mountainRent: '' }), includeMountainRent: v };
                          return next;
                        })
                      }
                      trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                      thumbColor={r.includeMountainRent ? COLORS.primary : '#f4f3f4'}
                    />
                  </View>

                  {r.includeMountainRent && (
                    <Input
                      label={t('agreement.mountainRent')}
                      value={r.mountainRent}
                      onChangeText={(v) =>
                        setIndividualBusRates((prev) => {
                          const next = [...prev];
                          next[idx] = { ...(next[idx] ?? { perDayRent: '', includeMountainRent: false, mountainRent: '' }), mountainRent: v };
                          return next;
                        })
                      }
                      keyboardType="number-pad"
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>{t('agreement.paymentDetails')}</Text>
          <Input
            label={t('agreement.totalAmount')}
            value={displayTotalAmount}
            onChangeText={computedTotal ? undefined : setManualTotalAmount}
            editable={!computedTotal}
            keyboardType="number-pad"
            style={computedTotal ? { backgroundColor: COLORS.background } : undefined}
          />
          <Input label={t('agreement.advancePaid')} value={advancePaid} editable={false} style={{ backgroundColor: COLORS.background }} />
          <Input label={t('agreement.balance')} value={displayBalance} editable={false} style={{ backgroundColor: COLORS.background, fontWeight: 'bold', color: COLORS.primary }} />
          <Input label={t('agreement.notes')} value={notes} onChangeText={setNotes} multiline style={{ minHeight: 100, textAlignVertical: 'top' }} />
        </Card>

        <Button
          title={t('common.save')}
          onPress={onSave}
          loading={busy}
          size="lg"
          style={{ marginBottom: SPACING.xl }}
        />

        {/* Date Picker Modal */}
        {(picker && Platform.OS !== 'android') && (
          <Modal transparent animationType="fade" visible onRequestClose={() => setPicker(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <DateTimePicker
                  value={picker.date}
                  mode="date"
                  display="spinner"
                  minimumDate={picker.field === 'toDate' ? parseDateDDMMYYYY(fromDate) ?? undefined : undefined}
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
            minimumDate={picker.field === 'toDate' ? parseDateDDMMYYYY(fromDate) ?? undefined : undefined}
            onChange={(event, selectedDate) => {
              setPicker(null);
              if (selectedDate && event.type === 'set') commitPickedDate(picker.field, selectedDate);
            }}
          />
        )}

      </KeyboardAvoidingScrollView>
    </Screen>
  );
}

// Utils (Same as before)
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
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function computeBalance(totalAmount: string, advancePaid: string): string {
  if (!totalAmount && !advancePaid) return '';
  const total = parseAmount(totalAmount) ?? 0;
  const advance = parseAmount(advancePaid) ?? 0;
  return String(Object.is(total - advance, -0) ? 0 : total - advance);
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
  return Math.floor((toUtc - fromUtc) / (24 * 60 * 60 * 1000)) + 1;
}

function formatMoney(n: number): string {
  return String(Number((Object.is(n, -0) ? 0 : n).toFixed(2)));
}

function computeTotalAmountMaybe(input: any): string | null {
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
  return formatMoney(buses * perDay * days + buses * mountainPerBus);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  badge: {
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  subCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subCardTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    width: '100%',
  },
});
