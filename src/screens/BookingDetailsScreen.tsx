import * as React from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { User, Calendar, MapPin, Calculator, CreditCard, Ban, Briefcase, PlusCircle, Edit2, Wallet } from 'lucide-react-native';

import type { RootStackParamList } from '../navigation/types';
import { addAdvanceToAgreement, cancelAgreement } from '../api/agreements';
import type { AgreementResponse } from '../types/api';
import { ScreenContainer } from '../components/ScreenContainer';
import { generateAndSharePdf } from '../utils/pdfGenerator';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
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
    <ScreenContainer style={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isCancelled ? (
          <View style={styles.cancelledBanner}>
            <Ban size={20} color="#991b1b" />
            <Text style={styles.cancelledBannerText}>
              {t('bookingDetails.cancelled')} {t('cancelledTours.cancelledAt')}: {formatCancelledAt(agreement.cancelledAtUtc)}
            </Text>
          </View>
        ) : null}

        <Card title={t('agreement.customerDetails')} icon={<User size={18} color="#4F46E5" />}>
          <Row label={t('agreement.customerName')} value={agreement.customerName} />
          <Row label={t('agreement.phone')} value={agreement.phone} />
        </Card>

        <Card title={t('agreement.tripDetails')} icon={<Calendar size={18} color="#4F46E5" />}>
          <Row label={t('agreement.fromDate')} value={agreement.fromDate} />
          <Row label={t('agreement.toDate')} value={agreement.toDate} />
          <Row label={t('agreement.totalDays')} value={totalDays == null ? '-' : String(totalDays)} />
          <Row label={t('agreement.busType')} value={agreement.busType} />
          <Row label={t('agreement.busCount')} value={agreement.busCount == null ? '-' : String(agreement.busCount)} />
          <Row label={t('agreement.passengers')} value={agreement.passengers == null ? '-' : String(agreement.passengers)} />
          <Row label={t('agreement.placesToCover')} value={agreement.placesToCover} isLast />
        </Card>

        <Card title={t('agreement.rentDetails')} icon={<Calculator size={18} color="#4F46E5" />}>
          <Row label={t('agreement.useIndividualBusRates')} value={yesNo(agreement.useIndividualBusRates)} />

          {!agreement.useIndividualBusRates ? (
            <>
              <Row label={t('agreement.perDayRent')} value={money(agreement.perDayRent)} />
              <Row label={t('agreement.includeMountainRent')} value={yesNo(agreement.includeMountainRent)} />
              <Row label={t('agreement.mountainRent')} value={money(agreement.mountainRent)} isLast={!agreement.includeMountainRent} />
            </>
          ) : (
            <View style={{ gap: 12, marginTop: 8 }}>
              {(agreement.busRates ?? []).map((r, idx) => (
                <View key={idx} style={styles.busRateCard}>
                  <Text style={styles.busRateTitle}>
                    {t('agreement.bus')} {idx + 1}
                  </Text>
                  <Row label={t('agreement.perDayRent')} value={money(r.perDayRent)} />
                  <Row label={t('agreement.includeMountainRent')} value={yesNo(r.includeMountainRent)} />
                  <Row label={t('agreement.mountainRent')} value={money(r.mountainRent)} isLast />
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card title={t('agreement.paymentDetails')} icon={<CreditCard size={18} color="#4F46E5" />}>
          <Row label={t('agreement.totalAmount')} value={money(agreement.totalAmount)} />
          <Row label={t('agreement.advancePaid')} value={money(agreement.advancePaid)} />
          <Row label={t('agreement.balance')} value={money(agreement.balance)} highlight />
          <Row label={t('agreement.notes')} value={agreement.notes || '-'} isLast />
        </Card>

        <View style={styles.actionsGrid}>
          <ActionButton
            label={t('bookingDetails.addAdvance')}
            icon={<PlusCircle size={20} color="white" />}
            onPress={() => setAdvanceModalOpen(true)}
            disabled={busy || isCancelled}
            variant="primary"
          />
          <ActionButton
            label={t('bookingDetails.accountsButton')}
            icon={<Wallet size={20} color="white" />}
            onPress={() => navigation.navigate('TourAccount', { agreementId: agreement.id })}
            disabled={busy}
            variant="secondary"
          />
          <ActionButton
            label={t('bookingDetails.alterButton')}
            icon={<Edit2 size={20} color="white" />}
            onPress={() => navigation.navigate('BookingEdit', { agreement })}
            disabled={busy || isCancelled}
            variant="secondary"
          />
          <ActionButton
            label={t('bookingDetails.cancelButton')}
            icon={<Ban size={20} color="white" />}
            onPress={onCancelTour}
            disabled={busy || isCancelled}
            variant="danger"
          />
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
            {t('bookingDetails.downloadAgreement', 'Download Agreement')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <ActionButton
                label="PDF (English)"
                icon={<Briefcase size={18} color="white" />}
                onPress={() => {
                  if (!user?.companyName) {
                    Alert.alert('Missing Profile', 'Your Company Name is missing. Please go to Profile and Save it.');
                    return;
                  }
                  // Debug: Remove this later
                  // Alert.alert('Debug', `Generating for: ${user.companyName}`);

                  generateAndSharePdf(agreement, 'en', {
                    companyName: user?.companyName,
                    address: user?.companyAddress,
                    phone: user?.companyPhone,
                    email: user?.email
                  });
                }}
                disabled={busy}
                variant="primary"
              />
            </View>
            <View style={{ flex: 1 }}>
              <ActionButton
                label="PDF (தமிழ்)"
                icon={<Briefcase size={18} color="white" />}
                onPress={() => {
                  if (!user?.companyName) {
                    Alert.alert('Missing Profile', 'Your Company Name is missing. Please go to Profile and Save it.');
                    return;
                  }
                  generateAndSharePdf(agreement, 'ta', {
                    companyName: user?.companyName,
                    address: user?.companyAddress,
                    phone: user?.companyPhone,
                    email: user?.email
                  });
                }}
                disabled={busy}
                variant="primary"
              />
            </View>
          </View>
        </View>
      </ScrollView>

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
    </ScreenContainer>
  );
}

function Card({ children, title, icon }: { children: React.ReactNode; title: string, icon?: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {icon}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardContent}>
        {children}
      </View>
    </View>
  );
}

function Row({ label, value, isLast, highlight }: { label: string; value: string, isLast?: boolean, highlight?: boolean }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.valueHighlight]}>{value || '-'}</Text>
    </View>
  );
}

