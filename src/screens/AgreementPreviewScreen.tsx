import * as React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { createAgreement } from '../api/agreements';
import type { RootStackParamList } from '../navigation/types';

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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>{t('agreement.title')}</Text>
      <Text style={styles.note}>{t('preview.comingSoon')}</Text>

      <Card>
        <Text style={styles.cardTitle}>{t('agreement.customerDetails')}</Text>
        <Row label={t('agreement.customerName')} value={draft.customerName} />
        <Row label={t('agreement.phone')} value={draft.phone} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t('agreement.tripDetails')}</Text>
        <Row label={t('agreement.fromDate')} value={draft.fromDate} />
        <Row label={t('agreement.toDate')} value={draft.toDate} />
        <Row label={t('agreement.busType')} value={draft.busType} />
        <Row label={t('agreement.busCount')} value={draft.busCount} />
        <Row label={t('agreement.passengers')} value={draft.passengers} />
        <Row label={t('agreement.placesToCover')} value={draft.placesToCover} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t('agreement.rentDetails')}</Text>
        <Row label={t('agreement.totalDays')} value={totalDays ? String(totalDays) : ''} />

        {!draft.useIndividualBusRates ? (
          <>
            <Row label={t('agreement.perDayRent')} value={draft.perDayRent} />
            {draft.includeMountainRent ? <Row label={t('agreement.mountainRent')} value={draft.mountainRent} /> : null}
          </>
        ) : (
          <View style={{ gap: 10 }}>
            {draft.individualBusRates.map((r, idx) => (
              <View key={idx} style={styles.busRateBlock}>
                <Text style={styles.busRateTitle}>{t('agreement.bus')} {idx + 1}</Text>
                <Row label={t('agreement.perDayRent')} value={r.perDayRent} />
                {r.includeMountainRent ? <Row label={t('agreement.mountainRent')} value={r.mountainRent} /> : null}
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t('agreement.paymentDetails')}</Text>
        <Row label={t('agreement.totalAmount')} value={draft.totalAmount} />
        <Row label={t('agreement.advancePaid')} value={draft.advancePaid} />
        <Row label={t('agreement.balance')} value={draft.balance} />
        <Row label={t('agreement.notes')} value={draft.notes} />
      </Card>

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
    </ScrollView>
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

function PrimaryButton(props: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Text
      accessibilityRole="button"
      onPress={props.disabled ? undefined : props.onPress}
      style={[styles.primaryBtn, props.disabled ? styles.primaryBtnDisabled : null]}
    >
      {props.title}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  h1: { fontSize: 18, fontWeight: '800' },
  note: { color: '#6b7280' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee', gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  row: { gap: 2 },
  label: { fontSize: 12, fontWeight: '700', color: '#374151' },
  value: { fontSize: 14 },
  busRateBlock: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, gap: 10 },
  busRateTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },

  primaryBtn: { backgroundColor: '#111827', color: 'white', textAlign: 'center', paddingVertical: 14, borderRadius: 12, fontWeight: '700' },
  primaryBtnDisabled: { backgroundColor: '#6b7280' },
});

