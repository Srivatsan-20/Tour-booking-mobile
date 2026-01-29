import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { RootStackParamList } from '../navigation/types';
import { getAgreementById } from '../api/agreements';
import { getAgreementAccounts, upsertAgreementAccounts } from '../api/accounts';
import type { AgreementResponse, BusResponse } from '../types/api';
import type { AgreementAccountsResponse } from '../types/accounts';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TourAccount'>;

type EditableFuel = { place: string; liters: string; cost: string };
type EditableOther = { description: string; amount: string };
type EditableBus = {
  busId: string | null;
  label: string;
  driverBatta: string;
  startKm: string;
  endKm: string;
  fuelEntries: EditableFuel[];
  otherExpenses: EditableOther[];
};

function cleanDecimalInput(s: string): string {
  return s.replace(/[^0-9.]/g, '');
}

function cleanIntInput(s: string): string {
  return s.replace(/[^0-9]/g, '');
}

function toNum(s: string): number {
  const x = Number.parseFloat((s ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(x) ? x : 0;
}

function toIntOrNull(s: string): string | null {
  const cleaned = cleanIntInput(s ?? '');
  return cleaned.trim() ? cleaned : null;
}

function toDecOrNull(s: string): string | null {
  const cleaned = cleanDecimalInput(s ?? '');
  return cleaned.trim() ? cleaned : null;
}

function busLabel(bus: BusResponse): string {
  const name = bus.name ? ` (${bus.name})` : '';
  return `${bus.vehicleNumber}${name}`;
}

function buildInitialBuses(accounts: AgreementAccountsResponse): EditableBus[] {
  const required = accounts.requiredBusCount > 0 ? accounts.requiredBusCount : 1;
  const assigned = accounts.assignedBuses ?? [];

  const existing = (accounts.busExpenses ?? []).map((be, idx) => {
    const label = be.busVehicleNumber ? `${be.busVehicleNumber}${be.busName ? ` (${be.busName})` : ''}` : `Bus ${idx + 1}`;
    return {
      busId: be.busId ?? null,
      label,
      driverBatta: String(be.driverBatta ?? 0),
      startKm: be.startKm == null ? '' : String(be.startKm),
      endKm: be.endKm == null ? '' : String(be.endKm),
      fuelEntries: (be.fuelEntries ?? []).map((f) => ({
        place: f.place ?? '',
        liters: String(f.liters ?? 0),
        cost: String(f.cost ?? 0),
      })),
      otherExpenses: (be.otherExpenses ?? []).map((o) => ({
        description: o.description ?? '',
        amount: String(o.amount ?? 0),
      })),
    } as EditableBus;
  });

  if (existing.length > 0) {
    const byBusId = new Set(existing.map((x) => x.busId).filter(Boolean) as string[]);
    const appended: EditableBus[] = [];
    for (const b of assigned) {
      if (!byBusId.has(b.id)) {
        appended.push({
          busId: b.id,
          label: busLabel(b),
          driverBatta: '0',
          startKm: '',
          endKm: '',
          fuelEntries: [],
          otherExpenses: [],
        });
      }
    }
    const out = [...existing, ...appended];
    while (out.length < required) {
      out.push({
        busId: null,
        label: `Bus ${out.length + 1}`,
        driverBatta: '0',
        startKm: '',
        endKm: '',
        fuelEntries: [],
        otherExpenses: [],
      });
    }
    return out;
  }

  const rows: EditableBus[] = [];
  for (const b of assigned) {
    rows.push({
      busId: b.id,
      label: busLabel(b),
      driverBatta: '0',
      startKm: '',
      endKm: '',
      fuelEntries: [],
      otherExpenses: [],
    });
  }
  while (rows.length < required) {
    rows.push({
      busId: null,
      label: `Bus ${rows.length + 1}`,
      driverBatta: '0',
      startKm: '',
      endKm: '',
      fuelEntries: [],
      otherExpenses: [],
    });
  }
  return rows;
}

export function TourAccountScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { agreementId } = route.params;

  const [agreement, setAgreement] = React.useState<AgreementResponse | null>(null);
  const [accounts, setAccounts] = React.useState<AgreementAccountsResponse | null>(null);
  const [buses, setBuses] = React.useState<EditableBus[]>([]);
  const [collapsedBus, setCollapsedBus] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    navigation.setOptions({ title: t('accounts.tourTitle') });
  }, [navigation, t]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [a, acc] = await Promise.all([
        getAgreementById(agreementId),
        getAgreementAccounts(agreementId),
      ]);
      setAgreement(a);
      setAccounts(acc);
      setBuses(buildInitialBuses(acc));
    } catch (e: any) {
      Alert.alert(t('common.errorTitle'), e?.message ? String(e.message) : String(e));
    } finally {
      setLoading(false);
    }
  }, [agreementId, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const totals = React.useMemo(() => {
    const totalExpenses = buses.reduce((sum, b) => {
      const driver = toNum(b.driverBatta);
      const fuel = (b.fuelEntries ?? []).reduce((s, f) => s + toNum(f.cost), 0);
      const other = (b.otherExpenses ?? []).reduce((s, o) => s + toNum(o.amount), 0);
      return sum + driver + fuel + other;
    }, 0);
    const income = agreement?.totalAmount ?? accounts?.incomeTotalAmount ?? 0;
    const profitOrLoss = income - totalExpenses;
    return { income, totalExpenses, profitOrLoss };
  }, [accounts?.incomeTotalAmount, agreement?.totalAmount, buses]);

  const onSave = async () => {
    setSaving(true);
    try {
      const payload = {
        busExpenses: buses.map((b) => ({
          busId: b.busId,
          driverBatta: toDecOrNull(b.driverBatta),
          startKm: toIntOrNull(b.startKm),
          endKm: toIntOrNull(b.endKm),
          fuelEntries: (b.fuelEntries ?? [])
            .filter((f) => f.place.trim() || f.liters.trim() || f.cost.trim())
            .map((f) => ({
              place: f.place,
              liters: toDecOrNull(f.liters),
              cost: toDecOrNull(f.cost),
            })),
          otherExpenses: (b.otherExpenses ?? [])
            .filter((o) => o.description.trim() || o.amount.trim())
            .map((o) => ({
              description: o.description,
              amount: toDecOrNull(o.amount),
            })),
        })),
      };

      const updated = await upsertAgreementAccounts(agreementId, payload);
      setAccounts(updated);
      setBuses(buildInitialBuses(updated));
      Alert.alert(t('common.successTitle'), t('accounts.saved'));
    } catch (e: any) {
      Alert.alert(t('common.errorTitle'), e?.message ? String(e.message) : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </Screen>
    );
  }

  const isProfit = totals.profitOrLoss >= 0;
  const assignedCount = accounts?.assignedBuses?.length ?? 0;
  const requiredCount = accounts?.requiredBusCount ?? 1;

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.headerCard}>
            <Text style={styles.title}>{agreement?.customerName ?? '-'}</Text>
            <Text style={styles.subText}>{agreement?.fromDate ?? '-'} → {agreement?.toDate ?? '-'}</Text>
            <View style={styles.headerRow}>
              <Text style={styles.subText}>{t('agreement.busType')}: {agreement?.busType ?? '-'}</Text>
              <Text style={styles.subText}>
                {t('manageAssignments.assignedBuses')}: {assignedCount}/{requiredCount}
              </Text>
            </View>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>{t('accounts.income')}</Text>
            <Text style={styles.bigMoney}>{String(totals.income)}</Text>
            <View style={styles.separator} />
            <View style={{ gap: SPACING.xs }}>
              <Text style={styles.sectionTitle}>{t('accounts.totalExpenses')}: {String(totals.totalExpenses)}</Text>
              <Text style={[styles.sectionTitle, isProfit ? styles.profitPos : styles.profitNeg]}>
                {t('accounts.profitOrLoss')}: {String(totals.profitOrLoss)}
              </Text>
            </View>
          </Card>

          {buses.map((b, idx) => {
            const collapseKey = b.busId ?? `idx-${idx}`;
            const isCollapsed = collapsedBus[collapseKey] ?? false;
            const totalLiters = (b.fuelEntries ?? []).reduce((s, f) => s + toNum(f.liters), 0);
            const startKm = b.startKm.trim() ? Number.parseInt(b.startKm, 10) : NaN;
            const endKm = b.endKm.trim() ? Number.parseInt(b.endKm, 10) : NaN;
            const hasDistance = Number.isFinite(startKm) && Number.isFinite(endKm) && endKm >= startKm;
            const distanceKm = hasDistance ? endKm - startKm : null;
            const mileage = distanceKm != null && totalLiters > 0 ? distanceKm / totalLiters : null;

            return (
              <Card key={`${b.busId ?? 'none'}-${idx}`} style={styles.busCard}>
                <Pressable
                  style={styles.busHeaderRow}
                  onPress={() => setCollapsedBus((prev) => ({ ...prev, [collapseKey]: !isCollapsed }))}
                >
                  <Text style={styles.busTitle}>
                    {t('accounts.bus')} {idx + 1}: {b.label}
                  </Text>
                  <MaterialCommunityIcons name={isCollapsed ? "chevron-down" : "chevron-up"} size={24} color={COLORS.textSecondary} />
                </Pressable>

                {isCollapsed ? (
                  <View style={{ gap: SPACING.xs, marginTop: SPACING.sm }}>
                    <Text style={styles.small}>
                      {t('accounts.driverBatta')}: {b.driverBatta?.trim() ? b.driverBatta : '0'}
                    </Text>
                    <View style={styles.mileageStats}>
                      <Text style={styles.small}>
                        {t('accounts.distanceKm')}: {distanceKm == null ? '—' : String(distanceKm)}
                      </Text>
                      <Text style={styles.small}>
                        {t('accounts.totalLiters')}: {totalLiters ? totalLiters.toFixed(2) : '0.00'}
                      </Text>
                      <Text style={styles.small}>
                        {t('accounts.mileage')}: {mileage == null ? '—' : `${mileage.toFixed(2)} km/L`}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ marginTop: SPACING.md, gap: SPACING.md }}>
                    <Input
                      label={t('accounts.driverBatta')}
                      value={b.driverBatta}
                      onChangeText={(v) => {
                        const next = [...buses];
                        next[idx] = { ...next[idx], driverBatta: cleanDecimalInput(v) };
                        setBuses(next);
                      }}
                      keyboardType="numeric"
                      placeholder="0.00"
                    />
                    <View style={styles.row2}>
                      <View style={{ flex: 1 }}>
                        <Input
                          label={t('accounts.startKm')}
                          value={b.startKm}
                          onChangeText={(v) => {
                            const next = [...buses];
                            next[idx] = { ...next[idx], startKm: cleanIntInput(v) };
                            setBuses(next);
                          }}
                          keyboardType="number-pad"
                          placeholder="0"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Input
                          label={t('accounts.endKm')}
                          value={b.endKm}
                          onChangeText={(v) => {
                            const next = [...buses];
                            next[idx] = { ...next[idx], endKm: cleanIntInput(v) };
                            setBuses(next);
                          }}
                          keyboardType="number-pad"
                          placeholder="0"
                        />
                      </View>
                    </View>

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('accounts.distanceKm')}</Text>
                        <Text style={styles.statValue}>{distanceKm == null ? '—' : String(distanceKm)}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('accounts.totalLiters')}</Text>
                        <Text style={styles.statValue}>{totalLiters ? totalLiters.toFixed(2) : '0.00'}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('accounts.mileage')}</Text>
                        <Text style={styles.statValue}>{mileage == null ? '—' : `${mileage.toFixed(2)}`}</Text>
                      </View>
                    </View>

                    <View style={styles.sectionHeader}>
                      <Text style={styles.subTitle}>{t('accounts.fuel')}</Text>
                    </View>

                    {(b.fuelEntries ?? []).map((f, fIdx) => (
                      <View key={fIdx} style={styles.entryRow}>
                        <View style={{ flex: 2 }}>
                          <Input
                            placeholder={t('accounts.place')}
                            value={f.place}
                            onChangeText={(v) => {
                              const next = [...buses];
                              const fuel = [...next[idx].fuelEntries];
                              fuel[fIdx] = { ...fuel[fIdx], place: v };
                              next[idx] = { ...next[idx], fuelEntries: fuel };
                              setBuses(next);
                            }}
                            containerStyle={{ marginBottom: 0 }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Input
                            placeholder={t('accounts.liters')}
                            value={f.liters}
                            onChangeText={(v) => {
                              const next = [...buses];
                              const fuel = [...next[idx].fuelEntries];
                              fuel[fIdx] = { ...fuel[fIdx], liters: cleanDecimalInput(v) };
                              next[idx] = { ...next[idx], fuelEntries: fuel };
                              setBuses(next);
                            }}
                            keyboardType="numeric"
                            containerStyle={{ marginBottom: 0 }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Input
                            placeholder={t('accounts.cost')}
                            value={f.cost}
                            onChangeText={(v) => {
                              const next = [...buses];
                              const fuel = [...next[idx].fuelEntries];
                              fuel[fIdx] = { ...fuel[fIdx], cost: cleanDecimalInput(v) };
                              next[idx] = { ...next[idx], fuelEntries: fuel };
                              setBuses(next);
                            }}
                            keyboardType="numeric"
                            containerStyle={{ marginBottom: 0 }}
                          />
                        </View>
                        <Pressable
                          style={styles.iconBtn}
                          onPress={() => {
                            const next = [...buses];
                            const fuel = [...next[idx].fuelEntries];
                            fuel.splice(fIdx, 1);
                            next[idx] = { ...next[idx], fuelEntries: fuel };
                            setBuses(next);
                          }}
                        >
                          <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.error} />
                        </Pressable>
                      </View>
                    ))}
                    <Button
                      title={t('accounts.addFuel')}
                      onPress={() => {
                        const next = [...buses];
                        next[idx] = { ...next[idx], fuelEntries: [...(next[idx].fuelEntries ?? []), { place: '', liters: '', cost: '' }] };
                        setBuses(next);
                      }}
                      variant="outline"
                      size="sm"
                      leftIcon={<MaterialCommunityIcons name="plus" size={16} color={COLORS.primary} />}
                    />

                    <View style={styles.sectionHeader}>
                      <Text style={styles.subTitle}>{t('accounts.otherExpenses')}</Text>
                    </View>
                    {(b.otherExpenses ?? []).map((o, oIdx) => (
                      <View key={oIdx} style={styles.entryRow}>
                        <View style={{ flex: 2 }}>
                          <Input
                            placeholder={t('accounts.description')}
                            value={o.description}
                            onChangeText={(v) => {
                              const next = [...buses];
                              const other = [...next[idx].otherExpenses];
                              other[oIdx] = { ...other[oIdx], description: v };
                              next[idx] = { ...next[idx], otherExpenses: other };
                              setBuses(next);
                            }}
                            containerStyle={{ marginBottom: 0 }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Input
                            placeholder={t('accounts.amount')}
                            value={o.amount}
                            onChangeText={(v) => {
                              const next = [...buses];
                              const other = [...next[idx].otherExpenses];
                              other[oIdx] = { ...other[oIdx], amount: cleanDecimalInput(v) };
                              next[idx] = { ...next[idx], otherExpenses: other };
                              setBuses(next);
                            }}
                            keyboardType="numeric"
                            containerStyle={{ marginBottom: 0 }}
                          />
                        </View>
                        <Pressable
                          style={styles.iconBtn}
                          onPress={() => {
                            const next = [...buses];
                            const other = [...next[idx].otherExpenses];
                            other.splice(oIdx, 1);
                            next[idx] = { ...next[idx], otherExpenses: other };
                            setBuses(next);
                          }}
                        >
                          <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.error} />
                        </Pressable>
                      </View>
                    ))}
                    <Button
                      title={t('accounts.addOtherExpense')}
                      onPress={() => {
                        const next = [...buses];
                        next[idx] = { ...next[idx], otherExpenses: [...(next[idx].otherExpenses ?? []), { description: '', amount: '' }] };
                        setBuses(next);
                      }}
                      variant="outline"
                      size="sm"
                      leftIcon={<MaterialCommunityIcons name="plus" size={16} color={COLORS.primary} />}
                    />
                  </View>
                )}
              </Card>
            );
          })}

          <View style={styles.actionRow}>
            <Button title={saving ? t('common.saving') : t('accounts.save')} onPress={onSave} loading={saving} style={{ flex: 1 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: SPACING.md, color: COLORS.textSecondary },

  scrollContent: { padding: SPACING.md, gap: SPACING.md },

  headerCard: { alignItems: 'flex-start' },
  title: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  subText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: SPACING.xs },

  summaryCard: {},
  bigMoney: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginVertical: SPACING.xs },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  separator: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },

  busCard: {},
  busHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
  busTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary, flex: 1, flexWrap: 'wrap' },

  mileageStats: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap' },
  small: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.medium },

  row2: { flexDirection: 'row', gap: SPACING.md },

  statsRow: { flexDirection: 'row', backgroundColor: COLORS.background, padding: SPACING.md, borderRadius: RADIUS.md, justifyContent: 'space-between', flexWrap: 'wrap', gap: SPACING.sm },
  statItem: { alignItems: 'center', minWidth: '30%' },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.bold, textTransform: 'uppercase', textAlign: 'center' },
  statValue: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginTop: 2 },

  sectionHeader: { marginTop: SPACING.sm, marginBottom: SPACING.xs },
  subTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },

  entryRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', marginBottom: SPACING.sm },
  iconBtn: { padding: SPACING.sm, alignItems: 'center', justifyContent: 'center' },

  actionRow: { marginTop: SPACING.md, marginBottom: SPACING.xl },

  profitPos: { color: COLORS.success },
  profitNeg: { color: COLORS.error },
});
