import * as React from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { KeyboardAvoidingScrollView } from '../components/KeyboardAvoidingScrollView';
import type { RootStackParamList } from '../navigation/types';
import { addAdvanceToAgreement, cancelAgreement } from '../api/agreements';
import type { AgreementResponse } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetails'>;

function money(v: number | null | undefined): string {
  if (v == null) return '-';
  return String(v);
}

function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatCancelledAt(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function parseDateDDMMYYYY(input: string): Date | null {
  const s = (input ?? '').trim();
  const m = s.match(/^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null;
  const d = new Date(yyyy, mm - 1, dd);
  if (Number.isNaN(d.getTime())) return null;
  // validate round-trip
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

function computeTripDaysInclusive(fromDate: string, toDate: string): number | null {
  const from = parseDateDDMMYYYY(fromDate);
  const to = parseDateDDMMYYYY(toDate);
  if (!from || !to) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  const diffDays = Math.floor((utcTo - utcFrom) / msPerDay);
  if (!Number.isFinite(diffDays) || diffDays < 0) return null;
  return diffDays + 1;
}

export function BookingDetailsScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const [agreement, setAgreement] = React.useState<AgreementResponse>(route.params.agreement);

  const isCancelled = agreement.isCancelled;
  const totalDays = computeTripDaysInclusive(agreement.fromDate, agreement.toDate);

  const yesNo = (v: boolean | null | undefined) => (v ? t('common.yes') : t('common.no'));

  const [advanceModalOpen, setAdvanceModalOpen] = React.useState(false);
  const [advanceAmount, setAdvanceAmount] = React.useState('');
  const [advanceNote, setAdvanceNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    navigation.setOptions({ title: t('bookingDetails.title') });
  }, [navigation, t]);

  const onAddAdvance = async () => {
    const amt = parseAmount(advanceAmount);
    if (!amt || amt <= 0) {
      Alert.alert(t('common.validationTitle'), t('bookingDetails.validationAdvanceAmount'));
      return;
    }

    setBusy(true);
    try {
      const updated = await addAdvanceToAgreement(agreement.id, advanceAmount, advanceNote);
      setAgreement(updated);
      setAdvanceAmount('');
      setAdvanceNote('');
      setAdvanceModalOpen(false);
      Alert.alert(t('common.successTitle'), t('bookingDetails.advanceAdded'));
    } catch (e: any) {
      Alert.alert(t('common.errorTitle'), e?.message ? String(e.message) : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onCancelTour = async () => {
    if (isCancelled) return;
    Alert.alert(t('bookingDetails.cancelTitle'), t('bookingDetails.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('bookingDetails.cancelButton'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
	            await cancelAgreement(agreement.id);
            Alert.alert(t('common.successTitle'), t('bookingDetails.cancelled'), [
              { text: t('common.ok'), onPress: () => navigation.goBack() },
            ]);
          } catch (e: any) {
            Alert.alert(t('common.errorTitle'), e?.message ? String(e.message) : String(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingScrollView contentContainerStyle={styles.container}>
      {isCancelled ? (
        <View style={styles.cancelledBanner}>
          <Text style={styles.cancelledBannerText}>
            {t('bookingDetails.cancelled')} {t('cancelledTours.cancelledAt')}: {formatCancelledAt(agreement.cancelledAtUtc)}
          </Text>
        </View>
      ) : null}

      <Card>
        <Text style={styles.cardTitle}>{t('agreement.customerDetails')}</Text>
        <Row label={t('agreement.customerName')} value={agreement.customerName} />
        <Row label={t('agreement.phone')} value={agreement.phone} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t('agreement.tripDetails')}</Text>
        <Row label={t('agreement.fromDate')} value={agreement.fromDate} />
        <Row label={t('agreement.toDate')} value={agreement.toDate} />
        <Row label={t('agreement.totalDays')} value={totalDays == null ? '-' : String(totalDays)} />
        <Row label={t('agreement.busType')} value={agreement.busType} />
        <Row label={t('agreement.busCount')} value={agreement.busCount == null ? '-' : String(agreement.busCount)} />
        <Row label={t('agreement.passengers')} value={agreement.passengers == null ? '-' : String(agreement.passengers)} />
        <Row label={t('agreement.placesToCover')} value={agreement.placesToCover} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t('agreement.rentDetails')}</Text>
        <Row label={t('agreement.useIndividualBusRates')} value={yesNo(agreement.useIndividualBusRates)} />

        {!agreement.useIndividualBusRates ? (
          <>
            <Row label={t('agreement.perDayRent')} value={money(agreement.perDayRent)} />
            <Row label={t('agreement.includeMountainRent')} value={yesNo(agreement.includeMountainRent)} />
            {agreement.includeMountainRent ? (
              <Row label={t('agreement.mountainRent')} value={money(agreement.mountainRent)} />
            ) : null}
          </>
        ) : (
          <View style={{ gap: 12 }}>
            {(agreement.busRates ?? []).map((r, idx) => (
              <View key={idx} style={styles.busRateCard}>
                <Text style={styles.busRateTitle}>
                  {t('agreement.bus')} {idx + 1}
                </Text>
                <Row label={t('agreement.perDayRent')} value={money(r.perDayRent)} />
                <Row label={t('agreement.includeMountainRent')} value={yesNo(r.includeMountainRent)} />
                {r.includeMountainRent ? <Row label={t('agreement.mountainRent')} value={money(r.mountainRent)} /> : null}
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t('agreement.paymentDetails')}</Text>
        <Row label={t('agreement.totalAmount')} value={money(agreement.totalAmount)} />
        <Row label={t('agreement.advancePaid')} value={money(agreement.advancePaid)} />
        <Row label={t('agreement.balance')} value={money(agreement.balance)} />
        <Row label={t('agreement.notes')} value={agreement.notes || '-'} />
      </Card>

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.primaryBtn, busy || isCancelled ? styles.btnDisabled : null]}
          disabled={busy || isCancelled}
          onPress={() => setAdvanceModalOpen(true)}
        >
          <Text style={styles.primaryBtnText}>{t('bookingDetails.addAdvance')}</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryBtn, busy ? styles.btnDisabled : null]}
          disabled={busy}
          onPress={() => navigation.navigate('TourAccount', { agreementId: agreement.id })}
        >
          <Text style={styles.secondaryBtnText}>{t('bookingDetails.accountsButton')}</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryBtn, busy || isCancelled ? styles.btnDisabled : null]}
          disabled={busy || isCancelled}
          onPress={() => navigation.navigate('BookingEdit', { agreement })}
        >
          <Text style={styles.secondaryBtnText}>{t('bookingDetails.alterButton')}</Text>
        </Pressable>

        <Pressable
          style={[styles.dangerBtn, busy || isCancelled ? styles.btnDisabled : null]}
          disabled={busy || isCancelled}
          onPress={onCancelTour}
        >
          <Text style={styles.dangerBtnText}>{t('bookingDetails.cancelButton')}</Text>
        </Pressable>
      </View>

      <Modal transparent visible={advanceModalOpen} animationType="fade" onRequestClose={() => setAdvanceModalOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('bookingDetails.addAdvance')}</Text>
            <TextInput
              value={advanceAmount}
              onChangeText={setAdvanceAmount}
              placeholder={t('bookingDetails.advanceAmountPlaceholder')}
              keyboardType="number-pad"
              style={styles.input}
            />
            <TextInput
              value={advanceNote}
              onChangeText={setAdvanceNote}
              placeholder={t('bookingDetails.advanceNotePlaceholder')}
              style={[styles.input, styles.inputMultiline]}
              multiline
            />

            <View style={styles.modalActionsRow}>
              <Pressable style={styles.modalBtn} onPress={() => setAdvanceModalOpen(false)} disabled={busy}>
                <Text style={styles.modalBtnText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={onAddAdvance} disabled={busy}>
                <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingScrollView>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  cancelledBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelledBannerText: { color: '#991b1b', fontWeight: '800' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee', gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  row: { gap: 2 },
  label: { fontSize: 12, fontWeight: '700', color: '#374151' },
  value: { fontSize: 14 },

  busRateCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  busRateTitle: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 6 },

  actionsRow: { gap: 10 },
  primaryBtn: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#f3f4f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#111827', fontSize: 16, fontWeight: '800' },
  dangerBtn: { backgroundColor: '#b91c1c', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  dangerBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, gap: 10 },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  modalActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#f3f4f6' },
  modalBtnPrimary: { backgroundColor: '#111827' },
  modalBtnText: { fontWeight: '800', color: '#111827' },
  modalBtnTextPrimary: { color: 'white' },
});