function ActionButton({ label, icon, onPress, disabled, variant }: { label: string; icon: React.ReactNode; onPress: () => void; disabled?: boolean; variant: 'primary' | 'secondary' | 'danger' }) {
  const getBg = () => {
    if (disabled) return '#E5E7EB';
    switch (variant) {
      case 'primary': return '#4F46E5';
      case 'secondary': return '#111827';
      case 'danger': return '#DC2626';
    }
  };

  return (
    <Pressable
      style={[styles.actionBtn, { backgroundColor: getBg() }]}
      disabled={disabled}
      onPress={onPress}
    >
      {icon}
      <Text style={[styles.actionBtnText, disabled && { color: '#9CA3AF' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
  cancelledBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FAC7C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelledBannerText: { color: '#991b1b', fontWeight: '700', flexShrink: 1 },

  card: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardContent: { padding: 14 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, alignItems: 'flex-start' }, /* aligned top for multiline */
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 13, fontWeight: '500', color: '#6B7280', flex: 0.4, paddingRight: 8 },
  value: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 0.6, textAlign: 'right' },
  valueHighlight: { color: '#4F46E5', fontWeight: '800' },

  busRateCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  busRateTitle: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 6 },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexBasis: '45%', // Ensure it fits 2 per row easily but grows
    flexGrow: 1,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, gap: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#F9FAFB' },
  inputMultiline: { minHeight: 100, textAlignVertical: 'top' },
  modalActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#F3F4F6' },
  modalBtnPrimary: { backgroundColor: '#4F46E5' },
  modalBtnText: { fontWeight: '700', color: '#374151' },
  modalBtnTextPrimary: { color: 'white' },
});
