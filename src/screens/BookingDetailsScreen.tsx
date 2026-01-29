import * as React from 'react';
import { Alert, KeyboardAvoidingView, Linking, Modal, Platform, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { KeyboardAvoidingScrollView } from '../components/KeyboardAvoidingScrollView';
import type { RootStackParamList } from '../navigation/types';
import { addAdvanceToAgreement, cancelAgreement } from '../api/agreements';
import type { AgreementResponse } from '../types/api';
import { generateAndShareAgreementPdf } from '../utils/pdfGenerator';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS } from '../theme';

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
  const d = new Date(yyyy, mm - 1, dd);
  if (Number.isNaN(d.getTime())) return null;
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

const DetailRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || '-'}</Text>
  </View>
);

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
    <Screen style={styles.container}>
      <KeyboardAvoidingScrollView contentContainerStyle={styles.scrollContent}>
        {isCancelled ? (
          <View style={styles.cancelledBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.error} />
            <Text style={styles.cancelledBannerText}>
              {t('bookingDetails.cancelled')} • {formatCancelledAt(agreement.cancelledAtUtc)}
            </Text>
          </View>
        ) : null}

        <Card>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>{t('agreement.customerDetails')}</Text>
          </View>
          <View style={styles.cardBody}>
            <DetailRow label={t('agreement.customerName')} value={agreement.customerName} />
            <DetailRow label={t('agreement.phone')} value={agreement.phone} />
          </View>
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="bus" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>{t('agreement.tripDetails')}</Text>
          </View>
          <View style={styles.cardBody}>
            <DetailRow label={t('agreement.fromDate')} value={agreement.fromDate} />
            <DetailRow label={t('agreement.toDate')} value={agreement.toDate} />
            <DetailRow label={t('agreement.totalDays')} value={totalDays == null ? '-' : String(totalDays)} />
            <DetailRow label={t('agreement.busType')} value={agreement.busType} />
            <DetailRow label={t('agreement.busCount')} value={agreement.busCount == null ? '-' : String(agreement.busCount)} />
            <DetailRow label={t('agreement.passengers')} value={agreement.passengers == null ? '-' : String(agreement.passengers)} />
            <DetailRow label={t('agreement.placesToCover')} value={agreement.placesToCover} />
          </View>
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="cash" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>{t('agreement.rentDetails')}</Text>
          </View>
          <View style={styles.cardBody}>
            <DetailRow label={t('agreement.useIndividualBusRates')} value={yesNo(agreement.useIndividualBusRates)} />

            {!agreement.useIndividualBusRates ? (
              <>
                <DetailRow label={t('agreement.perDayRent')} value={money(agreement.perDayRent)} />
                <DetailRow label={t('agreement.includeMountainRent')} value={yesNo(agreement.includeMountainRent)} />
                {agreement.includeMountainRent ? (
                  <DetailRow label={t('agreement.mountainRent')} value={money(agreement.mountainRent)} />
                ) : null}
              </>
            ) : (
              <View style={styles.busRatesContainer}>
                {(agreement.busRates ?? []).map((r, idx) => (
                  <View key={idx} style={styles.busRateItem}>
                    <Text style={styles.busRateTitle}>
                      {t('agreement.bus')} {idx + 1}
                    </Text>
                    <DetailRow label={t('agreement.perDayRent')} value={money(r.perDayRent)} />
                    <DetailRow label={t('agreement.includeMountainRent')} value={yesNo(r.includeMountainRent)} />
                    {r.includeMountainRent ? <DetailRow label={t('agreement.mountainRent')} value={money(r.mountainRent)} /> : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="receipt" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>{t('agreement.paymentDetails')}</Text>
          </View>
          <View style={styles.cardBody}>
            <DetailRow label={t('agreement.totalAmount')} value={money(agreement.totalAmount)} />
            <DetailRow label={t('agreement.advancePaid')} value={money(agreement.advancePaid)} />
            <DetailRow label={t('agreement.balance')} value={<Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>{money(agreement.balance)}</Text>} />
            <DetailRow label={t('agreement.notes')} value={agreement.notes || '-'} />
          </View>
        </Card>

        <View style={styles.actionsContainer}>
          <Button
            title={t('bookingDetails.addAdvance')}
            onPress={() => setAdvanceModalOpen(true)}
            disabled={busy || isCancelled}
            variant="primary"
            leftIcon={<MaterialCommunityIcons name="cash-plus" size={20} color={COLORS.surface} />}
          />

          <View style={styles.doubleBtnRow}>
            <Button
              title={t('bookingDetails.accountsButton')}
              onPress={() => navigation.navigate('TourAccount', { agreementId: agreement.id })}
              disabled={busy}
              variant="outline"
              style={{ flex: 1 }}
            />
            <Button
              title={t('bookingDetails.alterButton')}
              onPress={() => navigation.navigate('BookingEdit', { agreement })}
              disabled={busy || isCancelled}
              variant="outline"
              style={{ flex: 1 }}
            />
          </View>

          <Button
            title="WhatsApp Receipt"
            onPress={async () => {
              const ph = agreement.phone.replace(/[^0-9]/g, '');
              const msg = `Booking Confirmed!\n\nCustomer: ${agreement.customerName}\nDates: ${agreement.fromDate} to ${agreement.toDate}\nBus: ${agreement.busType} (${agreement.busCount})\nTotal Amount: ${agreement.totalAmount}\nBalance: ${agreement.balance}\n\nThank you for choosing us!`;
              const url = `whatsapp://send?phone=${ph}&text=${encodeURIComponent(msg)}`;
              try {
                const supported = await Linking.canOpenURL(url);
                if (supported) await Linking.openURL(url);
                else Alert.alert('Error', 'WhatsApp is not installed');
              } catch (err) {
                Alert.alert('Error', 'Could not open WhatsApp');
              }
            }}
            disabled={busy}
            variant="primary"
            style={{ backgroundColor: '#25D366' }} // WhatsApp Green
            leftIcon={<MaterialCommunityIcons name="whatsapp" size={20} color={COLORS.surface} />}
          />

          <Button
            title="Share PDF"
            onPress={async () => {
              setBusy(true);
              try {
                await generateAndShareAgreementPdf(agreement);
              } catch (e: any) {
                Alert.alert('Error', 'Failed to generate PDF');
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            variant="primary"
            style={{ backgroundColor: COLORS.warning }}
            leftIcon={<MaterialCommunityIcons name="file-pdf-box" size={20} color={COLORS.surface} />}
          />

          <Button
            title={t('bookingDetails.cancelButton')}
            onPress={onCancelTour}
            disabled={busy || isCancelled}
            variant="danger"
            style={{ marginTop: SPACING.sm }}
          />
        </View>

        <Modal transparent visible={advanceModalOpen} animationType="fade" onRequestClose={() => setAdvanceModalOpen(false)}>
          <KeyboardAvoidingView
            style={styles.modalBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('bookingDetails.addAdvance')}</Text>

              <Input
                value={advanceAmount}
                onChangeText={setAdvanceAmount}
                placeholder={t('bookingDetails.advanceAmountPlaceholder')}
                keyboardType="number-pad"
                label="Amount"
              />

              <Input
                value={advanceNote}
                onChangeText={setAdvanceNote}
                placeholder={t('bookingDetails.advanceNotePlaceholder')}
                multiline
                style={{ minHeight: 80, textAlignVertical: 'top' }}
                label="Note (Optional)"
              />

              <View style={styles.modalActions}>
                <Button
                  title={t('common.cancel')}
                  onPress={() => setAdvanceModalOpen(false)}
                  variant="ghost"
                  style={{ flex: 1 }}
                  size="sm"
                />
                <Button
                  title={t('common.save')}
                  onPress={onAddAdvance}
                  variant="primary"
                  disabled={busy}
                  style={{ flex: 1 }}
                  size="sm"
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </KeyboardAvoidingScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: SPACING.sm,
  },
  cancelledBannerText: {
    color: COLORS.error,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  cardBody: {
    gap: SPACING.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Allow multi-line values to align top
    paddingVertical: 2,
    gap: SPACING.md,
  },
  detailLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    flexShrink: 0, // Keep label from shrinking too much
    maxWidth: '40%', // Ensure label doesn't take over if value is empty/short? Actually optional.
  },
  detailValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'right',
    flex: 1, // Take remaining space
    flexWrap: 'wrap', // Ensure wrapping
  },
  busRatesContainer: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  busRateItem: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  busRateTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xs,
  },
  actionsContainer: {
    gap: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  doubleBtnRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
});
