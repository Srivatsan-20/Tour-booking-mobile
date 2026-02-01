import * as React from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronRight, Calendar, User, Truck, MapPin, DollarSign, FileText } from 'lucide-react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

import { KeyboardAvoidingScrollView, useScrollToFocusedInput } from '../components/KeyboardAvoidingScrollView';
import type { RootStackParamList } from '../navigation/types';
import type { AgreementDraft } from '../types/agreement';
import { ScreenContainer } from '../components/ScreenContainer';

type Props = NativeStackScreenProps<RootStackParamList, 'AgreementForm'>;

const emptyDraft: AgreementDraft = {
  customerName: '',
  phone: '',
  fromDate: '',
  toDate: '',
  busType: '',
  busCount: '',
  passengers: '',
  placesToCover: '',
  perDayRent: '',
  includeMountainRent: false,
  mountainRent: '',
  useIndividualBusRates: false,
  individualBusRates: [],
  totalAmount: '',
  advancePaid: '',
  balance: '',
  notes: '',
};

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

function formatMoney(n: number): string {
  const normalized = Object.is(n, -0) ? 0 : n;
  return String(Number(normalized.toFixed(2)));
}

function syncIndividualBusRates(draft: AgreementDraft): AgreementDraft {
  if (!draft.useIndividualBusRates) return draft;

  const currentCount = parsePositiveInt(draft.busCount);
  const targetCount = currentCount ?? 1;

  let rates = Array.isArray(draft.individualBusRates) ? [...draft.individualBusRates] : [];
  while (rates.length < targetCount) {
    rates.push({
      perDayRent: draft.perDayRent,
      includeMountainRent: draft.includeMountainRent,
      mountainRent: draft.mountainRent,
    });
  }
  if (rates.length > targetCount) {
    rates = rates.slice(0, targetCount);
  }

  return {
    ...draft,
    busCount: String(targetCount),
    individualBusRates: rates,
  };
}

function computeTotalAmount(draft: AgreementDraft): string {
  const days = computeTripDaysInclusive(draft.fromDate, draft.toDate);
  if (!days) return '';

  if (draft.useIndividualBusRates) {
    if (!draft.individualBusRates?.length) return '';
    let sum = 0;
    for (const r of draft.individualBusRates) {
      const perDay = parseAmount(r.perDayRent);
      if (perDay == null) return '';
      const mountain = r.includeMountainRent ? (parseAmount(r.mountainRent) ?? 0) : 0;
      if (r.includeMountainRent && parseAmount(r.mountainRent) == null) return '';
      sum += perDay * days + mountain;
    }
    return formatMoney(sum);
  }

  const buses = parsePositiveInt(draft.busCount);
  const perDay = parseAmount(draft.perDayRent);
  if (!buses || perDay == null) return '';
  const mountainPerBus = draft.includeMountainRent ? (parseAmount(draft.mountainRent) ?? 0) : 0;
  if (draft.includeMountainRent && parseAmount(draft.mountainRent) == null) return '';
  const total = buses * perDay * days + buses * mountainPerBus;
  return formatMoney(total);
}

