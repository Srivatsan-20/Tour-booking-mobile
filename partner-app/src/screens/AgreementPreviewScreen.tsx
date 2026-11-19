import * as React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Check, User, Calendar, MapPin, Calculator, CreditCard } from 'lucide-react-native';

import { createAgreement } from '../api/agreements';
import type { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';

type Props = NativeStackScreenProps<RootStackParamList, 'AgreementPreview'>;

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

export function AgreementPreviewScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { draft } = route.params;
  const totalDays = computeTripDaysInclusive(draft.fromDate, draft.toDate);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    navigation.setOptions({ title: t('preview.title') });
  }, [navigation, t]);

  return (
    <ScreenContainer style={{ paddingHorizontal: 0 }}>
      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.h1}>{t('agreement.title')}</Text>
          <Text style={styles.note}>{t('preview.comingSoon')}</Text>
        </View>

        <Card title={t('agreement.customerDetails')} icon={<User size={18} color="#4F46E5" />}>
          <Row label={t('agreement.customerName')} value={draft.customerName} />
          <Row label={t('agreement.phone')} value={draft.phone} isLast />
        </Card>

        <Card title={t('agreement.tripDetails')} icon={<Calendar size={18} color="#4F46E5" />}>
          <Row label={t('agreement.fromDate')} value={draft.fromDate} />
          <Row label={t('agreement.toDate')} value={draft.toDate} />
          <Row label={t('agreement.busType')} value={draft.busType} />
          <Row label={t('agreement.busCount')} value={draft.busCount} />
          <Row label={t('agreement.passengers')} value={draft.passengers} />
          <Row label={t('agreement.placesToCover')} value={draft.placesToCover} isLast />
        </Card>

        <Card title={t('agreement.rentDetails')} icon={<Calculator size={18} color="#4F46E5" />}>
          <Row label={t('agreement.totalDays')} value={totalDays ? String(totalDays) : ''} />

          {!draft.useIndividualBusRates ? (
            <>
              <Row label={t('agreement.perDayRent')} value={draft.perDayRent} />
              {draft.includeMountainRent ? <Row label={t('agreement.mountainRent')} value={draft.mountainRent} isLast /> : null}
            </>
          ) : (
            <View style={{ gap: 10, paddingTop: 10 }}>
              {draft.individualBusRates.map((r, idx) => (
                <View key={idx} style={styles.busRateBlock}>
                  <Text style={styles.busRateTitle}>{t('agreement.bus')} {idx + 1}</Text>
                  <Row label={t('agreement.perDayRent')} value={r.perDayRent} />
                  {r.includeMountainRent ? <Row label={t('agreement.mountainRent')} value={r.mountainRent} isLast /> : null}
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card title={t('agreement.paymentDetails')} icon={<CreditCard size={18} color="#4F46E5" />}>
          <Row label={t('agreement.totalAmount')} value={draft.totalAmount} />
          <Row label={t('agreement.advancePaid')} value={draft.advancePaid} />
          <Row label={t('agreement.balance')} value={draft.balance} highlight />
          <Row label={t('agreement.notes')} value={draft.notes} isLast />
        </Card>
      </ScrollView>

      {/* Footer Action Button */}
      <View style={styles.footer}>
        <PrimaryButton
          title={submitting ? t('agreement.submitting') : t('agreement.submit')}
          disabled={submitting}
          onPress={async () => {
            if (submitting) return;
            setSubmitting(true);
            try {
              await createAgreement(draft);
              Alert.alert(t('common.successTitle'), t('agreement.submitSuccess'), [
                { text: t('common.ok'), onPress: () => navigation.navigate('Bookings') },
              ]);
            } catch (e: any) {
              Alert.alert(t('common.errorTitle'), e?.message || t('agreement.submitFailed'));
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </View>
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
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

function Row({ label, value, isLast, highlight }: { label: string; value: string; isLast?: boolean, highlight?: boolean }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.valueHighlight]}>{value || '-'}</Text>
    </View>
  );
}

function PrimaryButton(props: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.disabled ? undefined : props.onPress}
      style={[styles.primaryBtn, props.disabled ? styles.primaryBtnDisabled : null]}
    >
      {props.disabled ? <ActivityIndicator color="#9CA3AF" /> : <Check size={20} color="white" />}
      <Text style={[styles.primaryBtnText, props.disabled && { color: '#9CA3AF' }]}>{props.title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 }, // Extra padding for footer
  header: { marginBottom: 4 },
  h1: { fontSize: 24, fontWeight: '800', color: '#111827' },
  note: { color: '#6B7280', fontSize: 14, marginTop: 4 },

  card: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardContent: { padding: 14 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  value: { fontSize: 15, fontWeight: '600', color: '#111827', flexShrink: 1, textAlign: 'right', paddingLeft: 10 },
  valueHighlight: { color: '#4F46E5', fontWeight: '800' },

  busRateBlock: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, backgroundColor: '#F9FAFB' },
  busRateTitle: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 8 },

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
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnDisabled: { backgroundColor: '#E5E7EB', shadowOpacity: 0, elevation: 0 },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
