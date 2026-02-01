import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { getAgreementById } from '../api/agreements';
import { getAgreementAccounts, upsertAgreementAccounts } from '../api/accounts';
import type { AgreementResponse, BusResponse } from '../types/api';
import type { AgreementAccountsResponse } from '../types/accounts';
import { KeyboardAvoidingScrollView, useScrollToFocusedInput } from '../components/KeyboardAvoidingScrollView';

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
    // Ensure we have rows for assigned buses.
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

  // No expenses saved yet: create rows for assigned buses first, then pad.
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

  // Used for the inline TextInputs (fuel/other rows) to ensure they scroll above the keyboard.
  const scrollOnFocus = useScrollToFocusedInput(90);

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
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.small}>{t('common.loading')}</Text>
      </View>
    );
  }

  const isProfit = totals.profitOrLoss >= 0;
  const assignedCount = accounts?.assignedBuses?.length ?? 0;
  const requiredCount = accounts?.requiredBusCount ?? 1;

  return (
    <KeyboardAvoidingScrollView contentContainerStyle={styles.container}>
      <Card>
        <Text style={styles.title}>{agreement?.customerName ?? '-'}</Text>
        <Text style={styles.small}>{agreement?.fromDate ?? '-'} - {agreement?.toDate ?? '-'}</Text>
        <Text style={styles.small}>{t('agreement.busType')}: {agreement?.busType ?? '-'}</Text>
        <Text style={styles.small}>
          {t('manageAssignments.assignedBuses')}: {assignedCount}/{requiredCount}
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>{t('accounts.income')}</Text>
        <Text style={styles.bigMoney}>{String(totals.income)}</Text>
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
          <Card key={`${b.busId ?? 'none'}-${idx}`}>
            <View style={styles.busHeaderRow}>
              <Text style={styles.sectionTitle}>
                {t('accounts.bus')} {idx + 1}: {b.label}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  style={styles.minimizeBtn}
                  onPress={() => {
                    const next = [...buses];
                    // basic confirmation could be added here
                    next.splice(idx, 1);
                    setBuses(next);
                  }}
                >
                  <Text style={[styles.minimizeBtnText, { color: '#991b1b' }]}>X</Text>
                </Pressable>
                <Pressable
                  style={styles.minimizeBtn}
                  onPress={() => setCollapsedBus((prev) => ({ ...prev, [collapseKey]: !isCollapsed }))}
                >
                  <Text style={styles.minimizeBtnText}>
                    {isCollapsed ? t('accounts.expand') : t('accounts.minimize')}
                  </Text>
                </Pressable>
              </View>
            </View>

            {isCollapsed ? (
              <View style={{ gap: 6 }}>
                <Text style={styles.small}>
                  {t('accounts.driverBatta')}: {b.driverBatta?.trim() ? b.driverBatta : '0'}
                </Text>
                <View style={styles.mileageRow}>
                  <Text style={styles.mileageText}>
                    {t('accounts.distanceKm')}: {distanceKm == null ? '—' : String(distanceKm)}
                  </Text>
                  <Text style={styles.mileageText}>
                    {t('accounts.totalLiters')}: {totalLiters ? totalLiters.toFixed(2) : '0.00'}
                  </Text>
                  <Text style={styles.mileageText}>
                    {t('accounts.mileage')}: {mileage == null ? '—' : `${mileage.toFixed(2)} km/L`}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <LabeledInput
                  label={t('accounts.driverBatta')}
                  value={b.driverBatta}
                  onChangeText={(v) => {
                    const next = [...buses];
                    next[idx] = { ...next[idx], driverBatta: cleanDecimalInput(v) };
                    setBuses(next);
                  }}
                  keyboardType="numeric"
                />
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <LabeledInput
                      label={t('accounts.startKm')}
                      value={b.startKm}
                      onChangeText={(v) => {
                        const next = [...buses];
                        next[idx] = { ...next[idx], startKm: cleanIntInput(v) };
                        setBuses(next);
                      }}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <LabeledInput
                      label={t('accounts.endKm')}
                      value={b.endKm}
                      onChangeText={(v) => {
                        const next = [...buses];
                        next[idx] = { ...next[idx], endKm: cleanIntInput(v) };
                        setBuses(next);
                      }}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                <View style={styles.mileageRow}>
                  <Text style={styles.mileageText}>
                    {t('accounts.distanceKm')}: {distanceKm == null ? '—' : String(distanceKm)}
                  </Text>
                  <Text style={styles.mileageText}>
                    {t('accounts.totalLiters')}: {totalLiters ? totalLiters.toFixed(2) : '0.00'}
                  </Text>
                  <Text style={styles.mileageText}>
                    {t('accounts.mileage')}: {mileage == null ? '—' : `${mileage.toFixed(2)} km/L`}
                  </Text>
                </View>


                <Text style={styles.subTitle}>{t('accounts.fuel')}</Text>
                {(b.fuelEntries ?? []).map((f, fIdx) => (
                  <View key={fIdx} style={styles.entryRow}>
                    <TextInput
                      style={[styles.input, { flex: 2 }]}
                      placeholder={t('accounts.place')}
                      value={f.place}
                      onFocus={scrollOnFocus}
                      onChangeText={(v) => {
                        const next = [...buses];
                        const fuel = [...next[idx].fuelEntries];
                        fuel[fIdx] = { ...fuel[fIdx], place: v };
                        next[idx] = { ...next[idx], fuelEntries: fuel };
                        setBuses(next);
                      }}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={t('accounts.liters')}
                      keyboardType="numeric"
                      value={f.liters}
                      onFocus={scrollOnFocus}
                      onChangeText={(v) => {
                        const next = [...buses];
                        const fuel = [...next[idx].fuelEntries];
                        fuel[fIdx] = { ...fuel[fIdx], liters: cleanDecimalInput(v) };
                        next[idx] = { ...next[idx], fuelEntries: fuel };
                        setBuses(next);
                      }}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={t('accounts.cost')}
                      keyboardType="numeric"
                      value={f.cost}
                      onFocus={scrollOnFocus}
                      onChangeText={(v) => {
                        const next = [...buses];
                        const fuel = [...next[idx].fuelEntries];
                        fuel[fIdx] = { ...fuel[fIdx], cost: cleanDecimalInput(v) };
                        next[idx] = { ...next[idx], fuelEntries: fuel };
                        setBuses(next);
                      }}
                    />
                    <Pressable
                      style={styles.removeBtn}
                      onPress={() => {
                        const next = [...buses];
                        const fuel = [...next[idx].fuelEntries];
                        fuel.splice(fIdx, 1);
                        next[idx] = { ...next[idx], fuelEntries: fuel };
                        setBuses(next);
                      }}
                    >
                      <Text style={styles.removeBtnText}>{t('accounts.remove')}</Text>
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  style={styles.addRowBtn}
                  onPress={() => {
                    const next = [...buses];
                    next[idx] = { ...next[idx], fuelEntries: [...(next[idx].fuelEntries ?? []), { place: '', liters: '', cost: '' }] };
                    setBuses(next);
                  }}
                >
                  <Text style={styles.addRowBtnText}>{t('accounts.addFuel')}</Text>
                </Pressable>

                <Text style={styles.subTitle}>{t('accounts.otherExpenses')}</Text>
                {(b.otherExpenses ?? []).map((o, oIdx) => (
                  <View key={oIdx} style={styles.entryRow}>
                    <TextInput
                      style={[styles.input, { flex: 2 }]}
                      placeholder={t('accounts.description')}
                      value={o.description}
                      onFocus={scrollOnFocus}
                      onChangeText={(v) => {
                        const next = [...buses];
                        const other = [...next[idx].otherExpenses];
                        other[oIdx] = { ...other[oIdx], description: v };
                        next[idx] = { ...next[idx], otherExpenses: other };
                        setBuses(next);
                      }}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={t('accounts.amount')}
                      keyboardType="numeric"
                      value={o.amount}
                      onFocus={scrollOnFocus}
                      onChangeText={(v) => {
                        const next = [...buses];
                        const other = [...next[idx].otherExpenses];
                        other[oIdx] = { ...other[oIdx], amount: cleanDecimalInput(v) };
                        next[idx] = { ...next[idx], otherExpenses: other };
                        setBuses(next);
                      }}
                    />
                    <Pressable
                      style={styles.removeBtn}
                      onPress={() => {
                        const next = [...buses];
                        const other = [...next[idx].otherExpenses];
                        other.splice(oIdx, 1);
                        next[idx] = { ...next[idx], otherExpenses: other };
                        setBuses(next);
                      }}
                    >
                      <Text style={styles.removeBtnText}>{t('accounts.remove')}</Text>
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  style={styles.addRowBtn}
                  onPress={() => {
                    const next = [...buses];
                    next[idx] = { ...next[idx], otherExpenses: [...(next[idx].otherExpenses ?? []), { description: '', amount: '' }] };
                    setBuses(next);
                  }}
                >
                  <Text style={styles.addRowBtnText}>{t('accounts.addOtherExpense')}</Text>
                </Pressable>
              </>
            )}
          </Card>
        );
      })}

      <Pressable
        style={styles.secondaryBtn}
        onPress={() => {
          setBuses((prev) => [
            ...prev,
            {
              busId: null,
              label: `Bus ${prev.length + 1}`,
              driverBatta: '0',
              startKm: '',
              endKm: '',
              fuelEntries: [],
              otherExpenses: [],
            },
          ]);
        }}
      >
        <Text style={styles.secondaryBtnText}>{t('action.addBus', 'Add Another Bus')}</Text>
      </Pressable>

      <Card>
        <Text style={styles.sectionTitle}>{t('accounts.totalExpenses')}: {String(totals.totalExpenses)}</Text>
        <Text style={[styles.sectionTitle, isProfit ? styles.profitPos : styles.profitNeg]}>
          {t('accounts.profitOrLoss')}: {String(totals.profitOrLoss)}
        </Text>
      </Card>

      <View style={{ gap: 10 }}>
        <Pressable style={[styles.primaryBtn, saving ? styles.btnDisabled : null]} disabled={saving} onPress={onSave}>
          <Text style={styles.primaryBtnText}>{saving ? t('common.saving') : t('accounts.save')}</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={load} disabled={saving}>
          <Text style={styles.secondaryBtnText}>{t('common.refresh')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingScrollView>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function LabeledInput({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any;
}) {
  const scrollOnFocus = useScrollToFocusedInput(90);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        onFocus={scrollOnFocus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },

  card: { backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee', gap: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#111827' },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#111827' },
  subTitle: { marginTop: 6, fontSize: 13, fontWeight: '900', color: '#111827' },
  small: { fontSize: 12, fontWeight: '700', color: '#374151' },
  bigMoney: { fontSize: 18, fontWeight: '900', color: '#111827' },
  label: { fontSize: 12, fontWeight: '800', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  row2: { flexDirection: 'row', gap: 10 },
  mileageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mileageText: { fontSize: 12, fontWeight: '800', color: '#374151' },
  busHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  minimizeBtn: { backgroundColor: '#f3f4f6', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  minimizeBtnText: { fontSize: 12, fontWeight: '900', color: '#111827' },

  entryRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addRowBtn: { backgroundColor: '#f3f4f6', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  addRowBtnText: { fontWeight: '900', color: '#111827' },
  removeBtn: { backgroundColor: '#fee2e2', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10 },
  removeBtnText: { fontWeight: '900', color: '#991b1b', fontSize: 11 },

  primaryBtn: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#f3f4f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#111827', fontSize: 16, fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },

  profitPos: { color: '#065f46' },
  profitNeg: { color: '#b91c1c' },
});