function deriveDraft(draft: AgreementDraft): AgreementDraft {
  const synced = syncIndividualBusRates(draft);
  const totalAmount = computeTotalAmount(synced);
  return {
    ...synced,
    totalAmount,
    balance: computeBalance(totalAmount, synced.advancePaid),
  };
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

export function AgreementFormScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = React.useState<AgreementDraft>(emptyDraft);
  const [picker, setPicker] = React.useState<{
    field: 'fromDate' | 'toDate';
    date: Date;
  } | null>(null);

  React.useEffect(() => {
    navigation.setOptions({ title: t('agreement.title') });
  }, [navigation, t]);

  const set = (key: keyof AgreementDraft) => (value: string) =>
    setDraft((d) => deriveDraft({ ...d, [key]: value } as AgreementDraft));

  const toggle = (key: 'includeMountainRent' | 'useIndividualBusRates') => (value: boolean) =>
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (key === 'useIndividualBusRates' && value && !parsePositiveInt(next.busCount)) {
        next.busCount = '1';
      }
      return deriveDraft(next);
    });

  const setBusRate = (index: number, key: 'perDayRent' | 'mountainRent') => (value: string) =>
    setDraft((d) => {
      const rates = [...(d.individualBusRates ?? [])];
      const current = rates[index] ?? { perDayRent: '', includeMountainRent: false, mountainRent: '' };
      rates[index] = { ...current, [key]: value };
      return deriveDraft({ ...d, individualBusRates: rates });
    });

  const toggleBusRateMountain = (index: number) => (value: boolean) =>
    setDraft((d) => {
      const rates = [...(d.individualBusRates ?? [])];
      const current = rates[index] ?? { perDayRent: '', includeMountainRent: false, mountainRent: '' };
      rates[index] = { ...current, includeMountainRent: value };
      return deriveDraft({ ...d, individualBusRates: rates });
    });

  const openPicker = (field: 'fromDate' | 'toDate') => {
    const fallback = parseDateDDMMYYYY(draft.fromDate) ?? new Date();
    const current = parseDateDDMMYYYY(draft[field]) ?? fallback;
    setPicker({ field, date: current });
  };

  const commitPickedDate = (field: 'fromDate' | 'toDate', date: Date) => {
    const formatted = formatDateDDMMYYYY(date);
    setDraft((d) => {
      const next: AgreementDraft = { ...d, [field]: formatted };
      if (field === 'fromDate') {
        const to = parseDateDDMMYYYY(d.toDate);
        if (to && to.getTime() < date.getTime()) {
          next.toDate = formatted;
        }
      }
      return deriveDraft(next);
    });
  };

  const totalDays = computeTripDaysInclusive(draft.fromDate, draft.toDate);

  const validate = (): boolean => {
    const d = deriveDraft(draft);
    if (!d.customerName.trim()) {
      Alert.alert(t('common.validationTitle'), t('agreement.validation.customerName'));
      return false;
    }
    if (!computeTripDaysInclusive(d.fromDate, d.toDate)) {
      Alert.alert(t('common.validationTitle'), t('agreement.validation.dates'));
      return false;
    }
    if (!parsePositiveInt(d.busCount)) {
      Alert.alert(t('common.validationTitle'), t('agreement.validation.busCount'));
      return false;
    }
    if (d.useIndividualBusRates) {
      if (!d.individualBusRates?.length) {
        Alert.alert(t('common.validationTitle'), t('agreement.validation.busRates'));
        return false;
      }
      for (let i = 0; i < d.individualBusRates.length; i++) {
        const r = d.individualBusRates[i];
        if (parseAmount(r.perDayRent) == null) {
          Alert.alert(t('common.validationTitle'), t('agreement.validation.busRatePerDay', { index: i + 1 }));
          return false;
        }
        if (r.includeMountainRent && parseAmount(r.mountainRent) == null) {
          Alert.alert(t('common.validationTitle'), t('agreement.validation.busRateMountain', { index: i + 1 }));
          return false;
        }
      }
    } else {
      if (parseAmount(d.perDayRent) == null) {
        Alert.alert(t('common.validationTitle'), t('agreement.validation.perDayRent'));
        return false;
      }
      if (d.includeMountainRent && parseAmount(d.mountainRent) == null) {
        Alert.alert(t('common.validationTitle'), t('agreement.validation.mountainRent'));
        return false;
      }
    }
    if (!d.totalAmount) {
      Alert.alert(t('common.validationTitle'), t('agreement.validation.totalAmount'));
      return false;
    }
    setDraft(d);
    return true;
  };

  return (
    <ScreenContainer style={{ paddingHorizontal: 0 }}>
      <KeyboardAvoidingScrollView contentContainerStyle={styles.scrollContent}>

        <Section title={t('agreement.customerDetails')} icon={<User size={18} color="#4F46E5" />}>
          <Field label={t('agreement.customerName')} value={draft.customerName} onChangeText={set('customerName')} placeholder={t('allTours.customerNamePlaceholder')} />
          <Field label={t('agreement.phone')} value={draft.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder={t('allTours.phonePlaceholder')} />
        </Section>

        <Section title={t('agreement.tripDetails')} icon={<Calendar size={18} color="#4F46E5" />}>
          <View style={styles.row2}>
            <Field
              label={t('agreement.fromDate')}
              value={draft.fromDate}
              placeholder="DD/MM/YYYY"
              onPress={() => openPicker('fromDate')}
              icon={<Calendar size={16} color="#6B7280" />}
            />
            <Field
              label={t('agreement.toDate')}
              value={draft.toDate}
              placeholder="DD/MM/YYYY"
              onPress={() => openPicker('toDate')}
              icon={<Calendar size={16} color="#6B7280" />}
            />
          </View>
          <Field label={t('agreement.busType')} value={draft.busType} onChangeText={set('busType')} placeholder={t('allTours.busTypePlaceholder')} />
          <View style={styles.row2}>
            <Field label={t('agreement.busCount')} value={draft.busCount} onChangeText={set('busCount')} keyboardType="number-pad" placeholder="e.g. 1" />
            <Field label={t('agreement.passengers')} value={draft.passengers} onChangeText={set('passengers')} keyboardType="number-pad" placeholder="e.g. 20" />
          </View>
          <Field label={t('agreement.placesToCover')} value={draft.placesToCover} onChangeText={set('placesToCover')} placeholder="e.g. Ooty, Mysore" />
        </Section>

        <Section title={t('agreement.rentDetails')} icon={<DollarSign size={18} color="#4F46E5" />}>
          <Field label={t('agreement.totalDays')} value={totalDays ? String(totalDays) : '-'} editable={false} />

          <ToggleField
            label={t('agreement.useIndividualBusRates')}
            value={draft.useIndividualBusRates}
            onValueChange={toggle('useIndividualBusRates')}
          />

          {!draft.useIndividualBusRates ? (
            <>
              <Field
                label={t('agreement.perDayRent')}
                value={draft.perDayRent}
                onChangeText={set('perDayRent')}
                keyboardType="number-pad"
                placeholder="0.00"
              />
              <ToggleField
                label={t('agreement.includeMountainRent')}
                value={draft.includeMountainRent}
                onValueChange={toggle('includeMountainRent')}
              />
              {draft.includeMountainRent && (
                <Field
                  label={t('agreement.mountainRent')}
                  value={draft.mountainRent}
                  onChangeText={set('mountainRent')}
                  keyboardType="number-pad"
                  placeholder="0.00"
                />
              )}
            </>
          ) : (
            <View style={{ gap: 12, marginTop: 4 }}>
              {draft.individualBusRates.map((r, idx) => (
                <View key={idx} style={styles.busRateCard}>
                  <Text style={styles.busRateTitle}>{`${t('agreement.bus')} ${idx + 1}`}</Text>
                  <Field
                    label={t('agreement.perDayRent')}
                    value={r.perDayRent}
                    onChangeText={setBusRate(idx, 'perDayRent')}
                    keyboardType="number-pad"
                    placeholder="0.00"
                  />
                  <ToggleField
                    label={t('agreement.includeMountainRent')}
                    value={r.includeMountainRent}
                    onValueChange={toggleBusRateMountain(idx)}
                  />
                  {r.includeMountainRent && (
                    <Field
                      label={t('agreement.mountainRent')}
                      value={r.mountainRent}
                      onChangeText={setBusRate(idx, 'mountainRent')}
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
          <Field label={t('agreement.totalAmount')} value={draft.totalAmount} editable={false} keyboardType="number-pad" placeholder="0.00" />
          <Field label={t('agreement.advancePaid')} value={draft.advancePaid} onChangeText={set('advancePaid')} keyboardType="number-pad" placeholder="0.00" />
          <Field label={t('agreement.balance')} value={draft.balance} editable={false} keyboardType="number-pad" placeholder="0.00" />
          <Field label={t('agreement.notes')} value={draft.notes} onChangeText={set('notes')} multiline placeholder={t('bookingDetails.advanceNotePlaceholder')} />
        </Section>

        <View style={{ height: 80 }} />
      </KeyboardAvoidingScrollView>

      {/* Floating Action Button for Next */}
      <View style={styles.footer}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            if (!validate()) return;
            navigation.navigate('AgreementPreview', { draft: deriveDraft(draft) });
          }}
        >
          <Text style={styles.primaryBtnText}>{t('agreement.preview')}</Text>
          <ChevronRight size={20} color="white" />
        </Pressable>
      </View>

      {/* Date Pickers */}
      {
        picker && Platform.OS === 'android' ? (
          <DateTimePicker
            value={picker.date}
            mode="date"
            display="default"
            minimumDate={picker.field === 'toDate' ? parseDateDDMMYYYY(draft.fromDate) ?? undefined : undefined}
            onChange={(event, selectedDate) => {
              setPicker(null);
              if (!selectedDate) return;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((event as any)?.type && (event as any).type !== 'set') return;
              commitPickedDate(picker.field, selectedDate);
            }}
          />
        ) : null
      }

      {
        picker && Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" visible onRequestClose={() => setPicker(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <DateTimePicker
                  value={picker.date}
                  mode="date"
                  display="spinner"
                  minimumDate={picker.field === 'toDate' ? parseDateDDMMYYYY(draft.fromDate) ?? undefined : undefined}
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
        ) : null
      }
    </ScreenContainer >
  );
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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, gap: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  modalBtnPrimary: { backgroundColor: '#111827' },
  modalBtnSecondary: { backgroundColor: '#f3f4f6' },
  modalBtnTextPrimary: { color: 'white', fontWeight: '700' },
  modalBtnTextSecondary: { color: '#111827', fontWeight: '700' },
});
